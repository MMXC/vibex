### Added (vibex-canvas-flowtree-edit-20260328 Epic1: 流程树编辑增强) — 2026-03-28
- **Epic1**: 流程树编辑功能增强
  - `addFlowNode` 支持 `contextId=''`（独立流程，无关联限界上下文）
  - `addStepToFlow` store action：向流程节点追加步骤
  - 流程节点样式标准化
  - 13 个新测试用例（canvasStore.test.ts Epic E1: 55 total pass）
  - 提交: `d6f8ab59`
  - 审查: ✅ PASSED (4.5/5)

### Fixed (vibex-canvas-btn-rename-20260328 Epic1: 按钮文案「重新执行」) — 2026-03-28
- **Epic1**: Canvas 页面按钮文案优化：「AI生成上下文」→「重新执行」
  - `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`:
    - 按钮可见文本: `◈ AI 生成上下文` → `◈ 重新执行`
    - 加载态文本: `◌ 生成中...` → `◌ 重新执行中...`
    - aria-label: `AI 生成限界上下文` → `重新执行`
    - 空状态提示: `点击「AI 生成上下文」...` → `点击「重新执行」...`
  - 提交: `75070fed` (feat) + `403336cb` (fix)
  - Review: `docs/vibex-canvas-btn-rename-20260328/`

### Added (team-evolution-20260328 Epic1: Agent Self-Score 机制) — 2026-03-28
- **Epic1 Phase1-SelfScore**: self-score-hook.sh — agent 端自动自我评分
  - `scripts/heartbeats/self-score-hook.sh`: 9维关键词评分，从 phase 文件结构推断各维度得分（格式/完整度/约束/耗时/可行性/可读/可理解/详细程度/正确性）
  - 6/6 agent HEARTBEAT.md task_done hook 已配置（analyst/pm/architect/dev/tester/reviewer）
  - `docs/team-evolution-20260328/test-phase.md`: E2E 测试用 phase 文件
  - `scores.tsv`: rater=self 记录正常写入，E2E 验证 7.9/10
  - Review: `docs/team-evolution-20260328/`

### Added (team-evolution-20260328 Epic2: ErrorLog 自动化) — 2026-03-28
- **Epic2 Phase2-ErrorLog**: auto-error-log.sh — 自动错误模式检测与 E00x 回填
  - `scripts/heartbeats/auto-error-log.sh`: 5种错误模式检测（rate-limit/timeout/null-return/blocked/error），Python3 原子写入 HEARTBEAT.md
  - 备份机制: `cp HEARTBEAT.md HEARTBEAT.md.bak.$(date +%Y%m%d%H%M%S)` 先备份再写入
  - 查重逻辑: 新条目与已有 E00x 描述相似度 > 0.7 时不重复创建
  - 教训回填: E00x 条目追加教训引用到 phase 文件
  - 6/6 agent HEARTBEAT.md task_done hook 已追加 auto-error-log.sh 并行调用
  - BATS 11/11 + pytest 1/1 测试全绿
  - Review: `docs/team-evolution-20260328/`

### Added (vibex-doc-fix-20260328 Epic1: API Contract 重建) — 2026-03-28
- **Epic1**: 重建 `docs/api-contract.yaml`（14 → 147 端点）
  - OpenAPI 3.0.3 规范，YAML 格式验证通过，0 敏感信息泄露
  - 端点: 147 个（BackendOnly 33 + Deprecated v1 28 + 业务 86）
  - Tag 分组: 18 个（Auth/Projects/Requirements/DDD/Design/Flows/...）
  - Schema: 55 个，含完整 Request/Response 类型
  - Review: `docs/vibex-doc-fix-20260328/review-epic1.md`

### Added (vibex-doc-fix-20260328 Epic2: 废弃文档归档) — 2026-03-28
- **Epic2**: 归档 886 个废弃文档到 `docs/archive/202603-stale/`
  - 归档范围: 历史项目文档（homepage、domain-model、api-fixes、security、test-infra 等 10 个类别）
  - 归档原则: 只移不删，保留文件名和时间戳，白名单豁免 agent-self-evolution-*、vibex-canvas-* 等活跃项目
  - Review: `docs/vibex-doc-fix-20260328/review-epic2.md`

