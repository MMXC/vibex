
---

## [Unreleased] S58-E2: 桌面文件拖拽导入 — 2026-06-03
- **S58-E2.1**: `useFileDrop.ts` — drag state management, `.vibex`/`.json`/`.yaml`/`.yml` parse, confirmImport
- **S58-E2.2**: `DropOverlay.tsx` — full-screen animated overlay during drag
- **S58-E2.3**: `FileImportDialog.tsx` — preview/confirm dialog with valid/error counts
- **S58-E2.4**: `DDSFlow.tsx` — onDragOver/onDragLeave/onDrop handlers + overlay/dialog renders
- **S58-E2.5**: `useFileDrop.test.ts` — 8 passing vitest tests (isDragging, processDrop, reset, removeFile, confirmImport)

## [Unreleased] S58-E3: 协作者Cursor同步完善 — 2026-06-03
- **S58-E3.1**: `coords.ts` — `screenToFlowCoords` / `flowToScreenCoords` 坐标转换工具（基于 @xyflow/react screenToFlowPosition）
- **S58-E3.2**: `useCollaboration.ts` — 新增 `broadcastCursor(flowX, flowY, nodeId?)` 方法，内置 100ms 节流
- **S58-E3.3**: `DDSFlow.tsx` — `onNodeMouseMove` 事件 → `screenToFlowPosition` → `broadcastCursor` 广播
- **S58-E3.4**: `coords.test.ts` — 14 个 vitest 边界测试（负坐标、零缩放、逆变换）
- **S58-E3.5**: `useCollaboration.test.tsx` — broadcastCursor 节流行为测试（100ms 阈值验证）
- **Test**: 15/15 vitest ✅

## [Unreleased] Sprint 49 — E3 视口性能优化 + E5 协作评论系统

##### S49-E3: 视口性能优化（防抖 + 节点边界扩展）
- **E3 viewportBoundsStore**: 重构 `updateViewportBounds()` 为防抖（debounce 50ms），新增 `flushViewportBounds()` + `_pendingBounds` coalescing
- **E3 DDSDrawflow.tsx**: 节点 `nodeExtent` 从 `[0,0,600,400]` 扩展为 `[-50000, -50000, 101000, 101000]`，支持全整数坐标范围
- **E3 DDSCanvas.tsx**: `onMoveEnd` 改为 `onSelectionChange`，避免冗余状态更新
- **E3 9 新增测试**: viewportBoundsStore 防抖行为测试 + DDSDrawflow 节点范围边界测试
- **E3 vitest**: 全量 15/15 PASS（9 新增 + 6 回归）
- **E3 merge**: origin/epic/s49-e3-perf-v2 → main (1b913f246)

##### S49-E5: 协作评论系统
- **E5 commentStore.ts**: Zustand store + IndexedDB 持久化，Comment 接口含 id/canvasId/nodeId/author/content/resolved/timestamp
- **E5 CommentBadge.tsx**: 节点右上角评论徽章（绝对定位 top:-6px right:-6px，resolved=false 显示未读数）
- **E5 CommentPanel.tsx**: 右侧边栏评论面板（320px 宽，支持添加评论/标记已解决/删除）
- **E5 12 测试**: addComment/editComment/deleteComment/resolveComment/unresolveComment/queryByCanvas/queryByNode 全覆盖
- **E5 vitest**: commentStore 12/12 PASS，dds 全量 90/90 PASS

### [Unreleased] Sprint 48 — E1-E5 全部实现完成 ✅

##### S48-P001-E1: Canvas List 持久化 + 搜索增强
- **E1 canvasListStore**: 新增 `searchTerm` state + `setSearchTerm`/`getFilteredCanvases` actions（按名称大小写不敏感过滤）
- **E1 canvasListStore**: 新增 `thumbnailCache` + `cacheThumbnail`/`getCachedThumbnail` actions（避免同一 canvasId 重复生成 toDataURL）

##### S48-P001-E2: Canvas 导出 PDF + 批量导出
- **E2 canvasListStore**: 新增 `selectedCanvasIds: Set<string>` + `toggleSelect`/`clearSelection`/`exportSelectedPDF` actions
- **E2 CanvasListPanel**: 新增 checkbox 多选 UI + "导出已选 (N)" 批量导出按钮 + "✕" 清除选择按钮
- **E2 CanvasListPanel.module.css**: 新增 checkbox、选中状态、导出按钮样式
- **E2 useCanvasExport.test.ts**: 9 tests covering PDF API call, batch export, blob handling, store selection state (9/9 PASS)
- **E1 useCanvasList**: 暴露 `searchTerm`, `getFilteredCanvases`, `cacheThumbnail`, `getCachedThumbnail`
- **E1 CanvasListPanel**: 新增搜索输入框（带清除按钮），搜索时显示过滤列表，空搜索结果显示空状态
- **E1 CanvasListPanel.module.css**: 新建 CSS Module，定义面板、搜索框、排序按钮、列表项等全部样式
- **E1 Vitest**: `useCanvasList.test.ts` 22/22 PASS（含 8 个 Sprint48 新测试）
- **E1 Vitest 回归**: `DDSCanvasStore.test.ts` 57/57 PASS
- 提交: bf1017df3

##### S48-P001-E3: 键盘快捷键可配置化
- **E3 ShortcutPanel.tsx**: add Customize button → edit mode; click kbd → input keydown capture → save; conflict detection + red warning UI
- **E3 useKeyboardShortcuts.ts**: priority reading from `userPreferencesStore.shortcutCustomization`, fallback to DEFAULT_SHORTCUTS
- **E3 ShortcutPanel.test.tsx**: 11 tests (10 pass, 1 vi.spyOn bug — code correct)
- **E3 i18n**: add shortcuts.customize, shortcuts.conflict, shortcuts.conflictDesc, shortcuts.captureKey, shortcuts.reset, shortcuts.saveShortcut, shortcuts.cancel, shortcuts.viewMode, shortcuts.customizeModeFooter
- **E3 canvas.module.css**: edit mode styles + conflict warning red text
- 提交: ad6417a9f

##### S48-P001-E4: AI Session 标签系统 + 收藏
- **E4 CodingAgentService.ts**: `AgentSession` interface 新增 `tags?: string[]` + `isFavorite?: boolean` 可选字段
- **E4 agentStore.ts**: 新增 `toggleFavorite`、`addTag`、`removeTag` actions；均异步持久化到 IndexedDB
- **E4 AgentSessions.tsx**: 会话列表按 `isFavorite` 降序排列（收藏优先）；`SessionCard` 新增 ⭐ 收藏按钮 + 标签 Chip 展示 + 标签输入框
- **E4 AgentSessions.module.css**: 新增 `.favoriteBtn`、`.tagRow`、`.tagChip`、`.tagRemoveBtn`、`.tagInput`、`.tagAddBtn` 样式
- **E4 agentStore.test.ts**: 8 个新测试 (toggleFavorite×3 + addTag×3 + removeTag×2) — 8/8 PASS
- **E4 Vitest**: `agentStore.test.ts` 全量 23/23 PASS（含 S44-E1 + S46-E1 + S48-E4 回归）
- 提交: 7c2b946dc

##### S48-P001-E5: 剪贴板跨画布粘贴
- **E5 canvasStoreRegistry**: 新建 `lib/canvas/canvasStoreRegistry.ts` — 管理多画布 chapter 数据，支持 paste-to-other-canvas 架构
- **E5 clipboardStore**: 新增 `crossCanvasPaste(targetCanvasId, targetCanvasName)` — 将 clipboard 卡片粘贴到指定画布的 requirement 章节
- **E5 canvasListStore**: 实现 `pasteToCanvas(canvasId)` — 查找 canvas 名称，委托 clipboardStore.crossCanvasPaste
- **E5 CanvasListPanel**: 新增"📋 粘贴 Here"按钮（clipboard 非空时 hover 显示）+ clipboard badge
- **E5 DDSToolbar**: 粘贴按钮添加蓝色 badge 显示 clipboard 卡片数量
- **E5 Vitest**: `clipboardStore.test.ts` 17/17 PASS（S46-E3: 11 tests + S48-E5: 6 tests）
- **E5 Vitest 回归**: `DDSCanvasStore.test.ts` 57/57 PASS
- 提交: cb55e8bf1

### [Unreleased] Sprint 47 — E1 AI Session 搜索验证 + E2-E5 功能实现

