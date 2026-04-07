# 需求分析报告: vibex-dev-proposals-20260403_024652

**任务**: 需求分析：Dev 提案评审与扩展
**分析师**: analyst
**日期**: 2026-04-03
**工作目录**: /root/.openclaw/vibex

---

## 一、业务场景分析

### 1.1 VibeX Sprint 3 当前状态

Sprint 3 正在执行两条主线：

| Epic | 内容 | 状态 |
|------|------|------|
| E1 | Checkbox 持久化修复 | 🔄 进行中 |
| E2 | 消息抽屉 (Message Drawer) | 🔄 进行中 |

同时，上一轮 Dev 提案（2026-04-02）推动了以下技术改进落地：

| 提案 | 内容 | 落地情况 |
|------|------|---------|
| D-001 | TypeScript 错误清理 | ✅ 已启用 strict mode，残留 2 个 TS 错误 |
| D-002 | DOMPurify XSS 修复 | ✅ npm overrides 已配置 |
| D-003 | canvasStore 拆分 Phase1-3 | ✅ 5 个子 Store 已拆分并有测试覆盖 |

### 1.2 近期代码变更历史摘要

```
最近 30 个 commit 分析:
- canvas-json-persistence Epic1-3 全部完成 (E1 数据结构/E2 版本化/E3 自动保存)
- canvasStore Epic4-5 完成 (componentStore + sessionStore 测试)
- E2E 测试稳定性提升 (mermaid-xss-protection)
- 遗留: E4 Sync Protocol (冲突检测) 未实现
- 遗留: canvasStore 合并清理 (原 1513 行仍存在，split stores 合计 735 行)
```

### 1.3 技术痛点识别

通过代码审查，识别出 4 类开发痛点：

| # | 痛点 | 证据 | 影响 |
|---|------|------|------|
| P1 | **E4 Sync Protocol 缺失** | IMPLEMENTATION_PLAN.md E4 未实现 | 多用户并发编辑无冲突保护，数据可能覆盖 |
| P2 | **canvasStore 未完全退役** | canvasStore.ts 1513 行仍存在 | 双重数据源风险，split stores 与原 Store 并存 |
| P3 | **StepClarification 命名冲突** | `Duplicate identifier 'StepComponentProps'` | TS build error，阻断 CI |
| P4 | **自动保存缺少 E2E 验证** | useAutoSave 有单元测试但无 Playwright 覆盖 | beacon/debounce 行为无端到端验证 |

---

## 二、核心 Jobs-To-Be-Done (JTBD)

### JTBD 1: 开发者需要冲突保护机制

**触发**: 多用户并发编辑同一项目，后保存覆盖先保存
**期望**: 乐观锁 + 冲突 UI，让用户决定保留哪个版本
**对应提案**: D-001（E4 Sync Protocol）
**Sprint 关联**: Sprint 3 之外，canvas-json-persistence 收尾

### JTBD 2: 开发者需要零错误的 CI 构建

**触发**: 每次 PR 都有 `StepClarification.tsx` 的 TS 编译错误
**期望**: `npm run build` 零错误，CI gate 可靠
**对应提案**: 修复 `StepComponentProps` 重复定义
**Sprint 关联**: Sprint 3 内修复（P0）

### JTBD 3: 开发者需要可信的测试金字塔

**触发**: 自动保存功能有单元测试但无 E2E，无法验证真实浏览器行为
**期望**: Playwright 覆盖 auto-save 流程（debounce、beacon、冲突对话框）
**对应提案**: D-002（测试覆盖率提升）

### JTBD 4: 开发者需要更轻量的 Store 架构

**触发**: canvasStore 1513 行仍存在，split stores 735 行，职责边界模糊
**期望**: canvasStore 仅作兼容层，所有逻辑在子 Store 中
**对应提案**: canvasStore 合并清理

### JTBD 5: 开发者需要类型安全的 API 调用

**触发**: API 路由 /v1/canvas/snapshots 与前端类型不对齐
**期望**: Zod schema 统一前后端类型定义
**对应提案**: 类型安全强化

---

## 三、技术方案选项

### 3.1 提案 D-001: 完成 E4 Sync Protocol（冲突检测 + UI）

**根因**: Epic1-3 优先级更高，E4 被推迟

