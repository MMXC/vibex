**Agent**: analyst
**日期**: 2026-05-17
**项目**: vibex-proposals-sprint38
**仓库**: /root/.openclaw/vibex
**分析视角**: 基于 Sprint 1-37 交付成果，识别下一批高优先级功能增强

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | 多语言/国际化 (i18n) 系统 | 所有用户 | P0 |
| P002 | improvement | 协作感知：实时多人编辑冲突可视化 | 团队用户 | P0 |
| P003 | improvement | AI Coding 反馈回路增强 | AI 用户 | P1 |
| P004 | quality | Playwright E2E 稳定性治理 | QA 流程 | P1 |
| P005 | improvement | Canvas 性能：大规模节点虚拟化 + 缩略图 | 大型项目用户 | P1 |

---

## 2. 提案详情

### P001: 多语言/国际化 (i18n) 系统

**问题描述**:

当前 VibeX UI 仅支持英文（硬编码字符串）。S37 交付了主题系统（CSS 变量驱动），但 UI 文本无法本地化。随着用户群扩展到中文、日文、韩文等多语言市场，所有 UI 文本（按钮、标签、提示、错误信息）都需要 i18n 支持。

**影响范围**:

- 所有非英语用户
- 影响所有 6 个 Canvas 页面 + Settings + Dashboard + Analytics
- Sprint 1-37 所有组件均有硬编码文本

**验收标准**:

- [ ] 集成 `next-intl` 或 `react-i18next`
- [ ] 支持中英文切换（`/settings` 已有 theme 选择，可复用该 UI 位置）
- [ ] 所有 UI 文本使用 i18n key（零硬编码英文文本）
- [ ] 语言偏好持久化到 `userPreferencesStore`（S37-E011 已建 store）
- [ ] `Accept-Language` header 自动检测初始语言
- [ ] 动态导入语言包（不影响首屏性能）

---

### P002: 协作感知：实时多人编辑冲突可视化

**问题描述**:

当前 VibeX 是单用户应用。S5 的"交付产物整合"已建立跨画布导航，S6 的"AI Coding 集成"已有 Agent 反馈回路。但当 AI Agent 修改画布时，用户无法感知（无通知、无冲突检测）。多用户场景下，两人同时编辑同一节点会导致 last-write-wins 数据丢失。

**影响范围**:

- 团队协作场景（AI Agent + 人类用户同时工作）
- S6-E2 AI Coding Agent 已部署，需感知层

**根因分析**:

- **根因**: 缺乏操作转换（OT）或 CRDT 机制；CanvasStore 无操作日志；无 WebSocket 协作层
- **证据**: `confirmationStore.ts` 有 `addCustomSnapshot`，但无自动协作快照；`businessFlowStore.ts` 的 `updateNode` 直接覆盖，无并发控制

**验收标准**:

- [ ] CanvasStore 记录操作日志（oplog），每次变更记录 `userId/timestamp/nodeId/action`
- [ ] AI Agent 操作时，Canvas 右上角显示 "AI Editing..." indicator
- [ ] 同一节点被多人同时编辑时，显示冲突警告（黄色边框 + 提示）
- [ ] 操作日志可通过 `Ctrl+H` overlay 查看（复用 S37-E3 的 KeyboardHelpOverlay 模式）
- [ ] 冲突解决：最新时间戳 wins，但保留历史版本到 `confirmationStore`

---

### P003: AI Coding 反馈回路增强

**问题描述**:

S6-E2 实现了 AI Coding Agent，但反馈回路不完整：
1. AI 生成的代码无法在 Canvas 中预览差异（用户不知道 AI 改了什么）
2. AI 执行结果没有评分机制（S32 提案 P002 提到但未实现）
3. AI 生成失败时仅 `console.error`，无用户可见错误 UI

**影响范围**:

- 使用 AI Coding 功能的所有用户
- S6-E2 的 `useAIAgent` hook 已实现，但缺少结果展示

**根因分析**:

- **根因**: `useAIAgent` hook 返回结果未接入 Canvas UI；无 diff 展示组件；错误处理不完善
- **证据**: S6 architecture.md 中 "反馈回路" 定义为"代码变更→Canvas 更新"，但实际实现停留在 CLI 层面

**验收标准**:

- [ ] AI 执行后，DDSCanvasPage 显示 diff overlay（绿色=新增，红色=删除）
- [ ] Diff overlay 支持 approve/reject（approve → 执行变更，reject → 撤销）
- [ ] AI 生成结果评分卡：可读性/复杂度/覆盖率（3 分量）
- [ ] AI 错误时 Toast 通知（复用 S37-E7 ExportMenu Toast 模式）
- [ ] 评分历史存储到 `userPreferencesStore`（S37-E011 已建 persist）

---

### P004: Playwright E2E 稳定性治理

**问题描述**:

S14-E3 建立了 Playwright E2E 测试框架，S37-E4 覆盖了快捷键测试。但现有 E2E 测试存在以下问题：
1. **超时不稳定**: 某些测试依赖 `waitForTimeout(3000)` 而非 `waitForSelector`，在 CI 慢环境下 flaky
2. **跨浏览器覆盖缺失**: 仅测试 Chromium，未验证 Firefox/Safari
3. **测试隔离不足**: 测试之间共享 localStorage，导致状态污染
4. **覆盖率低**: S37 的 5 个 feature 仅 1 个有 E2E 覆盖

