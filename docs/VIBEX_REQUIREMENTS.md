# VibeX 项目完整需求文档

> **版本**: 1.1  
> **日期**: 2026-03-20  
> **状态**: 已整合 Analyst + PM + Architect 分析

---

## 一、总需求流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                        首页完整用户流程                                │
├─────────────────────────────────────────────────────────────────────┤
│ Step 1: 首页输入需求                                                 │
│         ↓                                                           │
│ Step 2: (可选) 对话澄清需求                                          │
│         ↓                                                           │
│ Step 3: 生成核心上下文业务流程                                        │
│         + 询问是否需要通用支撑域流程                                  │
│         (CRM→用户支撑域, 商品→支付域, etc.)                          │
│         ↓                                                           │
│ Step 4: 用户勾选需要的流程和节点                                      │
│         ↓                                                           │
│ Step 5: 根据选择 + 额外描述生成页面/组件节点                          │
│         ↓                                                           │
│ Step 6: 用户再次勾选节点及描述                                       │
│         ↓                                                           │
│ Step 7: 信息足够 → 点击「创建项目」                                   │
│         ↓                                                           │
│ Step 8: 进入 Dashboard 项目管理页                                    │
│         ├─ 看到刚创建的项目 (进行中状态)                            │
│         ├─ 点击查看进度                                               │
│         └─ 完成后 → 跳转原型预览页                                    │
│             (可交互 + AI助手对话微调)                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、各 Agent 分析摘要

### 2.1 Analyst 视角

| 完成度 | 问题 |
|--------|------|
| ~60-70% | 两套流程并行、数据隔离、关键步骤缺失 |

**已完成**: 首页输入、DDD分析、节点勾选、项目创建  
**偏离**: 对话澄清与首页割裂、设计流程数据不互通  
**缺失**: 支撑域询问、两轮勾选确认、Dashboard 原型预览

### 2.2 PM 视角

| 完成度 | 问题 |
|--------|------|
| ~60% | 3个P0回归Bug、4个下游功能缺失 |

**已完成**: 核心步骤流程 PRD、设计页面框架 PRD  
**回归Bug**: UI组件点击、流程图不显示、Design页面为空  
**缺失**: 创建项目、Dashboard、原型预览+AI助手 PRD

### 2.3 Architect 视角

| 核心问题 | 建议 |
|----------|------|
| confirmationStore ≠ designStore | 统一到 designStore |
| 两套流程并行 | 统一为单一流程 |
| API路由不一致 | vibex-ddd-api-fix 需实施 |

**已完成**: DDD API、状态机设计、步骤回退架构  
**偏离**: confirmationStore/designStore 分裂  
**缺失**: Dashboard 原型预览、AI 助手集成架构

---

---

## 三、架构核心约束 (Architect)

> ⚠️ **Architect 强调：必须统一数据层**

### 3.1 一个数据源原则

```
所有设计流程共享 designStore，首页仅为 designStore 的快速入口
```

| Store | 用途 | 状态 |
|-------|------|------|
| confirmationStore | 首页临时状态 | ⚠️ 需迁移到 designStore |
| designStore | 统一数据源 | ✅ 保留 |
| dashboardStore | Dashboard | ⚠️ 需与 designStore 同步 |

### 3.2 状态快照化

```
每步骤完成后保存快照，支持任意回退
```

### 3.3 渐进式确认

```
勾选确认分为两轮，生成结果可预览后再确认
```

### 3.4 API 路由统一

| 现状 | 问题 | 修复 |
|------|------|------|
| `/api/ddd/...` | 路由不一致 | 统一到 `/api/v1/domain-model/...` |

---

## 四、当前状态评估

### 2.1 完成度概览