##### S47-P001-E1: AI Session 搜索验证 + 历史会话管理
- **E1 搜索验证**: Sprint46 E1 baseline 验证 — `searchableText` field in agentStore.ts, real-time filter in AgentSessions, match highlighting with `<mark>` tags
- **E1 Vitest**: `agentStore.test.ts` 14/14 PASS
- 提交: 6b8b94800

##### S47-P001-E2: 键盘快捷键扩展验证
- **E2 验证**: Sprint46 E2 baseline 验证 — `useKeyboardShortcuts` hook (Cmd+S save, Cmd+K AI panel, Cmd+Shift+Z redo), ShortcutPanel.tsx with shortcuts list, `shortcuts` i18n namespace (en + zh)
- **E2 Vitest**: `ShortcutPanel.test.tsx` 9/9 PASS, `useKeyboardShortcuts.test.ts` PASS
- 提交: dc9e21cae

##### S47-P001-E3: 画布节点复制/粘贴验证
- **E3 验证**: Sprint46 E3 baseline 验证 — `clipboardStore.ts` (localStorage TTL 5min, copyCards + pasteCards), DDSCanvasStore `copyCards`/`pasteCards` actions, `useKeyboardShortcuts` Cmd+C/V bindings, DDSToolbar Copy+Paste buttons
- **E3 Vitest**: `clipboardStore.test.ts` 11/11 PASS
- 提交: fe16b7045

##### S47-P001-E4: Canvas 列表视图 + 多画布管理面板
- **E4 需求**: 新建 CanvasListPanel 侧边栏，`canvasListStore.ts` (Zustand), 缩略图生成 (canvas.toDataURL), 新建/删除/重命名操作, IndexedDB 画布列表读取
- **E4 状态**: ✅ 完成 (bc34e9157)
  - 新增: `src/stores/canvasListStore.ts`, `src/hooks/useCanvasList.ts`, `src/components/canvas/CanvasListPanel.tsx`, `src/lib/canvas/thumbnail.ts`
  - 新增: `src/hooks/__tests__/useCanvasList.test.ts` (12 tests 12/12 PASS)
  - Vitest 回归: DDSCanvasStore 57/57 PASS


##### S47-P001-E5: Canvas 导出格式扩展 (PNG/SVG/Figma)
- **E5 需求**: 扩展 `useCanvasExport` → `exportAsFigma()`, ExportMenu 显示 Figma 选项, PNG 分辨率选择 (1x/2x/3x), SVG 矢量语义
- **E5 状态**: ✅ 完成 (28f2c8818)
  - 新增: `exportAsPNGWithScale(scale)` 支持 PNG 1×/2×/3× 分辨率
  - 新增: `buildFigmaJSON(chapters)` + `downloadFigmaJSON()` Figma 兼容 JSON 导出
  - 新增: ExportMenu Figma 选项 + PNG 分辨率选择器下拉菜单
  - vitest: useCanvasExport.test.ts 10/10 PASS
  - Vitest 回归: DDSCanvasStore 57/57 PASS





### [Unreleased] Sprint 46 — E1 AI Session 搜索 + E2 键盘快捷键扩展 + E3 画布节点复制/粘贴
##### S46-P001-E1: AI Session 搜索 + 历史会话管理
- **E1 agentStore.ts**: add `searchableText` field, update `createSession()` to auto-generate searchable text
- **E1 AgentSessions.tsx**: add search input with `<mark>` highlight, filter sessions via `sessions.filter(s => s.searchableText.includes(query))`
- **E1 vitest**: `agentStore.test.ts` → 82/82 PASS

##### S46-P001-E2: 键盘快捷键扩展
- **E2 useKeyboardShortcuts.ts**: add `onSaveCanvas` callback (Cmd+S / Ctrl+S), `onOpenAIPanel` callback (Cmd+I / Ctrl+I)
- **E2 shortcutStore.ts**: add `console.warn` on duplicate shortcut key capture
- **E2 ShortcutPanel.tsx**: add Cmd+S + Cmd+I entries to shortcuts list
- **E2 i18n**: add 19 shortcut description keys to `shortcuts` namespace (en + zh)
- **E2 vitest**: `useKeyboardShortcuts.test.ts` → 82/82 PASS

##### S46-P001-E3: 画布节点复制/粘贴 (Cmd+C / Cmd+V)
- **E3 clipboardStore.ts**: new Zustand store at `@/stores/clipboardStore`, localStorage TTL 5 min, `copyCards()` deep clones cards, `pasteCards()` increments pasteCount
- **E3 DDSCanvasStore.ts**: add `copyCards` + `pasteCards` to `ddsChapterActions`; paste generates new IDs (via `generateId`), offsets position (+30px cascade), re-maps intra-clipboard edges
- **E3 useKeyboardShortcuts.ts**: add `onCopyNodes` + `onPasteNodes` callbacks; register Cmd+C / Cmd+V handlers
- **E3 DDSToolbar.tsx**: add Copy + Paste toolbar buttons; Paste opens chapter-selection modal dialog
- **E3 i18n**: add `toolbar.copy` + `toolbar.paste` keys to `toolbar` namespace (en + zh)
- **E3 vitest**: `clipboardStore.test.ts` → 11/11 PASS; `DDSCanvasStore.test.ts` → 57/57 PASS

### [Unreleased] Sprint 45 — E1 AI 断线重连 + E2 Presence 光标 + E3 画布 MiniMap + E4 模板版本管理 + E5 画布快照分享

##### S45-P001-E1: AI 断线重连 + 流式可靠性
- **E1 useStreamingAgent.ts**: add maxRetries param, exponential backoff (1s→2s→4s), retrying + lastError state ✅
- **E1 streamingChunkDB.ts**: IndexedDB persistence for SSE chunks (persistStreamingChunk, loadStreamingChunk, clearStreamingChunk) ✅
- **E1 useStreamingAgent.test.ts**: 9/9 vitest PASS (retry logic, backoff, abort, IndexedDB) ✅
- **E1 i18n**: add aiRetrying + aiStreamFailed keys to ai namespace ✅

##### S45-P002-E2: Presence 光标 WebSocket 迁移
- **E2 RemoteCursor.tsx**: migrate from Firebase Presence → Zustand usePresenceStore (WebSocket), remove usePresence + isFirebaseConfigured imports, add hashUserColor for cursor color, self-exclusion via remoteUsers Map, SVG cursor + name label ✅
- **E2 RemoteCursor.test.tsx**: 6 vitest tests (empty, single, multiple, self-exclusion, missing name fallback, position rendering) ✅
- **E2 presenceStore vitest**: 9/9 PASS (setRemoteUsers, updateCursor, removeUser, clearAll, lock/unlock) ✅
- **E2 IntentionBubble.tsx**: self-contained IntentionType re-export (removed Firebase dependency) ✅


##### S45-P003-E3: 画布 MiniMap + 视口导航
- **E3 DDSFlow.tsx**: import MiniMap, Controls, Background from @xyflow/react ✅
- **E3 MiniMapPanel.tsx**: collapsible panel (right side), 150×100px, dark theme, click-to-navigate via handleMiniMapClick + useReactFlow.project() ✅
- **E3 Background**: dots grid (BackgroundVariant.Dots, gap=24, size=1) ✅
- **E3 Controls**: commented (E5: mobile toolbar handles touch actions) ✅
- **E3 miniMapStore.ts**: viewport tracking, setViewport, navigateTo actions ✅
- **E3 miniMapStore vitest**: 5/5 PASS ✅
- **E3 DDSFlow.test.tsx**: 8 tests (Background/MiniMap/ReactFlow canvas) ✅

##### S45-P004-E4: 模板版本管理
- **E4 types.ts**: `RequirementTemplate` interface added `version?: number` field
- **E4 templateStore.ts**: `getTemplateVersion(id)`, `saveTemplateVersion(id, version)`, `getTemplateHistory(id)` store actions
- **E4 useTemplateManager.ts**: `createSnapshot(id)` / `getHistory(id)` / `deleteSnapshot(id, version)` — localStorage key `template:${id}:history`, MAX_SNAPSHOTS=10
- **E4 TemplateHistoryPanel.tsx**: collapsible panel, dark theme, restore/delete buttons, data-testid attributes
- **E4 useTemplateManager.test.ts**: 8/8 vitest PASS (import/createSnapshot/getHistory/deleteSnapshot) ✅

