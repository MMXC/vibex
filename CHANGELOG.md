# Changelog

All notable changes to this project will be documented in this file.

### Fixed (vibex-canvas-api-fix-20260326 Epic2: SSE 路由修复) — 2026-03-26
- **根因修复**: Cloudflare Workers 部署 Hono 而非 Next.js，/v1/analyze/stream 404
- **Hono 迁移**: SSE 端点从 Next.js route.ts 迁移到 `src/routes/v1/analyze/stream.ts`
- **路由修正**: `/api/v1` mount + `/analyze` 路由在 protected_ 前注册
- **认证移除**: `/v1/analyze/stream` 设为公开路由（无需认证）
- **前端解析器**: `pendingEventType` 状态机替代 `indexOf`，更健壮
- 审查: `docs/review-reports/20260326/review-vibex-canvas-api-fix-epic2.md` — ✅ PASSED

### Added (vibex-canvas-api-fix-20260326 Epic1: SSE DDD API 集成) — 2026-03-26
- **dddApi.ts**: SSE 客户端，`analyzeRequirement` 支持 thinking/step_context/step_model/step_flow/step_components/done/error 事件
- **generateContextsFromRequirement**: Store action，调用 SSE 并更新 contextNodes
- **AI Thinking UI**: 启动按钮 loading 状态 + 实时分析提示
- **超时控制**: AbortController + 30s，外部 signal 合并
- 审查: `docs/review-reports/20260326/review-vibex-canvas-api-fix-epic1.md` — ✅ PASSED (60 tests)

### Added (vibex-canvas-redesign-20260325 Epic4: ComponentTree) — 2026-03-25
- **ComponentTree 组件**: 组件树垂直列表，节点展示 props + API method/path
- **AI 生成**: Mock templates + shuffle，支持 2-6 个组件节点
- **CRUD**: 添加/编辑/删除/确认组件节点，展开详情
- **级联**: flow 变更 → component 标记 pending（复用 cascade 机制）
- **Phase 推进**: allConfirmed → prototype，解锁 Epic5-6
- 审查: `docs/review-reports/20260325/review-vibex-canvas-redesign-20260325-epic4.md` — ✅ PASSED (44 tests)

### Added (vibex-canvas-redesign-20260325 Epic6: 后端 API + 导出) — 2026-03-25
- **CanvasProject/CanvasPage**: Prisma 模型新增
- **POST /api/canvas/project**: 创建画布项目（3树数据持久化）
- **POST /api/canvas/generate**: 触发生成（MiniMax API，mock fallback）
- **GET /api/canvas/status**: 查询生成进度
- **GET /api/canvas/export**: 导出 tar.gz（Node stream，无外部依赖）
- 审查: `docs/review-reports/20260325/review-vibex-canvas-redesign-20260325-epic6.md` — ✅ PASSED (459 tests)

### Added (vibex-canvas-redesign-20260325 Epic5: 原型生成队列) — 2026-03-25
- **canvasApi.ts**: createProject/generate/getStatus/exportZip + polling manager
- **ProjectBar.tsx**: 三树全确认后解锁「创建项目」按钮
- **PrototypeQueuePanel.tsx**: 队列状态显示/进度条/单页重生成/清空
- **Queue slice**: prototypeQueue state + 4 actions (add/update/remove/clear)
- **轮询**: 5s interval 自动停止，`encodeURIComponent` 正确处理 URL
- 审查: `docs/review-reports/20260325/review-vibex-canvas-redesign-20260325-epic5.md` — ✅ PASSED (48 tests)

### Added (vibex-canvas-redesign-20260325 Epic3: BusinessFlowTree) — 2026-03-25
- **BusinessFlowTree 组件**: 业务流程树垂直列表，每节点卡片展示
- **Step 操作**: 添加/编辑/删除/重排业务流程步骤
- **自动生成**: 确认所有上下文后自动生成业务流程
- **Step 重排**: 拖拽调整顺序，重排后 flow + component 自动 pending
- **TreePanel 集成**: `TreePanel.tsx` 添加 BusinessFlowTree 渲染
- **测试**: 35 tests pass (canvasStore.test.ts Epic3 scenarios)
- **审查**: ✅ PASSED
- Commit: `d76a0fae`

### Added (vibex-canvas-redesign-20260325 Epic2: BoundedContextTree) — 2026-03-25
- **BoundedContextTree 组件**: 垂直列表布局，节点卡片展示（pending 黄/confirmed 绿/error 红）
- **AI 生成**: Mock AI 生成 3-6 个限界上下文节点
- **CRUD 操作**: 添加/编辑/删除/确认上下文节点，连接 canvasStore
- **节点确认**: 点击确认后节点变绿，触发 flow tree activation
- **级联删除**: 删除上下文节点时，flow + component 节点自动 pending
- **TreePanel 集成**: `TreePanel.tsx` 添加 BoundedContextTree 渲染
- **测试**: 27 tests pass (`canvasStore.test.ts` flow cascade + activation)
- **审查**: ✅ PASSED — `docs/review-reports/20260325/review-vibex-canvas-redesign-20260325-epic2.md`
- Commit: `453c3895`

