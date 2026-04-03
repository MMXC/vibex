# Analysis: 2026-04-01 第二批提案综合分析

**Agent**: analyst
**日期**: 2026-04-01
**项目**: proposals-20260401-2
**数据来源**: Sprint 1 执行复盘（proposals-20260401）+ E6 竞品分析产出 + Dev 知识库

---

## 1. 执行摘要

第二批提案源自 Sprint 1（E1-E7）执行复盘与 E6 竞品分析深度挖掘。

**核心结论**：
- Sprint 1 完成了 7 个 Epic，共 33 个任务，全部交付 ✅
- E6 竞品分析揭示 VibeX 差异化护城河：**PRD → 可运行原型端到端**
- 第二批识别 **5 个新方向**，围绕用户旅程最大摩擦点（导出后到使用）
- 总工时估算：~62h（3 个 P0，2 个 P1）

---

## 2. Sprint 1 执行复盘

### 2.1 成功交付

| Epic | 任务数 | 状态 | 关键产出 |
|------|--------|------|----------|
| E1: Dev Env Fix | 4 | ✅ | TS pre-test 全绿，文件锁 |
| E2: Collab Quality | 4 | ✅ | 越权防护 + 路径规范 + 通知过滤 |
| E3: Canvas Selection | 4 | ✅ | 选区 bug 修复 + E2E |
| E4: Canvas Guidance | 4 | ✅ | 引导体系 + ShortcutBar |
| E5: Quality Process | 4 | ✅ | CI Gate + SOP + KPI Dashboard |
| E6: Competitive | 4 | ✅ | 竞品矩阵 + 旅程图 + 定价策略 |
| E7: Arch Evolution | 4 | ✅ | Flow 性能 + 文档版本化 + Zod Schema |

### 2.2 遗留问题（未在 Sprint 1 解决）

| 问题 | 来源 | 影响 | 状态 |
|------|------|------|------|
| MSW 契约测试 | E7 P2-1 | 仍是函数级测试，非 HTTP 级别 | 未实施 |
| E2E 稳定性 | E5 P2-2 | 偶发超时，未解决 | 未实施 |
| canvasApi 响应校验 | E7 P2-3 | 仍为 fallback，非 throw Error | 未实施 |
| DDD bounded context 命名 | E7 P3-1 | forbiddenNames 分歧未解决 | 未实施 |
| Epic 回滚策略 | Sprint 1 教训 | 无标准 SOP | 需新增提案 |
| Zustand Migration SOP | Sprint 1 教训 | Epic6+7 发现模式无文档 | 需新增提案 |

### 2.3 Sprint 1 核心教训

| # | 教训 | 影响 | 改进方向 |
|---|------|------|----------|
| L1 | Epic 回滚 ≠ revert（会丢失功能） | 高：开发者走了弯路 | 回滚 SOP |
| L2 | Zustand 无内置 migrations API | 高：Epic6+7 摸索出模式 | 文档化到知识库 |
| L3 | 文件锁竞态（task_manager） | 中：并发更新丢数据 | 加锁 + 幂等设计 |
| L4 | TypeScript 类型链（import 缺失） | 高：30+ TS 错误 | CI TS check 前置 |
| L5 | 验收标准不清导致 tester/dev 拉锯 | 高：E2 重做 | Epic 开始前对齐 DoD |

---

## 3. E6 竞品分析深度发现

### 3.1 核心差异化护城河（已确认）

VibeX 是**唯一**覆盖「PRD → 可运行原型」端到端的工具。竞品对比：

| 维度 | Cursor | v0 | Windsurf | VibeX |
|------|--------|-----|---------|-------|
| 代码生成 | ✅ | ✅ | ✅ | ✅ |
| UI 原型 | ❌ | ✅ | ❌ | ✅ |
| PRD 理解 | ❌ | ❌ | ❌ | ✅ |
| 可运行预览 | ❌ | ✅ | ❌ | ✅ |
| DDD 领域建模 | ❌ | ❌ | ❌ | ✅ |

**护城河深度**：PRD 理解 + DDD 建模 = 竞品 6-12 个月无法复制

### 3.2 最大竞争差距（v0 威胁）

v0.dev 是最强竞品：
- UI 生成质量高（比 VibeX 更美观）
- 组件即开即用
- 零学习成本

**VibeX 应对**：
- 强化 PRD 理解差异化（v0 无此能力）
- 补齐「一键部署」消除最后一步摩擦

### 3.3 用户旅程最大摩擦点

根据用户旅程图，7 个阶段中：