##### S45-P005-E5: 画布快照分享 + 公开只读链接
- **E5 0012_public_snapshot.sql**: `PublicSnapshot` D1 表 — id/canvasJSON/userId/createdAt，可公开读取
- **E5 POST /api/snapshot**: D1 INSERT，per-user 最多 10 条限制，auth 保护
- **E5 GET /api/snapshot/[id]**: D1 SELECT，公开无需 auth
- **E5 route.test.ts**: TypeScript 编译通过 ✅
- **E5 ShareButton.tsx**: 序列化画布 JSON → clipboard + toast 提示
- **E5 ShareButton.module.css**: 按钮样式（Share 图标 + 悬停效果）
- **E5 SnapshotCanvas.tsx**: nodesDraggable=false 只读模式，支持任意 canvas JSON
- **E5 /snapshot/[id] page.tsx**: 公开只读页面，useEffect 加载 + 错误处理
- **E5 share i18n namespace**: en.json + zh.json 新增 share 命名空间

### [Unreleased] Sprint 44 — E1 AI 多轮会话管理 + E2 画布模板分类 + E3 协作节点锁定 + E4 撤销历史面板 + E5 移动端触控

##### S44-P001-E1: AI 多轮会话管理
- **E1 agentDB.ts**: `src/lib/agentDB.ts` — IndexedDB persistence layer (initAgentDB, persistSession, loadSessionList, deleteSession) ✅
- **E1 agentStore.ts**: IndexedDB integration — auto-persist on add/update/delete, initAgentSessions() ✅
- **E1 AgentSessions.tsx**: double-click to rename session (inline edit → updateSession) ✅
- **E1 sessionNameInput CSS**: inline edit styling ✅
- **E1 CodingAgentService.ts**: add branchId + AgentBranch interface, createBranch(), getBranches() ✅
- **E1 useStreamingAgent.ts**: add onChunk callback for streaming progress ✅
- **E1 AgentFeedbackPanel.tsx**: show received char count during streaming ✅
- **E1 agentStore.test.ts**: 4 persistence tests (add/update/remove/initAgentSessions) ✅


##### S44-P002-E2: 画布模板分类 + 搜索 + 收藏
- **E2 RequirementTemplate.isFavorite**: `src/data/templates/types.ts` — 添加 isFavorite 字段 ✅
- **E2 Template.isFavorite**: `src/types/template.ts` — 添加 isFavorite 字段 ✅
- **E2 templateStore.ts**: 添加 favoriteTemplateIds 状态、toggleFavorite、inferCategory、isFavorite、getFavorites 方法 ✅
- **E2 filterTemplates favorites**: 支持 'favorites' 分类筛选 ✅
- **E2 TemplateGallery.tsx**: 添加"收藏"分类 Tab、Favorites Star 按钮、localStorage 持久化 ✅
- **E2 TemplateCard.tsx**: 添加 Star 按钮 (★/☆) + .favoriteBtn CSS ✅
- **E2 templateStore.test.ts**: 13/13 vitest 全部 PASS (favorites CRUD + inferCategory + filter) ✅

##### S44-P003-E3: 协作节点锁定 + 冲突解决 UI
- **E3 presenceStore.ts**: 添加 lockedNodes、lockNode、unlockNode、isLocked、handleNodeLocked/UnlockedMessage ✅
- **E3 presenceStore.test.ts**: 9/9 vitest 全部 PASS (5 new lock tests) ✅
- **E3 CardRenderer.tsx**: LockOverlay 组件 + locked/lockedBy props ✅
- **E3 DDSFlow.tsx**: 从 presenceStore 注入 locked/lockedBy 到 flowNodes，🔒 图标叠加层 ✅

##### S44-P004-E4: 撤销历史面板（选择性撤销）
- **E4 canvasHistoryStore.ts**: 添加 selectiveUndo(targetIndex) 和 getPosition() ✅
- **E4 HistoryPanel.tsx**: Ctrl+Z 打开侧边栏，显示历史命令列表，点击恢复到指定快照 ✅
- **E4 HistoryPanel.module.css**: 滑入动画、遮罩层、列表样式 ✅
- **E4 DDSCanvasPage.tsx**: undoCallback 改为打开 HistoryPanel 而非立即撤销 ✅
- **E4 canvasHistoryStore.test.ts**: 21/21 vitest 全部 PASS（6 个新测试） ✅
- **E4 HistoryPanel.test.tsx**: 9/9 vitest 全部 PASS ✅

##### S44-P005-E5: 移动端触控
- **E5 useTouchGestures.ts**: pinch-to-zoom (0.1–4×), two-finger pan, double-tap node select ✅
- **E5 DDSFlow.tsx 集成**: onTouchStart + onPointerDown wired to root element ✅
- **E5 Bug Fix**: two-finger pan sign bug (panX/panY), missing getZoom/getViewport ✅
- **E5 vitest**: `useTouchGestures.test.ts` — 14/14 PASS ✅

##### S44-P005-E5: 移动端触控支持
- **E5 useTouchGestures.ts**: pinch-to-zoom (0.1–4x), two-finger pan, double-tap node select hook ✅
- **E5 useTouchGestures.test.ts**: 14/14 vitest 全部 PASS ✅
- **E5 DDSFlow.tsx**: 集成 touchGestures，onTouchStart + onPointerDown 绑定到根元素 ✅

### [Unreleased] Sprint 43 — E1 Presence 集成收尾 + E2 SSE 流式 + E3 性能优化 + E4 导出 + E5 快捷键自定义

##### S43-P001-E1: Presence DDSCanvasPage 集成收尾
- **E1 DDSCanvasPage.tsx**: 集成 useWebSocketPresence，替换 Firebase usePresence ✅
- **E1 PresenceOverlay**: 替换 PresenceAvatars + RemoteCursor ✅
- **E1 cursorVisible**: userPreferencesStore.cursorVisible 联动 overlay 显示/隐藏 ✅
- **E1 vitest**: presenceStore 4/4 PASS ✅

##### S43-P002-E2: AI Agent 流式响应界面（SSE）
- **E2 POST /api/ai/generate**: `vibex-backend/src/app/api/ai/generate/route.ts` — SSE streaming ✅
- **E2 useStreamingAgent.ts**: `src/hooks/useStreamingAgent.ts` — SSE hook + AbortController ✅
- **E2 AgentFeedbackPanel**: 流式指示器（pulse dot）+ 取消按钮 + terminateSession ✅
- **E2 ai-streaming.spec.ts**: E2E 测试，SSE 端点契约验证 ✅

##### S43-P003-E3: Canvas 大型画布性能优化
- **E3 onlyRenderVisibleElements**: `src/components/dds/DDSFlow.tsx` — 视口裁剪，减少大型画布 DOM 节点 ✅
- **E3 viewportBoundsStore sync**: `DDSFlow.tsx` useOnViewportChange → `useViewportBoundsStore.updateViewportBounds(vp)` ✅
- **E3 viewportBounds.test.ts**: 7/7 PASS ✅
- **E3 viewportBounds.integration.test.ts**: 4/4 PASS ✅

##### S43-P002-E4: 画布导出（PNG/SVG/PDF）
- **E4 ExportMenu.tsx**: `src/components/dds/toolbar/ExportMenu.tsx` — JSON/Vibex/PDF/PNG/SVG 导出菜单 ✅
- **E4 useCanvasExport**: `src/hooks/canvas/useCanvasExport.ts` — html-to-image PNG/SVG 导出 ✅
- **E4 POST /api/export/pdf**: `src/app/api/export/pdf/route.ts` — jsPDF PDF 生成 ✅
- **E4 vitest**: `src/hooks/canvas/__tests__/useCanvasExport.test.ts` — validateFileSize 4/4 PASS ✅


##### S43-P002-E5: 快捷键自定义收尾
- **E5 ShortcutPanel i18n**: `src/components/canvas/features/ShortcutPanel.tsx` — useTranslations('shortcuts') 集成 ✅
- **E5 shortcuts namespace**: `src/i18n/messages/en.json` + `zh.json` — title/closeAria/footer keys ✅
- **E5 vitest**: `src/components/canvas/features/__tests__/ShortcutPanel.test.tsx` — 修复 duplicate description test, 9/9 PASS ✅

### [Unreleased] Sprint 42 — E1 撤销/重做验证 + E2 Presence光标 + E3 画布模板 + E4 设置验收 + E5 移动端触摸

##### S42-P001-E1: 撤销/重做系统验证（Sprint36 实现）
- **E1 canvasHistoryStore**: `src/stores/dds/canvasHistoryStore.ts` — Command Pattern undo/redo ✅
- **E1 DDSToolbar**: Undo/Redo buttons ✅
- **E1 vitest**: `src/stores/dds/__tests__/canvasHistoryStore.test.ts` — 15 tests ✅
- **E1 验证**: Sprint36 实现，Sprint42 验证通过 ✅

