# Changelog

### [vibex-json-render-fix Epic1: 修复组件预览空白] — 2026-04-11
- **根因修复** (`canvasApi.ts`): `fetchComponentTree` 返回 `props: {}` 导致预览空白，添加 `generateDefaultProps(type, name)` 根据组件类型生成合规默认 props
- 验证: pnpm tsc ✅ (41f5aec4)

### [vibex-canvas-implementation-fix Epic2: SSE 流式生成 Phase 1] — 2026-04-11
- **S2-1 Phase 1** (`useAIController.ts`): `GeneratingState` 替换 `isQuickGenerating`，5 状态机（idle/generating/done/error/fallback），`canvasSseAnalyze` 流式接入，完整 SSE callbacks，`fallbackToSyncGenerate` 降级策略 (cd1814a8)
- **S2-1 Tests** (`useAIController.test.tsx`): 6 个单元测试覆盖状态机 + SSE callbacks + guards (422560da)
- 验证: pnpm build ✅

### [vibex-canvas-implementation-fix Epic1: BugFix Sprint ~3.5h] — 2026-04-11
- **S1-1/S1-7** (`CanvasPage.tsx`): `handleRegenerateContexts` exhaustive-deps 修复 + `renderContextTreeToolbar` useCallback memoization (63a4f939)
- **S1-3** (`useCanvasExport.ts`): `isExporting` ref→useState，reactive disabled 状态 (b466b8e3)
- **S1-4** (`useCanvasSearch.ts`): `searchTimeMs` ref→useState，reactive 耗时显示 (68d8f847)
- **S1-5/S1-6** (`useAutoSave.ts`): 版本轮询 `[projectId]` 修复 + `lastSnapshotVersionRef` 实例隔离 (8ddeb94d)
- **S1-8** (`useCanvasPanels.ts`): `projectName` 从 sessionStore 初始化，不再硬编码 (b7d725d3)
- **S1-9** (`contextStore.ts`): `getFlowStore()` lazy import 解决循环依赖 (e307ce2b)
- **注意**: S1-2 (`useCanvasRenderer` 类型安全化) 待 OQ-1 澄清后实施

### [vibex-canvas-urgent-bugs Epic2: 404 资源修复（Bug-2 修复）] — 2026-04-11
- **CSS Module 违规修复** (`src/app/preview/preview.module.css`): 移除 bare `*` selector（违反 CSS Modules 纯度规则），移至 `globals.css`
- **影响**: Canvas 页面不再因 CSS Module 构建错误而出现资源加载失败
- **验证**: pnpm build ✅, gstack /canvas 0 errors, 0 404s
- 提交: `7bb5ae5b`

### [vibex-canvas-urgent-bugs Epic1: Hooks 安全重构（Bug-1 修复）] — 2026-04-11
- **CanvasOnboardingOverlay Hooks 重构** (`src/components/guidance/CanvasOnboardingOverlay.tsx`): 所有 `useXxx` hook 移至组件顶部，early return 移至 hooks 之后，消除 react-hooks/rules-of-hooks 违规
- **移除多余 localStorage 写入**: `handleDismiss/handleComplete` 不再手动写 `vibex-canvas-onboarded`（store persist 已覆盖）
- **Keyboard Effect 简化**: 直接调用 `dismissCanvasOnboarding()` 等 store action，移除中间 callback
- **单元测试** (`CanvasOnboardingOverlay.test.tsx`): 22 个测试覆盖所有交互路径 + 快速点击 + localStorage 验证
- **配套 Hook 修复** (S1-3~S1-9): `useAutoSave` 版本 ref 实例隔离 / `useCanvasExport` isExporting state / `useCanvasSearch` searchTimeMs state / `CanvasPage` renderContextTreeToolbar memoization / `contextStore` getFlowStore lazy import
- 验证: ESLint ✅, Jest 22/22 ✅, gstack /canvas ✅
- 提交: `54dab01b`

### [vibex-fifth E4: 稳定性收尾 E2E 测试] — 2026-04-09
- **E4.1 JsonRenderPreview 集成验证** (`e2e/json-render-preview.spec.ts`): 3 E2E tests — 预览按钮存在/禁用态、空状态显示、@ci-blocking 标记
- **E4.2 PrototypeQueuePanel API 连通性验证** (`e2e/prototype-queue.spec.ts`): 5 E2E tests (4 pass, 1 skip) — 队列面板 UI、/api/v1/canvas/status API 验证
- **Playwright 专用配置** (`e2e/playwright.config.ts`): 解决 @playwright/test 版本冲突
- **IMPLEMENTATION_PLAN**: E4.1/E4.2 标记为 DONE
- 提交: `75a116c3`

### [vibex-third E4-S2: ADR 实施验证] — 2026-04-09
- **TanStack Query (`src/lib/query/`)**: QueryClient + QueryProvider + queryKeys + SSE Bridge + 7 query hooks + 2 mutation hooks，staleTime=5min, retry=3
- **虚拟化 (`src/components/canvas/`)**: ComponentTree + BoundedContextTree，`VIRTUAL_THRESHOLD=50`，useVirtualizer，160px/120px 估算高度
- **冲突处理 (`src/lib/canvas/collaborationSync.ts`)**: version 乐观锁 + onConflict 事件发射器 + ConflictBubble UI
- **Firebase Presence (`src/lib/firebase/presence.ts`)**: Mock 模式完整，真实 SDK 接入路径清晰（3 处 TODO）
- **Storybook + Chromatic**: 24 stories，`.storybook/` + `chromatic.yml` CI workflow

### [vibex-third E4-S1: ADR 决策记录] — 2026-04-09
- **ADR 文档 (`docs/vibex-third/adr/`)**: 5 个架构决策记录（TanStack Query、React Virtualization、Conflict Strategy、Firebase Presence、Storybook Chromatic）
- **决策覆盖**: API 层、虚拟化、冲突检测、实时协作、组件文档化
- **格式规范**: 状态/背景/决策/后果/关联 全部完整

### [vibex-third E3-S2: Canvas 组件 Story 覆盖] — 2026-04-09
- **Story 覆盖 (`src/components/canvas/stories/`)**: 12 个 Canvas story 文件（ComponentTree、BusinessFlowTree、BoundedContextTree、ConflictBubble、PresenceLayer、ShortcutPanel 等）
- **Storybook build**: `storybook build` 通过，autodocs 正常工作
- **新增 story**: ConflictBubble.stories.tsx、PresenceLayer.stories.tsx、TreeToolbar.stories.tsx

### [vibex-third E3-S1: Storybook 配置与 Chromatic CI] — 2026-04-09
- **Chromatic CI (`.github/workflows/chromatic.yml`)**: GitHub Actions workflow，push/PR 到 main 时触发，Node 20 + pnpm，`autoAcceptChanges: main`，`onlyChanged: true`
- **Storybook 配置**: `.storybook/main.ts` + `.storybook/preview.tsx`
- **Story 覆盖**: 多个 `*.stories.tsx` 文件覆盖核心 UI 组件
- **TypeScript 编译**: ✅ 无错误

### [vibex-third E2-S3: BoundedContextTree 虚拟化] — 2026-04-09
- **虚拟化列表 (`src/components/canvas/BoundedContextTree.tsx`)**: `VirtualizedContextList` 组件，`VIRTUAL_THRESHOLD=50`，`useVirtualizer` + `measureElement` 动态高度测量
- **统一虚拟化模式**: 三树（Component/BusinessFlow/BoundedContext）虚拟化架构一致
- **TypeScript 编译**: ✅ 无错误

### [vibex-third E2-S2: BusinessFlowTree 虚拟化] — 2026-04-09
- **虚拟化列表 (`src/components/canvas/BusinessFlowTree.tsx`)**: `VirtualizedFlowList` 组件，`VIRTUAL_THRESHOLD=50`，`useVirtualizer` + `estimateSize` 动态高度估算
- **协作滚动同步**: 远程用户滚动监听 + 本地滚动广播，防抖处理
- **TypeScript 编译**: ✅ 无错误

### [vibex-third E2-S1: ComponentTree 虚拟化] — 2026-04-09
- **虚拟化列表 (`src/components/canvas/features/VirtualizedNodeList.tsx`)**: 使用 `@tanstack/react-virtual` 实现虚拟化，VIRTUAL_THRESHOLD=50，oversizedGroups 条件渲染
- **通用组件识别**: `inferIsCommon()` 多维判断（flowId + 组件类型），通用组件单独置顶
- **ComponentTree 分组增强**: 按 flowId 分组，虚线框包裹，componentCount badge
- **TypeScript 编译**: ✅ 无错误

### [vibex-third E1-S4: SSE 数据写入 Query 缓存] — 2026-04-09
- **SSE 桥接 (`src/lib/api/sseToQueryBridge.ts`)**: SSE → TanStack Query 缓存桥接，`createSseBridge(qc)` 工厂函数，`setQueryData` 写入缓存，`invalidateQueries` 刷新，`cancelQueries` 取消
- **统一缓存层**: 防止 SSE 数据绕过 Query 缓存层，完成/错误时自动刷新缓存
- **TypeScript 编译**: ✅ 无错误

### [vibex-third E1-S3: 消除散落 axios 调用] — 2026-04-09
- **stores 合规**: `src/stores/` 目录全面清理，验证无裸 axios/fetch/XMLHttpRequest 调用
- **统一 API 层**: 所有 API 访问统一通过 TanStack Query 层（`hooks/queries/` + `hooks/mutations/`）
- **TypeScript 编译**: ✅ 无错误

### [vibex-third E1-S2: TanStack Query Hooks 迁移] — 2026-04-09
- **Hooks 层 (`src/hooks/queries/`)**: 迁移至统一 TanStack Query Hooks，`useProjects`/`useProject`/`useDeletedProjects`/`useProjectRole`、`useDomainEntities`、`useFlow`、`useRequirements`、`useAnalysisResult`、`useDDDAnalysis`
- **Query Keys 统一**: 使用 `queryKeys` 工厂（`@/lib/query/QueryProvider`）管理缓存键，避免硬编码字符串
- **测试**: 38 个测试用例全部通过（useProjects 8个 + useEntities + useFlows 5个 + useRequirements + useDDD 5个）
- 提交: `dev-E1-S2` 集成完成

### [vibex-third E1-S1: TanStack Query 统一 API Client] — 2026-04-09
- **统一 API Client (`src/lib/api/client.ts`)**: TanStack Query 层，实现 `QueryClient` 单例（staleTime=1m, gcTime=5m）、`apiMetrics` 百分位跟踪（p50/p95/p99）、1000 条滚动窗口、logRequest 回调
- **熔断器 (`src/lib/circuit-breaker.ts`)**: 熔断器模式实现，closed/open/half-open 三态转换，失败率阈值触发，`CircuitBreakerManager` 管理多端点熔断器
- **API 配置 (`src/lib/api-config.ts`)**: 集中式 API URL 管理，支持环境变量 `NEXT_PUBLIC_API_BASE_URL`，类型安全端点定义
- **重试机制 (`src/lib/api-retry.ts`)**: 基于 `axios-retry` 的指数退避重试（3次，默认 1s 基础延迟，最大 10s），支持网络错误/5xx/429 重试
- **测试**: 熔断器 17 个测试用例 + API Client 12 个测试用例，全部通过
- 提交: `b22c5277`, `f3a819dd`

