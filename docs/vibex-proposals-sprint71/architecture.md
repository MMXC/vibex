# VibeX Sprint71 Architecture Design

**Project**: vibex-proposals-sprint71
**Date**: 2026-06-07
**Status**: Self-impl Phase1 analysis

---

## 1. 架构决策

### E1: 键盘快捷键可配置化

**决策 1**: 复用 `shortcutStore.ts`（S67-E4），扩展 UI 层
- `shortcutStore.ts` (11280 bytes on main) 已实现 `addBinding`/`removeBinding`/`importBindings`/`exportBindings` + localStorage 持久化
- 扩展点: 在 `ShortcutSettingsPanel.tsx` 新增"自定义" Tab，集成 `ShortcutKeyInput.tsx` + `ShortcutEditor.tsx`
- 不修改 store 的持久化层 — 已有 `persist` middleware

**决策 2**: 使用 `shortcutManager.ts` 进行全局冲突检测
- `shortcutManager.ts` 已有 `GlobalConflictResult` 和冲突检测逻辑
- E1 复用此模块，无需重新实现

**决策 3**: 键盘解析使用 `parseKeyCombo` 函数（需扩展）
- 新增 `parseKeyboardEvent(e: KeyboardEvent): ShortcutBinding`
- 兼容 `Mousetrap` 格式 (`ctrl+shift+s`)

### E2: 实时协作评论系统

**决策 1**: 复用 `wsCommentHandler.ts`（S51-E5, S53-E2）
- 文件路径: `vibex-fronted/src/lib/canvas/wsCommentHandler.ts` (6142 bytes on main)
- 已有 `comment:created` / `comment:resolved` / `comment:mention` 消息处理
- E2 扩展: `comment:reaction` / `comment:delete` 新消息类型

**决策 2**: 复用 `commentStore.ts`（S69-E4, 8275 bytes on main）
- 扩展 `subscribeToCanvas(canvasId)` + `broadcastComment()` action
- WebSocket 实例注入 via context provider

**决策 3**: 复用 `MentionInput.tsx`（S51）
- 路径: `vibex-fronted/src/components/dds/comments/MentionInput.tsx` — 需验证存在性
- 评论输入框使用 `MentionInput` 替代原生 textarea

### E3: 大型画布性能优化

**决策 1**: 视口虚拟化 via ReactFlow `viewport` API
- 不引入第三方虚拟化库，使用 ReactFlow 内置 `nodeExtent` + 自定义视口过滤
- 过滤函数: `filterNodesByViewport(nodes, viewport, padding=200)`

**决策 2**: WebWorker 用于路径计算
- 新建 `vibex-fronted/src/workers/pathfinding.worker.ts`
- 复用 `vi.mock` 方案进行测试（主线程 worker mock）

**决策 3**: 快照懒加载 via IndexedDB cursor
- `BranchManager` 的快照列表使用 `IDBKeyRange` 分页（初始 50 条）
- 点击"加载更多"触发下一次查询

### E4: 画布使用统计分析

**决策 1**: 新建 `canvasAnalyticsStore.ts`
- 路径: `vibex-fronted/src/stores/dds/canvasAnalyticsStore.ts`
- 使用 `persist` middleware 持久化到 localStorage (`vibex-canvas-analytics`)

**决策 2**: 数据采集在 `DDSCanvasPage.tsx` 的 `onNodesChange` 中触发
- Debounce 5min 批量写入（避免频繁 IndexedDB 写入）
- 使用 `setTimeout` + `clearTimeout` 实现 debounce

### E5: 模板评分与收藏增强

**决策 1**: 复用 `templateStore.ts` 的 `ratings` 字段（S70 已实现）
- 路径: `vibex-fronted/src/stores/templateStore.ts`
- `ratings: Record<string, number[]>` 已存在，新增 `favoriteTemplateIds: string[]` 字段