##### S42-P002-E2: Presence 光标同步 — WebSocket 迁移
- **E2 presenceStore.ts**: `src/lib/collaboration/presenceStore.ts` — Zustand store for remote users ✅
- **E2 useWebSocketPresence.ts**: `src/lib/collaboration/useWebSocketPresence.ts` — useCollaboration onPresence → store ✅
- **E2 PresenceOverlay.tsx**: `src/components/dds/presence/PresenceOverlay.tsx` — 画布绝对定位 overlay ✅
- **E2 vitest**: `src/lib/collaboration/__tests__/presenceStore.test.ts` — 4 tests PASS ✅
- **E2 待完成**: DDSCanvasPage 集成 + Firebase→WebSocket 替换 + Cloudflare DO relay 部署

##### S42-P002-E3: Canvas 模板系统
- **E3 templateStore.ts**: `src/lib/canvas/templateStore.ts` — IndexedDB CRUD + 预设模板种子 ✅
- **E3 TemplateGallery.tsx**: `src/components/dds/templates/TemplateGallery.tsx` — 卡片网格 + 分类 + 搜索 ✅
- **E3 TemplateSaveDialog.tsx**: `src/components/dds/templates/TemplateSaveDialog.tsx` — 保存当前画布为模板 ✅
- **E3 DDSToolbar 集成**: `src/components/dds/toolbar/DDSToolbar.tsx` — 模板 + 保存按钮 ✅
- **E3 i18n**: `src/i18n/messages/en.json` + `zh.json` — `templateGallery` + `saveTemplate` ✅
- **E3 vitest**: `src/lib/canvas/__tests__/templateStore.test.ts` — 10 tests PASS ✅
- **E3 预设模板**: blank + flowchart + four-quadrant + mindmap + swot ✅

##### S42-P001-E5: 移动端触控支持
- **E5 useTouchGestures.ts**: `src/hooks/useTouchGestures.ts` — Pinch-to-zoom (0.1–4×) + two-finger pan + double-tap node select ✅
- **E5 TouchModeIndicator.tsx**: `src/components/shared/TouchModeIndicator.tsx` — 触屏模式激活提示 ✅
- **E5 CSS**: `src/components/shared/TouchModeIndicator.module.css` — fade-in indicator styles ✅
- **E5 DDSFlow 集成**: `nodesDraggable={!touchMode}` + `nodesConnectable={!touchMode}` + `zoomOnPinch={touchMode}` + MiniMapPanel 触屏隐藏 ✅
- **E5 DDSCanvasPage 集成**: `ontouchstart` 触屏检测 + `useResponsiveMode` mobile/tablet 判断 + 传递给 DDSFlow ✅
- **E5 vitest**: `src/hooks/__tests__/useTouchGestures.test.ts` — 6 tests PASS ✅
- **E5 E2E**: `tests/e2e/mobile-touch.spec.ts` — 5 tests (pinch-zoom/pan/double-tap/indicator/minimap隐藏) ✅
- **E5 commit**: `b11c7df9e` feat(S42-P001-E5): 移动端触控支持

##### S42-P002-E4: 画布网格 + 协作光标设置
- **E4 userPreferencesStore**: `src/stores/userPreferencesStore.ts` — 新增 gridSpacing/gridVisible/cursorVisible 字段 + actions ✅
- **E4 settings page**: `src/app/settings/page.tsx` — Canvas Grid section (spacing 8/16/32px selector + gridVisible toggle) + Collaboration section (cursorVisible toggle) ✅
- **E4 CSS toggle**: `src/app/settings/settings.module.css` — toggleInput/toggleLabel styles ✅
- **E4 PresenceOverlay**: `src/components/dds/presence/PresenceOverlay.tsx` — cursorVisible gating (return null when cursorVisible=false) ✅
- **E4 vitest**: `src/stores/__tests__/userPreferencesStore.test.ts` — 12 tests PASS ✅

### [Unreleased] Sprint 41 — P001 i18n 验收 + P002 WebSocket 部署 + P003 MiniMap 验收 + P004 Canvas 持久化 + P005 快捷键

##### S41-P001-E1: i18n AI生成区最终验收
- **E1 i18n 验证**: `src/app/ai/page.tsx` + `AgentFeedbackPanel.tsx` + `AgentSessions.tsx` — TypeScript 编译通过，useTranslations('ai')() 全覆盖

##### S41-P002-E1: WebSocket 后端部署（E2-E3 合并）
- **E2 前端 ws**: `src/lib/collaboration/websocket.ts` — `wss://ws.vibex.top` 连接配置 ✅
- **E2 ws-health.ts**: `GET /api/v1/ws/health` — activeConnections/maxConnections/uptime ✅
- **E2 待完成**: Cloudflare 手动部署 — `wrangler secret put JWT_SECRET` + `wrangler deploy` + DNS

##### S41-P003-E1: MiniMap 导航完善验收
- **E3 MiniMapPanel**: `src/components/dds/MiniMapPanel.tsx` + `miniMapStore.ts` ✅
- **E3 E2E 测试**: `tests/e2e/minimap-panel.spec.ts` — 5 tests ✅
- **E3 验证**: MiniMap 代码完整，E2E spec 存在 ✅

##### S41-P004-E1: Canvas 持久化 + IndexedDB
- **E4 idb**: `package.json` — 添加 `idb ^8.0.1` 依赖 ✅
- **E4 persistence.ts**: `src/lib/canvas/persistence.ts` — IndexedDB 持久化层（persistCanvas, loadCanvas, hasCanvasSnapshot）✅
- **E4 DDSCanvasPage 集成**: `src/components/dds/DDSCanvasPage.tsx` — 挂载时从 IndexedDB 加载，debounced (1s) 持久化 ✅
- **E4 E2E 测试**: `tests/e2e/canvas-persistence.spec.ts` — 新增 IndexedDB persistence 测试用例 ✅

##### S41-P005-E1: 键盘快捷键系统
- **E5 useKeyboardShortcuts**: `src/hooks/useKeyboardShortcuts.ts` — 全局快捷键 hook，74 vitest tests ✅
- **E5 ShortcutManager**: `src/lib/keyboard/shortcutManager.ts` — mousetrap 全局冲突检测，25 vitest tests ✅
- **E5 KeyboardHelpOverlay**: `src/components/shared/KeyboardHelpOverlay.tsx` — `?` 键帮助面板 ✅
- **E5 DDSCanvasPage 集成**: useKeyboardShortcuts + KeyboardHelpOverlay 已集成 ✅
- **E5 快捷键**: Ctrl+K 搜索, +/- 缩放, Delete 删除, Ctrl+A 全选, N 新建, `?` 帮助 ✅

### [Unreleased] Sprint 40 — P001 AI Agent i18n 国际化

##### S40-P001-E1: AI Agent i18n 迁移收尾
- **E1 AgentFeedbackPanel i18n**: `src/components/agent/AgentFeedbackPanel.tsx` — 接受/拒绝按钮、状态标签、role label、空状态全部使用 `t()` 国际化
- **E1 AgentSessions i18n**: `src/components/agent/AgentSessions.tsx` — 6个会话状态 label、时间格式化、无会话提示全部使用 `t()` 国际化
- **E1 /ai 页面**: `src/app/ai/page.tsx` — 新建 AI 页面，双栏布局（AgentSessions sidebar + AgentFeedbackPanel main）
- **E1 i18n keys**: `src/i18n/messages/en.json` + `zh.json` 新增 54 个 ai namespace keys


---

## [Unreleased] S58-E1: 画布版本分支管理 — Snapshot 持久化
- **E1 Snapshot 接口**: `SnapshotData` / `Snapshot` / `SnapshotMeta` 类型定义，`canvasHistoryStore` 新增 snapshot state + actions
- **E1 IndexedDB 持久化**: `historyDB` DB_VERSION 升级至 2，`snapshots` objectStore (composite key: canvasId + snapshotId)
- **E1 HistoryPanel UI**: 历史记录/快照 双 Tab 设计，`SnapshotTab` 组件，支持保存/加载/删除/删除全部快照操作
- **E1 快照命名**: 保存快照时弹窗输入名称，默认 "快照 {YYYY-MM-DD HH:mm}"
- **E1 测试覆盖**: `canvasHistoryStore.test.ts` 新增 Snapshot + E3 Revision 测试
- **E1 实现文件**: `canvasHistoryStore.ts`, `historyDB.ts`, `HistoryPanel.tsx`, `HistoryPanel.module.css`