### Added (agent-self-evolution-20260328 Epic5: DAG Topological Sort) — 2026-03-28
- **F5.1**: `scripts/topological_sort.py` — Kahn's algorithm实现，117行，14个测试全部通过
- **F5.2**: `scripts/task_manager.py list --topo` — 按拓扑序输出任务
- **F5.3**: 环检测保护 — 环检测时返回 None，回退到字母序
- Review: `docs/agent-self-evolution-20260328/docs/review-epic5-topological-sort.md`

### Added (agent-self-evolution-20260328 Epic4: Analysis.md Template Standardization) — 2026-03-28
- **F4.1**: `docs/analysis-template.md` — 标准 6 节分析文档模板
  - 问题定义、业务场景、JTBD 分析（3-5条）、技术方案对比（≥2）、验收标准（≥4）、风险识别
- **F4.2**: `scripts/validate_analysis.sh` — 分析文档验证脚本
  - 扫描所有 docs/*/analysis.md，exit 1 报告违规
  - 跳过模板本身和 docs/docs/ 归档目录
- **F4.3**: 扫描 174 个文档（2 合规，172 待迁移）
- Review: `docs/agent-self-evolution-20260328/docs/review-epic4-template-standardization.md`

### Added (vibex-pre-existing-test-failures: CardTreeView & Navbar 测试修复) — 2026-03-28
- **CardTreeView.tsx**: 修复 `displayError` 逻辑，`fetchError` 不存在时不显示错误
- **CardTreeView.test.tsx**: 添加 `useErrorHandler` mock，修复错误状态测试（29 tests ✅）
- **useErrorHandler.ts**: 添加中文错误消息识别（网络错误/超时）
- **Navbar.test.tsx**: 修复 Zustand selector 模式 mock
- Review: `docs/vibex-pre-existing-test-failures/review-cardtreeview-fix.md`

### Added (vibex-canvas-expand-dir-20260328 Epic1: 三栏展开方向修复) — 2026-03-28
- **Epic1**: F1.1~F1.2 三栏展开方向独立控制
  - `HoverHotzone.tsx`: 新增 `centerExpandDirection` 属性，支持左/右热区独立控制展开方向
  - `CanvasPage.tsx`: 左热区 `centerExpandDirection="left"`，右热区 `centerExpandDirection="right"`
  - `canvasStore.ts`: `togglePanel` center 循环逻辑改为 `default → expand-left → expand-right → default`
  - 185 canvas tests pass
  - Review: `docs/review-reports/20260328/review-vibex-canvas-expand-dir-20260328-epic1.md`

### Added (vibex-canvas-bc-layout-20260328 Epic1: BC卡片布局虚线领域框分组) — 2026-03-28
- **Epic1**: F1.1 BC卡片布局虚线领域框分组
  - `BoundedContextGroup.tsx`: 新组件，按领域类型（核心/支撑/通用/外部）用虚线框分组，领域标签徽章和计数显示
  - `BoundedContextTree.tsx`: 集成 BoundedContextGroup，支持 data-testid="bounded-context-group" / "domain-label"
  - `BoundedContextCard.tsx`: 添加 data-testid 属性
  - `boundedGroup.test.ts`: 23 个单元测试全部通过
  - Review: `docs/review-reports/20260328/review-vibex-canvas-bc-layout-20260328-epic1.md`

### Added (vibex-canvas-checkbox-20260328 Epic1: Checkbox图标CSS替换) — 2026-03-28
- **Epic1**: F1.1 Checkbox图标CSS替换
  - `CheckboxIcon.tsx`: 新组件，CSS-only checkbox（√× → 口），支持 SVG checkmark
  - `CheckboxIcon.module.css`: 深色模式支持，CSS 变量
  - `BoundedContextTree.tsx` / `BusinessFlowTree.tsx`: 替换 emoji checkbox 为 CheckboxIcon 组件
  - 无障碍: role="checkbox", aria-checked, aria-disabled, aria-label 全部正确
  - Review: `docs/review-reports/20260328/review-vibex-canvas-checkbox-20260328-epic1.md`

### Added (vibex-canvas-expand-dir-20260328 Epic1: 三栏展开方向修复) — 2026-03-28
- **Epic1**: F1.1 三栏展开方向修复
  - `CanvasExpandPanel.tsx`: 左侧向右展开，右侧向左展开，中间双向展开
  - `canvasExpandState.test.ts`: 19 个单元测试全部通过
  - `canvasStore.test.ts`: 44 个综合测试全部通过
  - Review: `docs/review-reports/20260328/review-vibex-canvas-expand-dir-20260328-epic1.md`


# Changelog

### Added (vibex-canvas-bc-layout-20260328 Epic1: BC卡片布局虚线领域框分组) — 2026-03-28
- **Epic1**: F1.1 领域分组数据结构 + F1.2 领域分组渲染逻辑
  - `BoundedContextGroup.tsx`: 新组件，按领域类型（core/supporting/generic/external）用虚线框分组
  - `BoundedContextTree.tsx`: 按 `domainType` 分组渲染 contextNodes
  - `canvas.module.css`: `.boundedContextGroup` / `.domainLabel` / `.domainCount` / `.groupedCards` 样式
  - 响应式: 375px~1440px 支持，data-testid 标记
  - TypeScript 0 errors, ESLint 0 errors (specific files)
  - Review: `docs/review-reports/20260328/review-vibex-canvas-bc-layout-20260328-epic1.md`

### Fixed (vibex-canvas-import-nav-20260328 Epic1: 导入示例导航修复) — 2026-03-28
- **Epic1**: F3.2 导入示例节点预览链接修复
  - `ComponentTree.tsx`: 节点点击改为检查 `previewUrl`，有则新标签页打开，无则 toast 提示
  - 移除 `vscode://` deep link fallback 逻辑
  - `example-canvas.json`: 组件添加 `previewUrl` 字段
  - `cursor`/`title` 对齐为仅检查 `previewUrl`
  - 185 canvas tests pass
  - Review: `docs/review-reports/20260328/review-vibex-canvas-import-nav-20260328-epic1.md`

### Added (vibex-canvas-analysis Epic3: 步骤引导体验优化) — 2026-03-27
- **Epic3**: F-3.1~F-3.3 步骤引导体验优化
  - `PhaseProgressBar.tsx`: disabled 按钮添加 `title="{阶段名}：需先完成上一阶段"` + `data-testid="step-{phaseKey}"`
  - `TreeStatus.tsx`: 新组件，显示三树节点数量，`✓` 标记全部 confirmed
  - `canvas.module.css`: 新增 `.treeStatus` / `.treeStatusItem` / `.treeStatusConfirmed` / `.treeStatusDivider` 样式
  - 13 treeStatus + PhaseProgressBar tests pass
  - Review: `docs/review-reports/20260327/review-vibex-canvas-analysis-epic3.md`

### Fixed (vibex-canvas-analysis Epic2: 未登录引导优化) — 2026-03-27
- **Epic2 + Epic2-P1**: F-2.1~F-2.2 未登录用户引导优化
  - `Navbar.tsx`: 新画布按钮添加 auth guard，未登录显示 toast + 打开登录抽屉
  - `AuthToast.tsx`: 新增 auth 专用 toast 组件（支持 `AuthToastProvider` + `useAuthToast` hook）
  - `HomePage.tsx`: AI Panel 发送按钮添加 `showToast` 登录检查
  - `OnboardingProgressBar.module.css`: z-index 9999→200，添加 `pointer-events: none`
  - 13/16 Navbar tests pass（3 pre-existing mock failures from dev phase）
  - Review: `docs/review-reports/20260327/review-vibex-canvas-analysis-epic2.md`

### Fixed (vibex-canvas-analysis Epic1: 导入示例流程修复) — 2026-03-27
- **Epic1**: F-1 导入示例流程阻断修复
  - `canvasStore.ts`: `loadExampleData` action 设置 contextNodes + flowNodes + componentNodes + phase + activeTree
  - `example-canvas.json`: 扩展至 3 context + 4 flow + 5 component，全部 confirmed:true
  - `CanvasPage.tsx`: 导入按钮绑定 `loadExampleData`，添加 `data-testid="import-example-btn"`
  - `ProjectBar.tsx`: 创建按钮添加 `data-testid="create-project-btn"`
  - 三树组件添加 `data-testid`: context-tree / flow-tree / component-tree
  - 19 example tests + 172 canvas regression tests pass
  - Review: `docs/review-reports/20260327/review-vibex-canvas-analysis-epic1.md`

### Added (vibex-canvas-expandable-20260327 E5: E2E 测试) — 2026-03-27
- **E5**: Playwright E2E — 13 个端到端集成测试（展开 + 拖拽 + 领域框）
  - `canvas-expand.spec.ts`: E2/E3/E4/E5 四组测试
  - 修复 localStorage 格式（Zustand persist 直接存储字段，无 `{state, version}` 包装）
  - 修复 `phase` 不持久化问题（添加到 `partialize`）
  - `setupCanvasPhase()` helper：预置 `phase: 'context'` 使三栏 grid 可渲染
  - Review: `docs/review-reports/20260327/review-vibex-canvas-expandable-20260327-epic-e5.md`

### Added (vibex-canvas-expandable-20260327 E4: 虚线领域框) — 2026-03-27
- **E4**: BoundedGroup — DDD 限界上下文视觉分组
  - `canvasStore.ts`: `boundedGroups` Zustand slice + `addBoundedGroup`/`removeBoundedGroup`/`toggleBoundedGroupVisibility`/`updateBoundedGroupLabel`/`addNodeToGroup`/`removeNodeFromGroup`/`clearBoundedGroups`
  - `types.ts`: `BoundedGroup` / `BoundedGroupBBox` 类型 + `BOUNDED_GROUP_COLORS` / `computeGroupBBoxes`
  - `BoundedGroupOverlay.tsx`: SVG 虚线矩形叠加层，`pointer-events: none`，视口感知
  - `CardTreeRenderer.tsx`: 集成 `BoundedGroupOverlay`，视口跟踪
  - `boundedGroup.test.ts`: 23 tests (full lifecycle + computeGroupBBoxes)
  - 74 canvas tests pass (boundedGroup + dragState + canvasExpandState)
  - Review: `docs/review-reports/20260327/review-vibex-canvas-expandable-20260327-epic-e4.md`

### Added (vibex-canvas-expandable-20260327 E3: 卡片拖拽排序) — 2026-03-27
- **E3**: DragState — 卡片拖拽排序状态管理
  - `canvasStore.ts`: `draggedNodeId`/`dragOverNodeId`/`draggedPositions`/`isDragging` Zustand slice
  - `startDrag()`/`endDrag()`/`setDragOver()`/`updateDraggedPosition()`/`clearDragPositions()`/`clearDragPosition()`
  - `draggedPositions` 持久化到 localStorage（页面刷新不丢失）
  - `CardTreeRenderer.tsx`: `onNodeDragStart`/`onNodeDrag`/`onNodeDragStop` 事件处理
  - `HoverHotzone.tsx`: 拖拽时禁用面板展开热区（`isDragging` 保护）
  - `CardTreeRenderer.module.css`: 拖拽态 CSS（`isDragging` / `user-select: none`）
  - 51 canvas tests pass (dragState + canvasExpandState)
  - Review: `docs/review-reports/20260327/review-vibex-canvas-expandable-20260327-epic-e3.md`

### Added (vibex-canvas-expandable-20260327 E2: 三栏双向展开状态) — 2026-03-27
- **E2**: CanvasExpandState — 三栏双向展开状态管理
  - `canvasStore.ts`: `leftExpand`/`centerExpand`/`rightExpand` Zustand slice
  - `getGridTemplate()`: 动态计算 grid 列宽 (`D=1fr`, `X=1.5fr`)
  - `togglePanel()`: 单击展开/收起，`resetExpand()`: 双击恢复默认
  - `HoverHotzone.tsx`: 8px 热区组件，悬停显示展开箭头
  - `canvas.module.css`: `grid-template-columns: var(--grid-left,1fr) var(--grid-center,1fr) var(--grid-right,1fr)` + 0.3s transition
  - 44 canvasStore tests pass
  - Review: `docs/review-reports/20260327/review-vibex-canvas-expandable-20260327-epic-e2.md`

### Changed (vibex-canvas-expandable-20260327 E1: ReactFlow v12 升级) — 2026-03-27
- **E1**: ReactFlow v12 (`@xyflow/react`) 升级完成
  - `reactflow` → `@xyflow/react` 迁移（26 个文件）
  - 自定义 Node/Edge 类型适配 v12 API
  - `NodeProps<T>` / `EdgeProps<T>` 类型修复（`T extends Record<string, unknown>`）
  - TypeScript 0 errors, 2541 tests pass
  - `docs/gstack/vibex-canvas-expandable-20260327.md`

### Fixed (vibex-bc-filter-fix-20260326 Epic1: 修复过度过滤) — 2026-03-26
- **Epic1**: 移除 '管理' 从 forbiddenNames，maxNameLength 10→12
  - `bounded-contexts-filter.ts`: 修复过度过滤问题（'患者管理' 不再被误杀）
  - 69 tests pass (31 backend + 38 frontend)
  - Review: `docs/review-reports/20260326/review-vibex-bc-filter-fix-epic1.md`

### Added (vibex-bc-prompt-fix Epic1: 跨 API boundedContexts 一致性测试) — 2026-03-26
- **Epic1**: Cross-API boundedContexts 一致性测试 (C1-C5)
  - `bounded-contexts-consistency.test.ts`: 14 backend tests + 17 frontend tests = 31 total
  - Coverage: prompt consistency, deterministic filtering, suffix removal, core ratio, length bounds
  - Review: `docs/review-reports/20260326/review-vibex-bc-prompt-fix-epic1.md`

### Added (vibex-bc-prompt-optimize-20260326 Epic5: 跨 API 一致性测试) — 2026-03-26
- **Epic5**: Cross-API boundedContexts 一致性测试 (C1-C6)
  - `bounded-contexts-consistency.test.ts`: 14 tests covering cross-API prompt consistency, deterministic filtering, forbidden suffix removal, core ratio validation, name length bounds, realistic mixed scenarios
  - Review: `docs/review-reports/20260326/review-vibex-bc-prompt-optimize-20260326-epic5.md`

### Added (vibex-bc-prompt-optimize-20260326 Epic1: 统一 DDD Prompt 模板) — 2026-03-26
- **Epic1**: 统一 Prompt 模块 + 过滤器 (S1.1-S1.3)
  - `bounded-contexts.ts`: `BOUNDED_CONTEXTS_PROMPT` 模板 + `buildBoundedContextsPrompt()`
  - `bounded-contexts-filter.ts`: `isNameFiltered` + `filterInvalidContexts` + `validateCoreRatio`
  - 22 tests (T1-T5 + filter/ratio validation)
  - Review: `docs/review-reports/20260326/review-vibex-bc-prompt-optimize-20260326-epic1.md`

### Added (vibex-step-context-fix-20260326: boundedContexts 多节点展示) — 2026-03-26
- **Epic1**: 后端 SSE `step_context` 事件增加 `boundedContexts` 数组
  - `route.ts`: 条件展开 boundedContexts（无数据时不发送字段）
  - Review: `docs/review-reports/20260326/review-vibex-step-context-fix-epic1.md`
- **Epic2**: 前端类型定义扩展 `StepContextEvent` + `onStepContext` 回调签名
  - `dddApi.ts`: `BoundedContext` 接口 + 回调参数
  - Review: `docs/review-reports/20260326/review-vibex-step-context-fix-epic2.md`
- **Epic3**: 前端 Store 循环创建多节点（max 10）+ 名称截断（max 30）
  - `canvasStore.ts`: `truncateName()` + `slice(0, 10)` 数量限制
  - Review: `docs/review-reports/20260326/review-vibex-step-context-fix-epic3.md`


### Added (vibex-task-state-20260326 Epic1-4: task_state CLI + 乐观锁) — 2026-03-26
- **Epic1**: `atomic_write_json()` + `save_project_with_lock()` + `load_project_with_rev()` (F1.1-F1.4)
  - tempfile.mkstemp + os.rename 原子写入，乐观锁 revision 比对 + 重试
  - Review: `docs/review-reports/20260326/review-vibex-task-state-20260326-epic1.md`
- **Epic2**: `task_state.py` CLI (update/claim/status/lock) (F2.1-F2.5)
  - Fix: `cmd_update/claim/lock` 并发异常捕获 (RuntimeError → 友好错误)
  - Review: `docs/review-reports/20260326/review-vibex-task-state-20260326-epic2.md`
- **Epic3**: `task_manager.py` 重构 (cmd_update/cmd_claim 迁移到乐观锁) (F3.1-F3.3)
  - Fix: `cmd_update`/`cmd_claim` 3处并发异常捕获
  - Review: `docs/review-reports/20260326/review-vibex-task-state-20260326-epic3.md`
- **Epic4**: 并发 + 原子测试 (F4.1-F4.4)
  - `test_concurrent.py` (5 tests): 并发写入 revision 一致性
  - `test_atomic.py` (7 tests): 崩溃恢复、Unicode、契约测试
  - Review: `docs/review-reports/20260326/review-vibex-task-state-20260326-epic4.md`
- **总计**: 37 task-state tests pass (Epic1-4 全部通过) 🎉


All notable changes to this project will be documented in this file.

### Fixed (vibex-canvas-api-fix-20260326 Epic3: API URL 统一修复 + gstack 验证) — 2026-03-26
- **根因**: `dddApi.ts` 和 `canvasApi.ts` 使用硬编码相对路径如 `/api/v1/analyze/stream`，解析到前端域名而非后端
- **修复**: 使用 `getApiUrl()` 统一管理 API 地址，读取 `NEXT_PUBLIC_API_BASE_URL`
- **baseURL 默认值**: `https://api.vibex.top/api`（fallback 机制）
- **受影响端点**: `/v1/analyze/stream`, `/canvas/project`, `/canvas/generate` 等 7 个 API 调用
- **gstack 验证**: API 成功调用 `api.vibex.top/api/v1/analyze/stream` → 200，上下文节点正常生成
- **审查**: ✅ PASSED — `docs/review-reports/20260326/review-vibex-canvas-api-fix-epic3.md`
- Commit: `b5ef1d69`

### Fixed (vibex-canvas-api-fix-20260326 Epic2: SSE 路由修复) — 2026-03-26
- **根因修复**: Cloudflare Workers 部署 Hono 而非 Next.js，/v1/analyze/stream 404
- **Hono 迁移**: SSE 端点从 Next.js route.ts 迁移到 `src/routes/v1/analyze/stream.ts`
- **路由修正**: `/api/v1` mount + `/analyze` 路由在 protected_ 前注册
- **认证移除**: `/v1/analyze/stream` 设为公开路由（无需认证）
- **前端解析器**: `pendingEventType` 状态机替代 `indexOf`，更健壮
- 审查: `docs/review-reports/20260326/review-vibex-canvas-api-fix-epic2.md` — ✅ PASSED

### Added (vibex-three-trees-enhancement-20260326 Epic3: 组件树交互) — 2026-03-26
- **F3.1**: `data-testid` 支持（节点 + 展开按钮）
- **F3.2**: 点击跳转（previewUrl → vscode deep link）
- **F3.3**: Hover 高亮状态（`hovered` class）
- **F3.4**: 子树计数 badge（展开按钮显示 `▼(n)`）
- 审查: `docs/review-reports/20260326/review-vibex-three-trees-enhancement-epic3.md` — ✅ PASSED

### Added (vibex-three-trees-enhancement-20260326 Epic2: 流程分支循环可视化) — 2026-03-26
- **GatewayNode.tsx**: 菱形网关节点（XOR/OR 分支选择）
- **LoopEdge.tsx**: 循环边（虚线箭头，标识回退路径）
- **types.ts**: 新增 FlowGateway/GatewayNodeData/LoopEdgeData 类型
- 审查: `docs/review-reports/20260326/review-vibex-three-trees-enhancement-epic2.md` — ✅ PASSED

### Added (vibex-three-trees-enhancement-20260326 Epic1: 上下文关系推理) — 2026-03-26
- **inferRelationships.ts**: 领域关系推算引擎，关键词→类型映射（dependency/aggregate/calls）
- **RelationshipEdge.tsx**: 自定义 ReactFlow 边（三类样式：实线/粗线/虚线）
- **ContextTreeFlow.tsx**: 集成 CardTreeRenderer + relationships
- 审查: `docs/review-reports/20260326/review-vibex-three-trees-enhancement-epic1.md` — ✅ PASSED (66 tests)

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

### Fixed (vibex-canvas-flow-card-20260328 Epic1: FlowCard样式虚线+图标) — 2026-03-28
- **Epic1**: FlowCard border 改为 dashed，FlowStep 添加 type 字段（normal/branch/loop）
  - `BusinessFlowTree.tsx`: StepRow 显示步骤类型图标 🔀分支/🔁循环，`data-testid="flow-card"`, `data-testid="flow-step-icon"`
  - `canvas.module.css`: `.flowCard` border `2px solid` → `2px dashed`，新增 `.flowStepIcon` 样式
  - `types.ts`: `FlowStep.type?: 'normal' | 'branch' | 'loop'`
  - Review: `docs/review-reports/20260328/review-vibex-canvas-flow-card-20260328-epic1.md`
  - Verdict: ✅ PASSED (tsc 0 errors, build ✅, eslint 0 errors, 2655/2669 tests pass)

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