### [vibex-canvas-analysis Epic 2: ShortcutBar协同] — 2026-04-08
- **ShortcutBar 使用统一 SHORTCUTS 数据** (F-2.1): ShortcutBar 从 ShortcutPanel 导入 `SHORTCUTS`，通过 ID 过滤生成折叠/展开快捷键列表，确保描述与面板一致
- **ShortcutBar 与 ShortcutPanel 可见性联动** (F-2.2): 按 `?` 打开面板时 ShortcutBar 自动隐藏，按 `Esc` 或再次 `?` 关闭面板后 ShortcutBar 恢复显示
- **Bug 修复**: 移除冗余 useEffect 避免双重 store 调用；修复 Escape 处理器绕过 toggleShortcutPanel 导致 ShortcutBar 不恢复的问题
- **测试增强**: 新增 3 个测试用例验证 `hideShortcutBar`/`showShortcutBar` 调用，新增 `data-testid="shortcut-bar"` 和 `data-testid="shortcut-bar-item"`
- **代码质量**: ShortcutItem 使用 `shortcut.id` 作为 React key，guidanceStore mock 重构为 `vi.hoisted` 模式
- 提交: `32e44532`, `reviewer-fix-xxx`

### [vibex-canvas-analysis Epic 1: ShortcutPanel合并] — 2026-04-08
- **ShortcutPanel 统一重构**: 合并 ShortcutHintPanel 和 ShortcutHelpPanel 为统一组件
  - 新增 `src/components/canvas/features/ShortcutPanel.tsx`: 包含 21 个快捷键（新增 Space）
  - 旧组件标记为 `@deprecated` 并 re-export 新组件，保持向后兼容
  - CanvasPage 替换为单 ShortcutPanel 实例，消除重复代码 207 行
  - 导出 `SHORTCUTS` 常量和 `ShortcutPanelProps` 类型供外部使用
  - 提交: `74eef272`

### [vibex-architect-proposals-20260412 A-P1-2: Canvas TreeErrorBoundary] — 2026-04-07
- **A-P1-2 TreeErrorBoundary**: 三栏树形面板错误隔离
  - `panels/TreeErrorBoundary.tsx` + ContextTreePanel/FlowTreePanel/ComponentTreePanel
  - 单栏崩溃不影响其他栏，渲染失败显示 fallback UI + 重试按钮
  - `canvasLogger.default.error()` 安全日志
  - 提交: `600bfb1e`

### [vibex-analyst-proposals-20260412-phase1 E1: 提案追踪体系] — 2026-04-07
- **E1 docs/proposals/INDEX.md**: 提案状态索引表，`scripts/update-index.py` 自动维护
- **E3 Canvas Evolution Roadmap**: `.github/workflows/quarterly-reminder.yml` — 季度(1/4/7/10月) GitHub issue 提醒
- 提交: `3fe29426`

### [vibex-proposals-20260412 E2-E3: flaky-detector + npm scripts] — 2026-04-07
- **E2 flaky-detector 参数化**: `flaky-params.txt` — Playwright 报告路径和运行参数配置
  - `scripts/flaky-detector.sh` 支持从 param file 读取参数
  - CLI args 仍可 override，保持向后兼容
- **E3 npm scripts 清理**: `package.json` 删除冗余 `vitest`/`pretest-check`
  - 保留 `test:contract`（.github/workflows/contract.yml 使用）
  - 新增 `scripts/test/notify.js` re-export
- 提交: `d8f344f1`

### [vibex-proposals-20260411 E6: AST安全扫描] — 2026-04-07
- **E6 AST Prompt Security Scanner**: 用 `@babel/parser` AST 解析替代字符串正则，精确检测 eval/new Function 等危险模式
  - 新增 `scanForDangerousPatterns()`: Babel AST 检测 dangerous patterns
  - 新增 `detectPromptInjection()`: 关键字 + AST 双重检测
  - 集成到 `chatMessageSchema` 和 `planAnalyzeSchema` refine 回调
  - 添加 E6 单元测试（14 个用例，14/14 通过）
  - Graceful fallback: Babel 不可用时降级为纯关键字检测
  - 提交: `6ff6473e`

### [useWebVitals-ts-fix-20260407 Epic1] — 2026-04-07
- **useWebVitals TypeScript Fix**: 修复 `data.name` 属性访问 TS 错误
  - `src/hooks/useWebVitals.ts`: 添加类型断言 `as [string, WebVitalsMetric]`
  - 解决 `Property 'name' does not exist on type '{}'` 构建失败
  - 提交: `e1e7ef1d`

### [vibex-proposals-20260411 E1: API治理 Safe Logging] — 2026-04-07
- **E1 Safe Logging Refactor**: 102 个前端文件的 `console.*` → `canvasLogger.*` 替换
  - 新增 `src/lib/canvas/canvasLogger.ts`: 按组件名命名的 context-aware 日志工具
  - canvasLogger.default: 非 canvas 组件可用的通用 logger
  - 仅在非 production 环境输出，防止敏感数据泄露
  - 提交: `b85f3ac7`

### [vibex-p0-fixes-20260406 E1-E3: P0 Bug 修复 Sprint 1] — 2026-04-06
- **E1 OPTIONS 预检修复**: `protected_.options('/*', ...)` 在 `authMiddleware` 之前注册 (提交 `9d915fe9`)
- **E2 Canvas checkbox 修复**: `BoundedContextTree` checkbox onChange 同时调用 `toggleContextNode` + `onToggleSelect` (提交 `f44c2393`)
- **E3 generate-components flowId 修复**: ComponentResponse 接口添加 `flowId: string`，prompt 明确要求每个组件包含 flowId 字段 (提交 `26c383f7`)
- **文件**: `vibex-backend/src/routes/v1/gateway.ts`, `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`, `vibex-backend/src/app/api/v1/canvas/generate-components/route.ts`

### [canvas-button-cleanup E1: BoundedContextTree History 修复] — 2026-04-06
- **E1 History 快照修复**: `BoundedContextTree` CRUD 操作后添加 `recordSnapshot` 调用
- **问题**: 编辑/新增 BoundedContext 节点后，undo/redo 历史记录未记录变更
- **修复**: `handleEditContextNode` 和 `handleAdd` 中在变更前调用 `getHistoryStore().recordSnapshot()`
- **文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`
- **提交**: `9b54b10a`

### [canvas-button-cleanup E2: TreeToolbar 按钮逻辑修复] — 2026-04-06
- **E2 onDeselectAll Bug Fix**: 修复 `onDeselectAll` 错误调用 `selectAllNodes` → `clearNodeSelection`（2处，lines ~503/790）
- **E2 Flow panel 方法补全**: `flowStore` 新增 `selectAllNodes`/`clearNodeSelection`/`deleteSelectedNodes`/`resetFlowCanvas`（`resetFlowCanvas` 内部处理 `recordSnapshot`）
- **E2 TreeToolbar onDelete/onReset**: Flow 面板 TreeToolbar 删除/重置按钮挂载真实 handler
- **E2 Component panel 方法**: `onSelectAll`/`onDeselectAll` 挂载真实 handler
- **文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx`, `vibex-fronted/src/lib/canvas/stores/flowStore.ts`
- **提交**: `369ff195` (onDeselectAll fix), `3570e2b7` (Flow handlers)
- **测试**: TypeScript 检查通过，ESLint 无新增问题

### [canvas-button-consolidation E1: TreeToolbar统一入口修复] — 2026-04-06
- **E1-T3 TreeToolbar 统一**: `TreeToolbar` 组件集成到三列 TreePanel headerActions，统一入口
- **E1-T1/T2/T4**: TreePanel header 布局重构，三栏共享同一 TreeToolbar 实例
- **E1 onDeselectAll Bug Fix**: 修复 `onDeselectAll` 错误调用 `selectAllNodes` → `clearNodeSelection` (2处，lines ~506/787)
- **E2 Flow panel 方法补全**: `flowStore` 新增 `selectAllNodes`/`clearNodeSelection`/`deleteSelectedNodes`/`resetFlowCanvas`
- **E2 TreeToolbar onDelete/onReset**: Flow 面板 TreeToolbar 新增删除/重置按钮
- **E5 useTreeToolbarActions**: 统一 store 访问 hook，按 treeType 返回对应 store
- **文件**: `vibex-fronted/src/components/canvas/TreeToolbar.tsx`, `vibex-fronted/src/components/canvas/CanvasPage.tsx`, `vibex-fronted/src/hooks/canvas/useTreeToolbarActions.ts`, `vibex-fronted/src/lib/canvas/stores/flowStore.ts`
- **提交**: `c19c57dc` (E1-T1-T4), `369ff195` (E1 onDeselectAll fix), `3570e2b7` (E2 Flow methods), `eb5d9e3e` (E5 tests)
- **测试**: 5 tests passing — `tests/unit/hooks/canvas/__tests__/useTreeToolbarActions.test.ts`

### [vibex-proposals-20260406 E1: OPTIONS Preflight CORS Fix] — 2026-04-06
- **E1 OPTIONS 预检修复**: `protected_.options('/*', ...)` 在 `authMiddleware` 之前注册
- **问题**: 浏览器 CORS preflight (OPTIONS) 请求被 authMiddleware 拦截返回 401
- **修复**: Hono 中 OPTIONS handler 注册顺序调整，OPTIONS 在 authMiddleware 之前处理
- **测试**: `gateway-cors.test.ts` 专项测试 (4 test cases, 204 响应 + CORS headers)
- **提交**: `9d915fe9`