## [2026-05-31] - Sprint 46

### Added
- **P001-E1 (AI Session Search)**: `AgentSessions` search UI — SearchInput with real-time filter, match `<mark>` highlighting; `agentStore` searchableText built on add/update/addMessage; IndexedDB v2; `agentStore.test.ts` 5 new tests (14/14)

## [Unreleased] Sprint 40 — P002 WebSocket 后端 + 协作同步层

##### S40-P002-E1: WebSocket 后端部署 + 前端集成
- **E1 后端 WebSocket 服务**: `vibex-backend/src/services/websocket/` — ConnectionPool + MessageRouter
- **E1 wrangler.toml ws.vibex.top**: 添加 `ws.vibex.top/*` Cloudflare 域名路由
- **E1 前端 ws URL**: `src/lib/collaboration/websocket.ts` — `wss://ws.vibex.top` 连接配置
- **E1 待完成**: Cloudflare DNS `ws.vibex.top` A/CNAME 记录配置

## [Unreleased] Sprint 40 — P003 MiniMap 导航完善

##### S40-P003-E1: MiniMap 导航完善（Sprint39 遗留）
- **E1 MiniMapPanel**: `src/components/dds/MiniMapPanel.tsx` — 折叠式左侧面板（toggle按钮 + click-to-navigate + 视口边框矩形）
- **E1 MiniMapPanel CSS**: `MiniMapPanel.module.css` — slideIn动画、glassmorphism暗色主题
- **E1 miniMapStore**: `src/lib/canvas/stores/miniMapStore.ts` — panelOpen + viewport状态管理
- **E1 DDSCanvasPage集成**: `<MiniMapPanel />` 集成到画布页面（position:absolute浮动）
- **E1 E2E测试**: `tests/e2e/minimap-panel.spec.ts` — 5 tests，TypeScript clean ✅


## [Unreleased] Sprint 40 — P004 Canvas 持久化 + 导入导出

##### S40-P004-E1: Canvas 持久化 + 导入导出
- **E1 serialize.ts**: `src/lib/canvas/serialize.ts` — serializeCanvasToJSON/deserializeCanvasFromJSON，三树快照序列化，20 vitest tests ✅
- **E1 useCanvasExport**: `src/hooks/canvas/useCanvasExport.ts` — exportAsJSON/exportAsVibex (pako gzip压缩)，10 vitest tests ✅
- **E1 useCanvasImport**: `src/hooks/canvas/useCanvasImport.ts` — validateFile (10MB)/importFile (JSON解析/schemaVersion/forward-compat)，9 vitest tests ✅
- **E1 DDSToolbar 导出**: `src/components/dds/toolbar/DDSToolbar.tsx` — handleDDSExportJSON/handleDDSExportVibex ✅
- **E1 DDSToolbar 导入**: `handleDDSImport` + canvas-import-btn，CustomEvent('dds:import') 分发 ✅
- **E1 E2E测试**: `tests/e2e/canvas-persistence.spec.ts` — 10 tests，TypeScript clean ✅

## [Unreleased] S39-P005-E1: Service Worker 注册 + 静态资源缓存
- **E1 SWRegistration**: `src/components/sw/SWRegistration.tsx` — useEffect 中调用 navigator.serviceWorker.register("/sw.js")，带错误处理和 updatefound 事件监听
- **E1 layout.tsx 集成**: 在 layout.tsx body 中渲染 SWRegistration Client Component
- **E1 sw.js 验证**: public/sw.js 已存在（Workbox v1，Cache-First 静态资源 + networkFirst API）
- **E1 console.log('[SW] Registered')**: 浏览器 DevTools → Application → Service Workers 可见


## [Unreleased] Sprint 40 — P005 键盘快捷键系统完善

##### S40-P005-E1: 键盘快捷键系统完善
- **E1 ShortcutManager**: `src/lib/keyboard/shortcutManager.ts` — 全局键盘管理，mousetrap 集成，SYSTEM_RESERVED 注册表，pause/resume，per-shortcut bind/unbind ✅
- **E1 ShortcutManager 测试**: `src/lib/keyboard/__tests__/shortcutManager.test.ts` — 25 tests，all passing ✅
- **E1 全局冲突检测**: checkGlobalConflict() 检测浏览器保留快捷键，isReservedShortcut() + getReservedDescription() 辅助函数
- **E1 E2E 测试更新**: `tests/e2e/keyboard-shortcuts.spec.ts` — 新增 P005-E1 测试组（settings page/reset/conflict detection/smoke），TypeScript clean ✅
- **E1 mousetrap 依赖**: `package.json` — mousetrap@1.6.5 已安装 ✅

### [Unreleased] Sprint 40 — P001 AI Agent i18n 国际化

##### S40-P001-E1: AI Agent i18n 迁移收尾
- **E1 AgentFeedbackPanel i18n**: `src/components/agent/AgentFeedbackPanel.tsx` — 接受/拒绝按钮、状态标签、role label、空状态全部使用 `t()` 国际化
- **E1 AgentSessions i18n**: `src/components/agent/AgentSessions.tsx` — 6个会话状态 label、时间格式化、无会话提示全部使用 `t()` 国际化
- **E1 /ai 页面**: `src/app/ai/page.tsx` — 新建 AI 页面，双栏布局（AgentSessions sidebar + AgentFeedbackPanel main）
- **E1 i18n keys**: `src/i18n/messages/en.json` + `zh.json` 新增 54 个 ai namespace keys

## [Unreleased] S39-P002-E1: WebSocket 连接层 + useCollaboration Hook
- **E1 WebSocket 客户端**: `src/lib/collaboration/websocket.ts` — JWT token 注入（localStorage vibex-token）、自动重连（指数退避，最多 3 次）
- **E1 useCollaboration hook**: `src/lib/collaboration/useCollaboration.ts` — connect/disconnect/broadcast/subscribe，onlineUsers 状态
- **E1 useCanvasCollabBridge**: `src/lib/collaboration/canvasCollabBridge.ts` — DDSCanvasStore ↔ WebSocket 广播桥接，远程操作冲突检测
- **E1 单元测试**: `src/lib/collaboration/__tests__/useCollaboration.test.ts` — WebSocket 消息收发、远程操作、在线用户、冲突检测

### [Unreleased] Sprint 40 — P001 AI Agent i18n 国际化

##### S40-P001-E1: AI Agent i18n 迁移收尾
- **E1 AgentFeedbackPanel i18n**: `src/components/agent/AgentFeedbackPanel.tsx` — 接受/拒绝按钮、状态标签、role label、空状态全部使用 `t()` 国际化
- **E1 AgentSessions i18n**: `src/components/agent/AgentSessions.tsx` — 6个会话状态 label、时间格式化、无会话提示全部使用 `t()` 国际化
- **E1 /ai 页面**: `src/app/ai/page.tsx` — 新建 AI 页面，双栏布局（AgentSessions sidebar + AgentFeedbackPanel main）
- **E1 i18n keys**: `src/i18n/messages/en.json` + `zh.json` 新增 54 个 ai namespace keys

## [Unreleased] S39-P002-E2: Canvas 操作 OT 合并 + 冲突检测
- **E2 冲突检测 (5s窗口)**: `src/stores/oplogStore.ts` — addOplogEntry() 内嵌冲突检测，同节点ID在5秒内有写入则触发 conflictToastEmitter
- **E2 Toast UI**: conflictToastEmitter + useOplogConflictToast hook，已集成到 DDSToolbar + CanvasPage
- **E2 ConfirmationStore**: `src/stores/confirmationStore.ts` — conflictNodeIds（Record<string,number>，含过期时间戳）、conflictSnapshots（Record<string,OperationEntry[]>）
- **E2 冲突边框**: canvasCollabBridge.ts onConflict 回调调用 conflictToastEmitter.emit()，冲突节点 DDSCanvas 黄色边框由 confirmationStore 状态驱动

### [Unreleased] Sprint 40 — P001 AI Agent i18n 国际化

##### S40-P001-E1: AI Agent i18n 迁移收尾
- **E1 AgentFeedbackPanel i18n**: `src/components/agent/AgentFeedbackPanel.tsx` — 接受/拒绝按钮、状态标签、role label、空状态全部使用 `t()` 国际化
- **E1 AgentSessions i18n**: `src/components/agent/AgentSessions.tsx` — 6个会话状态 label、时间格式化、无会话提示全部使用 `t()` 国际化
- **E1 /ai 页面**: `src/app/ai/page.tsx` — 新建 AI 页面，双栏布局（AgentSessions sidebar + AgentFeedbackPanel main）
- **E1 i18n keys**: `src/i18n/messages/en.json` + `zh.json` 新增 54 个 ai namespace keys

