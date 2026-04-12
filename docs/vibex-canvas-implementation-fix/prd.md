# PRD: VibeX Canvas Implementation Fix

**Agent**: PM  
**Date**: 2026-04-11  
**Project**: vibex-canvas-implementation-fix  
**Status**: Draft  
**Code Baseline**: `79ebe010`  

---

## 执行摘要

### 背景

VibeX Canvas 页面是产品的核心用户流程：需求录入 → DDD 三树生成 → 节点确认 → 项目创建。当前完成度已达 95.9%，但存在 3 个 P0 bug、6 个 P1 问题、1 个 P2 技术债，阻碍功能发布和可维护性。

### 目标

1. **P0**: 消除功能阻断 bug（闭包陷阱、类型断言、SSE 未接入）
2. **P1**: 修复重要缺陷（状态非响应式、版本轮询不稳定、多标签页冲突）
3. **P2**: 解决 CSS 可维护性（4,383 行单文件拆分）

### 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| TypeScript 类型错误数 | >0（有 as unknown as） | 0 |
| 闭包陷阱 bug | 防重入失效 | 连续点击防重入生效 |
| SSE 流式体验 | 无（同步等待） | 实时 Thinking + 树节点流式填充 |
| 导出按钮状态 | 不响应 | 点击后立即 disabled |
| 搜索耗时显示 | 不更新 | 正确显示毫秒级耗时 |
| 版本轮询稳定性 | 被 saveStatus 重置 | 持续稳定运行 |
| 多标签页版本隔离 | 单例互相覆盖 | 各标签页独立 |
| CSS 文件行数 | 4,383 行 | 拆至 6 个子文件 |

---

## Epic 拆分

### Epic 1: BugFix Sprint（~3.5h）

| ID | 功能点 | 描述 | 验收标准 | 页面/模块 | 工时 |
|----|--------|------|----------|-----------|------|
| S1-1 | handleRegenerateContexts 闭包修复 | useCallback 补全依赖数组 `[aiThinking, isQuickGenerating, requirementText, toast]`，消除防重入失效 | `expect(handleRegenerateContexts.toString()).not.toMatch(/useCallback.*\[\]/)` <br> `expect(eslint('handleRegenerateContexts')).toHaveRule('react-hooks/exhaustive-deps', 'off')` | CanvasPage.tsx:222-245 | 0.5h |
| S1-2 | useCanvasRenderer 类型安全化 | 移除 `as unknown as` 断言；在 types.ts 中为 BusinessFlowNode 和 ComponentNode 添加可选字段 `isActive`、`parentId`、`children` | `expect(tsc --noEmit).toHaveExitCode(0)` <br> `expect(file('useCanvasRenderer.ts')).not.toMatch(/as unknown as/)` | useCanvasRenderer.ts:178-195 | 1h |
| S1-3 | isExporting 响应式化 | 导出状态从 `ref` 改为 `useState`，按钮立即响应 | `expect(screen.getByRole('button', { name: /导出/ })).toBeDisabled()` after click <br> `expect(screen.getByRole('button', { name: /导出/ })).toBeEnabled()` after complete | useCanvasExport.ts:321 | 0.25h |
| S1-4 | searchTimeMs 响应式化 | 搜索耗时从 `ref` 改为 `useState`，耗时正确显示 | `expect(screen.getByTestId('search-time')).toHaveTextContent(/\d+ms$/)` <br> 多次搜索耗时分别正确更新 | useCanvasSearch.ts:183 | 0.25h |
| S1-5 | 版本轮询稳定性修复 | 版本轮询 useEffect 仅依赖 `projectId`，移除 `saveStatus` 依赖，定时器不被重建 | `expect(useAutoSave.ts).not.toMatch(/\[projectId,\s*saveStatus\]/)` <br> `expect(useAutoSave.ts).toMatch(/\[projectId\]/)` | useAutoSave.ts:343 | 0.5h |
| S1-6 | lastSnapshotVersionRef 实例隔离 | ref 从模块级单例移入 hook 内部 `useRef(0)`，多标签页版本追踪独立 | `expect(file('useAutoSave.ts')).not.toMatch(/^const lastSnapshotVersionRef/')` <br> `expect(file('useAutoSave.ts')).toMatch(/useRef\(0\)/)` | useAutoSave.ts:29 | 0.25h |
| S1-7 | renderContextTreeToolbar 记忆化 | 用 `useCallback` 包裹 `renderContextTreeToolbar`，或提取为独立组件 | `expect(screen.queryByTestId('tree-toolbar')).not.toBeNil()` <br> 无关状态变化不触发重渲染 | CanvasPage.tsx:342-363 | 0.25h |
| S1-8 | projectName 从 store 初始化 | projectName 初始值从 `sessionStore` 获取，不再硬编码"我的项目" | `expect(screen.getByTestId('project-name')).not.toHaveTextContent('我的项目')` 在已有项目页面 | useCanvasPanels.ts:29 | 0.25h |
| S1-9 | Store 循环依赖修复 | `contextStore.ts` 改用 `getFlowStore().getState()` 延迟获取，消除模块加载顺序警告 | `expect(file('contextStore.ts')).not.toMatch(/import.*useFlowStore/)` <br> `expect(file('contextStore.ts')).toMatch(/getFlowStore\(\)\.getState\(\)/)` | contextStore.ts:20 | 0.5h |