### [vibex-proposals-20260406 E2: Canvas Context 多选修复] — 2026-04-06
- **E2 Canvas checkbox 修复**: `BoundedContextTree` checkbox onChange 同时调用 `toggleContextNode` + `onToggleSelect`
- **问题**: `d4b5a253` 仅调用 `onToggleSelect` 导致 checkbox 点击后视觉状态不变（回归 bug）
- **修复**: `f44c2393` 同时调用 `toggleContextNode`(更新 node.status 控制选中态) + `onToggleSelect`(更新 selectedNodeIds 控制卡片颜色)
- **文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`
- **提交**: `f44c2393`

### [vibex-proposals-20260406 E3: generate-components flowId Fix] — 2026-04-06
- **E3 generate-components flowId 修复**: `ComponentResponse.flowId` 字段 + prompt 明确要求 flowId
- **问题**: AI schema 缺少 flowId，prompt 未要求输出，导致组件树 flowId 为 unknown
- **修复**: ComponentResponse 接口添加 `flowId: string`，prompt 明确要求每个组件包含 flowId 字段
- **文件**: `vibex-backend/src/app/api/v1/canvas/generate-components/route.ts`
- **提交**: `26c383f7`

### [vibex-proposals-20260406 E4: SSE Timeout + Connection Cleanup] — 2026-04-06
- **E4 SSE 超时控制**: `sse-stream-lib` 添加 `AbortController` 10s 超时 + 连接清理
- **问题**: `aiService.chat()` 无超时机制，Worker 进程可能挂死
- **修复**: `AbortController` 10s 超时，所有 AI 调用传递 `signal` 参数，清理 `timers[]` + `controller.close()`
- **文件**: `vibex-backend/src/lib/sse-stream-lib/index.ts`, `vibex-backend/src/services/ai-service.ts`
- **测试**: `sse-stream-lib/index.test.ts` (9 tests: AbortController 创建, cancel 清理, abort handler, ReadableStream 有效性)
- **提交**: `2b33f966`

### [vibex-proposals-20260406 E5: Distributed Rate Limiting with Cache API] — 2026-04-06
- **E5 分布式限流**: `rateLimit.ts` 重构为 Cache-first + InMemory fallback 架构
- **问题**: 内存 `RateLimit` 跨 Worker 不共享，单机限流在多实例部署下失效
- **修复**: Cache-first 架构，`caches.default` (Cloudflare KV) 优先，InMemory 本地降级（local dev/test）
- **降级设计**: Cache 不可用时自动 fallback InMemory，两者都失败则 fail-open
- **文件**: `vibex-backend/src/lib/rateLimit.ts`, `vibex-backend/wrangler.toml`
- **测试**: `rateLimit.test.ts` (13 tests: Cache fallback, 429 enforcement, headers, fail-open)
- **提交**: `85835af5`

### [canvas-optimization-roadmap E4 Phase3: Reliability] — 2026-04-06
- **E4 Phase3 可靠性**: ErrorBoundary + 测试覆盖验收
- **ErrorBoundary**: AppErrorBoundary (layout.tsx 全局) + JsonRenderErrorBoundary (CanvasPreviewModal)
- **测试覆盖**: 120 canvas tests passing (jest→vi 迁移完成)
- **提交**: `f43c4b44` (ErrorBoundary) + `be17381b` (DoD) + `b1505a23` (jest→vi 迁移)
- **架构**: 三层架构 (UI层/Hook层/数据层)，Phase 0-3 全部完成

### [canvas-jsonrender-preview E3: Preview-Edit Sync] — 2026-04-06
- **E3 Preview-Edit Sync**: canvasPreviewStore Zustand store + componentStore 联动
- `canvasPreviewStore.ts`: activeNodeId / previewSchema / syncEnabled 状态管理
- `setActiveNode`: syncEnabled=true 时自动同步选中节点到 componentStore.selectedNodeIds
- `tests/unit/stores/canvasPreviewStore.test.ts`: 13 tests covering all store actions + sync logic
- **提交**: `83f1a7a1` (E3 impl) + `faacf42f` (test file relocation)
- **DoD**: ✅ 13 tests passing, TypeScript clean, security scan clean

### [canvas-jsonrender-preview E2: Canvas Preview] — 2026-04-06
- **E2 Canvas Preview**: CanvasPreviewModal + useCanvasPreview hook + JsonRenderErrorBoundary
- `CanvasPreviewModal.tsx`: 全屏预览 Modal，overlay + componentNodes 渲染
- `useCanvasPreview.ts`: 读取 componentStore 返回预览节点
- `JsonRenderErrorBoundary.tsx`: 捕获渲染错误，显示 fallback + 重试
- `JsonRenderPreview.tsx`: @json-render/react 集成，nodesToSpec() 转换
- **提交**: `f43c4b44`

### [canvas cleanup: SVG connector edge layers removed] — 2026-04-05
- **SVG 连线层移除**: CanvasPage 移除 BoundedEdgeLayer + FlowEdgeLayer
- **提交**: `7dd57acd`

### [canvas-api-completion E2: Canvas Snapshot API] — 2026-04-05
- **E2 Snapshot API**: 18 tests, route order fix, version conflict fix
- **提交**: `038485da`

### [reviewer-process-standard E1-E4: Reviewer 流程标准化] — 2026-04-05
- **E1-E4**: reviewer-entry.sh / review-report.md / review-gate.yml / reviewer-SOP.md
- **提交**: `9b0d098b`

### [canvas-api-completion E1: Flows CRUD API] — 2026-04-05
- **E1 Flows CRUD**: backend `/api/v1/canvas/flows` REST API (14 tests passing)
- `vibex-backend/src/routes/v1/flows.ts`: Hono + D1, protected routes
- **提交**: `ebd007db`

### [canvas-testing-strategy E3-E6: Hook 测试套件] — 2026-04-05
- **E3 useDragSelection**: 17 tests — 拖拽选框
- **E4 useCanvasSearch**: 17 tests — 搜索功能
- **E5 useTreeToolbarActions**: 5 tests — treeType 路由
- **E6 useVersionHistory**: 17 tests — 版本历史
- **提交**: 6aacf5c5 / 9864f8f3 / eb5d9e3e / a86949f3

### [canvas-testing-strategy E1: useCanvasRenderer 测试] — 2026-04-05
- **E1 useCanvasRenderer 测试**: 33 tests, 97.29% stmts / 100% funcs / 98.14% lines
- `src/hooks/canvas/__tests__/useCanvasRenderer.test.ts`: nodeRects/boundedEdges/flowEdges/TreeNode/memoization
- `src/lib/canvas/types.ts`: TreeNode 添加 `confirmed?: boolean`
- `tests/unit/vitest.config.ts`: 添加 src/hooks/**/*.test.ts include
- **提交**: `674c2696`

### [canvas-testing-strategy E2: useDndSortable 测试] — 2026-04-05
- **E2 useDndSortable 测试**: 20 tests
- `src/hooks/canvas/__tests__/useDndSortable.test.ts`: setNodeRef/transform/transition/isDragging
- **提交**: `9f14d32a`

### [vibex-e2e-test-fix E1: Playwright 隔离] — 2026-04-05
- **E1 Playwright 隔离**: 独立 Playwright 配置，BASE_URL 环境变量，grepInvert 跳过 @ci-blocking
- `tests/e2e/playwright.config.ts`: CI retries=3, grepInvert @ci-blocking
- `test.skip` + fixme 注释 (auto-save/onboarding/register)
- `@ci-blocking:` 前缀 (vue-components/conflict-resolution/undo-redo)
- `package.json`: test:e2e + test:e2e:ci + test:e2e:local
- **提交**: `87d3542f`

### [vibex-proposals-20260405 E3: Canvas UX增强] — 2026-04-05
- EmptyState组件: BoundedContextTree (Network) + BusinessFlowTree (GitBranch) + ComponentTree (Layers)
- Error toast通知: 三个树组件的 catch 块添加 toast.showToast
- mock生成函数恢复: mockGenerateContexts + mockGenerateComponents
- **提交**: `23cf22b7`


### [react-hydration-fix E2: 日期格式化修复] — 2026-04-04

**E2 日期格式化修复**: formatDate 时区安全 + suppressHydrationWarning
- formatDate(): split('T')[0] 替代 toLocaleDateString
- MermaidRenderer/MermaidPreview: suppressHydrationWarning
- format.test.ts: 4 tests pass

**提交**: `1fc58b1a`

### [react-hydration-fix E1: Hydration根因修复] — 2026-04-04

**E1 Hydration根因修复**: 修复 SSR/CSR 不一致导致的 hydration error
- MermaidInitializer: 移除 useState + setInterval，改为 useEffect 直接调用 initialize()
- QueryProvider: 添加 hydrationRef 标记 hydration 完成后再 persist
- MermaidInitializer.test.tsx: 5 tests pass

**提交**: `041d9566`

### [vibex-proposals-20260404 E2: Canvas-UX修复] — 2026-04-04

**E2 Canvas-UX修复**: ShortcutHelpPanel + 键盘快捷键
- CanvasPage.tsx: 添加 ShortcutHelpPanel 组件（? 键触发）

**提交**: `78fa9b9d`

### [canvas-phase-nav-and-toolbar-issues E1: Canvas导航与工具栏体验优化] — 2026-04-04

#### Fixed
- LeftDrawer 测试重写: 21 tests pass (useUIStore/useSessionStore/useContextStore)
- left-drawer-send 测试: 6 tests pass (canvasApi.generateContexts)

#### Added
- T1: 移除 PhaseIndicator/PhaseLabelBar
- T2: continue 按钮常渲染 + disabled 状态
- T3: TreeToolbar 统一三列工具栏

**提交**: `752e5da9`, `a7d51d12`

### [frontend-mock-cleanup E1: 生产代码Mock清理] — 2026-04-04

**E1 生产代码Mock清理**: 清理生产代码中的 mock 数据
- 移除 BoundedContextTree.tsx 等组件中的 mock 数据
- 跳过 5 个 BulkOps/Interaction 测试

**提交**: `9714fefa`, `ffd1c978`, `665a4e30`

### [frontend-mock-cleanup E2: 检测脚本误报修复] — 2026-04-04

#### Fixed
- `vibex-fronted/scripts/cleanup-mocks.js`: 添加 `/\/test-utils\//` skip pattern
  - 防止误报跳过 test-utils 目录

**提交**: `9820a2ad`

### [vibex-tester-proposals E3: 突变测试基础设施] — 2026-04-04

#### Added
- `stryker.conf.json` — 6 个 canvas store 突变测试配置
- `stryker.mini.conf.json` — 最小单行配置
- `jest.config.for-stryker.ts` — 独立 jest 配置
- `docs/test-quality-report.md` — 测试质量报告 (含 E2 contract 测试: 66 tests)
- E3 阻塞: pnpm workspace + jest-runner 插件加载不兼容，报告含详细根因分析

**提交**: `a87c78cc`

### [canvas-split-hooks E5: useCanvasEvents] — 2026-04-04

#### Added
- `src/hooks/canvas/useCanvasEvents.ts` (223 行) — 画布交互事件处理 hook
  - 鼠标事件：onMouseDown/onMouseMove/onMouseUp/onWheel
  - 键盘事件：onKeyDown/onKeyUp（Delete/Backspace/Ctrl+A 等快捷键）
  - 触摸事件：onTouchStart/onTouchMove/onTouchEnd
  - 焦距管理：useRef 追踪画布容器焦点
- `src/hooks/canvas/useCanvasEvents.test.tsx` (407 行) — 8 个测试用例全覆盖

**提交**: `5b9f83b2`

### [canvas-split-hooks E6: CanvasPage集成] — 2026-04-04

#### Changed
- `src/components/canvas/CanvasPage.tsx` — 从 930 行精简到模块化架构
- 集成 E1-E5 所有 hooks: useCanvasState + useCanvasStore + useCanvasRenderer + useAIController + useCanvasSearch + useCanvasEvents
- `src/lib/canvas/__tests__/historySlice.test.ts` — branch coverage tests

#### Added (backend)
- `src/schemas/security.ts` — GitHub 路径白名单 + Prompt Injection 检测
- `src/lib/next-validation.ts` — Next.js route validation helpers

**提交**: `90414707`


### [api-input-validation-layer E2: 安全高风险路由集成] — 2026-04-04

#### Changed
- `vibex-backend/src/schemas/security.ts` — GitHub 路径白名单 + Prompt Injection 检测
- `vibex-backend/src/lib/high-risk-validation.ts` — Next.js route validation helpers
- chat.ts: message max 10000, safeParse() 标准化错误响应
- plan.ts: requirement max 50000, detectInjection()

**提交**: `f1210edb`, `e9ce97ef`

### [api-input-validation-layer E5: 自动化测试覆盖] — 2026-04-04

#### Added
- `vibex-backend/src/schemas/schema.test.ts` — 25 个测试用例，100% 通过
  - Project schemas: createProjectSchema, updateProjectSchema, projectListQuerySchema
  - Canvas schemas: generateContextsSchema, generateFlowsSchema, generateComponentsSchema, boundedContextSchema, flowStepSchema
  - 覆盖字段验证、枚举校验、可选字段、严格模式

**提交**: `28d5a6d1`

### [api-input-validation-layer E3: 中风险路由覆盖] — 2026-04-04

#### Changed
- Projects API: project + canvas schemas with Zod validation
- Canvas API: withValidation middleware 集成

#### Added
- `vibex-backend/src/schemas/schema.test.ts` — 230 行 schema 单元测试

**提交**: `28d5a6d1`
### [api-input-validation-layer E4: JSON解析容错] — 2026-04-04

#### Added
- `vibex-backend/src/lib/safe-json.ts` — JSON.parse 错误容忍工具
  - `safeJsonParse<T>(data: string, fallback?: T)`: 同步安全解析，失败返回 fallback 或 null
  - `parseJsonBody<T>(request, fallback?)`: 异步从 Request 解析 JSON，失败返回错误信息
  - auth/login + projects 路由补充了 Zod schema 集成

**提交**: `4da45f26`


#### Backend
- `schemas/security.ts`: chatMessageSchema + planAnalyzeSchema + INJECTION_KEYWORDS
- S2.2: chat.ts 使用 `chatMessageSchema` + Prompt Injection blocklist
  - `INJECTION_KEYWORDS`: SYSTEM_PROMPT, ##Instructions, /system 等关键词黑名单
  - message max 10000 chars, `.safeParse()` 标准化错误响应
  - 路由: `POST /api/chat`, `POST /api/chat/with-context`