### Added (vibex-canvas-redesign-20260325 Epic1: Canvas Infrastructure) — 2026-03-25
- **Canvas 基础设施**: 新路由 `/canvas`，三树面板（Phase/Context/Flow）并行展示
- **组件**: `CanvasPage.tsx`, `PhaseProgressBar.tsx`, `TreePanel.tsx`
- **状态管理**: Zustand `canvasStore.ts` (phase/context/flow/component/queue slices)
- **级联更新**: `CascadeUpdateManager` 处理状态依赖
- **类型定义**: `lib/canvas/types.ts` 完整类型
- **Landing Page**: 首页添加 Canvas Banner 引导
- **测试**: 34 tests pass (`canvasStore.test.ts`, `CascadeUpdateManager.test.ts`)
- **审查**: ✅ PASSED — `docs/review-reports/20260325/review-vibex-canvas-redesign-20260325-epic1.md`
- Commit: `57c09045`

### Fixed (fix-epic1-topic-tracking Epic1: create_thread_and_save Silent Failure) — 2026-03-25
- **移除静默失败**: `create_thread_and_save` 失败时不再返回 exit 0
- **告警消息**: 失败时输出 `⚠️ 话题创建失败` + stderr 详情
- **降级机制**: `_degrade_to_normal_message()` 失败时降级为普通消息
- **dev-heartbeat.sh**: 显式处理 `create_thread_and_save` 失败，不阻塞心跳
- **analyst-heartbeat.sh**: 移除 `|| true`，显式处理失败
- **测试**: `test-topic-tracking.sh` 7 场景 10 测试用例全部通过
- **审查**: ✅ PASSED — `docs/review-reports/20260325/review-fix-epic1-topic-tracking-epic1.md`
- 文件: `scripts/heartbeats/common.sh`, `scripts/heartbeats/dev-heartbeat.sh`, `scripts/heartbeats/analyst-heartbeat.sh`, `scripts/heartbeats/test-topic-tracking.sh`

### Added (vibex-epic2-frontend-20260324 P1-6: API Error Tests) — 2026-03-25
- **api-error-integration.test.ts**: 33 tests 覆盖 E1.1~E4.2（HTTP状态码拦截、错误响应解析、网络/超时错误捕获、错误码映射、Toast集成）
- 测试文件: `vibex-fronted/src/services/api/__tests__/api-error-integration.test.ts`

### Added (vibex-epic2-frontend-20260324 P1-5: E2E CI Integration) — 2026-03-25
- **e2e-tests.yml 修复**: 移除 `continue-on-error: true`（掩盖真实失败）
- **playwright.ci.config.ts**: 显式指定 CI 配置文件，Chromium sandbox flags，`--shard` 分片支持
- **内存优化**: CI 使用 `workers: undefined`（自动选择 CPU 核心数），retries: 3