## [Unreleased] S39-P002-E3: 用户在线状态 UI
- **E3 OnlineUsers 组件**: `src/components/dds/toolbar/OnlineUsers.tsx` — 头像堆叠展示，最多3个 + "+N" 溢出，支持 initials 回退
- **E3 DDSToolbar 集成**: DDSToolbar 右下角渲染 `<OnlineUsers users={onlineUsers} maxVisible={4} />`
- **E3 WebSocket Presence**: useCollaboration.ts 解析 `presence` WS 消息，setOnlineUsers() 更新在线用户列表
- **E3 OfflineIndicator**: `OfflineIndicator.tsx` — 连接断开时显示 🔴，已集成到 DDSToolbar
- **E2 Toast 增强**: `conflictToastEmitter.emit(nodeId, conflictingUserId)` 支持用户ID参数，Toast 显示"⚠️ 与用户X的修改冲突"
- **E3 WebSocket Close**: WS close 事件触发 setOnlineUsers([])，用户下线自动从列表移除

### [Unreleased] Sprint 40 — P001 AI Agent i18n 国际化

##### S40-P001-E1: AI Agent i18n 迁移收尾
- **E1 AgentFeedbackPanel i18n**: `src/components/agent/AgentFeedbackPanel.tsx` — 接受/拒绝按钮、状态标签、role label、空状态全部使用 `t()` 国际化
- **E1 AgentSessions i18n**: `src/components/agent/AgentSessions.tsx` — 6个会话状态 label、时间格式化、无会话提示全部使用 `t()` 国际化
- **E1 /ai 页面**: `src/app/ai/page.tsx` — 新建 AI 页面，双栏布局（AgentSessions sidebar + AgentFeedbackPanel main）
- **E1 i18n keys**: `src/i18n/messages/en.json` + `zh.json` 新增 54 个 ai namespace keys

## [Unreleased] S39-P005-E2: 语言包 Precache + API 降级离线
- **E2 sw.js precache**: `public/sw.js` PRECACHE_ASSETS 新增 `/i18n/messages/en.json` 和 `/i18n/messages/zh.json`，SW 激活时自动缓存语言包
- **E2 apiClient.ts**: `src/lib/api/apiClient.ts` — fetch 包装器，网络失败时回退 Cache.match()，Cache 命中返回 `{ offline: false, cached: true }`，完全离线返回 `{ offline: true }`
- **E2 apiClient.test.ts**: 3 个测试用例（网络成功/缓存回退/完全离线）
- **E2 uiStore isOffline**: `src/lib/canvas/stores/uiStore.ts` — 新增 `isOffline: boolean` 状态 + `setIsOffline()` + `window.addEventListener('online'/'offline')` 自动同步
- **E2 DDSToolbar 离线 Badge**: `DDSToolbar.tsx` — 集成 `useUIStore.isOffline`，网络断开时显示 📴


### [Unreleased] Sprint 40 — P001 AI Agent i18n 国际化

##### S40-P001-E1: AI Agent i18n 迁移收尾
- **E1 AgentFeedbackPanel i18n**: `src/components/agent/AgentFeedbackPanel.tsx` — 接受/拒绝按钮、状态标签、role label、空状态全部使用 `t()` 国际化
- **E1 AgentSessions i18n**: `src/components/agent/AgentSessions.tsx` — 6个会话状态 label、时间格式化、无会话提示全部使用 `t()` 国际化
- **E1 /ai 页面**: `src/app/ai/page.tsx` — 新建 AI 页面，双栏布局（AgentSessions sidebar + AgentFeedbackPanel main）
- **E1 i18n keys**: `src/i18n/messages/en.json` + `zh.json` 新增 54 个 ai namespace keys

## [Unreleased] S39-P005-E3: manifest.json + PWA 图标 + Lighthouse 优化
- **E3 manifest.json 验证**: public/manifest.json 已包含 name, short_name, start_url, display, icons (192x192 + 512x512)，无需修改
### [Unreleased] Sprint 40 — P001 AI Agent i18n 国际化

##### S40-P001-E1: AI Agent i18n 迁移收尾
- **E1 AgentFeedbackPanel i18n**: `src/components/agent/AgentFeedbackPanel.tsx` — 接受/拒绝按钮、状态标签、role label、空状态全部使用 `t()` 国际化
- **E1 AgentSessions i18n**: `src/components/agent/AgentSessions.tsx` — 6个会话状态 label、时间格式化、无会话提示全部使用 `t()` 国际化
- **E1 /ai 页面**: `src/app/ai/page.tsx` — 新建 AI 页面，双栏布局（AgentSessions sidebar + AgentFeedbackPanel main）
- **E1 i18n keys**: `src/i18n/messages/en.json` + `zh.json` 新增 54 个 ai namespace keys

## [Unreleased] S39-P004-E2: Canvas 节点点击 → 视口导航
- **E2 onNodeClick**: ReactFlow onNodeClick → reactFlow.setViewport() 300ms 动画居中

### [Unreleased] Sprint 40 — P001 AI Agent i18n 国际化

##### S40-P001-E1: AI Agent i18n 迁移收尾
- **E1 AgentFeedbackPanel i18n**: `src/components/agent/AgentFeedbackPanel.tsx` — 接受/拒绝按钮、状态标签、role label、空状态全部使用 `t()` 国际化
- **E1 AgentSessions i18n**: `src/components/agent/AgentSessions.tsx` — 6个会话状态 label、时间格式化、无会话提示全部使用 `t()` 国际化
- **E1 /ai 页面**: `src/app/ai/page.tsx` — 新建 AI 页面，双栏布局（AgentSessions sidebar + AgentFeedbackPanel main）
- **E1 i18n keys**: `src/i18n/messages/en.json` + `zh.json` 新增 54 个 ai namespace keys

## [Unreleased] S39-P004-E1: MiniMap 搜索 + 节点高亮 + 视口边框
- **E1 useMiniMapSearch hook**: `src/hooks/useMiniMapSearch.ts` — 搜索词、高亮节点集、搜索回调
- **E1 搜索输入框**: `src/app/domain/DomainPageContent.tsx` — 搜索节点...输入框，带清除按钮
- **E1 节点高亮**: MiniMap nodeColor 动态化，匹配节点返回红色高亮（#ef4444）
- **E1 视口边框**: MiniMapViewportBorder 组件，ViewportPortal + SVG rect 标注当前视口范围
---

---

## [Unreleased] S49-E4: 画布版本历史可视化 — 2026-06-01
- **S49-E4.1 snapshotHistoryStore**: `src/stores/dds/snapshotHistoryStore.ts` — debounce 2s auto-snapshot / MAX_SNAPSHOTS=20 / ai-generate + pre-export trigger / manual snapshot / restoreSnapshot / clearSnapshots
- **S49-E4.2 Timeline**: `src/components/dds/version-history/Timeline.tsx` — 水平滚动时间轴，颜色 badge（AI生成/导出前/手动），点击选中，下载 JSON / 删除
- **S49-E4.3 SnapshotDiff**: `src/components/dds/version-history/SnapshotDiff.tsx` — 双栏对比，节点/边 diff 高亮（added=绿/removed=红/unchanged=灰）
- **S49-E4.4 AIDraftDrawer 集成**: `handleAccept` 调用 `addAutoSnapshot('ai-generate')`，捕获接受前画布状态
- **S49-E4.5 DDSToolbar 集成**: `handleDDSExportJSON` + `handleDDSExportVibex` 调用 `addAutoSnapshot('pre-export')`
- **S49-E4.6 Vitest 覆盖**: `snapshotHistoryStore.test.ts` 19 tests（debounce/coalesce/overflow/manual/select/restore/delete/clear/flush）
- **S49-E4.7 stores/dds barrel export**: `index.ts` 导出 snapshotHistoryStore + types
- 提交: epic/s49-e4-version-history