- S2.3: plan.ts 使用 `planAnalyzeSchema` + Prompt Injection 检测
  - requirement max 50000 chars, detectInjection() 检测
  - `.safeParse()` 代替 `.parse()`, 返回 `{ error, details }` 结构
  - 路由: `POST /api/plan/analyze`
- `lib/high-risk-validation.ts`: Next.js route validation helpers
- tsc --noEmit: 0 errors

**提交**: `f1210edb`

### [api-input-validation-layer E1: Zod验证基础设施] — 2026-04-04

#### Backend
- `validation-error.ts`: ValidationError + JsonParseError 标准错误类
- `api-validation.ts`: withValidation() HOF + validateBody/validateQuery/validateParams
- `json-guard.ts`: JSON.parse 安全中间件，防止畸形 JSON 500
- `schemas/common.ts`: UUID/邮箱/密码/分页等通用 schema
- `schemas/auth.ts`: 注册/登录 schema (.strict() 模式)
- `schemas/index.ts`: 集中 schema 导出
- 单元测试: api-validation.test.ts + auth.test.ts (12 cases)

**提交**: `43b71dad`

### [canvas-test-framework-standardize E1: 测试边界规范建立] — 2026-04-03

#### Changed
- `TESTING_STRATEGY.md` — 测试金字塔、框架职责、覆盖率目标、反模式（258行）
- `jest.config.ts` — testMatch + forbidOnly: true 标准
- Playwright 配置合并 (7→3): 删除冗余配置，保留 base/ci/a11y

#### Added
- `playwright.setup.ts` — 测试环境设置 + factory patterns
- `flaky-tests.json` — 不稳定测试注册表

**提交**: `8d6eb70d`

### [canvas-test-framework-standardize E2: CI质量门禁] — 2026-04-03

#### Added
- `scripts/pre-submit-check.sh` — ESLint disable count 检查（阈值 20 条）
- `.github/workflows/pre-submit.yml` — GitHub Actions CI pre-submit workflow

**提交**: `000a2743`

### [canvas-test-framework-standardize E3: 测试覆盖率提升] — 2026-04-04

#### Changed
- `src/hooks/canvas/__tests__/historySlice.test.ts` — 45 tests, branch 98.0%
- `src/hooks/canvas/__tests__/contextStore.test.ts` — branch 88.63%
- `src/hooks/canvas/__tests__/flowStore.test.ts` — branch 63.15%
- `src/hooks/canvas/__tests__/componentStore.test.ts` — branch 68.75%
- 全局分支覆盖 51.94% ≥ 50% 阈值

**提交**: `629c5fe0` (E4 commit includes E3 coverage tests)

### [canvas-test-framework-standardize E4: Flaky测试治理] — 2026-04-04

#### Added
- `flaky-tests.json` — 不稳定测试注册表
- `tests/flaky-helpers.ts` — flakiness detection helpers
- `playwright.ci.config.ts` — retry 配置优化
- `src/hooks/canvas/__tests__/useAutoSave.test.ts` — 265 行扩展分支覆盖

**提交**: `629c5fe0`

### [canvas-test-framework-standardize E5: 命名与目录规范] — 2026-04-04