### Added (vibex-epic3-architecture-20260324 Epic3 P2-2: Error Type Unify) — 2026-03-25
- **ErrorType 枚举统一**: 改为 UPPERCASE 格式 (`NETWORK_ERROR | TIMEOUT | PARSE_ERROR | UNKNOWN`)
- **useErrorHandler hook**: 新增统一错误处理 Hook（重试 + 状态管理 + 用户提示）
- **lib/error/* 重构**: ErrorClassifier、ErrorCodeMapper、ErrorMiddleware、RetryHandler 统一模块
- **测试套件**: ErrorClassifier / ErrorCodeMapper / ErrorMiddleware 共 120 tests 全部通过

### Added (vibex-epic1-toolchain-20260324 Epic1: Toolchain Fixes) — 2026-03-24
- **scripts/dedup/dedup_production_verify.py**: 新增生产环境 dedup 批量验证脚本，102 项目 × 10 提案，误判率 0%
- **scripts/timeout.py**: 新增通用 `@timeout(seconds)` SIGALRM 超时装饰器
- **task_manager.py**: `cmd_list`/`cmd_claim` 添加 `@timeout(5)` 装饰器，防止挂起
- **task_manager.py**: 新增 `health` 命令，健康检查 list + load_project 耗时
- **page.test.tsx**: 已通过 203 suites / 2388 tests ✅（无需修改）
- **dedup service**: 新增 `services/dedup/index.ts`，去重检测机制核心服务
- **MessageContext data model**: `docs/data-model.md` 定义数据结构
- **coord-heartbeat.sh**: PROJECTS_DIR 路径修复（独立 PR）

### Added (homepage-cardtree-debug Epic1) — 2026-03-24
- **数据传递修复**: HomePage → PreviewArea → CardTreeView 传递 useCardTree + projectId
- **useHomePage 增强**: 新增 createdProjectId state，handleCreateProject 后自动设置
- **Epic1 测试**: 6 个验收测试全部通过，200 suites / 2367 tests 整体通过

### Added (ReactFlow Visualization - Epic1-6) — 2026-03-23
- **统一类型系统**: VisualizationType discriminated union (flow/mermaid/json)
- **Zustand Store**: visualizationStore 统一管理三种视图状态 + persist
- **FlowRenderer**: ReactFlow 流程图组件，支持 minimap/节点点击/store 同步
- **MermaidRenderer**: Mermaid 图表组件，DOMPurify XSS 防护
- **JsonTreeRenderer**: 虚拟化 JSON 树（1000+ 节点），ResizeObserver 动态高度
- **ViewSwitcher**: Tab 切换三视图，ARIA accessibility + 键盘导航
- **性能调优**: useCallback hooks 全覆盖 + Suspense 懒加载 + LRU 缓存

### Added (taskmanager SyntaxWarning 修复) — 2026-03-23
- **SyntaxWarning 修复**: % 格式化替换为 f-strings，编译零警告
- **测试覆盖**: pytest 13/13 全绿


## [Epic3 Fix] - 2026-03-22

### Fixed
- **ThemeWrapper timing bug**: useRef/useEffect 检测异步 homepageData 到达并重新计算 merge 策略
- **ThemeContext**: 异步数据到达时重新计算 mode 而非使用 stale initialState
- **KnowledgeBase 虚假完成修复**: 创建真实 docs/knowledge/ 结构
  - 4 个 Pattern: test-isolation, async-state-race, api-version-drift, config-drift
  - 3 个 Template: problem-analysis, competitive-analysis, solution-evaluation
  - 索引文档 _index.md

## [Unreleased]

## [1.x.x] - 2026-03-24

### Fixed
- **Jest 配置**: 补充 jest.config.ts + mock 文件，明确 testPathIgnorePatterns 排除 e2e/performance 目录，防止 Playwright 测试被 Jest 误执行

### Added (Epic 1 - 布局框架)
- **三栏布局**: Sidebar (15%) + PreviewArea (60%) + InputArea (25%) 实现
- **CSS 变量系统**: tokens.css 完整定义 (颜色/间距/阴影/圆角/z-index)
- **背景特效**: Grid overlay + Cyan/Purple Glow orb 动态效果
- **响应式断点**: 1200px (max-width: 1440px) / 900px (padding: 0 24px)
- **暗色主题**: 完整暗色变量覆盖

### Added (Epic 2 - Header 导航)
- **Navbar 组件**: 顶部导航 (Logo + 导航链接 + CTA 按钮)
- **Logo**: VibeX 文字 + ◈ 图标
- **导航链接**: 模板页 /templates 链接
- **登录状态**: 未登录显示"开始使用"，已登录显示"我的项目"
- **响应式**: 768px 断点隐藏导航链接

### Added (Epic 3 - 左侧抽屉)
- **Sidebar 组件**: 5 步流程导航 (需求澄清 → 限界上下文 → 领域模型 → 业务流程 → UI生成)
- **StepNavigator**: 步骤指示器 + 点击切换
- **进度统计**: 实时步骤进度条
- **状态同步**: 默认/激活/完成三种样式

### Added (Epic 4 - 预览区)
- **PreviewArea 组件**: 图表预览区 (空/加载/Mermaid/交互/导出)
- **PreviewCanvas**: SVG 画布渲染
- **NodeTreeSelector**: 节点树选择器
- **图表导出**: PNG / SVG / 源码复制
- **错误处理**: Mermaid 语法错误 / 初始化失败 / 渲染失败降级

### Added (Epic 5 - 右侧抽屉)
- **右侧配置面板**: 思考列表、新增动画、详情展开

### Added (Epic 6 - 底部面板)
- **底部结果面板**: 设计产物展示、导出、对比

### Added (Epic 7 - 快捷功能)
- **快捷操作**: 常用操作快捷入口

### Added (Epic 8 - AI 展示区)
- **AI 对话面板**: AI 生成结果实时展示

### Added (Epic 9 - 悬浮模式)
- **悬浮 UI**: 画布悬浮工具条

### Added (Epic 10 - 状态管理)
- **Zustand Store**: 设计状态管理、localStorage 持久化
- **状态快照**: 切换前保存，支持回退
- **SSE 连接**: 服务端推送支持

### Added
- **agent-self-evolution-20260321**: 每日自检提案收集
  - 6 个 agent 提案: dev, analyst, architect, pm, tester, reviewer
  - PRD 和架构文档已创建
  - 提案存储在 proposals/20260321/

### Added (Story 1.2 CSS Variables) 新增完整的设计令牌系统
  - 颜色变量: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted` 等
  - 间距变量: `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`, `--spacing-2xl`
  - 字体变量: `--font-sans`, `--font-size-base` 等
  - 圆角/阴影: `--radius-md`, `--shadow-lg` 等
  - 过渡动画: `--transition-fast`, `--transition-normal`, `--ease-out`, `--ease-in-out`
  - 暗色主题覆盖

### Tests
- 新增 `css-variables.test.ts` 验证 CSS 变量正确定义
- 更新 `colors.test.ts` 测试 Story 1.2 spec 变量
- 所有 token 测试通过

### Dependencies
- N/A

### Refactor
- N/A

---

## [Previous Changes]

See git history for complete changelog.