#### Option A: 渐进式冲突保护（推荐）

| 步骤 | 工时 | 内容 |
|------|------|------|
| S1 | 1.5h | 后端: snapshots API 增加 version 乐观锁检查 |
| S2 | 1.5h | 前端: useAutoSave 携带 version，发起保存请求 |
| S3 | 2h | 前端: ConflictDialog 组件 + 冲突解决逻辑 |
| **合计** | **5h** | — |

#### Option B: 简化版本（次选）

仅实现只读版本历史对比（不处理并发冲突），避免 UI 开发。

| 步骤 | 工时 | 内容 |
|------|------|------|
| S1 | 1h | 后端返回最新版本号 |
| S2 | 1h | 前端显示版本号（不检测冲突） |
| **合计** | **2h** | — |

**推荐 Option A** — 并发编辑是真实用户场景，简化版本治标不治本。

---

### 3.2 提案 D-002: 前端测试覆盖率提升（Playwright E2E）

**根因**: Jest 不支持 `navigator.sendBeacon`，debounce 计时在单元测试中无法可靠验证

#### Option A: Playwright E2E 覆盖 auto-save 流程（推荐）

| 步骤 | 工时 | 内容 |
|------|------|------|
| S1 | 1h | Playwright 配置 + fixture 搭建 |
| S2 | 1h | Auto-save 基础流程测试（编辑 → 等待 → 验证保存） |
| S3 | 1h | Beacon 触发测试（beforeunload 场景） |
| S4 | 1h | VersionHistoryPanel 交互测试 |
| **合计** | **4h** | — |

#### Option B: Integration Test with MSW

用 Mock Service Worker 模拟 API 响应，减少对真实后端的依赖。

| 步骤 | 工时 | 内容 |
|------|------|------|
| S1 | 2h | MSW 集成配置 |
| S2 | 2h | Hook integration test |
| S3 | 1h | API mock 覆盖 |
| **合计** | **5h** | — |

**推荐 Option A** — 真实浏览器环境验证 auto-save 行为，Playwright 已有基础设施。

---

### 3.3 提案 D-003: TypeScript 严格模式收尾

**根因**: Sprint 2 遗留 `StepClarification.tsx` 的重复类型定义

#### Option A: 快速修复 + 全局 `no-duplicate-imports`（推荐）

| 步骤 | 工时 | 内容 |
|------|------|------|
| S1 | 0.5h | 修复 StepClarification.tsx 重复定义 |
| S2 | 0.5h | 添加 ESLint 规则防止未来重复 |
| **合计** | **1h** | — |

#### Option B: 全库 TS 审计

从零开始建立 `tsconfig` 严格标准，逐步修复所有 `any`。

| 步骤 | 工时 | 内容 |
|------|------|------|
| S1 | 2h | 分析当前 `any` 使用点（前 20 个高频） |
| S2 | 3h | 逐个修复类型 |
| S3 | 1h | CI 添加 `tsc --strict` 检查 |
| **合计** | **6h** | — |

**前端已启用 strict mode，仅 2 个错误。推荐 Option A 立即修复，Option B 可作为独立 Epic 延后执行。**

---

### 3.4 提案 D-NEW: canvasStore 退役清理

**根因**: canvasStore 1513 行 + split stores 735 行共存，存在双重数据源风险

#### Option A: 逐步替换 + 向后兼容（推荐）

| 步骤 | 工时 | 内容 |
|------|------|------|
| S1 | 2h | 审查 canvasStore 中剩余未迁移逻辑 |
| S2 | 3h | 将剩余逻辑迁移至 split stores |
| S3 | 2h | canvasStore 降级为纯兼容层（re-export） |
| S4 | 1h | 更新所有 import path（14 个组件） |
| **合计** | **8h** | — |

#### Option B: 大爆炸替换

冻结功能开发 1 周，一次性移除 canvasStore。

| 步骤 | 工时 | 内容 |
|------|------|------|
| S1 | 1 周 | 全量替换 + 回归测试 |
| **合计** | **1 周** | — |

**推荐 Option A** — 风险分散，每阶段可验证，不阻断 Sprint 4 开发。

---

## 四、可行性评估

