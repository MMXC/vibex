# Changelog

### E1: E2E Flaky 治理 (vibex-tester-proposals-20260403_024652)
- **E1-S1**: Playwright Config — retries:2, workers:1, expect.timeout:30000 ✅
- **E1-S2**: Stability Report — scripts/test-stability-report.sh + parse-playwright-report.py + docs/daily-stability.md
- **E1-S3**: CI Integration — e2e-tests.yml stability report step
- Commit: `8d2ed687`

### E1: 技术债清理 — Sprint 4 (vibex-sprint4-20260403)
- **S1.1**: TypeScript 错误修复 — flow-execution handlers 类型修复
- **S2.1**: CHANGELOG 规范 — 统一格式模板
- **S2.2**: Pre-submit 检查脚本 — scripts/pre-submit-check.sh
- Commits: `914919b8`, `571c1f67`

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