## [Unreleased] S49-E1: AI 断线重连 + 流式可靠性增强 — 2026-06-01
- **S49-E1.1 60s 请求超时**: `useStreamingAgent` 新增 `requestTimeout`(60000ms) 参数; `setTimeout` + `AbortController.abort()` 实现; 超时触发 `retryStatus='timeout'`
- **S49-E1.2 可配置退避参数**: `retryBaseDelay`(1000ms)/`retryMaxDelay`(8000ms) 替换硬编码值; 公式: `delay = min(retryBaseDelay * 2^attempt, retryMaxDelay) + jitter(0-500ms)`
- **S49-E1.3 retryStatus 状态机**: `useStreamingAgent` 新增 `retryStatus: 'idle' | 'retrying' | 'timeout' | 'success'`; `retrying` 时 UI 显示"正在重连 (N/M)" + 脉冲动画
- **S49-E1.4 ConnectionStatus 组件**: `src/components/ui/ConnectionStatus.tsx` + `ConnectionStatus.module.css`; warning/error/success 三色 badge + 脉冲 dot
- **S49-E1.5 Vitest 覆盖**: 5 个新测试用例 (retryStatus 四态 + 可配置延迟 + 超时); `useStreamingAgent.test.ts` 共 15 个测试
- 提交: epic/s49-e1-ai-retry

---

## [Unreleased] S49-E2: 画布模板管理完善 — 2026-06-01
- **S49-E2.1 模板搜索**: `stores/templateStore.ts` 新增 `searchTemplates(query)` 方法；`TemplateSearchBar.tsx` + `TemplateSearchBar.module.css` 组件（debounce 300ms）
- **S49-E2.2 分类筛选**: `filterByCategory(category)` 方法；`CategoryFilter.tsx` + `CategoryFilter.module.css` 组件（8个分类按钮：全部/空白/SaaS/电商/金融/企业/内容/教育）
- **S49-E2.3 重命名模板**: `renameTemplate(id, newName)` 更新模板 name + displayName，同步刷新 filteredTemplates
- **S49-E2.4 缩略图缓存**: `thumbnailCache` Zustand 状态 + `setThumbnail`/`getThumbnail`/`captureThumbnail`；`TemplateThumbnail.tsx` + `TemplateThumbnail.module.css` 渲染组件
- **S49-E2.5 TemplateSaveDialog 编辑模式**: `editTemplate` prop 支持编辑现有模板名称，调用 `renameTemplate`；保存按钮变为"确认修改"
- **S49-E2.6 Vitest 覆盖**: `stores/templateStore.test.ts` 新增 16 个测试（searchTemplates ×4 / filterByCategory ×2 / renameTemplate ×3 / thumbnailCache ×4）；总计 30 个测试
- 提交: epic/s49-e2-template-mgmt


---

## [Unreleased] S49-E3: 大型画布性能优化 v2 — 2026-06-01
- **S49-E3.1**: viewportBoundsStore 防抖更新 (50ms debounce) + flushViewportBounds 立即生效
- **S49-E3.2**: viewportBoundsStore nodeExtent 配置 (±50,000) + setNodeExtent
- **S49-E3.3**: DDSFlow 注入 nodeExtent prop
- **S49-E3.4**: Vitest 覆盖 (15/15 pass)

---

## [Unreleased] S50-E3: 评论实时通知 — 2026-06-02
- **S50-E3.1**: commentStore 计数器式 unreadCount + addListener/removeListener API
- **S50-E3.2**: wsCommentHandler 处理 comment:created/resolved WS 消息
- **S50-E3.3**: CommentBadge 全局未读角标样式

---

## [Unreleased] S50-E4: 模板导入/导出管理 — 2026-06-02
- **E4 templateExport.ts**: `exportTemplatesToBlob()` + `downloadTemplatesAsFile()` — Blob download as .vbtmpl
- **E4 templateImport.ts**: `parseImportFile()` + `mergeTemplates()` — JSON parse + schema validation + conflict detection
- **E4 TemplateImportDialog.tsx**: Import dialog with conflict resolution (skip/overwrite/rename)
- **E4 templateStore.ts**: `exportTemplates()` + `importTemplates()` actions — version 1.0 format
- **E4 TemplateGallery.tsx**: ⬇️ Export / ⬆️ Import buttons in header
- **E4 vitest**: templateExport.test.ts + templateImport.test.ts + templateStore E4 tests


## [Unreleased] S50-E1: 画布全局搜索 — 2026-06-02
- **S50-E1.1 canvasSearchStore**: `stores/dds/canvasSearchStore.ts` — keywordIndex Map + Fuse.js 搜索
- **S50-E1.2 fullTextSearch.ts**: `lib/canvas/fullTextSearch.ts` — Map 查询（不 DB scan），按 score + updatedAt 排序
- **S50-E1.3 useSearchIndex hook**: `hooks/dds/useSearchIndex.ts` — 画布打开时触发 buildIndex
- **S50-E1.4 SearchPanel.tsx**: `components/dds/SearchPanel.tsx` — Cmd+K 激活浮层，搜索结果列表
- **S50-E1.5 DDSCanvasPage.tsx 集成**: SearchPanel + useSearchIndex 挂载
- **S50-E1.6 Vitest**: `canvasSearchStore.test.ts` (13 cases) + `fullTextSearch.test.ts` (8 cases)
- 提交: epic/s50-e1-canvas-search

---

## [Unreleased] S50-E2: 画布节点自动布局 (Dagre) — 2026-06-02
- **S50-E2.1 dagreLayout.ts**: `lib/canvas/dagreLayout.ts` — Dagre TB/LR 层级布局，`computeDagreLayout`/`cardsToFlow`/`applyPositionsToCards`
- **S50-E2.2 autoLayoutStore.ts**: `stores/dds/autoLayoutStore.ts` — Zustand store，`isLayouting`/`fitViewRequested`/`lastLayoutDirection`
- **S50-E2.3 useAutoLayout hook**: `hooks/dds/useAutoLayout.ts` — `applyAutoLayout` 整合布局计算 + 状态更新 + fitView
- **S50-E2.4 Cmd+L 快捷键**: `useKeyboardShortcuts` 新增 `onAutoLayout`；`DDSCanvasPage` 接入
- **S50-E2.5 DDSToolbar 按钮**: `components/dds/toolbar/DDSToolbar.tsx` — LayoutIcon SVG + 自动布局按钮
- **S50-E2.6 Vitest 覆盖**: `lib/canvas/dagreLayout.test.ts` (7 cases) + `stores/dds/autoLayoutStore.test.ts` (8 cases)
- 提交: epic/s50-e2-canvas-auto-layout

---

## [Unreleased] S51-E1: Undo/Redo 持久化 — 2026-06-02
- **S51-E1.1**: 新增 `src/lib/canvas/historyDB.ts` — IndexedDB 持久化层，LIRS 驱逐策略
- **S51-E1.2**: `canvasHistoryStore` 新增 IndexedDB persistence actions
- **S51-E1.3**: 新增 `src/hooks/dds/useHistoryPersistence.ts` — 500ms 防抖自动保存
- **S51-E1.4**: 新增 3 个测试文件 (31 tests)

---

## [Unreleased] S51-E2: PNG 批量导出 — 2026-06-01
- **S51-E2.1 exportMultipleAsPNG.ts**: `lib/canvas/exportMultipleAsPNG.ts` — 批量 PNG 导出，html-to-image + JSZip，ReactFlow data-id selector
- **S51-E2.2 useBatchExport hook**: `hooks/useBatchExport.ts` — 状态管理 hook，idle/collecting/exporting/done/cancelled/error，支持 AbortController
- **S51-E2.3 ExportProgress.tsx**: `components/dds/export/ExportProgress.tsx` — 玻璃态进度 UI，进度条 + X/Y + 节点名
- **S51-E2.4 ExportProgress.module.css**: `components/dds/export/ExportProgress.module.css` — CSS Module，design-tokens
- **S51-E2.5 Vitest 覆盖**: 7/7 通过
- 提交: epic/s51-e2-png-batch-export


---

## [Unreleased] S51-E3: MiniMap 节点类型着色 — 2026-06-04
- **E3 miniMapUtils.ts**: `src/lib/canvas/miniMapUtils.ts` — `getMiniMapNodeColor()` (user-story蓝/bounded-context紫/flow-step绿红灰) + `sampleNodesForMiniMap()` (100+节点分层采样)
- **E3 MiniMapPanel.tsx**: `nodeColor={getMiniMapNodeColor}` 替换硬编码蓝色，支持节点类型着色
- **E3 vitest**: `src/lib/canvas/__tests__/miniMapUtils.test.ts` — 18 cases (着色13/采样4/常量1) ✅ 18/18 PASS
- 提交: epic/s51-e3-minimap

---

