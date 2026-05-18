**Agent**: hermes (coord self-implement)
**日期**: 2026-05-18
**项目**: vibex-proposals-sprint38
**触发**: architect-review ghost self-implement — 26h+ in-progress, no output; coord wrote architecture.md + this plan

---

## 概览

Sprint 38 包含 5 个功能（P001-P005），共 15 个 Epic，分布在 3 个子阶段。

### 功能优先级
| # | 功能 | 优先级 | Epic数 | 预估工时 |
|---|------|--------|--------|----------|
| P001 | i18n 多语言 | P0 | 3 | 4h |
| P002 | 协作感知 | P0 | 3 | 6h |
| P003 | AI 反馈回路 | P1 | 3 | 4h |
| P004 | E2E 稳定性 | P1 | 3 | 3h |
| P005 | 虚拟化性能 | P1 | 3 | 5h |

---

## Phase1 Epic 清单

### P001: i18n 多语言系统

#### P001-E1: i18n 框架安装 + DDSToolbar 试点
- [ ] `pnpm add next-intl` 安装，版本锁定 ≥ 3.x
- [ ] 创建 `src/i18n/messages/en.json` 和 `zh.json`，包含 DDSToolbar 按钮文本（New/Add/Edit/Delete/Export/Settings/Theme）
- [ ] 创建 `src/i18n/index.ts` 导出 `I18nProvider`
- [ ] 创建 `src/hooks/useTranslations.ts` 兼容层 hook
- [ ] `DDSToolbar` 组件改为 `useTranslations('toolbar')()` 动态文本
- [ ] `next.config.js` 配置 `next-intl` 插件
- [ ] 中间件自动检测 `Accept-Language` header
- [ ] `pnpm build` 成功，无 i18n key 缺失警告

#### P001-E2: Settings 语言切换 UI
- [ ] `/settings` 页面增加语言切换下拉框（English / 中文），复用 S37 theme toggle 位置和样式
- [ ] `userPreferencesStore` 增加 `locale: 'en' | 'zh'` 字段，写入 persist
- [ ] 语言偏好从 `userPreferencesStore.locale` 读取，初始化 i18n 语言
- [ ] `pnpm test` 单元测试通过

#### P001-E3: 全局 UI 文本迁移
- [ ] 审查所有组件（DDSToolbar 除外）：Settings, Dashboard, Analytics, Canvas 操作按钮
- [ ] 替换所有硬编码英文 → `useTranslations()` 调用
- [ ] 语言包覆盖率达到 100%（验证：`grep -rn "英文文本" src/` 无结果）
- [ ] CI 增加 lint 规则：`no-hardcoded-strings`（使用 eslint-plugin-i18next 或自定义规则）
- [ ] `pnpm test && pnpm test:e2e` 全部通过

---

### P002: 协作感知

#### P002-E1: CanvasStore oplog + AI indicator
- [ ] `businessFlowStore` 增加 `oplog: OperationEntry[]` 字段
- [ ] `addOplogEntry()` action：生成 `{ id: uuid(), timestamp: Date.now(), ...entry }` 追加到数组
- [ ] oplog 限制 1000 条，超出时 `splice(0, 100)` 归档（移到 `conflictSnapshots`）
- [ ] `useAIAgent` hook 调用完成后，自动 `addOplogEntry({ userId: 'ai', type: 'ai', nodeId, action })`
- [ ] `AIEditingIndicator` 组件：在 AI 操作期间显示 🤖 黄色徽章 + "AI Editing..."
- [ ] indicator 挂载到 `DDSCanvasPage` 右上角
- [ ] `pnpm test` 覆盖 oplog append 逻辑

#### P002-E2: 冲突检测（5s 窗口警告）
- [ ] `addOplogEntry()` 内部增加冲突检测逻辑：同一 `nodeId` 在 5s 内有 >=2 条 entry → 触发冲突
- [ ] 冲突时：节点边框变黄色（CSS class `node-conflict-warning`）
- [ ] Toast 提示："检测到冲突：节点 {nodeId} 被同时编辑"
- [ ] 冲突快照存入 `confirmationStore.conflictSnapshots[nodeId]`
- [ ] `pnpm test` 覆盖冲突检测逻辑

#### P002-E3: Ctrl+H operation overlay
- [ ] `OperationOverlay` 组件：全屏遮罩 + 滚动列表展示 oplog（最近的在前）
- [ ] 每条 entry 显示：userId badge / action / nodeId / timestamp
- [ ] 全局 `Ctrl+H` 快捷键注册（使用 S37-E3 KeyboardHelpOverlay 的事件监听模式）
- [ ] overlay 内置搜索框，支持按 nodeId 过滤
- [ ] `pnpm test:e2e` 覆盖 Ctrl+H overlay 打开/关闭

---

### P003: AI 反馈回路

#### P003-E1: useAIAgent result 导出 + DiffOverlay UI
- [ ] `useAIAgent` hook 增加 `lastResult: DiffResult | null` 和 `lastError: string | null` 状态
- [ ] `DiffOverlay` 组件：接收 `DiffResult`，展示绿色（新增）/ 红色（删除）行级 diff
- [ ] diff 使用 `diff` npm 包（jsdiff）
- [ ] `DiffOverlay` 挂载到 `DDSCanvasPage`
- [ ] `pnpm test` 覆盖 DiffResult 状态更新

#### P003-E2: Approve/Reject 流程 + Toast 错误
- [ ] `DiffOverlay` 增加 Approve 按钮（写入文件）和 Reject 按钮（关闭 overlay）
- [ ] Approve 后：调用 `useAIAgent` 执行变更，关闭 overlay，写入 changelog
- [ ] Reject 后：关闭 overlay，不做任何变更
- [ ] `useAIAgent.lastError` 非空时，显示红色 Toast（复用 S37-E7 ExportMenu Toast 模式）
- [ ] `pnpm test:e2e` 覆盖 approve/reject 完整流程