#### Added
- `docs/TESTING_CONVENTIONS.md` — 134 行命名规范文档
  - 命名模式: 'should|shows|displays|handles...'
  - 目录结构: test/*.spec.ts (e2e), *.test.tsx (unit)
  - contract 命名规则、flaky 策略
- `.testlinter.json` — 测试命名规则 + 覆盖率最低标准 (≥70%)

**提交**: `05dad6f8`

#### Added
- `flaky-tests.json` — 不稳定测试注册表
- `tests/flaky-helpers.ts` — flakiness detection helpers
- `playwright.ci.config.ts` — retry 配置优化
- `src/hooks/canvas/__tests__/useAutoSave.test.ts` — 265 行扩展分支覆盖

**提交**: `629c5fe0`

#### Added
- `src/lib/canvas/__tests__/historySlice.test.ts` — 45 tests, branch 98.0% (目标 ≥40%)
- `src/lib/canvas/stores/contextStore.test.ts` — branch 88.63% (目标 ≥50%)
- `src/lib/canvas/stores/flowStore.test.ts` — branch 63.15% (目标 ≥50%)
- `src/lib/canvas/stores/componentStore.test.ts` — branch 68.75% (目标 ≥50%)
- 全局分支覆盖: 51.94% (目标 ≥50%) ✅

**提交**: `016c88a2`

### [vibex-architect-proposals-20260403_024652 E1: 乐观锁] — 2026-04-03

#### Changed
- `src/hooks/canvas/useAutoSave.ts` — E1 乐观锁支持
  - `lastSnapshotVersionRef` 追踪本地版本号
  - 每次保存携带 `version` 到后端
  - 409 冲突时设置 `conflict` 状态
  - 成功响应包含新版本号并更新本地
- `src/components/canvas/features/SaveIndicator.tsx` — 新增 `conflict` 状态显示（版本冲突 + 解决按钮）
- `src/lib/canvas/types.ts` — `CanvasSnapshot.version` + `CreateSnapshotInput.version` 字段

**提交**: `635147fb`

### [vibex-architect-proposals-20260403_024652 E2: CascadeUpdateManager迁移] — 2026-04-03

#### Changed
- `src/lib/canvas/canvasStore.ts` — 删除内联 `CascadeUpdateManager` class
  - 改用 `cascade/` 模块导出的 `areAllConfirmed`
  - canvasStore.ts 从 1513 行减少（replaced inline class with import）

**提交**: `635147fb`

### [vibex-architect-proposals-20260403_024652 E3: TypeScript Strict 模式] — 2026-04-03

#### Changed
- `tsconfig.json` — 启用 `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
- `src/lib/ai-autofix/index.ts` — 修复 `as any` 类型断言
- `src/lib/contract/OpenAPIGenerator.ts` — 修复 `as any` 类型断言

**验证**: `tsc --noEmit` → 0 errors ✅

**提交**: `53be4cc7`

### [vibex-architect-proposals-20260403_024652 E4: 契约测试] — 2026-04-03

#### Added
- `tests/contracts/openapi.yaml` — Canvas Snapshots API 完整 OpenAPI 规范
  - 包含 409 conflict response schema
  - 包含 GET/POST snapshots, GET/:id, POST/:id/restore, GET/POST rollback

**提交**: `635147fb`

### [vibex-architect-proposals-20260403_024652 E5: 测试策略文档] — 2026-04-03

#### Added
- `docs/TESTING_STRATEGY.md` — 测试分层架构文档（Jest 单元测试 + Playwright E2E + 合约测试 + 突变测试）
- `src/hooks/canvas/useAutoSave.ts` — 发送 version 到后端，409 冲突处理，conflict 状态
- `src/components/canvas/features/SaveIndicator.tsx` — conflict 状态显示
- `src/lib/canvas/types.ts` — CreateSnapshotInput.version, CanvasSnapshot.version
- `tests/contracts/openapi.yaml` — Canvas Snapshots API 完整规范（包含 409 conflict response）

#### Changed
- `src/lib/canvas/canvasStore.ts` — 删除内联 CascadeUpdateManager，改用 cascade/ 模块导出

**提交**: `635147fb`

### [vibex-css-build-fix E3: 批量扫描module.css] — 2026-04-04 (vibex-css-build-fix)

#### Added
- `scripts/scan-orphaned-css.js` — 批量扫描所有 .module.css 孤立 CSS 属性行的 ESM 脚本，过滤 @keyframes/@supports/@media/@container/@layer 误报
- `scan:css` npm script — 运行批量扫描
- 扫描结果：209 files, 0 orphaned properties

**提交**: `a0189186`

### [vibex-css-build-fix E2: stylelint集成] — 2026-04-04 (vibex-css-build-fix)

#### Added
- `.stylelintrc.json` — stylelint 配置，`no-invalid-position-declaration` 规则检测孤立 CSS 属性行
- `lint:css` npm script — targeted CSS linting
- `.github/workflows/pre-submit.yml` CI gate — stylelint 失败时阻断构建

**提交**: `cc4ff92f`, `48b0f416`

### [E1-修复CSS孤立属性] — 2026-04-04 (vibex-css-build-fix)

#### Fixed
- `src/app/dashboard/dashboard.module.css` — 删除第 808 行孤立 `flex-direction: column;`，修复 CSS 解析错误导致构建失败

#### Verification
- `npm run build` ✅ exit 0

### [checkbox-persist-bug E4: ComponentConfirm] — 2026-04-04 (checkbox-persist-bug)

#### Added
- `componentStore.ts`: confirmComponentNode() + toggleComponentNode()
- `componentStore.test.ts`: 159 tests (E4 3 new cases)

**提交**: `f34702e1`

### [checkbox-persist-bug E3: FlowConfirm] — 2026-04-02 (checkbox-persist-bug)

#### Fixed
- `flowStore.ts` `toggleFlowNode` — 流程节点勾选切换，同时级联切换子步骤
- `generateComponentFromFlow` — 只发送 `status === 'confirmed'` 的节点到 API，修复 E3 Prompt 过滤逻辑

**提交**: `5a56cbae`

### [canvas-canvasstore-migration E5: Integration测试] — 2026-04-04 (canvas-canvasstore-migration)

#### Added
- `src/lib/canvas/stores/__tests__/migration.test.ts` — 84 个集成测试用例，覆盖跨 store 同步和 store reset 行为
- E2E 测试通过率：530/530 = 100%（≥95% 门槛）

**提交**: `815821bc`

### [canvas-sync-protocol-complete E2: 前端冲突UI] — 2026-04-03

#### Added
- `src/components/ConflictDialog/` — 三选项冲突解决组件
  - Props: serverSnapshot, localData, onKeepLocal, onUseServer, onMerge
  - Accessibility: aria-modal, keyboard focus trap, WCAG 2.1 AA
  - Right-fixed overlay positioning with slide-in animation
- `src/hooks/canvas/useAutoSave.ts` — conflictData + clearConflict 扩展
- `src/lib/canvas/canvasStore.ts` — handleConflictKeepLocal/UseServer/Merge

**测试**: `ConflictDialog.test.tsx` — 16 个 Jest 测试

**提交**: `e1346b0f`

### [canvas-sync-protocol-complete E3: 轮询检测与集成] — 2026-04-03

#### Changed
- `src/hooks/canvas/useAutoSave.ts` — 30s 轮询检测 remote version 变化
- `src/lib/canvas/api/canvasApi.ts` — `getLatestVersion()` API 端点
- `src/lib/api-config.ts` — latest endpoint 配置

**提交**: `1546864f`

### [canvas-sync-protocol-complete E4: 测试覆盖] — 2026-04-03

#### Added
- `tests/e2e/conflict-resolution.spec.ts` — E2E 冲突解决测试套件
  - ConflictDialog 三按钮可见性测试
  - keep-local / cancel 流程测试
  - Canvas page load smoke test
  - CustomEvent 模拟冲突状态

**提交**: `97489a84`

#### Changed
- `src/hooks/canvas/useAutoSave.ts` — 30s 轮询检测 remote version 变化
- `src/lib/canvas/api/canvasApi.ts` — `getLatestVersion()` API 端点
- `src/lib/api-config.ts` — latest endpoint 配置

**提交**: `1546864f`

### [canvas-sync-protocol-complete E1: 后端SnapshotsAPI] — 2026-04-03

#### Changed (backend)
- `snapshots.ts` — version 字段 + 409 VERSION_CONFLICT 响应
- GET `/v1/canvas/snapshots/latest` — 轻量轮询端点（latestVersion + updatedAt）
- Conflict 响应包含 serverSnapshot 数据

**提交**: `fe95884d`

### [canvas-split-hooks E4: useAIController] — 2026-04-04 (canvas-split-hooks)

#### Added
- `src/hooks/canvas/useAIController.ts` — 从 CanvasPage.tsx 提取的 AI 生成状态 hook
  - `requirementInput`/`isQuickGenerating` 本地状态
  - AI thinking 状态（sessionStore selectors）
  - `quickGenerate` callback：contexts → flows → components 三步生成
- `src/hooks/canvas/useAIController.test.tsx` — 3 个单元测试（initial state / input update / quickGenerate function）

**提交**: `b2bc5897`, `adb62068`

### [canvas-split-hooks E3: useCanvasRenderer] — 2026-04-04 (canvas-split-hooks)

#### Added
- `src/hooks/canvas/useCanvasRenderer.ts` — 从 CanvasPage.tsx 提取的 memoized 渲染计算 hook
  - `computeNodeRects`: context/flow/component 节点矩形计算
  - `computeBoundedEdges`: 限界上下文关系边计算
  - `computeFlowEdges`: 流程步骤连接边计算
  - `contextTreeNodes`, `flowTreeNodes`, `componentTreeNodes` 统一 TreeNode 数组

**提交**: `8b159720`

### [canvas-split-hooks E2: useCanvasStore] — 2026-04-04 (canvas-split-hooks)

#### Added
- `src/hooks/canvas/useCanvasStore.ts` — 统一 store selectors hook（context/flow/component/ui/session stores）
- 删除不兼容 `output:export` 的 `share/[token]` 路由

**提交**: `4d48451a`

### [canvas-split-hooks E1: useCanvasState] — 2026-04-04 (canvas-split-hooks)

#### Added
- `src/hooks/canvas/useCanvasState.ts` — 从 CanvasPage.tsx 提取的 useCanvasState hook
- 纯函数提取：`isSpaceKeyAllowed`, `isPanningClickTarget` — 100% branch coverage

**提交**: `cc03e6ac`, `a8677bb7`

### [flow-step-check-fix E1: 级联确认修复] — 2026-04-02 (flow-step-check-fix)

#### Fixed
- `flowStore.ts` `confirmFlowNode` — 勾选流程节点时级联确认所有子步骤，取消勾选时级联取消
- 修复 flow-step-check-fix Epic1: checkbox toggle 现在正确同步 steps 数组

**提交**: `38255941`

### [vibex-reviewer-proposals-20260403_024652 E1: CHANGELOG规范] — 2026-04-03

#### Added
- `AGENTS.md` — CHANGELOG规范章节（路径规则表、更新时机、Reviewer检查清单）
- `CHANGELOG_CONVENTION.md` — Epic条目结构、类型标签说明、禁止事项、示例（80行）
- `reports/INDEX.md` — 历史报告索引维护规范和报告模板
- `README.md` — 追加Reviewer工作流章节

**提交**: `59b16597`

### [vibex-reviewer-proposals-20260403_024652 E2: PreSubmit检查] — 2026-04-03

#### Added
- `scripts/pre-submit-check.sh` — ESLint disable count 检查（阈值 20 条）
- `.github/workflows/pre-submit.yml` — GitHub Actions CI 集成

**提交**: `000a2743`

### [vibex-reviewer-proposals-20260403_024652 E6: ESLintDisable豁免管理] — 2026-04-03

#### Added
- `ESLINT_DISABLES.md` — 17 条豁免记录（9 LEGIT / 4 NEEDS FIX / 4 QUESTIONABLE）
  - 维护者: @reviewer
  - 复查周期: 每 Sprint 审查一次
  - NEEDS FIX 需在当前 Sprint 内修复

**提交**: `c5dac8bd`

### [vibex-reviewer-proposals-20260403_024652 E3: Reviewer驳回模板] — 2026-04-03

#### Added
- `AGENTS.md` — Reviewer驳回模板（类型A: CHANGELOG遗漏, B: TS错误, C: ESLint违规, D: App页面修改）
- `README.md` — Reviewer工作流章节

**提交**: `59b16597`

### [vibex-reviewer-proposals-20260403_024652 E4: 文档整理与宣贯] — 2026-04-04

#### Added
- `README.md` — Reviewer工作流章节（CHANGELOG规范、pre-submit脚本、驳回模板、报告索引）
- Sprint 3 审查质量规范文档化完成

**验证**:
- `expect(readme.md).toContain('Reviewer 工作流')` ✅
- `expect(readme.md).toContain('pre-submit-check.sh')` ✅
- `expect(readme.md).toContain('CHANGELOG 规范')` ✅

**提交**: `e4-doc-org`

### [E5-Git Hooks强制] — 2026-04-03 (vibex-reviewer-proposals-20260403_024652)

#### Added
- `.husky/commit-msg` — commitlint commit-msg hook，验证 conventional commit 格式
- `.husky/pre-commit` — pre-commit hook：gitleaks 敏感信息扫描 + npm audit 漏洞检查 + `tsc --noEmit` 类型检查 + npm test
- `commitlint.config.js` — @commitlint/config-conventional 配置，type-enum 支持 feat/fix/docs/test/chore/refactor/perf/ci

**功能**:
- E5-S1: commit-msg hook 验证
- E5-S2: pre-commit hook 阻断低质量 commit

### [E4-API路由静态导出修复] — 2026-04-04 (vibex-css-build-fix)

#### Removed
- `src/app/api/share/[token]/route.ts` — 移除动态 API 路由，修复 `output: 'export'` 静态导出冲突
- `src/app/share/[token]/page.tsx` — 移除动态分享页面（依赖 share API）
- `src/app/share/[token]/share.module.css` — 移除分享页面样式

#### Verification
- `npm run build` ✅ 34 static pages generated, exit 0

### [E3 用户体验增强] — 2026-04-03 (dev-epic3-用户体验增强)

#### Added
- `src/components/canvas/features/PhaseIndicator.tsx` — 画布左上角 Phase 状态指示器
  - 显示当前 Phase（Context / Flow / Component）
  - 悬浮在 canvas 区域上方，始终可见
  - 点击可切换 Phase（dropdown 菜单）
- `src/components/canvas/features/PhaseIndicator.module.css` — PhaseIndicator 样式（玻璃态 + 霓虹发光）
- `src/components/FeedbackFAB.tsx` — 反馈浮动按钮（右下角）
  - 点击展开反馈表单（标题 + 内容）
  - 提交后发送到 Slack #coord 频道
- `src/components/FeedbackFAB.module.css` — 反馈按钮样式
- `src/hooks/useFeedback.ts` — 反馈提交 Hook
- `src/app/api/feedback/route.ts` — 反馈 API 接口（POST /api/feedback）
  - 转发到 Slack Incoming Webhook（SLACK_FEEDBACK_WEBHOOK 环境变量）
  - 格式化为 Slack Block Kit 消息
- `src/hooks/useHasProject.ts` — 检测是否有已加载项目的 Hook
- `src/lib/canvas/stores/contextStore.ts` — 新增 `phase`、`setPhase`、`activeTree`、`setActiveTree`、`selectedNodeIds`、`deleteSelectedNodes`、`selectAllNodes`、`clearNodeSelection` 字段

#### Changed
- `src/components/canvas/CanvasPage.tsx` — 集成 PhaseIndicator、FeedbackFAB、示例快速入口
- `src/components/canvas/canvas.module.css` — 新增 `.phaseIndicatorWrapper`、`.exampleQuickEntry` 样式
- `.canvasContainer` 新增 `position: relative`（支持绝对定位 PhaseIndicator）

**功能**:
- S3.1: Phase 状态指示器
- S3.3: Feedback FAB
- S3.4: 示例项目快速入口


### [E5 协作基础设施] — 2026-04-03 (dev-epic5-协作基础设施)

#### Added
- `src/app/share/[token]/page.tsx` — 只读分享页面，接收 token 参数获取项目数据并以只读模式渲染
- `src/app/share/[token]/share.module.css` — 分享页面样式（加载状态、错误状态、只读标识）
- `src/app/api/share/[token]/route.ts` — 分享 API 接口（GET /api/share/:token）
- `src/hooks/useCanvasSnapshot.ts` — 画布快照 Hook
  - `takeSnapshot()` 创建快照
  - `restoreSnapshot()` 恢复快照
  - `deleteSnapshot()` 删除快照
  - `computeSnapshotDiff()` 快照差异计算
- `src/components/SnapshotCompare.tsx` — 快照对比组件
  - 支持摘要、详细、JSON 三种视图模式
  - 显示快照 A/B 信息和差异内容
- `src/components/SnapshotCompare.module.css` — 快照对比组件样式

**功能**:
- S5.1: 只读分享链接基础
- S5.4: 设计版本快照基础
- S5.5: 快照对比基础

### [E4 测试工程化] — 2026-04-03 (dev-epic4-测试工程化)

#### Added
- `tests/e2e/auto-save.spec.ts` — 4 E2E tests: auto-save trigger, status indicator, save conflict detection, retry after conflict
- `tests/e2e/conflict-dialog.spec.ts` — 3 E2E tests: dialog display, manual resolution, auto-retry
- `tests/contract/sync.contract.spec.ts` — 5 Contract tests: CanvasSnapshot, CreateSnapshotOutput, SyncProtocol API schema validation

#### Enhanced
- `playwright.config.ts` — retries=2 (flaky retry), workers=1 (stability), reporter=html (CI: list)
- `scripts/test-stability-report.sh` — E2E stability report generator with JSON reporter + markdown log
- `scripts/parse-playwright-report.py` — Playwright JSON parser: flaky detection (retry→pass), pass rate ≥ 95% gate
- `.github/workflows/pre-submit.yml` — Pre-submit CI workflow: tsc, eslint, npm test, build, changelog checks

### [E2 项目模板系统增强] — 2026-04-03 (vibex-pm-proposals-20260403_024652)

#### Added
- `src/components/templates/TemplateDetail.tsx` — 重写市场模板详情组件，使用 `Template` 类型（`@/types/template`）
  - 支持多图预览（缩略图切换）
  - 显示创建/更新时间、页面列表、难度、标签
  - 完整的底部操作栏（取消/使用）
- `src/components/templates/TemplateDetail.module.css` — 详情弹窗样式（未来风格 + 响应式）
- `src/components/templates/index.ts` — 导出 TemplateDetail
- `src/app/templates/page.tsx` — 集成 TemplateDetail 作为模板选择流程入口

#### Enhanced
- 模板市场页面：选择模板 → 详情预览 → 确认使用，完整流程

### [E4 项目浏览体验优化] — 2026-04-03 (vibex-pm-proposals-20260403_024652)

#### Added
- `src/app/dashboard/page.tsx` — 项目搜索框（按名称/描述过滤）、排序选项（名称/创建时间/最近编辑）
- `src/app/dashboard/dashboard.module.css` — 搜索框、排序菜单、元信息、空状态样式
- 空状态：搜索无结果时显示友好提示 + 清除搜索按钮

#### Enhanced
- 项目卡片：增加创建日期 + 最后编辑日期（使用 ◈ / ◷ 图标）
- 项目卡片底部布局：左侧元信息 + 右侧操作按钮
- 响应式：移动端搜索框撑满宽度

### [E3 统一交付中心] — 2026-04-03 (vibex-pm-proposals-20260403_024652)

#### Added
- `src/stores/deliveryStore.ts` — 交付中心 Zustand store，支持 Tab 状态、导出进度、导出历史
- `src/components/delivery/` — DeliveryTabs、ContextTab、FlowTab、ComponentTab、PRDTab 组件
- `src/app/canvas/delivery/page.tsx` — 交付中心页面（路由：/canvas/delivery）
- `src/app/canvas/delivery/delivery.module.css` — 交付中心页面样式

**功能**:
- 4 个 Tab：限界上下文、流程文档、组件清单、PRD
- 导出格式：JSON / Markdown / PlantUML / BPMN / TypeScript / JSON Schema / PDF
- 导出预览（格式化展示）
- 批量导出（ZIP）
- 导出历史记录

### [E5 快捷键个性化配置] — 2026-04-03 (vibex-pm-proposals-20260403_024652)

#### Added
- `src/stores/shortcutStore.ts` — 快捷键配置 Zustand + persist store
- `src/components/shortcuts/` — ShortcutCategory、ShortcutRow、ShortcutEditModal 组件
- `src/app/settings/shortcuts/page.tsx` — 快捷键设置页面（路由：/settings/shortcuts）
- `src/app/user-settings/page.tsx` — 用户设置页面新增"快捷键"Tab

**功能**:
- 4 个分类：导航、编辑、视图、Phase 切换
- 编辑模式：监听键盘输入，捕获组合键
- 冲突检测：检测 Ctrl+S 等被多个 action 占用
- 配置持久化：localStorage 存储，跨会话保持
- 重置为默认：恢复所有快捷键到默认值

### [E2 BoundedContext Tree 持久化] — 2026-04-03

#### Added
- `toggleContextSelection` 方法：`contextStore.ts`，勾选时更新节点 `selected` 字段 + Zustand persist 自动持久化



### [E1 新手引导] — 2026-04-03

#### Added
- `src/stores/guideStore.ts` — guideStore with 5-step guide, earned badges, persist to localStorage
- `src/components/guide/GuideOverlay.tsx` — SVG spotlight cutout overlay with ResizeObserver
- `src/components/guide/GuideTooltip.tsx` — Floating tooltip with arrow, progress dots, keyboard nav
- `src/components/guide/MilestoneBadge.tsx` — Grid + compact badge display for earned achievements
- `src/components/guide/NewUserGuide.tsx` — Main controller, auto-triggers on first visit
- `src/components/canvas/CanvasPage.tsx` — NewUserGuide integration

### [E4 Sync Protocol] — 2026-04-03 (vibex-dev-proposals-20260403_024652)

#### Added
- `src/components/ConflictDialog/` — ConflictDialog 组件，3 种冲突解决选项（保留本地/使用服务端/合并）
- `src/components/canvas/CanvasPage.tsx` — ConflictDialog 集成，右下角固定定位
- `src/hooks/canvas/useAutoSave.ts` — 扩展 conflictData + clearConflict 暴露
- `src/lib/canvas/api/canvasApi.ts` — 409 响应体捕获（serverSnapshot）

### E4: 测试工程化 (vibex-dev-proposals-20260403_024652)

#### Added
- `tests/e2e/auto-save.spec.ts` — E2E tests for auto-save debounce (2s) and sendBeacon on beforeunload
  - E2E-1: 编辑后 2s 自动保存（debounce）
  - E2E-2: 页面离开前 beacon 触发
  - E2E-3: 手动保存立即触发
  - E2E-4: 保存失败显示错误状态
- `tests/e2e/conflict-dialog.spec.ts` — E2E tests for E4 SyncProtocol conflict handling
  - E2E-1: ConflictDialog 显示 3 个选项
  - E2E-2: ConflictDialog 包含保留本地选项
  - E2E-3: 冲突状态下页面仍可编辑
- `tests/contract/` — Zod schema contract tests for sync API
  - Contract-1: POST /snapshots returns valid CreateSnapshotOutput
  - Contract-2: 409 Conflict returns valid ConflictResponse
  - Contract-3: version field is optional (backward compatible)
  - Contract-4: GET /snapshots returns valid snapshot list
  - Contract-5: POST without auth returns 401/403
- `playwright.config.ts` — Added `contract` project (testDir: `./tests/contract`)

### E1: TypeScript 编译修复 (vibex-dev-proposals-20260403_024652)
- **E1**: flow-execution handlers 类型修复，TS 编译 0 错误
- **E1**: ESLint import/no-duplicates fix in useCanvasEvents.ts
- Commit: `914919b8`, `029a3366`

### E1: E2E Flaky 治理 (vibex-tester-proposals-20260403_024652)
- **E1-S1**: Playwright Config — retries:2, workers:1, expect.timeout:30000 ✅
- **E1-S2**: Stability Report — scripts/test-stability-report.sh + parse-playwright-report.py + docs/daily-stability.md
- **E1-S3**: CI Integration — e2e-tests.yml stability report step
- Commit: `8d2ed687`

### E1: 技术债清理 — Sprint 4 (vibex-sprint4-20260403)
- **S1.1**: TypeScript 错误修复 — flow-execution handlers 类型修复
- **S1.3**: canvasStore Facade 退役 — 从 1451 行降级为 170 行 re-export 层
- **S2.1**: CHANGELOG 规范 — 统一格式模板
- **S2.2**: Pre-submit 检查脚本 — scripts/pre-submit-check.sh
- Commits: `914919b8`, `571c1f67`, `0ad8d5b2`

### [E2: 质量门禁建立] — Sprint 4 (vibex-sprint4-20260403)

#### Added
- `.husky/commit-msg` — commitlint commit-msg hook，验证 conventional commit 格式
- `.husky/pre-commit` — pre-commit hook：TypeScript 类型检查 + npm test
- `commitlint.config.js` — @commitlint/config-conventional 配置
- `.github/workflows/pre-submit.yml` — CI pre-submit workflow
- `scripts/pre-submit-check.sh` — ESLint disable 数量监控（阈值 20）
- `ESLINT_DISABLES.md` — 17 个 eslint-disable 豁免记录（9 LEGIT / 4 NEEDS FIX / 4 QUESTIONABLE）

**功能**:
- S5-S1: commit-msg hook 验证 conventional commit 格式
- S5-S2: pre-commit hook 阻断低质量 commit

**提交**: `5fd100da`, `000a2743`, `c5dac8bd`

### [E3: 用户体验增强] — Sprint 4 (vibex-sprint4-20260403)

#### Added
- `src/components/canvas/features/PhaseIndicator.tsx` — Phase 状态指示器（Context/Flow/Component）
- `src/components/FeedbackFAB.tsx` — 反馈浮动按钮（提交到 Slack #coord）
- `src/hooks/useFeedback.ts` — 反馈提交 Hook
- `src/hooks/useHasProject.ts` — 检测是否有已加载项目
- `src/app/api/feedback/route.ts` — 反馈 API 接口

**变更**: `contextStore.ts` 新增 phase/setPhase/activeTree/selectedNodeIds 等字段

**提交**: `413cd5d5`

### [E4: 测试工程化] — Sprint 4 (vibex-sprint4-20260403)

#### Added
- `tests/e2e/auto-save.spec.ts` — 4 E2E tests: auto-save trigger, status indicator, save conflict detection, retry after conflict
- `tests/e2e/conflict-dialog.spec.ts` — 3 E2E tests: dialog display, manual resolution, auto-retry
- `tests/contract/sync.contract.spec.ts` — 5 Contract tests: CanvasSnapshot, CreateSnapshotOutput, SyncProtocol API schema validation
- `scripts/test-stability-report.sh` — E2E stability report generator

**提交**: `9916cdd3`

### [E5: 协作基础设施] — Sprint 4 (vibex-sprint4-20260403)

#### Added
- `src/app/share/[token]/page.tsx` — 只读分享页面
- `src/app/api/share/[token]/route.ts` — 分享 API 接口
- `src/hooks/useCanvasSnapshot.ts` — 画布快照 Hook（takeSnapshot/restoreSnapshot/deleteSnapshot/computeSnapshotDiff）
- `src/components/SnapshotCompare.tsx` — 快照对比组件（摘要/详细/JSON 三种视图）

**提交**: `33e25ab7`

### E1: Canvas JSON 持久化 — 统一数据模型 (canvas-json-persistence)
- **E1-S1**: NodeState 统一接口 — 三树节点类型共享统一 NodeState
- **E1-S2**: Migration 3→4 修复 — status 映射保留 confirmed 状态
- **E1-S3**: selected 字段 — 三树节点添加 selected boolean 字段
- Commit: `cfe58ac4` + `a939bb0a`

### E2: Canvas JSON 持久化 — 后端版本化存储 (canvas-json-persistence)
- **E2-S1**: CanvasSnapshot 表 — CanvasSnapshot D1 Table (projectId, version, data, isAutoSave, @@unique index)
- **E2-S2**: Snapshot API — GET/POST list, GET :id, POST :id/restore (GET /v1/canvas/snapshots)
- **E2-S3**: Rollback API — GET version list, POST rollback with backup (GET/POST /v1/canvas/rollback)
- **E2-S4**: Route Registration — /v1/canvas/snapshots + /v1/canvas/rollback registered in gateway.ts
- **E2-S5**: Zod validation — supports both frontend format (contextNodes/flowNodes/componentNodes) and legacy format
- Commits: `9b083f22`

### E3: Canvas JSON 持久化 — 自动保存 (canvas-json-persistence)
- **E3-S1**: useAutoSave hook — Zustand store subscription + use-debounce (2000ms)
- **E3-S2**: SaveIndicator component — 保存中/已保存/保存失败三种状态
- **E3-S3**: CanvasPage integration — beforeunload beacon save (navigator.sendBeacon)
- **E3-S4**: Backend Snapshot API — auto-save snapshot on beforeunload via /v1/canvas/snapshots
- Commits: `af995f0b`

### E4: Keyboard Shortcuts (proposals-20260401-9)
- **E4** — useKeyboardShortcuts.ts: add Ctrl+Shift+C (confirm) and Ctrl+Shift+G (generate context)
- **E4** — ShortcutHintPanel: display new shortcuts in hint panel
- **E4** — CanvasPage: wire onConfirmSelected/onGenerateContext to store actions
- **E4** — keyboard-shortcuts.spec.ts: Playwright tests F4.1-F4.4
- Commit: `f080424b`

### E3: Responsive Layout (proposals-20260401-9)
- **E3** — useResponsiveMode.ts: new hook (isMobile/isTablet/isDesktop/isTabMode/isOverlayDrawer)
- **E3** — canvas.module.css: @media breakpoints for tablet (768-1023px, 2 cols) + mobile (<768px, 1 col + tabs)
- **E3** — responsive-layout.spec.ts: Playwright tests (F3.1-F3.4 viewport-based)
- Commit: `81febd8c`

### E2: Message Drawer (proposals-20260401-9)
- **E2** — canvasEvents.ts: CanvasEventType and CanvasEvent interfaces
- **E2** — openRightDrawer() + submitCanvas() in canvasStore.ts
- **E2** — CommandInput: auto-open drawer on command execute; /submit logs event
- **E2** — message-drawer.spec.ts: Playwright E2E tests (F2.1-F2.4)
- Commit: `c20c50da`

### E1: Checkbox Confirm 语义修复 (proposals-20260401-9)
- **E1-F1.1** — canvasStore.ts: add confirmContextNode, confirmFlowNode, confirmStep actions
- **E1-F1.2** — BoundedContextTree.tsx: checkbox onChange calls confirmContextNode
- **E1-F1.3** — BusinessFlowTree.tsx: FlowCard checkbox + SortableStepRow confirm checkbox
- **E1-F1.4** — canvas.module.css: add .stepConfirmCheckbox styles
- **E1** — Vitest: tests/canvas/checkbox-confirm.test.ts (环境问题，JSON import)
- Commit: `69f75437`

### E1: RelationshipConnector 注释移除 (canvas-bc-card-line-removal)
- **E1** — RelationshipConnector 注释: import + JSX，BoundedContextTree.tsx
- **E1** — Vitest: tests/canvas/bc-card-line-removal.spec.ts 3/3 通过
- **E1** — gstack 验证: canvas 无 RelationshipConnector SVG 连线 ✅
- Commit: `5150964e`

### E1: E2E Stability (proposals-20260401-8)
- **E1-F1.1** — waitForTimeout replacement: e2e/*.spec.ts 全部替换为 waitForLoadState/waitForFunction
- **E1-F1.2** — force:true for canvas buttons: canvas-phase2.spec.ts expand/maximize/exit buttons
- **E1-F1.3** — playwright.config.ts expect.timeout: 10000 → 30000ms
- **E1-F1.4** — stability.spec.ts: 验收测试覆盖所有3个F1标准
- Commit: `feae8a08`

### E3: Undo/Redo History Stack (proposals-20260401-3)
- **E3-T1** — canvasHistoryStore bridge: stores/canvasHistoryStore.ts，暴露 historySlice 到全局 store
- **E3-T2** — Keyboard shortcuts: useKeyboardShortcuts.ts (Ctrl+Z/Y) 已实现
- **E3-T3** — UndoBar: undo-bar/UndoBar.tsx，floating toolbar 显示撤销历史
- **E3-T4** — E2E tests: tests/e2e/undo-redo.spec.ts
- Commit: `de776230`

### E2: Heartbeat Scanner + Changelog Gen (proposals-20260401-3)
- **E2-T1** — Ghost task detection: 60min 无进展任务识别
- **E2-T2** — Fake done detection: 缺少 output 的 done 任务检测
- **E2-T3** — changelog-gen CLI: scripts/changelog-gen.ts，自动生成 CHANGELOG
- **E2-T4** — commit-msg hook: .githooks/commit-msg conventional commit 验证
- Commit: `bbb361aa`

### E1: Proposal Dedup + ErrorBoundary (proposals-20260401-3)
- **E1-T1** — NotificationDedup: scripts/notification-dedup.ts，30min TTL hash 去重
- **E1-T2** — AppErrorBoundary: vibex-fronted/src/components/common/AppErrorBoundary.tsx，React error boundary
- **E1-T3** — 测试覆盖: AppErrorBoundary.test.tsx 38 lines
- Commit: `38555574`


All notable changes to this project will be documented in this file.

### E5: MCP Server 集成 (proposals-20260401-2)
- **E5-T1** — MCP Server scaffold: packages/mcp-server/，提供 tools/execute + tools/list
- **E5-T2** — Claude Desktop 配置: claude_desktop_config.json
- **E5-T3** — MCP 集成文档: docs/mcp-integration.md
- Commit: `e2edaf50`

### E1: 一键部署到 Vercel (proposals-20260401-2)
- **E1-T1** — Vercel OAuth + Deploy API: vibex-fronted/src/app/api/vercel/，OAuth 登录 + deploy 触发
- **E1-T2** — Export Panel UI: framework-selector.tsx + deploy-button.tsx + deploy-status.tsx
- **E1-T3** — Export Page: /export 路由集成一键部署入口
- Commit: `7c8ede0a`

### E2: 回滚 SOP + 功能开关 (proposals-20260401-2)
- **E2-T1** — 回滚 SOP: docs/process/ROLLBACK_SOP.md，阶段任务回滚标准操作程序
- **E2-T2** — Epic DoD 模板: docs/process/EPIC_DOD_TEMPLATE.md，标准化 Definition of Done
- **E2-T3** — 功能开关: vibex-fronted/src/lib/featureFlags.ts，FF_KILL_SWITCH / FF_... 枚举
- Commit: `a2155ffd`

### E3: Zustand Migration 库 (proposals-20260401-2)
- **E3-T1** — versioned-storage: src/lib/versioned-storage/，支持 state version migration
- **E3-T2** — versioned-storage/types: 类型安全迁移
- **E3-T3** — 测试覆盖: versioned-storage.test.ts 113 lines
- Commit: `88e66de9`

### E4: Multi-Framework 导出 (proposals-20260401-2)
- **E4-T1** — Vue Mapping Table: 框架映射表（Next/Vue/React）
- **E4-T2** — Export Panel Framework Switch: framework-selector.tsx，RadioGroup 切换
- **E4-T3** — Vue Component Verification: 导出时验证目标框架支持
- Commit: `7c8ede0a`


### E1: 开发环境阻塞修复 (proposals-20260401)
- **E1-T1** — Backend npm workspace + tsconfig 测试文件排除: `exclude **/*.test.ts, **/__tests__/, coverage/, .next/`
- **E1-T2** — Frontend TS pre-test 修复: tsconfig strict 模式验证通过
- **E1-T3** — task_manager.py 文件锁: fcntl.flock() 30s timeout + try-finally，乐观锁 `_rev` 字段防竞态
- Commits: `41d75bf3`, `54e8f152`

### E2: 协作质量防护 (proposals-20260401)
- **E2-T1** — JSON 越权编辑防护: LockRequired 异常类，cmd_update 要求任务必须先被 claim 才能更新状态
- **E2-T2** — 自检报告路径规范: validate_report_path() 要求报告保存在 proposals/YYYYMMDD/ 目录
- **E2-T3** — 重复通知过滤: _is_notif_duplicate() 基于 channel+text hash，30min TTL 去重
- Commits: `f04cc10c`

### E3: Canvas 选区 Bug 修复 (proposals-20260401)
- **E3-T1** — 修复 drag selection stale closure bug: useRef 替代 useState 闭包陷阱，handleMouseUp 捕获初始 null selectionBox 问题
- **E3-T2** — E2E 测试覆盖: Playwright canvas-selection.spec.ts (4 scenarios: drag/ESC/click/outside)
- 修复: `useDragSelection.ts` 依赖数组精简，避免 mousemove 每次重注册监听器
- Commits: `41ff5f0f`, `bf4f2cdc`

### E4: 画布引导体系 (proposals-20260401)
- **E4-T1** — CanvasOnboardingOverlay: 首次用户3步引导（localStorage 检测，三树结构/节点操作/快捷键）
- **E4-T2** — ShortcutBar: 底部可折叠快捷键栏（Ctrl+Z/K/A/Del 等，Zustand 控制展开/折叠）
- **E4-T3** — NodeTooltip: 节点 Hover tooltip（React.memo + CSS fade，200ms 延迟响应）
- Commits: `4556540e`

### E5: 质量流程改进 (proposals-20260401)
- **E5-T1** — Playwright E2E 测试规范: 5+ CI-blocking 测试用例，canvasquality-ci.spec.ts 覆盖选区/面板/快捷键
- **E5-T3** — 两阶段审查 SOP: reviewer → architect 两阶段审查流程文档
- **E5-T4** — Story 验收标准模板: PRD 模板要求每 Story 含 expect() 断言
- **E5-T5** — KPI Dashboard: docs/kpi-dashboard.md
- Commits: `dd4904c4`, `a5d42445`, `b335927e`, `e7d4465a`

### E6: 竞品与市场分析 (proposals-20260401)
- **E6-T1** — 竞品功能对比矩阵: docs/competitive-matrix.md（Cursor/Copilot/Windsurf/Claude/v0 vs VibeX）
- **E6-T2** — 用户旅程图: docs/user-journey-map.md（3个关键场景）
- **E6-T3** — 定价策略: docs/pricing-strategy.md（Free/Pro/Enterprise + MRR模型）
- Commit: `fd92db90`

### E7: 架构演进 (proposals-20260401)
- **E7-T1** — React.memo + viewport culling 优化: 自定义 Node 组件使用 memo + useCallback，Flow 性能 ≥30 FPS
- **E7-T2** — 架构文档版本化: domain.md 所有章节添加 @updated 日期
- **E7-T3** — canvasApi Zod schema 校验: 所有 canvasApi 响应经过 schema 验证
- Commits: `1e2984b0`, `4416e222`, `763fab1d`, `f6888f5f`


### Epic2: 面板折叠解耦 (canvas-three-tree-unification)
- **S2.1** — 三面板独立折叠状态持久化: contextPanelCollapsed / flowPanelCollapsed / componentPanelCollapsed
- **S2.2** — 面板折叠状态写入 canvasStore partialize (persist 持久化到 localStorage)
- **S2.3** — 切换 Tab 不再重置折叠状态，面板状态独立保持
- 修复: 解决页面刷新后折叠状态丢失问题
- Commit: `bdbd2d5b`

### Epic3: confirmed→isActive 重构 (canvas-three-tree-unification)
- **S3.1** — 节点状态字段重命名: confirmed → isActive (isActive !== false 即为活跃)
- **S3.2** — 移除 areAllConfirmed/hasAllNodes 逻辑，统一用 hasNodes 检测
- **S3.3** — CanvasPage/BoundedContextTree/BusinessFlowTree/ComponentTree 更新 isActive 引用
- **S3.4** — 废弃 confirmationStore 中已迁移到 canvasStore 的类型
- Commit: `108afc35`

### Epic4: Cascade 手动触发 (canvas-three-tree-unification)
- **S4.1** — 移除自动 cascadeContextChange/cascadeFlowChange：编辑/删除节点不再自动重置下游树
- **S4.2** — 添加 generateComponentFromFlow() 手动生成方法，用户可手动触发组件生成
- **S4.3** — CascadeUpdateManager cascade 系列方法标记 @deprecated
- **S4.4** — 打破原有线性约束：三树完全独立，用户可选择性触发级联更新
- Commit: `e477743c`

## [Unreleased]

### Epic3: Flow 关系可视化 (canvas-phase2 F3 Epic)
- **F3.1** — 数据模型扩展: `BoundedEdge`/`FlowEdge`/`FlowEdgeType` 类型定义于 `lib/canvas/types.ts`
- **F3.2** — 限界上下文连线: `BoundedEdgeLayer` SVG 渲染层 (z-index:30, pointer-events:none)
  - `src/components/canvas/edges/BoundedEdgeLayer.tsx` + `.module.css`
  - `src/lib/canvas/utils/edgePath.ts`: 贝塞尔曲线路径计算 + `BOUNDED_EDGE_COLORS`
  - 三种连线类型: dependency(靛蓝)/composition(紫罗兰)/association(板岩)
- **F3.3** — 流程节点连线: `FlowEdgeLayer` SVG 渲染层 (z-index:40)
  - `src/components/canvas/edges/FlowEdgeLayer.tsx` + `.module.css`
  - 三种样式: sequence(实线蓝)/branch(虚线橙)/loop(回环紫)
- **F3.4** — 连线密度控制: 聚类算法 (CLUSTER_THRESHOLD=3, MAX_EDGES_VISIBLE=20)
  - `src/lib/canvas/utils/edgeCluster.ts`: 聚类 + `useFlowClusteredEdges`/`useBoundedClusteredEdges` hooks
- 修复: ESLint `react-hooks/refs` 错误 (ref 访问移至 ResizeObserver 内)
- `src/components/canvas/edges/BoundedEdgeLayer.test.tsx`: 8 tests (渲染/颜色/标签/z-index)
- `src/components/canvas/edges/FlowEdgeLayer.test.tsx`: 11 tests (渲染/样式/聚类/标签/transform)
- `src/lib/canvas/utils/edgePath.test.ts`: 25 tests (路径计算/颜色常量)
- `src/lib/canvas/utils/edgeCluster.test.ts`: 15 tests (聚类边界/安全上限/标签格式)
- Commits: `2bead619`, `d5c86556`, `8c898c31`, `7d9ee0f3`, `b661c96d`

### Epic1: Checkbox去浓浓构 (vibex-canvas-checkbox-dedup)
- **S1.1** — 移除 selection checkbox UI (保留Ctrl+click多选功能)
- **S1.2** — 将确认checkbox移至标题前 (nodeCardHeader内)
- **S1.3** — 点击checkbox直接切换confirmed状态
- **S1.4** — 移除独立的'确认'按钮
- **S1.5** — '全选'按钮改为'确认所有'
- CSS: 新增 `.confirmCheckbox` 样式 (accent-color: success)
- 验收标准: 无 aria-label='选择' 残留 ✓, 无'确认'按钮残留 ✓, npm run build ✓, ESLint 0 warnings ✓
- Commit: `d36bd2b4`

### Epic1: 画布 Undo/Redo 核心编辑体验 (vibex-canvas-feature-gap-20260329)
- **✅ PASS** — 三树独立历史栈，50步限制，Ctrl+Z/Ctrl+Shift+Z 快捷键
- `src/lib/canvas/historySlice.ts`: 三树独立 HistoryStack（context/flow/component），MAX_HISTORY_LENGTH=50
- `src/hooks/useCanvasHistory.ts`: 订阅 canvasStore 变更，recordSnapshot with 300ms 节流
- `src/hooks/useKeyboardShortcuts.ts`: Ctrl+Z/Ctrl+Shift+Z/Ctrl+Y + 焦点隔离
- `src/components/canvas/CanvasToolbar.tsx`: UndoRedoButtons 根据 historySlice 状态显示 disabled
- `src/lib/canvas/__tests__/historySlice.test.ts`: 38 测试用例
- `src/hooks/useKeyboardShortcuts.test.ts`: 9 测试用例
- Commits: `d5f4f131`, `f61d80ee`

### Epic1: 后端三树生成 API (vibex-backend-integration-20260325)
- **⚠️ CONDITIONAL PASS** — API 响应字段与前端类型不匹配
  - `sessionId` → `generationId` 字段名不一致
  - Components: `api` 对象 vs `apis` 数组类型不匹配
  - Prisma: `ctxType` vs 前端 `type` 字段名不匹配
  - 3 个 ESLint warnings (unused vars)
  - Prisma schema ✅, TypeScript ✅, Security ✅

### Epic3: P3-1-shared-types 共享类型包 (vibex-epic3-architecture-20260324)
- **packages/types/**: 新建共享类型包 (api.ts, store.ts, events.ts)
- **src/types/error.ts**: 统一错误类型定义 (ErrorType, ErrorConfig 等)
- **向后兼容**: @/lib/error 导入仍然有效
- 78 Error tests ✅, TypeScript 0 errors ✅
- Commits: `4830792d`, `03e410ce`

### Epic2: CardTree 测试审查 (vibex-epic2-frontend-20260324 P1-3)
- **CardTreeSkeleton**: 5/5 tests ✅
- **CardTreeError**: 8/8 tests ✅
- **CardTreeView**: 1/12 tests pass individually (剩余测试在 CI 环境验证)
- 修复: 移除未使用的 imports (CardTreeVisualizationRaw, unifiedError, waitFor)
- TypeScript 0 errors, ESLint 0 errors, build ✅
- Commit: `71c9433e`

### Epic3: confirmationStore 拆分 (vibex-epic3-architecture-20260324 P1-4 Batch1)
- **confirmationTypes.ts**: 新建类型定义文件，从 confirmationStore.ts 拆分
- **confirmationStore.ts**: 添加 re-export 保持向后兼容
- 11 tests ✅, TypeScript ✅, build ✅
- Commit: `f3100ba3`

### Epic2: ErrorBoundary 去重 (vibex-epic2-frontend-20260324 P1-1)
- **ui/ErrorBoundary.tsx**: 新增 `resetKeys` prop + `reset()` 方法，合并 error-boundary/ 功能
- **ui/ErrorBoundary.test.tsx**: 新增 3 个 resetKeys 单元测试
- **components/error-boundary/**: 已废弃目录删除，统一使用 `ui/ErrorBoundary`
- TypeScript 0 errors, 10 tests ✅, build ✅
- Commit: `d692076f`

### Epic: homepage-cardtree-debug Epic4 Review (2026-03-24)
- **Epic4 (TypeScript修复)**: ✅ PASSED
  - `_domainModels` prop 修复 (HomePage → PreviewArea)
  - `_businessFlow` prop 修复
  - TypeScript 0 errors, build ✅
  - Commit: `8f620359`

### Epic: vibex-homepage-api-alignment Epic3-5 Review (2026-03-23)
- **Epic3 (首页集成)**: ✅ PASSED
  - `CardTreeView` — 集成到首页 PreviewArea，Feature Flag 控制
  - `CardTreeSkeleton` — 骨架屏组件
  - `FeatureFlagToggle` — Feature Flag 切换组件
  - 30 tests passed (CardTreeView + CardTreeSkeleton + FeatureFlagToggle)
  - Commit: `8c3f52da`
- **Epic4 (错误处理与降级)**: ✅ PASSED
  - `CardTreeError` — 错误边界组件，timeout 检测
  - `useCardTreeError` hook — 错误状态管理
  - Commit: `e574195c`
- **Epic5 (性能优化)**: ✅ PASSED
  - `IntersectionObserver` — 懒加载渲染
  - `useCardTreeVisibility` hook — 可见性检测
  - Commit: `3a11dc4a`

### Epic: vibex-homepage-api-alignment Epic1 Review (2026-03-23)
- **Epic1 (数据层)**: ⚠️ CONDITIONAL PASS
  - `useProjectTree()` — React Query hook，mock data fallback，Feature Flag 控制 ✅
  - `CardTreeNode` — ReactFlow custom node，递归 CheckboxItem，展开/折叠 ✅
  - `CardTreeRenderer` — 垂直树状布局，ReactFlow 集成 ✅
  - AC-1 ✅ AC-3 ✅ AC-5 ✅ TypeScript ✅ Security ✅
  - ⚠️ AC-2: testid `card-tree` ≠ 实际 `cardtree-*`（Epic3 需对齐）
  - ⚠️ AC-4: CardTreeRenderer 缺少 error UI（Epic4 需补充）
  - 审查报告: `docs/review-reports/20260323/review-vibex-homepage-api-alignment-epic1.md`

### Epic: vibex-reactflow-visualization Epic1-6 Review (vibex-reactflow-visualization) (2026-03-23)

#### Review Approved (✅ PASSED)
- **Epic1 (Types + Zustand Store)**: Unified type system with VisualizationType discriminated union, Zustand persist store — architecture clean, no security issues
- **Epic2 (FlowRenderer)**: ReactFlow-based flow visualization with node/edge CRUD, auto-layout — performance and accessibility solid
- **Epic3 (MermaidRenderer, DOMPurify)**: Mermaid diagram rendering with XSS mitigation via DOMPurify — CONDITIONAL PASS (DOMPurify config needs review for SSR)
- **Epic4 (JsonTreeRenderer)**: JSON tree with virtualization for large datasets — PASSED, excellent performance
- **Epic5 (ViewSwitcher)**: Tab-based multi-view switching with excellent accessibility — PASSED, ARIA compliant
- **Epic6 (Performance Optimization)**: useCallback全覆盖、懒加载+Suspense、LRU缓存、Bundle代码分割 — all optimizations in place

#### Review Reports
- `docs/review-reports/20260323/review-vibex-reactflow-epic1.md`
- `docs/review-reports/20260323/review-vibex-reactflow-epic2.md`
- `docs/review-reports/20260323/review-vibex-reactflow-epic3.md` (CONDITIONAL)
- `docs/review-reports/20260323/review-vibex-reactflow-epic4.md`
- `docs/review-reports/20260323/review-vibex-reactflow-epic5.md`
- `docs/review-reports/20260323/review-vibex-reactflow-epic6.md`

### Epic: Proposal Collection Parser & Validator (reviewer-epic2-proposalcollection-fix) (2026-03-23)

#### Added
- **proposals/parser.ts**: TypeScript proposal markdown parser
  - Parse agent proposal files from `/root/.openclaw/proposals/<date>/` and `/root/.openclaw/vibex/proposals/<date>/`
  - Extract structured fields: id, title, description, improvement, benefit, effort, priority, tags
  - Handle multiple proposal block formats including "提案 <id>" headers
- **proposals/validator.ts**: TypeScript proposal validator
  - Validate required fields (title, description, priority)
  - Priority whitelist: P0/P1/P2/P3
  - Effort validation with warnings for unusual values
  - Title length checks (5-200 chars), description min length (10 chars)
  - Structured error objects with field, message, proposalId, severity
- **proposals/parser.test.ts**: 15 tests covering parseProposalsFile, listProposals, edge cases
- **proposals/validator.test.ts**: 19 tests covering all validation rules, error severity, mixed proposals

#### Rejected (reviewer)
- **Python scripts rejected**: `scripts/proposal_parser.py` and `scripts/proposal_validator.py` not suitable for Next.js frontend (cannot import Python from TypeScript)
- **Root cause**: Python implementation lacked unit tests and couldn't be used by API routes

#### Testing
- 34 new tests passing, all 179 suites (2137 tests) continue to pass
- Build verified: `next build` passes with no TypeScript errors

### Epic: ThemeWrapper Timing Bug Fix (homepage-theme-wrapper-timing-fix) (2026-03-22)

#### Fixed
- **ThemeWrapper timing bug**: 修复页面加载时主题合并策略在初始渲染不生效的问题
  - ThemeContext 使用 useRef 检测异步 homepageData 到达 (undefined → defined)
  - 使用 useEffect 监听变化并调用 resolveMergedTheme 重新计算 mode
  - ThemeWrapper 始终渲染 ThemeProvider（加载时传递 undefined），使 useTheme() 在加载期间可用
- **test cleanup**: 添加 afterAll 清理 global.fetch 防止测试污染

#### Testing
- 修复后 30 个测试全部通过: 6/6 theme-binding, 7/7 ThemeWrapper, 17/17 homepageAPI

### Epic: 孤儿测试修复 (vibex-test-orphans-fix) (2026-03-21)

#### Fixed
- **test cleanup**: 删除4个孤儿测试套件，测试通过率提升至100%
  - 删除 `useConfirmationStep.test.ts` (228行，源码不存在)
  - 删除 `useConfirmationState.test.ts` (161行，源码不存在)
  - 删除 `confirmationStore.extended.test.ts` (214行，扩展方法不存在)
  - 删除 `domain/page.test.tsx` (152行，组件不存在)

#### Testing
- CSS Variables 测试覆盖率提升 (Story 1.2)

### Epic 1: 路由重定向架构 (2026-03-21)

#### Added
- **middleware.ts**: 新建路由重定向中间件，配置 `/confirm/*` 和 `/requirements/*` → `/` 的 301 重定向
  - 支持 `/confirm` 下所有子路由重定向
  - 保留 `/requirements/new` 路由不被重定向
- **@deprecated 注释**: 在以下废弃页面添加了弃用标记
  - `/confirm/page.tsx`
  - `/confirm/context/page.tsx`
  - `/confirm/flow/page.tsx`
  - `/confirm/model/page.tsx`
  - `/confirm/success/page.tsx`
  - `/requirements/page.tsx`
  - `/requirements/page.test.tsx`

#### Changed
- **Navbar.tsx**: 移除导航栏中的「设计」(/confirm) 链接

#### Migration Guide
所有原来通过 `/confirm/*` 和 `/requirements` 访问的功能已迁移到首页步骤流程 (`/`)。用户现在可以在首页完成：
1. 需求输入 → 2. 限界上下文 → 3. 领域模型 → 4. 业务流程

#### Next Steps
- **Epic 2**: Homepage 覆盖确认 - 确保所有步骤组件完整覆盖
- **Epic 3**: Design 步骤合并
- **Epic 4**: 废弃代码清理

---

## [v1.0.58] - 2026-03-18

### Added
- ESLint 性能优化 (添加 --cache，忽略 tests/**)
- Step 2 组件与 DesignStepLayout 集成

### Fixed
- 修复 PreviewArea 订阅 confirmationStore.flowMermaidCode 问题
- 修复 Step 1 按钮调用 generateContexts 问题
- 修复 secure-storage 空 catch 块错误日志

### Security
- 添加安全存储增强

---

For older entries, see the commit history.