| 提案 | 可行性 | 评估依据 |
|------|--------|---------|
| D-001 E4 Sync | ✅ 95% | 后端 API 结构已就绪，只需加 version 字段 |
| D-002 Playwright E2E | ✅ 100% | Playwright 已配置，fixture 可复用 |
| D-003 TS 修复 | ✅ 100% | 仅 2 个重复定义，15 分钟可修复 |
| D-NEW Store 清理 | ⚠️ 80% | 涉及 14 个组件的 import 变更，有回归风险 |

---

## 五、初步风险识别

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| E4 并发冲突导致数据丢失 | 低 | 高 | Option A 的乐观锁 + UI 确认是行业标准方案 |
| Playwright 测试 flaky | 中 | 中 | 用 `waitForResponse` 而非硬 sleep |
| Store 替换引入回归 | 中 | 中 | 保留 canvasStore 作为兼容层，过渡期逐步替换 |
| StepClarification 修复后再次冲突 | 低 | 低 | ESLint `no-duplicate-imports` 规则 |
| Beacon API 在某些浏览器失败 | 低 | 中 | 提供 fallback（同步 XHR） |

---

## 六、验收标准

### 6.1 D-003 TS 修复（立即执行，优先级 P0）

- [ ] `cd vibex-fronted && npx tsc --noEmit` 输出 0 error
- [ ] `StepClarification.tsx` 无重复 `StepComponentProps` 定义
- [ ] ESLint 配置 `no-duplicate-imports` 或等效规则

### 6.2 D-001 E4 Sync Protocol

- [ ] `useAutoSave` 携带 `version` 字段发送保存请求
- [ ] 后端 `POST /v1/canvas/snapshots` 检测 `localVersion < serverVersion` 时返回 `409 Conflict`
- [ ] 前端显示 `ConflictDialog`，包含"保留本地"/"使用服务端"两个选项
- [ ] 冲突解决后版本号正确更新

### 6.3 D-002 Playwright E2E

- [ ] Playwright 测试覆盖 auto-save 完整流程（编辑 → debounce → 保存 → 指示器更新）
- [ ] Beacon 触发场景测试通过（`navigator.sendBeacon` 调用被验证）
- [ ] `VersionHistoryPanel` 打开/切换版本交互测试通过
- [ ] E2E 测试在 CI 中运行且通过率 > 90%

### 6.4 D-NEW canvasStore 清理

- [ ] `canvasStore.ts` 仅保留 re-export 语句（< 50 行）
- [ ] 所有组件从 split stores 导入（无 canvasStore 直接引用）
- [ ] `npm test` 所有 14 个组件相关测试通过
- [ ] 无循环依赖（通过 `madge --circular` 验证）

### 6.5 跨提案验收

- [ ] `npm run build` 在 vibex-fronted 和 vibex-backend 均 0 error
- [ ] `npm run test` 通过率 > 95%
- [ ] CI pipeline 中包含 TS 类型检查步骤

---

## 七、推荐执行顺序

```
Sprint 3.x (本周):
  └─ D-003 TS 修复 → 1h，立即解除 CI 阻断

Sprint 3.y (本周):
  └─ D-001 E4 Sync → 5h，canvas-json-persistence 收尾

Sprint 4:
  ├─ D-002 Playwright E2E → 4h，测试金字塔补全
  └─ D-NEW Store 清理 Phase1 → 4h，逐步退役 canvasStore
```

---

## 八、做得好的

1. **Sprint 3 规划清晰** — E1/E2 双线并行，优先级明确
2. **canvasStore 拆分有实质进展** — 5 个子 Store 已拆分，有测试覆盖
3. **技术债清理持续推进** — TS strict mode 已启用，DOMPurify 已修复
4. **测试基础设施完善** — Playwright 已配置，E2E 框架可用

## 九、需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | E4 Sync 长期推迟 | 纳入 Sprint 3.y 或 Sprint 4，不能再推迟 |
| 2 | canvasStore 拆分不彻底 | 需完成退役清理，移除双重数据源风险 |
| 3 | TS build 有错误未修复 | P0 修复 `StepClarification.tsx` |
| 4 | 自动保存无 E2E 覆盖 | Playwright 测试补全，确保真实浏览器行为 |

---

*本文档由 analyst agent 生成，基于 Sprint 3 当前状态 + 近期代码变更历史 + Dev 提案 D-001~D-003。*