| 阶段 | 摩擦点 | 当前状态 |
|------|--------|----------|
| 需求输入 | 仅支持纯文本 | ❌ 无多格式 |
| AI 澄清 | 缺乏澄清模板 | ⚠️ 模板化不足 |
| 导出使用 | 需手动复制粘贴 | ❌ **最大摩擦** |

**关键洞察**：用户旅程最后一步（导出使用）是最大摩擦点，v0 在这里体验更好。

---

## 4. 第二批提案（5 个方向）

### 4.1 P0-1: 一键部署能力（消除用户旅程最后一步）

**问题**：用户导出代码后，还需手动：创建项目 → 安装依赖 → 配置环境 → 部署，摩擦极大。

**JTBD**：「作为用户，我希望导出后点一下就看到在线可用的原型，不需要任何配置」

**竞品参考**：v0.dev 一键部署到 Vercel/Netlify；Cursor 内置 deploy

**方案对比**：

| 方案 | 描述 | 工时 | 优势 | 劣势 |
|------|------|------|------|------|
| A: Vercel API | 通过 Vercel API 直接部署 | 6h | 成熟稳定，无需运维 | 依赖 Vercel |
| B: Netlify Drop | Netlify drag-drop API | 5h | 更简单 | 功能受限 |
| C: GitHub Pages | 生成静态文件推送到 gh-pages | 8h | 完全自主 | 需 GitHub OAuth，复杂 |

**推荐方案 A**（Vercel API）：工时 6h，与 GitHub OAuth 集成，成熟生态。

**验收标准**：
- 导出面板有「Deploy to Vercel」按钮
- 点击后 ≤ 60s 生成在线 URL
- URL 可分享，有访问统计

---

### 4.2 P0-2: Epic 回滚 SOP + 验收标准对齐机制

**问题**：Epic 回滚 ≠ git revert（会丢失功能），但无标准 SOP；Sprint 1 中走了弯路。

**JTBD**：「作为开发者，我希望 Epic 回滚有标准流程，不因个人经验导致返工」

**Sprint 1 教训**：dev 在 Epic1 尝试通过 git revert 修复 TS 错误，结果丢失了 TabBar 功能。

**方案**：

| 方案 | 描述 | 工时 | 适用场景 |
|------|------|------|----------|
| A: 增量修复 SOP | 回滚 = 新 commit 修复，而非 revert | 2h | 保留功能历史 |
| B: 功能开关 | 用 feature flag 开关功能，而非删除 | 4h | 需要快速回退时 |
| C: 完整 SOP 文档 | 写清各类回滚场景的标准操作 | 3h | 全场景覆盖 |

**推荐方案 C**（完整 SOP + 功能开关组合）：
- 增量修复 SOP（2h）
- 功能开关模板（2h）— 统一用 `process.env.NEXT_PUBLIC_FEATURE_*`
- 总工时：4h

**验收标准**：
- `docs/process/ROLLBACK_SOP.md` 存在且包含 5+ 场景
- 功能开关在 E2/E3 Epic 中已使用
- Epic 开始前，dev/tester 对 DoD 对齐率 ≥ 80%

---

### 4.3 P0-3: Zustand Migration 知识库文档化

**问题**：Sprint 1 中 Epic6+7 发现了 Zustand persistence 迁移模式（无内置 API，需自定义 storage 包装），但无文档。

**JTBD**：「作为开发者，我希望遇到 Zustand migration 时有文档参考，不再重复摸索」

**发现模式**（Epic6+7 验证）：
```typescript
// CURRENT_STORAGE_VERSION: 1 → 2 (Epic6 后)
// CURRENT_STORAGE_VERSION: 2 → 3 (Epic7 后)
const CURRENT_STORAGE_VERSION = 3;

function runMigrations(oldState: any, version: number) {
  let state = { ...oldState };
  if (version < 2) { /* migration v1→v2 */ }
  if (version < 3) { /* migration v2→v3 */ }
  return state;
}
```

**方案**：

| 方案 | 描述 | 工时 | 优势 |
|------|------|------|------|
| A: 知识库文档 | 在 `knowledge-base/` 写 Zustand migration 指南 | 2h | 快速 |
| B: 封装成库 | 创建 `libs/canvas-store-migration/` 复用 | 5h | 可维护性高 |
| C: 模板生成器 | CLI 工具自动生成 migration 模板 | 4h | 标准化 |

**推荐方案 B**（封装库）：复用性最高，工时 5h。`libs/canvas-store-migration/index.ts` 导出 `createVersionedStorage`。

**验收标准**：
- `libs/canvas-store-migration/index.ts` 存在
- Epic6/Epic7 的 migration 已迁移到新库
- 有 Jest 测试覆盖

---

### 4.4 P1-1: Multi-Framework 导出支持