| 阶段 | 完成度 | 说明 |
|------|--------|------|
| Step 1: 首页输入 | ✅ 100% | 需求输入框、流式分析 |
| Step 2: 对话澄清 | ⚠️ 30% | 有 /design/clarification 但与首页割裂 |
| Step 3: 核心上下文 | ✅ 95% | 限界上下文、流程图生成 |
| Step 4: 支撑域询问 | ❌ 0% | **完全缺失** |
| Step 5: 勾选流程节点 | ✅ 90% | 节点树选择器 |
| Step 6: 再次勾选 | ❌ 0% | **缺失** |
| Step 7: 创建项目 | ⚠️ 50% | 有入口但流程不完整 |
| Step 8: Dashboard | ⚠️ 50% | 有页面但功能不完整 |
| 原型预览 + AI助手 | ❌ 0% | **完全缺失** |

**整体完成度**: ~40%

### 2.2 核心问题

#### 问题 1: 两套流程并行 (数据隔离)

| 首页 (`/`) | 设计 (`/design/*`) |
|-----------|------------------|
| confirmationStore | designStore |
| 3 步骤 | 5 步骤 |
| 无对话澄清 | 有对话澄清 |
| 无数据同步 | 无数据同步 |

**影响**: 用户在首页完成流程后跳转到 Design 页面是空的

#### 问题 2: 关键步骤缺失

| 缺失项 | 影响 |
|--------|------|
| 支撑域询问 | 用户不理解领域分类 |
| 再次勾选确认 | 无法修正错误 |
| Dashboard 项目状态 | 无法查看进度 |
| 原型预览 | 无法看到最终效果 |
| AI 助手对话微调 | 无法调整生成结果 |

---

## 三、必须修复的回归问题

> ⚠️ **P0 - 阻断性问题**