### Epic 2: SSE 流式生成（~2-3 days）

| ID | 功能点 | 描述 | 验收标准 | 页面/模块 | 工时 |
|----|--------|------|----------|-----------|------|
| S2-1 | SSE 流式接入 | `useAIController.ts` 替换同步 `canvasApi.generateContexts` 为 SSE 调用 `canvasSseApi`；UI 实时显示 Thinking、step_context、step_flow、step_components 事件；完成后显示 done 状态 | `expect(screen.getByTestId('ai-thinking')).toBeVisible()` during generation <br> `expect(screen.getByRole('tree')).not.toBeEmpty()` within 5s <br> `expect(screen.getByText(/生成完成|done/i)).toBeVisible()` on completion <br> `expect(screen.getByRole('button', { name: /重新生成/ })).toBeEnabled()` after SSE error | useAIController.ts + canvasSseApi.ts | 2-3d |

> **依赖项**: SSE 后端 `/api/v1/canvas/stream` 可用性需 Dev 验证；isActive 字段语义需 PM 澄清（P0-2 的前置条件）。

### Epic 3: CSS 架构重构（~1 day）

| ID | 功能点 | 描述 | 验收标准 | 页面/模块 | 工时 |
|----|--------|------|----------|-----------|------|
| S3-1 | CSS 按组件拆分 | `canvas.module.css`（4,383 行）拆分为 6 个子文件：<br>- `canvas.base.css`（全局布局、变量）<br>- `canvas.toolbar.css`（工具栏）<br>- `canvas.trees.css`（三树面板）<br>- `canvas.panels.css`（侧边面板）<br>- `canvas.export.css`（导出功能）<br>- `canvas.misc.css`（杂项） | `expect(file('canvas.module.css')).toHaveLinesLessThan(500)` <br> `expect(glob('canvas.*.css')).toHaveLength(6)` <br> gstack 截图对比与拆分前一致 <br> `expect(bundleSize('canvas.css')).toBeLessThan(originalSize * 1.05)` | canvas.module.css | 1d |

---

## 验收标准（完整列表）

### Epic 1 — BugFix Sprint

#### S1-1: handleRegenerateContexts 闭包修复

- `expect(tsc --noEmit).toHaveExitCode(0)`（含 ESLint）
- 连续点击"重新生成"按钮，第二个请求被阻断（控制台无重复请求日志）
- `requirementText` 变化后重新生成，内容与当前输入一致

#### S1-2: useCanvasRenderer 类型安全化

- `expect(tsc --noEmit).toHaveExitCode(0)`（无新增类型错误）
- `expect(screen.getAllByRole('treeitem')).toHaveLength(expected)` 三树节点正确渲染
- `expect(file('useCanvasRenderer.ts')).not.toMatch(/as unknown as/)`

#### S1-3: isExporting 响应式化

- 点击导出按钮后，按钮立即变为 disabled
- 导出完成后，按钮恢复 enabled
- `expect(screen.getByRole('button', { name: /导出/ })).toBeDisabled()` during export

#### S1-4: searchTimeMs 响应式化

- 搜索完成后，耗时显示正确更新（格式：`XXXms`）
- 多次搜索，耗时显示各自分别更新
- `expect(screen.getByTestId('search-time')).toHaveTextContent(/\d+ms$/)`

#### S1-5: 版本轮询稳定性修复

- 打开 Canvas，期间多次保存，版本历史轮询持续稳定执行（不被重置）
- `expect(consoleLogs).toContain(expect.stringMatching(/polling/))` within 30s

#### S1-6: lastSnapshotVersionRef 实例隔离

- 两个浏览器标签页同时打开 Canvas，各自有独立版本号追踪
- 一个标签页创建 snapshot 不影响另一个的轮询逻辑

#### S1-7: renderContextTreeToolbar 记忆化

- `renderContextTreeToolbar` 被 `useCallback` 包裹
- 无关状态（如面板折叠）变化，不触发 TreeToolbar 重渲染（React DevTools 验证）

#### S1-8: projectName 从 store 初始化

- Canvas 加载已有项目时，显示服务器返回的项目名
- `expect(screen.getByTestId('project-name')).not.toHaveTextContent('我的项目')`