**影响范围**:

- CI 流水线稳定性
- 所有 Playwright spec 文件
- S37-E4 建立的 E2E 规范需扩展

**根因分析**:

- **根因**: Playwright 规范未强制执行；无 CI 并行测试；无 flaky test 追踪机制
- **证据**: `playwright.config.ts` 中 `timeout: 30000`，但部分测试在 CI 中超过 30s；无 `globalSetup` 清理 localStorage

**验收标准**:

- [ ] 所有 E2E spec 使用 `page.waitForSelector` 替代硬编码 `waitForTimeout`
- [ ] `globalSetup` 清理 `localStorage`/`IndexedDB`，确保测试隔离
- [ ] 覆盖率：S38 每个新 feature 至少 1 个 E2E spec
- [ ] Playwright config 增加 `retries: 2`（CI 模式）
- [ ] 测试报告输出到 `playwright-report/`，可被 CI 收集

---

### P005: Canvas 性能：大规模节点虚拟化 + 缩略图导航

**问题描述**:

S1-E1 实现了基础拖拽布局，S3-E1 实现了页面跳转连线。当前虚拟化支持 100+ 节点，但真实用户项目常见 300-800 节点规模（S32 提案 P001 识别此问题）。全览缩放时帧率下降明显；大规模画布缺乏缩略图导航，用户定位节点效率低。

**影响范围**:

- 中大型项目用户（>100 节点）
- 所有使用 DDSCanvasPage 的用户

**根因分析**:

- **根因**: 当前使用 CSS `overflow: auto` 全量渲染 DOM 节点；无 viewport culling；React 重新渲染开销随节点数线性增长
- **证据**: `ProtoFlowCanvas.tsx` 无虚拟化逻辑；S1 的 `useVirtualization` hook 未实现（S1 roadmap 有此计划但未完成）

**验收标准**:

- [ ] 500 节点项目缩放/平移帧率 ≥ 50fps（`performance.now()` 测量）
- [ ] 提供缩略图导航面板（MiniMap），支持点击跳转
- [ ] Group 节点折叠/展开不影响周围节点布局
- [ ] `react-window` 或 `@tanstack/react-virtual` 集成（viewport culling）
- [ ] CanvasStore 增加 `viewportBounds` 状态，节点只在视口内渲染

---

## 3. 相关文件

- 设计文档: `docs/vibex-proposals-sprint38/architecture.md`
- 实施计划: `docs/vibex-proposals-sprint38/IMPLEMENTATION_PLAN.md`

---

## 根因分析

### 根因

i18n 缺失的根本原因是：Sprint 1-37 的所有 UI 组件均使用硬编码英文字符串，未建立 i18n 抽象层。协作感知缺失的根本原因是：CanvasStore 是同步单用户设计，缺少操作日志和冲突检测机制。AI 反馈回路的根本原因是：useAIAgent hook 返回结果未接入 Canvas 可视化层。

### 证据

- S37-E012 Settings UI 中所有按钮文本均为硬编码英文
- `businessFlowStore.ts` 的 `updateNode` 方法无并发控制
- S6-E2 的 `useAIAgent` 返回结果仅用于 CLI 日志，未展示给用户
- E2E 测试使用 `page.waitForTimeout` 而非 `waitForSelector` 的 spec 数量 > 5

---

## 建议方案

### 方案 A（推荐）：增量 i18n + 协作感知

**i18n 路径**:
- 阶段1: 安装 `next-intl`，建立 `i18n/messages/{en,zh}.json` 语言包
- 阶段2: 在 S37 的 `DDSToolbar` 组件中试点（按钮最少）
- 阶段3: 逐步迁移所有组件到 `useTranslations()` hook

**协作感知路径**:
- 阶段1: 在 `businessFlowStore` 增加 `oplog[]` 数组（append-only）
- 阶段2: AI Agent 操作时写 oplog entry（`type: 'ai' | 'user'`）
- 阶段3: 冲突检测：同一 `nodeId` 在 5s 内两次写入 → 警告

**实施成本**: 中 | **风险**: 低 | **回滚计划**: 禁用 i18n feature flag，默认回退英文

### 方案 B：激进重构 i18n + 全量协作

- 立即用 `next-intl` 替换所有字符串
- WebSocket 协作层 + CRDT（实施成本高，风险高）

---

## 执行依赖

- [ ] 需要修改的文件: `vibex-fronted/src/components/`, `vibex-fronted/src/stores/`, `vibex-fronted/src/i18n/`
- [ ] 前置依赖: S37 `userPreferencesStore` (S37-E011) — 已完成 ✅
- [ ] 需要权限: GitHub Actions CI（已有），无新权限需求
- [ ] 预计工时: P001 4h, P002 6h, P003 4h, P004 3h, P005 5h
- [ ] 测试验证命令: `cd /root/.openclaw/vibex/vibex-fronted && pnpm test && pnpm test:e2e`