#### P003-E3: 评分卡 + userPreferencesStore.aiScores 持久化
- [ ] `AIScoreCard` 组件：可读性/复杂度/覆盖率各 1-5 星，显示在 DiffOverlay 底部
- [ ] 评分逻辑：调用 LLM API 分析 diff 输出，生成 3 个维度评分
- [ ] 评分结果存入 `userPreferencesStore.aiScores[]`
- [ ] 历史评分列表可在 `/settings` 页面查看（展开 AI Scores 面板）
- [ ] `pnpm test` 覆盖评分持久化

---

### P004: Playwright E2E 稳定性

#### P004-E1: playwright.config.ts 改进
- [ ] `playwright.config.ts` 增加 `retries: 2`（CI 模式）
- [ ] 创建 `tests/global-setup.ts`：清理 `localStorage` 和 `IndexedDB`
- [ ] `globalSetup` 注册到 `playwright.config.ts`
- [ ] CI 配置收集 `playwright-report/` 目录为 artifact

#### P004-E2: waitForTimeout 替换
- [ ] `grep -rn "waitForTimeout" tests/` 列出所有违规位置
- [ ] 逐个替换为 `page.waitForSelector()` 或 `page.waitForFunction()`
- [ ] 替换完成后验证：`grep -rn "waitForTimeout" tests/` 无结果

#### P004-E3: 新 feature E2E 覆盖
- [ ] 为 P001（语言切换）、P002（冲突警告）、P003（DiffOverlay）各写 1 个 E2E spec
- [ ] E2E spec 路径：`tests/e2e/i18n-language-switch.spec.ts`
- [ ] E2E spec 路径：`tests/e2e/collaboration-conflict.spec.ts`
- [ ] E2E spec 路径：`tests/e2e/ai-diff-overlay.spec.ts`
- [ ] `pnpm test:e2e` 在 CI 环境（retries=2）通过率 100%

---

### P005: Canvas 性能/虚拟化

#### P005-E1: react-virtual 安装 + viewportBounds store
- [ ] `pnpm add @tanstack/react-virtual`
- [ ] `canvasStore` 增加 `viewportBounds: { x, y, width, height }` 字段
- [ ] 创建 `useViewportBounds` hook：监听 canvas 容器 resize/update，实时更新 viewportBounds
- [ ] viewportBounds 持久化到 sessionStorage（刷新页面后恢复视口位置）
- [ ] `pnpm test` 覆盖 viewportBounds 更新

#### P005-E2: ProtoFlowCanvas 虚拟化集成
- [ ] 在 `ProtoFlowCanvas` 中集成 `@tanstack/react-virtual`
- [ ] 实现 viewport culling：仅渲染视口内节点（`viewportBounds` 过滤）
- [ ] 虚拟化通过 feature flag `NEXT_PUBLIC_FEATURE_VIRTUALIZATION` 控制，默认 `off`
- [ ] 500 节点性能测试：创建 500 节点画布，测量 `performance.now()` 缩放帧率 ≥ 50fps
- [ ] `pnpm test` 覆盖虚拟化逻辑

#### P005-E3: MiniMap 组件 + 点击跳转
- [ ] `MiniMap` 组件：显示画布缩略图 + 蓝色视口边框矩形
- [ ] 点击 MiniMap 任意位置 → 平滑滚动到对应视口位置（使用 `canvasStore` 定位 action）
- [ ] MiniMap 位置：DDSCanvasPage 左侧（可折叠面板）
- [ ] 视口边框跟随 `viewportBounds` 实时更新
- [ ] `pnpm test:e2e` 覆盖 MiniMap 点击跳转

---

## dev → tester → reviewer 流程

每个 Epic 完成后按以下流程推进：

```
dev 完成 → tester E2E 测试 → reviewer 代码审查 → coord-completed 汇总
```

| Epic | dev | tester | reviewer |
|------|-----|--------|---------|
| P001-E1 | 完成后通知 tester | 单元 + 集成测试 | reviewer |
| P001-E2 | 完成后通知 tester | E2E 覆盖 | reviewer |
| P001-E3 | 完成后通知 tester | 全量回归 | reviewer |
| P002-E1 | 完成后通知 tester | 单元测试 | reviewer |
| P002-E2 | 完成后通知 tester | 冲突场景 E2E | reviewer |
| P002-E3 | 完成后通知 tester | overlay E2E | reviewer |
| P003-E1 | 完成后通知 tester | 单元测试 | reviewer |
| P003-E2 | 完成后通知 tester | approve/reject E2E | reviewer |
| P003-E3 | 完成后通知 tester | 评分持久化 E2E | reviewer |
| P004-E1 | 完成后通知 tester | 配置验证 | reviewer |
| P004-E2 | 完成后通知 tester | 全部 spec 通过 | reviewer |
| P004-E3 | 完成后通知 tester | 新 feature 覆盖 | reviewer |
| P005-E1 | 完成后通知 tester | viewportBounds 测试 | reviewer |
| P005-E2 | 完成后通知 tester | 500节点性能 E2E | reviewer |
| P005-E3 | 完成后通知 tester | MiniMap E2E | reviewer |

---

## 验收标准

- [ ] 所有 15 个 Epic 的 DoD 均已满足
- [ ] `pnpm build` 成功
- [ ] `pnpm test` 全部通过
- [ ] `pnpm test:e2e` CI 模式（retries=2）通过率 100%
- [ ] P005 虚拟化在 500 节点下 ≥ 50fps
- [ ] changelog 更新，包含所有 Epic 的变更记录
- [ ] 远程 GitHub push 完成