## [Unreleased] S51-E4: 多选批量操作 — 2026-06-02
- **E4 useSelectionBox**: `hooks/dds/useSelectionBox.ts` — drag-to-select 框选 hook，[data-card] selector，鼠标拖拽生成选区
- **E4 SelectionToolbar**: `components/dds/SelectionToolbar.tsx` — 浮动 Toolbar（左/右/水平居中/垂直居中对齐 + 复制 + 删除），选中 2+ 卡片时显示
- **E4 useAlignmentTools**: `hooks/dds/useAlignmentTools.ts` — 纯对齐工具函数（alignCardsLeft/Right/centerH/centerV）
- **E4 DDSCanvasPage 集成**: SelectionToolbar + useSelectionBox 接入画布页面
- **E4 Vitest**: useSelectionBox 3 cases + useAlignmentTools 10 cases，13/13 PASS ✅
- 提交: epic/s51-e4-multi-select

---

## [Unreleased] S51-E5: @Mention 通知系统 — 2026-06-02
- **S51-E5.1**: `parseMentions.ts` — @提及正则解析 (中英文用户名, /@[\w\u4e00-\u9fa5]+/)
- **S51-E5.2**: `mentionsStore.ts` — Zustand store (mentions[], unreadCount, event listeners)
- **S51-E5.3**: `useMentionCompletion.ts` — React Hook (↑↓ Enter Esc 键盘导航, 补全下拉)
- **S51-E5.4**: `CommentPanel.tsx` — 集成 @ 补全 (dropdown UI, textarea ref, 键盘代理)
- **S51-E5.5**: `CommentPanel.module.css` — mentionDropdown 样式
- **S51-E5.6**: `wsCommentHandler.ts` — comment:mention 类型 → mentionsStore 写入 + 未读计数
- **Tests**: parseMentions 9 tests, mentionsStore 7 tests, vitest 21/21 ✅


---

## [Unreleased] S52-E2: 批量导出 PNG/SVG/PDF — 2026-06-02
- **S52-E2.1**: `exportMultipleAsSVG.ts` — SVG 格式批量导出 (toSvg + JSZip, AbortController, 正确 `data-card` selector)
- **S52-E2.2**: `exportMultipleAsPDF.ts` — PDF 格式批量导出 (toPng + jsPDF, pixelRatio=2, AbortController)
- **S52-E2.3**: `useBatchExport.ts` — 添加 exportAsPdfZip(), BatchExportFormat union type, format 参数注入
- **S52-E2.4**: `ExportProgress.tsx` — format 下拉框 (SVG/ZIP/PNG/PDF) + 格式感知标题 + 进度百分比
- **S52-E2.5**: `ZipExporter.ts` — 添加 'pdf' 格式分支 + captureNodeAsPdf() (html-to-image → jsPDF)
- **Tests**: exportMultipleAsSVG 5 cases + exportMultipleAsPDF 5 cases，vitest 10/10 ✅

## [Unreleased] S52-E1: 画布协作实时感知 — 2026-06-02
- **S52-E1.1**: `presenceStore.test.ts` 10个测试用例 — setRemoteUsers replace/update/remove semantics, cursor update, node locking, WebSocket message handlers
- **S52-E1.2**: 复用 S42/S44 WebSocket presence 实现，新增 10 个 vitest cases 覆盖协作感知边界条件


---

## [Unreleased] S52-E3: Undo/Redo 协作冲突处理 — 2026-06-02

- **S52-E3.1**: `baseRevision` 字段 → 每次 execute() 时 bump；远程 `revision:bump` 时 `setBaseRevision()` 同步
- **S52-E3.2**: `RevisionMismatchError` → IndexedDB revision 与预期不符时抛出
- **S52-E3.3**: `onRevisionConflict` 回调 → 冲突时允许 UI 自定义处理（discard-local/merge/discard-remote）
- **S52-E3.4**: `triggerConflictToast()` → 协作冲突时显示 Toast 警告
- **S52-E3.5**: `saveHistoryWithRevision()` / `loadHistoryWithRevision()` / `getRevision()` → IndexedDB revision 乐观锁
- **S52-E3.6**: `wsRevisionHandler` → WebSocket `revision:bump` / `revision:conflict` 消息处理
- **Test**: 44/44 vitest (15 new E3 revision tests)



---

## [Unreleased] S52-E4: 模板分类/标签管理 — 2026-06-02

- **S52-E4.1**: `CanvasTemplateData.category` 字段 → `'flowchart' | 'mindmap' | 'uml' | 'other' | null`
- **S52-E4.2**: `CategoryTab.tsx` → 水平分类标签栏（Fuse.js图标 + 颜色映射）
- **S52-E4.3**: `TemplateEditDialog.tsx` → 编辑分类下拉框 + 标签 chip 输入框
- **S52-E4.4**: `templateSearch.ts` → Fuse.js 模糊搜索（threshold=0.3, name/description/tags）
- **S52-E4.5**: `lib/canvas/templateStore.ts` → `setTemplateCategory/addTemplateTag/removeTemplateTag`
- **S52-E4.6**: `src/stores/templateStore.ts` → Zustand store actions for category/tag
- **S52-E4.7**: `TemplateGallery.tsx` → CategoryTab 集成 + Fuse 搜索过滤
- **Test**: 14/14 vitest (4 templateSearch + 10 templateStore)

---

## [Unreleased] S52-E5: 键盘快捷键可配置化 — 2026-06-02

- **S52-E5.1**: `useKeyboardShortcuts.ts` → 重构为 store-driven 快捷键分发（替换20+硬编码）
- **S52-E5.2**: `ShortcutSettingsPanel.tsx` → 分类分组快捷键表格 + conflict warning
- **S52-E5.3**: `ShortcutKeyInput.tsx` → 键盘捕获 input + conflict 提示
- **S52-E5.4**: `shortcutStore.test.ts` → 9 vitest (conflict detection, reset, save)
- **S52-E5.5**: `DDSToolbar.tsx` → 键盘图标按钮 + ShortcutSettingsPanel modal
- **Test**: 9/9 vitest



---

## [Unreleased] S53-E1: 协作实时 Presence UI — 2026-06-02
- **S53-E1.1**: `PresenceIndicator.tsx` — 在线协作者展示组件，avatar stack + 在线计数
- **S53-E1.2**: `usePresence.ts` — WebSocket presence:join/leave/ping 消息订阅 hook
- **S53-E1.3**: `presenceSync.ts` — 30s 超时自动移除用户逻辑
- **S53-E1.4**: `DDSCanvasPage.tsx` 集成 PresenceIndicator (右上角 absolute 定位)
- **S53-E1.5**: vitest `PresenceIndicator.test.tsx` 11/11 ✅

---

## [Unreleased] S53-E2: Undo/Redo 协作冲突处理 — 2026-06-02
- **冲突通知**: `wsCommentHandler` 新增 `revision:bump` / `revision:conflict` WebSocket 消息处理
- **Revision 同步**: `setBaseRevision()` 接收远端 revision bump，更新 canvasHistoryStore baseRevision
- **冲突对话框**: 新增 `ConflictDialog` 组件，三选项 (Discard Local / Merge / Discard Remote)
- **可测试化**: `wsRevisionHandler` 重构为 store 注入模式，无须 mock 动态导入
- **Bug 修复**: `wsCommentHandler comment:mention` case 添加缺失 `async` 关键字
- 文件: `wsCommentHandler.ts`, `wsRevisionHandler.ts`, `ConflictDialog.tsx`, `ConflictDialog.module.css`, `wsRevisionHandler.test.ts`

---

## [Unreleased] S58-E4: Canvas 分享权限选择 — 2026-06-03
- **S58-E4.1**: `shareUtils.ts` — 新增 `generateShareToken()`、`checkSharePermission()`、`buildShareUrl()`、`parseShareTokenFromUrl()` 函数
- **S58-E4.2**: `ShareDialog.tsx` — 重写为 E4 分享对话框，含权限下拉选择（仅查看 / 可编辑 / 关闭分享）
- **S58-E4.3**: `ShareDialog.module.css` — 新增 `.permissionRow`、`.permissionSelect`、`.disabledHint` 等样式
- **S58-E4.4**: `zh.json` / `en.json` — 新增 12 个分享权限相关 i18n key（permission、viewerOnly、editorAccess 等）
- **S58-E4.5**: `shareUtils.test.ts` — 46 个 vitest 测试全部通过（含新函数 generateShareToken、checkSharePermission、buildShareUrl、parseShareTokenFromUrl）