| # | 问题 | 根因 | 修复方案 |
|---|------|------|----------|
| 1 | UI组件分析点不了 | DesignStepLayout 改动影响交互 | 检查点击事件绑定 |
| 2 | 第一步流程图不显示 | confirmationStore → designStore 数据不同步 | 添加数据同步机制 |
| 3 | /design/* 页面为空 | 两套 store 隔离 | 统一数据层或添加同步 |

---

## 五、功能开发计划 (整合版)

### Phase 1: 修复回归 (P0)

| Epic | 功能 | 来源 | 验收标准 |
|------|------|------|----------|
| Epic 1 | 修复 UI 组件点击 | PM | 组件可点击，触发正确事件 |
| Epic 2 | 修复流程图显示 | PM | 首页生成的数据能传递到预览区 |
| Epic 3 | 修复 Design 页面数据 | Architect | confirmationStore → designStore 同步 |
| Epic 4 | API 路由统一 | Architect | `/api/ddd/*` → `/api/v1/*` |

### Phase 2: 补充缺失流程 (P1)

| Epic | 功能 | 来源 | 验收标准 |
|------|------|------|----------|
| Epic 5 | 实现支撑域询问 | PM | 生成上下文后询问是否需要支撑域 |
| Epic 6 | 实现再次勾选确认 | PM | 用户可修正选择，支持两轮确认 |
| Epic 7 | 完善创建项目流程 | PM | 创建后跳转到 Dashboard |
| Epic 8 | 统一数据层 | Architect | 迁移 confirmationStore 到 designStore |

### Phase 3: 补充下游功能 (P2)

| Epic | 功能 | 来源 | 验收标准 |
|------|------|------|----------|
| Epic 9 | Dashboard 项目管理 | PM | 查看项目列表、状态、进度 |
| Epic 10 | 原型预览页 | Architect | 可交互的原型展示 |
| Epic 11 | AI 助手对话微调 | Architect | 在原型页与 AI 对话调整 |

### Architect 优先级建议

1. **P0**: vibex-ddd-api-fix + 首页→设计页数据同步
2. **P0**: vibex-step2-regression（节点不可点击）
3. **P1**: 两轮勾选数据流 + 步骤回退快照
4. **P1**: Dashboard 2.0 架构设计
5. **P2**: AI 助手集成抽象

---

## 六、架构约束 (Architect)

### 6.1 一个数据源原则 (必须)

**方案**: 统一使用 designStore 作为单一数据源

```
首页生成数据 → designStore → 所有页面读取
```

- confirmationStore 需迁移到 designStore
- 不允许创建第三套 store

### 6.2 状态快照化

```
每步骤完成后保存快照，支持任意回退
```

### 6.3 API 路由统一

```
/api/ddd/* → /api/v1/domain-model/*
```

### 6.4 不允许的操作

- ❌ 在首页流程中跳转到 /design/* 除非数据已同步
- ❌ 创建 confirmationStore 和 designStore 之外的第三套 store
- ❌ 在未完成当前步骤前允许进入下一步
- ❌ 节点勾选状态不持久化

---

## 七、验收标准

### 6.1 首页流程验收

| 步骤 | 验收条件 |
|------|----------|
| Step 1 | 输入需求后显示思考过程，生成限界上下文 |
| Step 2 | 支持对话澄清，用户可追问补充信息 |
| Step 3 | 生成核心上下文 + 支撑域询问 |
| Step 4 | 用户可勾选流程节点 |
| Step 5 | 根据选择生成页面/组件节点 |
| Step 6 | 用户再次勾选确认 |
| Step 7 | 点击创建项目，跳转到 Dashboard |

### 6.2 Dashboard 验收

| 功能 | 验收条件 |
|------|----------|
| 项目列表 | 显示用户所有项目 |
| 项目状态 | 显示进行中/已完成 |
| 进度查看 | 点击可查看生成进度 |
| 原型跳转 | 完成后可跳转预览页 |

### 6.3 原型预览验收

| 功能 | 验收条件 |
|------|----------|
| 页面展示 | 显示生成的页面原型 |
| 交互 | 原型可交互 |
| AI 助手 | 侧边栏 AI 对话窗口 |
| 调整 | AI 可根据对话调整原型 |

---

## 八、开发指导原则

1. **单一数据源**: 首页生成的所有数据存储在 designStore
2. **步骤锁定**: 未完成当前步骤不能进入下一步
3. **可回退**: 用户可回退到已完成步骤修改（状态快照化）
4. **状态持久化**: 刷新页面不丢失数据（localStorage 或 Store 快照）
5. **流程闭环**: 从首页到原型预览形成完整闭环
6. **渐进式确认**: 勾选确认分为两轮，生成结果可预览后再确认

---

## 九、待小羊确认

1. ✅ 上述需求流程是否正确？
2. ✅ 优先级排序是否合理？（Phase 1 P0 → Phase 2 P1 → Phase 3 P2）
3. ✅ 架构约束是否可以接受？（统一 designStore 为单一数据源）
4. ✅ Analyst/PM/Architect 分析是否有遗漏？
5. ✅ 可以开始 Phase 1 P0 修复吗？

---

## 十、参考文档

| 文档 | 来源 | 说明 |
|------|------|------|
| `docs/vibex-requirements-sync/analyst-perspective.md` | Analyst | 用户体验视角分析 |
| `docs/vibex-requirements-sync/pm-perspective.md` | PM | 产品需求视角分析 |
| `docs/vibex-requirements-sync/architect-perspective.md` | Architect | 架构设计视角分析 |
| `docs/vibex-requirements-sync/reviewer-perspective.md` | Reviewer | 代码审查视角分析 |
| `docs/vibex-requirements-sync/dev-perspective.md` | Dev | 代码实现视角分析 |
| `docs/vibex-requirements-sync/tester-perspective.md` | Tester | 测试覆盖视角分析 |
| `docs/VIBEX_REQUIREMENTS.md` | 汇总 | 本文档 |

---

## 十一、Reviewer 代码审查摘要

### ✅ 已审查通过

| 模块 | 质量评估 |
|------|---------|
| Mermaid 渲染 | ✅ Singleton + LRU + DOMPurify |
| Auth 安全 | ✅ AES-256-GCM + sessionStorage |
| 日志脱敏 | ✅ 28类敏感字段递归脱敏 |
| TypeScript | ✅ strict mode, 0 errors |
| 测试覆盖 | ✅ 153 suites, 1751 tests |

### ⚠️ 需关注问题

| ID | 问题 | 严重性 |
|----|------|--------|
| R1 | ClarifyStep 未与首页流程联动 | 🟡 |
| R2 | Step 3 (创建项目) 入口不清晰 | 🟡 |
| R3 | Chat AI 助手与流程未绑定 | 🟡 |
| R4 | Prototype 预览依赖前端 build | 🟡 |

### 关键发现

1. **confirm vs design 分裂**: 总需求期望无缝单页流程，但实现是多个独立页面
2. **Clarify 步骤未集成**: `design/clarification/page.tsx` 存在但未与首页流程联动
3. **Step 数量变化**: 主页 3 步 vs design 4 步 vs onboarding 5 步，流程不一致

---

## 十二、会议状态

| Agent | Perspective | 状态 |
|-------|-------------|------|
| Analyst | ✅ 完成 | analyst-perspective.md |
| PM | ✅ 完成 | pm-perspective.md |
| Architect | ✅ 完成 | architect-perspective.md |
| Reviewer | ✅ 完成 | reviewer-perspective.md |
| Dev | ⏳ 进行中 | 待提交 |
| Tester | ⏳ 进行中 | 待提交 |

---

---

## 十三、Dev 代码实现摘要

### 🔴 P0 严重问题

| 问题 | 影响 | 位置 |
|------|------|------|
| `onCreateProject={() => {}}` 空实现 | **无法创建项目，核心流程断裂** | HomePage.tsx:117 |
| HomePage 缺少 Step 4 项目创建步骤 | 项目创建无入口 | currentStep 只支持 1/2/3 |
| Confirm 流程完全闲置 | /confirm/* 页面从未被调用 | confirmationStore 未被使用 |

### ⚠️ 中等问题

| 问题 | 影响 | 位置 |
|------|------|------|
| 流程节点勾选未连通 | 无法基于选择生成内容 | NodeTreeSelector 未集成 |
| 通用支撑域询问缺失 | 需求理解不完整 | designStore 无支撑域状态 |
| /design/* 页面是占位桩 | 端到端流程中断 | ui-generation 无实际功能 |

### ✅ 已完成

- 限界上下文生成 ✅
- MermaidManager 重构 ✅
- Dashboard 完整实现 ✅
- confirmationStore 数据存储 ✅

---

## 十四、Tester 测试覆盖摘要

### 🔴 P0 测试缺口

| 流程 | 页面数 | 测试状态 | 风险 |
|------|--------|----------|------|
| Confirm 流程 | 6 页 | **0 测试** | 高 — 核心转化节点 |
| Design 流程 | 6 页 | **0 测试** | 高 — 核心生成链路 |
| E2E 环境 | - | **Playwright/jest 冲突** | 高 — 无法自动化 |

### ⚠️ 覆盖率不足

| 模块 | 分支覆盖率 | 阈值 |
|------|-----------|------|
| figma-import | 9.09% | 40% |
| github-import | ~5% | 40% |
| useDDD.ts | ~5% | 40% |
| useDDDStream.ts | ~18% | 40% |

### ✅ 覆盖良好

- Mermaid/Diagram: 84 tests ✅
- Auth/OAuth: 58 tests ✅
- Dashboard/Chat/Homepage: 有测试 ✅

---

## 十五、综合评估

### 整体完成度: ~35%

| 层级 | 完成度 | 说明 |
|------|--------|------|
| 首页输入 | ✅ 90% | 基本功能完成 |
| DDD 分析 | ✅ 80% | 限界上下文、流程图 |
| 对话澄清 | ⚠️ 30% | 有页面但未集成 |
| 流程节点勾选 | ⚠️ 50% | 组件存在但未连通 |
| 项目创建 | ❌ 0% | **空实现** |
| Dashboard | ✅ 80% | 页面存在 |
| 原型预览 | ❌ 0% | 占位桩 |
| AI 助手 | ⚠️ 50% | 有页面但未与流程打通 |
| 测试覆盖 | ⚠️ 60% | 核心流程 0 测试 |

### 核心问题汇总

1. **无法创建项目** — `onCreateProject` 空实现
2. **Confirm/Design 流程无测试** — 0 测试覆盖
3. **E2E 环境损坏** — Playwright/jest 冲突
4. **两套流程并行** — confirmationStore vs designStore 分裂
5. **通用支撑域缺失** — 需求理解不完整

---

*文档版本: 2.0 | 最后更新: 2026-03-20 | 整合: Analyst + PM + Architect + Reviewer + Dev + Tester*
# Reviewer 视角：需求对齐分析

**日期**: 2026-03-20  
**审查人**: reviewer  
**分析目标**: 对比总需求流程与实际代码实现，找出偏离与风险

---

## 一、总需求流程 vs 当前实现对照

```
总需求流程:
[1] 首页输入需求
[2] 对话澄清
[3] 生成核心上下文业务流程
[4] 询问通用支撑域
[5] 用户勾选流程节点
[6] 生成页面/组件节点
[7] 用户再次勾选
[8] 创建项目
[9] Dashboard
[10] 原型预览 + AI助手
```

| 步骤 | 总需求 | 当前实现 | 状态 | 风险 |
|------|--------|---------|------|------|
| 1 | 首页输入需求 | `HomePage.tsx` + InputArea | ✅ | - |
| 2 | 对话澄清 | `design/clarification/page.tsx` | ✅ | ClarifyStep API 未集成到首页流程 |
| 3 | 生成核心上下文业务流程 | `confirm/context/page.tsx` | ✅ | 依赖 bounded-context API |
| 4 | 询问通用支撑域 | `confirm/model/page.tsx` | ✅ | DomainModel 生成 |
| 5 | 用户勾选流程节点 | `confirm/flow/page.tsx` | ✅ | 用户交互已实现 |
| 6 | 生成页面/组件节点 | `design/ui-generation/page.tsx` | ✅ | DesignStepLayout 统一布局 |
| 7 | 用户再次勾选 | UI-generation 页面 | ✅ | - |
| 8 | 创建项目 | `requirements/new/page.tsx` | ✅ | - |
| 9 | Dashboard | `dashboard/page.tsx` | ✅ | - |
| 10 | 原型预览 + AI助手 | `prototype/page.tsx` + chat | ⚠️ | AI助手集成待验证 |

---

## 二、已审查通过的代码质量评估

### 2.1 符合规范的模块

| 模块 | 文件 | 质量评估 |
|------|------|---------|
| Mermaid 渲染 | `MermaidManager.ts` + `MermaidPreview.tsx` | ✅ Singleton + LRU + DOMPurify |
| Auth 安全 | `secure-storage.ts` + `auth-token.ts` | ✅ AES-256-GCM + sessionStorage |
| 日志脱敏 | `log-sanitizer.ts` | ✅ 28类敏感字段递归脱敏 |
| TypeScript | 全局 | ✅ strict mode, 0 errors |
| ESLint 性能 | `package.json` lint script | ✅ --cache, 27s |
| 测试覆盖 | 153 suites, 1751 tests | ✅ 全部通过 |

### 2.2 需关注的问题

| ID | 问题 | 位置 | 严重性 | 说明 |
|----|------|------|--------|------|
| R1 | ClarifyStep 未与首页流程联动 | `InputArea.tsx` | 🟡 | 用户输入后需手动跳转 clarification |
| R2 | Step 3 (创建项目) 入口不清晰 | `requirements/new/page.tsx` | 🟡 | 从 ui-generation 到 requirements/new 跳转路径未测试 |
| R3 | Chat AI 助手与流程未绑定 | `chat/page.tsx` | 🟡 | AI助手独立于流程，无法辅助澄清 |
| R4 | Prototype 预览依赖前端 build | `prototype/page.tsx` | 🟡 | Cloudflare Pages static export 兼容性待验证 |

---

## 三、代码偏离分析

### 3.1 确认流程 vs Design 流程分裂

**总需求**: 首页 → 连续引导流程  
**实际实现**: 首页 → `confirm/*` → `design/*` 两个独立区域

- `confirm/` (194-247 行/文件): 上下文/流程/模型确认 — 使用 MermaidPreview ✅
- `design/*` (48-328 行/文件): bounded-context/business-flow/domain-model/ui-generation — 使用 DesignStepLayout ✅

**偏离**: 总需求期望无缝的单页流程，但实现是多个独立页面。

### 3.2 Clarify 步骤缺失关键集成

`design/clarification/page.tsx` (328 行) 存在但：
- 未在首页 `InputArea` 的生成按钮之后自动触发
- API `/clarify/ask` 未与 `useDDDStream` 钩子集成
- 没有 SSE 流式返回澄清内容

### 3.3 Step 数量变化

**总需求**: 5 步引导 (onboarding)  
**实际 onboarding**: 5 步 (welcome/input/clarify/model/preview) ✅  
**实际 design 流程**: 4 个 design 页面 (bounded-context/domain-model/business-flow/ui-generation)  
**实际主页流程**: 3 步 (STEPS constant)

---

## 四、审查记录摘要

| 日期 | 项目 | 结论 | 关键修复 |
|------|------|------|---------|
| 03-20 05:36 | vibex-onboarding-redesign | ✅ | 5步引导 + Zustand 状态 |
| 03-20 05:57 | vibex-ts-strict | ✅ | strict mode, 0 errors |
| 03-20 11:14 | vibex-p1-security-fix | ✅ | AES-GCM + sessionStorage |
| 03-20 11:14 | vibex-auth-e2e-fix | ✅ | OAuth async 改造 |
| 03-20 11:14 | vibex-console-log-sanitize | ✅ | 28类敏感字段脱敏 |
| 03-20 12:44 | vibex-zustand-missing | ✅ | zustand@4.5.7 显式声明 |
| 03-20 16:24 | vibex-mermaid-regression-fix | ✅ | MermaidManager singleton |
| 03-20 16:50 | vibex-mermaid-render-fix | ✅ | MermaidPreview 重构 |
| 03-20 20:59 | vibex-ddd-api-fix | ✅ | DesignStepLayout + StepNavigator |
| 03-20 21:35 | vibex-eslint-perf-fix | ✅ | ESLint --cache |
| 03-20 21:35 | vibex-homepage-mermaid-fix | ✅ | PreviewArea 订阅 flowMermaidCode |
| 03-20 21:35 | vibex-secure-storage-fix | ✅ | 空 catch 添加 error logging |
| 03-20 21:35 | vibex-step2-issues | ✅ | DesignStepLayout |

**累计**: 13 个审查项目，100% PASSED

---

## 五、建议

### 高优先级
1. **Clarify 集成到首页流程**: 在 `InputArea` 生成按钮之后添加 clarification 阶段自动跳转
2. **Step 3 入口测试**: `design/ui-generation` → `requirements/new` 跳转链路测试覆盖

### 中优先级
3. **Chat AI 助手绑定流程**: AI 助手应能感知当前流程阶段，提供上下文相关辅助
4. **Prototype 静态导出验证**: Cloudflare Pages static export 与 prototype 预览的兼容性测试

### 低优先级
5. **代码重复清理**: `confirm/*` 和 `design/*` 页面有相似结构，可提取共享 Layout 组件
6. **测试覆盖补充**: `design/clarification/page.tsx` 目前无单元测试

---

## 六、结论

总体来看，代码实现基本覆盖了总需求流程，核心模块（Mermaid、Auth、日志、类型）质量良好。

**主要风险**: Clarify 步骤与首页流程的集成缺失，以及 Step 3 创建项目入口的跳转路径需要补充端到端测试。

**已审查代码安全性**: 无注入、XSS 或凭证泄露风险。