**问题**：当前仅支持 React 导出，限制了用户覆盖面。竞品 v0 支持多框架。

**JTBD**：「作为使用 Vue/ Svelte 的开发者，我希望 VibeX 能导出我熟悉的框架代码」

**竞品空白**：VibeX 竞品矩阵显示无一竞品同时支持 DDD 建模 + 多框架导出。

**方案**：

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: Vue 导出插件 | 开发 Vue 代码生成器 | 8h | 组件映射复杂 |
| B: 抽象代码生成层 | 重构为 DSL → 多框架 | 15h | 架构改动大 |
| C: 组件映射表 | React→Vue 通过映射表转换 | 5h | 样式映射困难 |

**推荐方案 C**（组件映射表）：快速验证，工时 5h。建立 React 组件到 Vue 的映射关系。

**验收标准**：
- 导出面板支持 React/Vue 切换
- 基础组件（Button/Input/Card）在 Vue 下可运行
- 单元测试覆盖率 ≥ 80%

---

### 4.5 P1-2: MCP (Model Context Protocol) 集成

**问题**：竞品 Claude (MCP) 和 Windsurf 正在快速集成 AI 生态，VibeX 需要跟进。

**JTBD**：「作为架构师，我希望能用 Claude Desktop 访问 VibeX 项目，作为 AI 助手的上下文」

**机会窗口**：Claude MCP 生态正在快速增长，VibeX 可作为「VibeX 项目 → Claude 上下文」的 MCP Server。

**方案**：

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: MCP Server | VibeX 提供 MCP Server 暴露项目上下文 | 10h | MCP 协议稳定性 |
| B: REST API 扩展 | 提供完整 REST API 供 MCP 调用 | 6h | API 设计复杂 |
| C: GitHub Integration | MCP 通过 GitHub 获取项目上下文 | 4h | 只能读，无法写 |

**推荐方案 A**（MCP Server）：战略价值最高，建立 VibeX 在 Claude 生态中的入口。工时 10h。

**验收标准**：
- `@vibex/mcp-server` npm 包存在
- Claude Desktop 可连接并查询 VibeX 项目
- 文档在 `docs/mcp-integration.md`

---

## 5. 方案对比汇总

| 提案 | 工时 | 优先级 | 并行性 | 依赖 |
|------|------|--------|--------|------|
| P0-1: 一键部署 | 6h | P0 | 可并行 | 无 |
| P0-2: 回滚 SOP | 4h | P0 | 可并行 | 无 |
| P0-3: Zustand 迁移库 | 5h | P0 | 可并行 | 无 |
| P1-1: Multi-Framework | 5h | P1 | 可并行 | 无 |
| P1-2: MCP 集成 | 10h | P1 | 可并行 | 无 |

**总工时**: 30h（约 1.5 周 1 人月）

**Epic 拆分建议**：

| Epic | 包含 | 工时 | 优先级 |
|------|------|------|--------|
| Epic1: 部署 + 回滚 | P0-1 + P0-2 | 10h | P0 |
| Epic2: Zustand 迁移库 | P0-3 | 5h | P0 |
| Epic3: Multi-Framework | P1-1 | 5h | P1 |
| Epic4: MCP 集成 | P1-2 | 10h | P1 |

---

## 6. 验收标准

| Epic | 验收标准 |
|------|----------|
| Epic1 | 「Deploy to Vercel」按钮存在且 ≤ 60s 生成 URL；ROLLBACK_SOP.md 包含 5+ 场景；功能开关在当前 Epic 中使用 |
| Epic2 | `libs/canvas-store-migration/index.ts` 存在且有 Jest 测试；Epic6/7 migration 迁移到新库 |
| Epic3 | 导出面板支持 React/Vue 切换；基础组件在 Vue 下可运行；测试覆盖率 ≥ 80% |
| Epic4 | `@vibex/mcp-server` npm 包存在；Claude Desktop 可连接；文档完整 |

---

## 7. 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Vercel API 限流 | 中 | 中 | 降级为 Netlify；加缓存 |
| MCP 协议变更 | 低 | 高 | 隔离在独立包；加版本锁定 |
| Vue 映射质量差 | 中 | 高 | 先 MVP 再优化映射表 |
| Epic 膨胀（Epic1 10h） | 中 | 中 | 拆为 sub-Epic |

---

## 8. 下一步行动

1. **PM 细化**：Epic1（10h）需拆分为 sub-Epic（P0-1 部署 + P0-2 回滚独立）
2. **并行启动**：Epic1-3 可立即并行（P0）
3. **Epic4 评估**：MCP 集成 10h，建议延后到 v0 威胁明朗后再决策