#### S1-9: Store 循环依赖修复

- `contextStore.ts` 使用 `getFlowStore().getState()` 延迟获取
- 应用启动无 `Circular dependency` 警告

### Epic 2 — SSE 流式生成

- 点击"开始生成"后，AI Thinking 消息实时显示（`screen.getByTestId('ai-thinking')` visible）
- 各树节点按 SSE 事件流实时填充（context → flow → components）
- 生成完成时，UI 有明确反馈（done/error 状态）
- SSE 连接错误时，降级到同步 API 或显示错误提示（graceful degradation）

### Epic 3 — CSS 架构重构

- `canvas.module.css` 行数减少至 < 500 行
- 存在 6 个 `canvas.*.css` 子文件
- 页面样式与拆分前完全一致（gstack 截图逐组件对比）
- 未使用的 CSS 不被打包（构建产物验证）

---

## Definition of Done

### Epic 1 — BugFix Sprint

- [ ] 所有 9 个 Story 的验收标准 100% 通过
- [ ] `tsc --noEmit` 零错误
- [ ] ESLint 无新增 warning
- [ ] 每个 Story 独立 commit（可回滚）
- [ ] P0-2: PM 已澄清 `isActive` 语义（P0-2 解锁条件）

### Epic 2 — SSE 流式生成

- [ ] SSE 后端 `/api/v1/canvas/stream` 可用性验证通过
- [ ] Thinking 消息实时显示（UI 可见）
- [ ] 三树节点流式填充（用户感知到实时更新）
- [ ] 完成/错误状态明确反馈
- [ ] 降级策略已定义（SSE 失败 → 同步 API）
- [ ] gstack 自动化测试覆盖 SSE happy path

### Epic 3 — CSS 架构重构

- [ ] `canvas.module.css` 从 4,383 行拆至 < 500 行
- [ ] 存在 6 个子文件
- [ ] gstack 逐组件截图对比，无视觉差异
- [ ] 构建产物中未使用 CSS 不打包
- [ ] 每个 CSS 文件独立 commit

---

## 开放问题（Open Questions）

| # | 问题 | 负责人 | 阻塞状态 |
|---|------|--------|----------|
| OQ-1 | `isActive` 字段在 `BusinessFlowNode`/`ComponentNode` 中的语义是什么？是否等同于 `confirmed`？ | PM | **是** — P0-2 启动前必须澄清 |
| OQ-2 | SSE 后端 `/api/v1/canvas/stream` 是否已部署并可用？ | Dev | **是** — Epic 2 启动前必须验证 |
| OQ-3 | SSE 失败时的降级策略：自动切回同步 API 还是报错提示用户？ | PM | 否 — 影响 UI 设计 |
| OQ-4 | CSS 拆分的文件粒度：按组件还是按功能分类？ | Architect | 否 — 影响拆分方案细节 |

---

## 依赖关系图

```
Epic 1 (BugFix Sprint)
├── S1-1 handleRegenerateContexts ─────────┐
├── S1-2 useCanvasRenderer ─────┐ (OQ-1)  │
├── S1-3 isExporting ──────────┤          │
├── S1-4 searchTimeMs ─────────┤          │
├── S1-5 版本轮询 ─────────────┤          │
├── S1-6 lastSnapshotVersion ──┤          │
├── S1-7 TreeToolbar 记忆化 ────┤          │
├── S1-8 projectName 初始化 ────┤          │
└── S1-9 Store 循环依赖 ────────┘          │
                                        ┐
Epic 2 (SSE 流式生成) ←── 依赖 OQ-2 ──┤
                                        ┘
Epic 3 (CSS 重构)
└── S3-1 CSS 拆分 ──────────────── 无外部依赖
```

---

## 执行决策

- **决策**: 已采纳（分三阶段执行）
- **执行项目**: `vibex-canvas-implementation-fix`
- **执行日期**: 2026-04-11

### 执行阶段

| Phase | 内容 | 工期 | 前置条件 |
|-------|------|------|----------|
| Sprint 0 | Epic 1: BugFix Sprint（S1-1 ~ S1-9） | ~3.5h | OQ-1 澄清（P0-2 解锁） |
| Sprint 1 | Epic 2: SSE 流式生成（S2-1） | ~2-3 days | OQ-2 验证（SSE 后端可用） |
| Sprint 2 | Epic 3: CSS 架构重构（S3-1） | ~1 day | 无 |

> **立即可执行**: S1-1, S1-3, S1-4, S1-5, S1-6, S1-7, S1-8, S1-9（无前置条件）
> **需澄清**: S1-2（OQ-1: isActive 语义）
> **需验证**: S2-1（OQ-2: SSE 后端可用性）