**决策 2**: `TemplateGallery.tsx` 新增"收藏" Tab
- 路径: `vibex-fronted/src/components/dds/templates/TemplateGallery.tsx`
- Tab 路由: `?tab=favorites` 过滤 `favoriteTemplateIds`

**决策 3**: 市场排序扩展
- `TemplateMarketplacePanel.tsx` 新增排序选择器（usageCount / score / recentlyAdded）
- 调用 `templateStore.getSortedTemplates(sortBy)`

---

## 2. 现有资产映射表

| 文件 | 路径 | 状态 | 用途 |
|------|------|------|------|
| shortcutStore.ts | `src/stores/shortcutStore.ts` | ✅ 存在 | E1: 绑定存储 |
| shortcutManager.ts | `src/lib/keyboard/shortcutManager.ts` | ✅ 存在 | E1: 全局冲突检测 |
| ShortcutSettingsPanel.tsx | `src/components/dds/shortcuts/ShortcutSettingsPanel.tsx` | ✅ 存在 | E1: UI 入口 |
| ShortcutEditor.tsx | `src/components/dds/shortcuts/ShortcutEditor.tsx` | ✅ 存在 | E1: 编辑组件 |
| ShortcutKeyInput.tsx | `src/components/dds/shortcuts/ShortcutKeyInput.tsx` | ✅ 存在 | E1: 快捷键录制 |
| wsCommentHandler.ts | `src/lib/canvas/wsCommentHandler.ts` | ✅ 存在 | E2: WS 处理 |
| commentStore.ts | `src/stores/dds/commentStore.ts` | ✅ 存在 | E2: 评论状态 |
| CommentThread.tsx | `src/components/dds/comments/CommentThread.tsx` | ✅ 存在 | E2: 评论 UI |
| MentionInput.tsx | `src/components/dds/comments/MentionInput.tsx` | ❓ 待验证 | E2: @ 提及 |
| DDSFlow.tsx | `src/components/dds/canvas/DDSFlow.tsx` | ✅ 存在 | E3: 虚拟化改造 |
| templateStore.ts | `src/stores/templateStore.ts` | ✅ 存在 | E5: 评分存储 |
| TemplateMarketplacePanel.tsx | `src/components/dds/templates/TemplateMarketplacePanel.tsx` | ✅ 存在 | E5: 市场 UI |
| TemplateGallery.tsx | `src/components/dds/templates/TemplateGallery.tsx` | ✅ 存在 | E5: 收藏 Tab |
| canvasAnalyticsStore.ts | `src/stores/dds/canvasAnalyticsStore.ts` | ❌ 新建 | E4 |
| AnalyticsPanel.tsx | `src/components/dds/canvas-history/AnalyticsPanel.tsx` | ❌ 新建 | E4 |
| pathfinding.worker.ts | `src/workers/pathfinding.worker.ts` | ❌ 新建 | E3 |

---

## 3. 跨 Epic 集成点

| 集成 | 涉及 Epic | 方式 |
|------|-----------|------|
| `Ctrl+Enter` 提交评论 | E1 + E2 | `shortcutStore` 注册 `comment:submit` action，绑定到 `Ctrl+Enter` |
| 大画布评论输入 | E2 + E3 | `CommentThread` 在虚拟化画布中渲染，过滤视口外评论 |
| 模板评分 UI | E2 + E5 | `CommentThread` 扩展支持模板 ID，@ 提及作者 |
| 快捷键禁用动画 | E1 + E3 | 大画布模式下 `shortcutManager.disableAnimation()` |

---

## 4. 技术风险缓解

| 风险 | 缓解 |
|------|------|
| E3 ReactFlow 虚拟化破坏拖拽 | 先做性能基准测试，逐步添加虚拟化 |
| E2 WebSocket 评论延迟 | 使用现有 `wsCommentHandler` 超时处理 |
| E1 localStorage 配额 | 快捷键数据量小 (<1KB)，无风险 |

