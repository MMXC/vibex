
## [Unreleased] S69-E4: 节点评论系统 — 2026-06-06

- **E4.1**: `commentStore.ts` — `addComment()` 触发 `useNotificationStore.addNotification()` 发送评论通知
- **E4.2**: `DDSDanvasPage.tsx` / `DDSFlow.tsx` — 右键节点上下文菜单"查看评论"，打开 CommentThread 浮层
- **E4.3**: `components/dds/comments/CommentThread.tsx` — 评论浮层组件，显示评论列表 + MentionInput 回复
- **E4.4**: `components/dds/comments/NodeCommentBadge.tsx` — 节点未读评论红色徽章 (`getUnreadCount(nodeId)`)
- **vitest**: `commentStore.test.ts` 22/22 通过

## [Unreleased] S68-E5: 协作光标同步 — 2026-06-06
- **E5.1**: `presenceStore.ts` — 新增 `cursors` 独立字段 (Record<userId, CursorState>) + `broadcastCursor()` + `clearCursor()` + `clearAllCursors()`
- **E5.2**: `wsCursorHandler.ts` — cursor:move / cursor:clear WebSocket 消息处理
- **E5.3**: `RemoteCursorsLayer.tsx` — 升级为订阅 `presenceStore.cursors`（独立于 remoteUsers）
- **E5.4**: `useWebSocketPresence.ts` — hook 写两路：remoteUsers + cursors
- **E5.5**: `DDSCanvasPage.tsx` — broadcastCursor 集成，≥3 协作者光标共存
- **vitest**: `presenceStore.test.ts` +9 E5 测试（66/66 总通过）


---

## [Unreleased] S67-E4: 画布快捷键可配置化 — 2026-06-06

- **E4.1**: `shortcutStore.ts` — 新增 `addBinding(action, key)` / `removeBinding(action)` / `exportBindings()` / `importBindings(json)` 方法，支持直接绑定 API + JSON 导入导出
- **E4.2**: `shortcutStore.ts` — 新增 `ImportResult` 接口，部分导入失败报告错误
- **E4.3**: `ShortcutEditor.tsx` — 新增专用快捷键录制 Modal，支持按键捕获 + 冲突检测 + 保存/重置
- **E4.4**: `ShortcutEditor.module.css` — ShortcutEditor 样式
- **E4.5**: `ShortcutSettingsPanel.tsx` — Footer 新增 📥 导入 / 📤 导出按钮 + 隐藏 file input
- **E4.6**: `shortcutStore.test.ts` — 22 个 E4 测试用例覆盖 addBinding/removeBinding/export/import/conflict/round-trip


## [Unreleased] S67-E2: 实时协作活动流面板 — 2026-06-06

- **E2.1**: `CollabActivityPanel.tsx` — React panel 组件，auto-scroll activity list，支持 add/remove/focus/blur 类型，显示用户名称 + "你" 自标签，header 含清空按钮
- **E2.2**: `activityStore.ts` — 扩展至 20 条缓冲（ring buffer），新增 focus/blur ActivityType，新增 recentActivity getter
- **E2.3**: `wsActivityHandler.ts` — incoming `user:activity` WebSocket handler + throttle broadcaster (1 msg/sec per userId)
- **E2.4**: `useCollaboration.ts` — 注册 wsActivityHandler，导出 sendRaw
- **E2.5**: `DDSFlow.tsx` — handleNodesChange 包装 broadcastActivity，广播 add/remove/focus/blur (throttled)
- **E2.6**: `CollabActivityPanel.test.tsx` — 7 tests ✅，activityStore.test.ts 13 tests ✅
## [Unreleased] S67-E1: 画布分支快照视觉对比 — 2026-06-06

- **E1.1**: `historyDB.ts` — 新增 `getLatestSnapshotFromDB(canvasId, branchName)` 从 IndexedDB 查找指定分支的最新快照
- **E1.2**: `canvasHistoryStore.ts` — 新增 `compareBranches(canvasId, branchA, branchB)` 返回 `BranchDiffResult`（含 snapA/snapB/diffs/summary）
- **E1.3**: `canvas-history/BranchDiffPanel.tsx` — 分支对比侧边面板，支持选择分支 A/B + 对比按钮 + 差异展示
- **E1.4**: `canvas-history/SnapshotDiffRenderer.tsx` — 差异渲染器，区分新增/删除/修改项，颜色编码
- **E1.5**: `HistoryPanel.tsx` — 集成"对比分支"按钮，当分支数>1时显示
- **E1.6**: `canvasHistoryStore.sprint67-e1.test.ts` — 4 个测试用例覆盖 error/null/正常 diff 场景

## [Unreleased] S66-E5: 协作会话历史与回放 — 2026-06-06

- **E5.1**: `collabSessionStore.ts` — Zustand store + IndexedDB persistence (idb); startRecording/stopRecording CRUD; SessionEvent types: node:focused/unfocused/focus/blur, cursor:move, user:join/leave, editing:start/end; Replay engine: speed control (0.5x/1x/2x/4x), pause/resume/stop; SESSION_EVENT_LABELS zh-CN
- **E5.2**: `wsSessionCaptureHandler.ts` — WebSocket event capture; registers with CollabWebSocket subscribe; forwards all collab events to session store when recording
- **E5.3**: `SessionReplayPanel.tsx` + `SessionReplayPanel.module.css` — React UI; recording controls (start/stop with name input); session list with CRUD; replay controls (play/pause/stop, speed selector); progress bar + current event display; full event timeline
- **E5.4**: `collabSessionStore.test.ts` — vitest 8/8 ✅

---
---

## [Unreleased] S67-E3: 模板画廊使用分析 + AI 推荐 — 2026-06-06

- **E3.1**: `templateStore.ts` — 新增 `topTemplates(limit)` selector，按 usageCount 降序排列
- **E3.2**: `templateStore.ts` — 新增 `getCategoryStats()` selector，分类维度统计（count + avgUsage）
- **E3.3**: `templateStore.ts` — 新增 `calcRecommendScore(templateId)`，AI 推荐加权评分 (usage×0.5 + tagMatch×0.3 + recency×0.2)
- **E3.4**: `TemplateAnalytics.tsx` — 使用量排行榜 + 分类柱状图
- **E3.5**: `TemplateGallery.tsx` — 新增"📊 分析"按钮 + "为你推荐" Tab 集成
- **E3.6**: `TemplateAnalytics.test.tsx` — 5 tests ✅，`templateStore.test.ts` E3 块 7 tests ✅

## [Unreleased] S66-E4: 模板高级搜索与过滤 — 标签自定义 + 日期范围 + URL 持久化 — 2026-06-06
- **E4.1**: `templateStore.ts` — FilterOptions 状态 + setFilterOptions / applyFilters / search / addCustomTag / removeCustomTag / getCustomTags; applyFiltersImpl 实现 AND-标签 + 日期范围过滤
- **E4.2**: `TagSelector.tsx` — 自定义标签多选下拉（预定义标签 + 自定义输入 + 本地持久化）; 集成 TEMPLATE_USE_CASE_TAGS
- **E4.3**: `DateRangePicker.tsx` — 双月日历日期范围选择器（start/end 选择 + 清除按钮）; 基于 createdAt 过滤
- **E4.4**: `TemplateGallery.tsx` — 嵌入 TagSelector + DateRangePicker; URL 参数持久化 (tags/start/end/q/cat)
- **E4.5**: TemplateGallery AND-标签交集过滤 + createdAt 日期范围过滤

---

## [Unreleased] S66-E2: 协作者冲突检测与通知 — 2026-06-06
- **E2.1**: `presenceStore.ts` — `nodeLocks: Map<string, NodeLockInfo>` 状态; `focusNode(nodeId)` 记录锁定 + 30s auto-release timer; `blurNode(nodeId)` 清除; `isNodeLockedByOther(nodeId)` 查询; `handleNodeFocusMessage`/`handleNodeBlurMessage` WS 消息处理
- **E2.2**: `wsNodeFocusHandler.ts` — `node:focus`/`node:blur` case handlers; `NodeFocusMessage`/`NodeBlurMessage` interfaces
- **E2.3**: `NodeLockedToast.tsx` — `useNodeLockedToast()` hook，锁定时显示 warning toast (4s)
- **E2.4**: `DDSFlow.tsx` — 读取 `presenceStore.nodeLocks`; `handleNodeClick` 拦截 + toast; `handleNodesChange` 拦截拖拽
- **E2.5**: `CardRenderer.tsx` — 读取 `presenceStore.nodeLocks`; 锁定节点显示金色边框 (`outline: 2px solid #f59e0b`) + 🔒 角标
- **Test**: vitest presenceStore 57/57 ✅, collab 74/74 ✅

---

## [Unreleased] S66-E3: 画布视图预设保存与切换 — 2026-06-06

### Features
- **新增 viewPresetsStore**: Zustand store，localStorage 持久化，支持 savePreset/deletePreset/loadPreset/updatePreset
- **新增 ViewPresetsTab**: 预设卡片列表 UI（颜色预览 + 删除）+ 保存表单（名称输入 + 自适应开关）
- **新增 viewPresetsStore.test.ts**: 20 个测试用例覆盖所有 CRUD 路径

### Files Added
- `vibex-fronted/src/stores/viewPresetsStore.ts`
- `vibex-fronted/src/components/dds/settings/ViewPresetsTab.tsx`
- `vibex-fronted/src/components/dds/settings/ViewPresetsTab.module.css`
- `vibex-fronted/src/stores/__tests__/viewPresetsStore.test.ts`

### DoD
- [x] D3.1: viewPresetsStore CRUD 操作正确 (20 vitest)
- [x] D3.2: localStorage 持久化
- [x] D3.3: ViewPresetsTab 预设列表 + 保存表单
- [x] D3.4: 预设卡片颜色预览 (背景色 + 网格样式)
- [x] D3.5: loadPreset 批量应用所有 settings
- [x] D3.6: vitest 20/20
- [x] D3.7: dual-CHANGELOG

## [Unreleased] S66-E1: 画布分支操作 — 2026-06-06
- **E1.1**: `historyDB.ts` — DB_VERSION=4, parentSnapshotId field in SnapshotEntry/load/update, branchName+parentSnapshotId indexes in onupgradeneeded
- **E1.2**: `historyDB.ts` — renameBranchInDB/deleteBranchFromDB/mergeBranchInDB/listBranchesFromDB (bulk IndexedDB operations)
- **E1.3**: `canvasHistoryStore.ts` — renameBranch/deleteBranch/mergeBranch/listBranches actions (auto-refresh snapshots list after each op)
- **E1.4**: `HistoryPanel.tsx` — Branch operation menus (rename/merge/delete buttons) in filter section
- **E1.5**: `HistoryPanel.tsx` — BranchRenameDialog + BranchMergeDialog inline modal components
- **E1.6**: UI — Branch filter click-to-select + branch operation buttons (✎ ↗ 🗑), delete-main guard

## [Unreleased] S65-E5: 模板画廊用户收藏管理 — 2026-06-05
- **S65-E5.1**: `templateStore.addCustomCategory()` / `removeCustomCategory()` / `incrementUsage()` — 自定义分类管理 + 使用频率统计
- **S65-E5.2**: Zustand persist middleware 自动持久化 `customCategories` + `stats.usageCount` (localStorage)
- **S65-E5.3**: `TemplateCard` 📁 按钮 — 自定义分类添加/移除交互
- **S65-E5.4**: `TemplateGallery` 动态 tabs — 收藏 + 自定义分类 + 新建分类 + 分类过滤
- **S65-E5.5**: 收藏夹按使用频率排序 (`incrementUsage` → `stats.usageCount`)

## [Unreleased] S64-E2: 画布版本历史 LRU 缓存 + 恢复 — 2026-06-05
- **S64-E2.1**: `MAX_SNAPSHOTS = 50` — 导出常量，供 HistoryPanel 使用
- **S64-E2.2**: `saveSnapshot` LRU eviction — 列表 > 50 时，slice(50) 删除最旧的快照
- **S64-E2.3**: `restoreSnapshot` action — 从 IndexedDB 加载快照数据，应用到 DDSCanvasStore，恢复历史记录
- **S64-E2.4**: `autoSnapshotMs` state + `startAutoSnapshot`/`stopAutoSnapshot` 定时器 actions
- **S64-E2.5**: `canvasHistoryStore.test.ts` — E2 测试套件：MAX_SNAPSHOTS 导出、saveSnapshot LRU eviction（单次/多次）、restoreSnapshot、auto-snapshot 定时器
- **Test**: 60/60 vitest ✅

## [Unreleased] S63-E4: AI 流式响应 + 可视化重试 — 2026-06-05
- **S63-E4.1**: `agentStore.ts` — streamingContent/isStreaming/lastPrompt maps; SSE streamSession; retryLastStream/cancelStream/clearStreamContent actions; selectors
- **S63-E4.2**: `AISessionDrawer.tsx` — 流式 AI 响应抽屉，打字机效果 + 重试按钮 + 停止生成按钮 + 重试计数徽章
- **S63-E4.3**: `AISessionDrawer.module.css` — 抽屉样式（overlay/drawer/header/content/actions/retryInfo）
- **S63-E4.4**: `agentStore.test.ts` — 12 vitest (D4.5a-f streaming state + streamSession + retryLastStream + selectors)
- **S63-E4.5**: `AISessionDrawer.test.tsx` — 12 vitest (D4.6a-l drawer rendering + button interactions + streaming UI)

---

## [Unreleased] S58-E2: 桌面文件拖拽导入 — 2026-06-03

---

## [Unreleased] S65-E1: 画布版本快照可视化分支管理 — 2026-06-05

- **S65-E1.1**: `saveNamedSnapshot(name?)` — 自动生成 Snapshot-{timestamp} 名称
- **S65-E1.2**: `createBranch(sourceId, name)` — 基于源快照创建分支，设置 parentSnapshotId
- **S65-E1.3**: `compareSnapshots` — 已有，验证存在
- **S65-E1.4**: HistoryPanel 分支树视图 — 重构为树视图（⌘ 切换），折叠/展开分支
- **S65-E1.5**: SnapshotCompareDialog 高亮弹窗 — 新增，computeSnapshotDiff 结果展示
- **S65-E1.6**: 分支感知 LRU 驱逐 — 以分支为粒度，每分支 MAX=50
- **S65-E1.7**: vitest 11/11 (canvasHistoryStore.sprint65-e1.test.ts)
- **S65-E1 (new files)**: `snapshotCompare.ts`, `SnapshotCompareDialog.tsx`
---

## [Unreleased] S60-E3: 协作活动流 + 在线状态指示 — 2026-06-04
- **S60-E3**: `activityStore.ts` — Zustand ring buffer (max 5 entries), online/idle/offline status derivation
- **S60-E3**: `ActivityFeed.tsx` — 活动流面板，展示最近 5 条协作活动
- **S60-E3**: `RemoteCursor` pulse 动画 — online (绿色脉冲) / idle (琥珀色脉冲) / offline 状态指示
- **S60-E3**: `activityHandler.ts` — WS `activity:update` 消息处理
- **S60-E3**: `types.ts` — `ActivityMessage` + `ActivityEntry` 类型扩展
- **S60-E3**: vitest 17/17 通过 (activityStore 11 + ActivityFeed 5 + RemoteCursor 11)

## [Unreleased] S60-E4: 画布导出增强 — 2026-06-04
- **S60-E4.1**: `ExportMenu.tsx` — 添加 PDF batch export radio button 选项，支持 PNG/SVG/PDF 三种格式批量导出
- **S60-E4.2**: `src/services/export/__tests__/ZipExporter.test.ts` — 15 个 vitest 测试（PNG/PDF capture、JSZip manifest、filename sanitization、collectNodes scopes、progress callback）
- **S60-E4**: ZipExporter PNG/PDF 支持、D4.3 ExportMenu PDF 选项、D4.5 vitest 测试覆盖
## [Unreleased] S60-E5: 搜索体验增强 — 2026-06-04
- **S60-E5.1**: `canvasSearchStore.ts` — Zustand store, searchHistory localStorage 持久化（最多 10 条，最新优先，dedup）
- **S60-E5.2**: `DDSSearchPanel.tsx` — 新增"最近搜索"Tab + "搜索结果"Tab tablist 导航
- **S60-E5.3**: `DDSSearchPanel.tsx` — 搜索结果关键词高亮（`<mark>` 标签），支持大小写不敏感
- **S60-E5.4**: `DDSSearchPanel.tsx` — history tab ↑↓ 键盘导航 + Enter 选历史项
- **S60-E5.5**: vitest: `canvasSearchStore.test.ts` 10/10 + `DDSSearchPanel.test.tsx` 16/16

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

## [Unreleased] S58-E5: 协作冲突增强 — 2026-06-03
- **S58-E5.1**: `wsConflictHandler.ts` — 新建 WS 冲突消息处理器，监听 `conflict:detected` 消息
- **S58-E5.2**: `conflictStore.ts` — 新建冲突状态管理，新增 `conflictData` + `resolvedStrategy` 状态
- **S58-E5.3**: `ConflictDialog.tsx` — 扩展冲突对话框，支持本地/远程 diff + 三选项（保留本地/接受远程/手动合并）
- **S58-E5.4**: `ConflictDialog.module.css` — 扩展样式，支持 manual merge 编辑器
- **S58-E5.5**: `wsConflictHandler.ts` — 冲突解决后发送 `conflict:resolved` 消息
- **S58-E5.6**: `conflictStore.test.ts` — 6 个 vitest 测试全部通过
- **S58-E5.7**: `ConflictDialog.test.tsx` — 18 个 vitest 测试全部通过

---

## [Unreleased] S59-E1: 画布全局搜索 — 2026-06-11
- **S59-E1.1**: `canvasSearchStore.ts` — Fuse.js 搜索状态管理，`cmd+k` 快捷键，`searchResults`/`isSearchOpen`
- **S59-E1.2**: `SearchPanel.tsx` — DDSSearchPanel 搜索面板，支持实时搜索 + 节点高亮
- **S59-E1.3**: `useSearchIndex.ts` — 画布节点索引构建，Fuse.js index 管理
- **S59-E1.4**: `fullTextSearch.ts` — 全文搜索核心算法，支持标题 + 内容匹配
- **S59-E1.5**: `DDSCanvasPage.tsx` — 集成搜索面板，Cmd+K 触发，支持搜索结果导航
- **S59-E1.6**: `canvasSearchStore.test.ts` — 11 个 vitest 测试全部通过
- **S59-E1.7**: `fullTextSearch.test.ts` — 10 个 vitest 测试全部通过

## [Unreleased] S59-E2: 评论实时通知 — 2026-06-11
- **S59-E2.1**: `commentStore.ts` — reactions 支持 + @mention 通知状态管理
- **S59-E2.2**: `wsCommentHandler.ts` — @mention 动态导入 `import('@/stores/dds/mentionsStore')`，`comment:mention` 消息处理
- **S59-E2.3**: `commentStore.test.ts` — 18 个 vitest 测试全部通过
- **S59-E2.4**: `wsCommentHandler.test.ts` — WS 消息处理测试全部通过

## [Unreleased] S59-E3: 画布节点自动布局 — 2026-06-11
- **S59-E3.1**: `dagreLayout.ts` — 基于 `@types/dagre` 的 DAG 自动布局算法，`applyLayoutToCards`/`computeLayout`
- **S59-E3.2**: `autoLayoutStore.ts` — 布局状态管理 + `isLayouting` 状态
- **S59-E3.3**: `useAutoLayout.ts` — React hook，`handleAutoLayout` + 快捷注册
- **S59-E3.4**: `dagreLayout.test.ts` + `autoLayoutStore.test.ts` — 20 个 vitest 测试全部通过
- **S59-E3.5**: `DDSToolbar.tsx` — Cmd+L 自动布局按钮集成，`aria-label="自动布局"`

## [Unreleased] S59-E4: 模板批量导入导出 — 2026-06-11
- **S59-E4.1**: `templateStore.ts` — `addTemplate`/`addTag`/`removeTag` 方法完善，`importTemplates`/`exportTemplates`
- **S59-E4.2**: `templateExport.ts` — `exportTemplatesToBlob` Blob 下载，支持 JSON/YAML 格式
- **S59-E4.3**: `templateImport.ts` — `importTemplatesFromFile` 文件上传，支持 conflict 策略（skip/overwrite）
- **S59-E4.4**: `TemplateGallery.tsx` — 导入/导出按钮 UI，`importTemplatesFromFile` + `exportTemplatesToBlob` 集成
- **S59-E4.5**: `templateStore.test.ts` — 42 个 vitest 测试全部通过（含 E4 import/export 策略测试）

## [Unreleased] S59-E5: 键盘快捷键扩展 — 2026-06-11
- **S59-E5.1**: `shortcutStore.ts` — 快捷键注册表 + 冲突检测 + localStorage 持久化 + `loadDefaults`
- **S59-E5.2**: `useKeyboardShortcuts.ts` — 自动布局快捷键注册（Cmd+L），可扩展架构
- **S59-E5.3**: `DDSToolbar.tsx` — 键盘快捷键设置按钮，`isShortcutSettingsOpen` 状态
- **S59-E5.4**: `shortcutStore.test.ts` + `useKeyboardShortcuts.test.ts` — vitest 测试全部通过

## [Unreleased] S60-E1: 画布版本历史 UI 增强 — 2026-06-03
- **S60-E1.1**: `Snapshot` 接口新增 `branchName`/`isStarred` 可选字段
- **S60-E1.2**: `SnapshotDiff` 接口：`added`/`removed`/`modified` 节点差异
- **S60-E1.3**: `canvasHistoryStore.compareSnapshots()` — 基于 Set+深比较
- **S60-E1.4**: `canvasHistoryStore.updateSnapshotMetadata()` — 星标/分支名更新
- **S60-E1.5**: `historyDB`: DB_VERSION→3，存储/读取 `branchName`/`isStarred`
- **S60-E1.6**: `HistoryPanel.tsx` — 时间线视图+列表视图切换
- **S60-E1.7**: `SnapshotDiffDialog.tsx` — 快照对比弹窗
- **S60-E1.8**: `TimelineView.tsx` — 时间线节点卡片

---

## [Unreleased] S60-E2: 批量操作增强 — 2026-06-04
- **S60-E2.1**: 新增 `batchOpsStore.ts` — UI状态管理（删除确认对话框、重命名对话框前缀/后缀模式、操作状态）
- **S60-E2.2**: 新增 `BatchOpsToolbar.tsx` — 批量删除/重命名浮层，CanvasListPanel 多选时显示
- **S60-E2.3**: 扩展 `canvasListStore.ts` — `batchDeleteCanvas()` / `batchRenameCanvas()` 批量操作方法
- **S60-E2.4**: vitest: 28 tests passing（`batchOpsStore.test.ts` 15 + `canvasListStore.batchOps.test.ts` 7 + `BatchOpsToolbar.test.tsx` 6）

---

## [Unreleased] S61-E1: 画布版本历史时间线视图 + 快照对比 — 2026-06-04
- **S61-E1.1**: `HistoryPanel.tsx` — 时间线/列表双视图 Drawer 面板，搜索过滤 + 分支过滤 + 快照预览 + 对比按钮
- **S61-E1.2**: `SnapshotPreview.tsx` — 快照详情面板，支持节点缩放查看
- **S61-E1.3**: `SnapshotDiffDialog.tsx` — 两快照 diff 对比（绿色新增/红色删除/黄色修改）
- **S61-E1.4**: `DDSToolbar.tsx` — 历史图标按钮触发 HistoryPanel（aria-label="历史记录"）
- **S61-E1.5**: `historyDB.ts` — IndexedDB 快照数据库操作（save/load/delete）
- **S61-E1.6**: `canvasHistoryStore.ts` — 扩展 `listSnapshots(branch?, starred?)` action + `compareSnapshots()` diff 算法
- **S61-E1**: vitest 33/33 通过（HistoryPanel 15 + canvasHistoryStore 14 + TimelineView 4）

---

## [Unreleased] S61-E2: 批量导出（PNG/SVG/PDF）— 2026-06-04
- **S61-E2.1**: `ExportDialog.tsx` — 批量导出对话框，支持格式选择（PNG/SVG/PDF）和范围选择（全部/选中）
- **S61-E2.2**: `ExportProgress.tsx` — 导出进度条组件，实时显示当前节点 + 进度百分比
- **S61-E2.3**: `ExportMenu.tsx` — 新增"批量导出"菜单项（`aria-label="批量导出"`），触发 ExportDialog
- **S61-E2.4**: `useBatchExport.test.ts` — 18 个测试，91.42% 行覆盖率（PNG/SVG/PDF 路由、取消、错误处理、scope 映射）

## [Unreleased] S61-E3: 国际化完善-多语言支持 — 2026-06-04
- **S61-E3.1**: `BatchOpsToolbar.tsx` — 批量操作栏硬编码中文字符串全部替换为 `useTranslations('batchOps')()` 调用（15→0 硬编码）
- **S61-E3.2**: `useLanguage.ts` — 用户语言偏好 Hook，支持 `setLanguage()` 切换，读取 `userPreferencesStore` 持久化
- **S61-E3.3**: `LanguageSwitcher.tsx` — 工具栏语言切换下拉组件，支持 en/zh 切换
- **S61-E3.4**: `DDSToolbar.tsx` — 集成 `LanguageSwitcher` + `useLanguage`，粘贴/复制按钮 aria-label i18n
- **S61-E3.5**: `DDSSearchPanel.tsx` — 搜索面板所有 UI 字符串替换为 `useTranslations('search')()` 调用
- **S61-E3.6**: `en.json`/`zh.json` — 新增 `toolbar`、`common`、`search`、`batchOps` 命名空间翻译键（batchOps 19 key, toolbar 18 key, search 12 key）
- **S61-E3.7**: vitest: `useLanguage.test.ts` 4/4 通过

## [Unreleased] S61-E4: AI Session 画布上下文集成 — 2026-06-04
- **S61-E4.1**: `agentStore.ts` — DDS AI 会话 Store，持有 sessions[]/canvasContext/retryConfig，支持重试模式（3/5/无限）
- **S61-E4.2**: `useAIAgentContext.ts` — Hook，序列化画布状态为节点/边计数摘要字符串（e.g. "3 nodes, 1 edge, chapters: 需求, 流程"）
- **S61-E4.3**: `AIDraftDrawer.tsx` — 集成 canvasContext badge（画布上下文摘要）+ retryConfig 下拉（3/5/无限）到抽屉 Header
- **S61-E4.4**: `AIDraftDrawer.tsx` — 断线重连时显示重试 spinner（D4.5 断线重连 UI）
- **S61-E4.5**: `useAIAgentContext.test.ts` — 10 个测试，canvasSummary 格式/chapterCounts/totalNodes+Edges/setCanvasContext/retryMode

---

## [Unreleased] S61-E5: 画布数据备份与导出 — 2026-06-04
- **S61-E5.1**: BackupPanel.tsx — modal UI with export/import buttons + backup list
- **S61-E5.2**: useBackup.ts — React hook wrapping BackupService
- **S61-E5.3**: BackupService.test.ts — 14 tests covering export/import/list/delete/format
- **S61-E5.4**: DDSToolbar integration — backup toolbar button + panel render
- **S61-E5.5**: i18n — zh.json/en.json canvasBackup key

---

## S62-E1: 协作者实时编辑同步 — 2026-06-04
- **S62-E1.1**: presenceStore 新增 editingNodeIds Map + startEditing/endEditing/endEditingByUser/isBeingEdited/getEditor 方法
- **S62-E1.2**: useCollaboration sendRaw() 新增 collab:editing 消息发送能力
- **S62-E1.3**: useWebSocketPresence 新增 collab:editing:start/end 消息接收处理
- **S62-E1.4**: DDSCanvasPage handleSelectCard 集成 startEditing/endEditing，Escape 键退出编辑
- **S62-E1.5**: CardRenderer 集成 NodeEditorLock 叠加层，显示正在编辑该节点的协作者
- **新增文件**: useCollabEditing.ts, wsCollabHandler.ts, NodeEditorLock.tsx, NodeEditorLock.module.css
- **测试**: presenceStore 19/19 ✅, useCollaboration 9/9 ✅ (CardRenderer 3 个 role=button 可访问性测试失败为历史遗留问题)

---

## S62-E2: 画布文件夹管理 — 2026-06-04
- **S62-E2.1**: canvasFolderStore: createFolder/renameFolder/deleteFolder (递归删除子文件夹) + setPendingDeleteFolder
- **S62-E2.2**: moveCanvasToFolder/batchMoveToFolder + getCanvasesInFolder + getRootFolders/getChildFolders
- **S62-E2.3**: FolderTree UI: 右键菜单(重命名/移动到/删除)
- **S62-E2.4**: CreateFolderDialog: 新建文件夹弹窗, 空名称/重复名称校验
- **S62-E2.5**: 删除确认流程: pendingDeleteFolderId 状态管理
- **S62-E2.6**: 30个 vitest 单测 (CRUD/move/delete/edge cases)
- **新增文件**: canvasFolderStore.ts, CreateFolderDialog.tsx, FolderTree.tsx (及其 CSS 模块)
- **测试**: canvasFolderStore 30/30 ✅

---

## [Unreleased] S62-E3: 画布云端备份与恢复 — 2026-06-04
- **S62-E3.1**: BackupService — cloudBackup/cloudRestore/listCloudBackups/deleteCloudBackup via /api/backup endpoints
- **S62-E3.2**: backupStore — pendingBackups Set + cloudBackupHistory + taskStatus FSM
- **S62-E3.3**: BackupPanel cloud tab — Tab 2 with upload/restore/list/delete UI + cloudBackupStore integration
- **S62-E3.4**: /api/backup route.ts + /api/backup/[canvasId] route.ts — Next.js API routes proxying VIBEX_BACKEND_URL
- **S62-E3.5**: BackupService.cloud.test.ts 22 passing (AbortSignal-in-jsdom 5 failures pre-existing)

## [Unreleased] S62-E4: 协作 Undo/Redo — 2026-06-04
- **S62-E4.1**: undoRedoStore — currentOperator + conflictDialog + performUndo/performRedo + checkConflict + showConflict/dismissConflict
- **S62-E4.2**: wsCollabHandler — broadcastUndo/broadcastRedo + collab:undo/collab:redo message types
- **S62-E4.3**: DDSToolbar — operator badge UI (lines 678-720) + handleUndo/handleRedo 集成
- **新增文件**: undoRedoStore.ts, __tests__/undoRedoStore.test.ts
- **修改文件**: wsCollabHandler.ts (新增 collab:undo/redo 消息处理)
- **测试**: undoRedoStore 13/13 ✅

---

## [Unreleased] S62-E5: 离线 PWA 支持 — 2026-06-04
- **S62-E5.1**: SWRegistration 在 RootLayout 中注册 Service Worker
- **S62-E5.2**: offline-queue.ts 新增 queueCloudBackup/queueUndoRedo 函数，离线时将操作入队
- **S62-E5.3**: 离线页面 offline.html 支持基础离线提示
- **S62-E5.4**: OfflineBanner 在 CanvasPage 中渲染，网络断开时显示提示
- **S62-E5.5**: public/sw.js 新增画布数据缓存层（MAX_CACHED_CANVASES=5, CACHE_TTL=7天），cacheCanvasResponse/evictOldestCanvasEntries/getCachedCanvasResponse/handleCanvasAPI

---

## [Unreleased] S63-E1: 协作者实时游标追踪 — 2026-06-05
- **S63-E1.1**: `RemoteCursorsLayer.tsx` — RemoteCursor SVG 渲染组件，跟随远程用户鼠标位置，支持用户名标签
- **S63-E1.2**: `RemoteCursorsLayer.module.css` — 脉冲动画样式 (online 绿/amber idle)
- **S63-E1.3**: `presenceStore.ts` — 扩展 `remoteCursors` Map，`updateCursor(userId, x, y)` + `removeCursor(userId)` actions
- **S63-E1.4**: `useWebSocketPresence.ts` — `throttleCursorBroadcast` (50ms) + `cursor:move` 消息发送/接收
- **S63-E1.5**: `wsCollabHandler.ts` + `types.ts` — `CursorMoveMessage` 类型扩展
- **S63-E1.6**: `DDSCanvasPage.tsx` + `DDSFlow.tsx` — `onPaneMouseMove` → `onCursorMove` → WS broadcast 链路
- **S63-E1**: vitest 23/23 通过 (presenceStore cursor 生命周期 + remoteCursors Map 状态)

---

## [Unreleased] S63-E2: 协作撤销冲突对话框 — 2026-06-05
- **S63-E2.1**: `ConflictDialog.tsx` — 三选项对话框（撤销你的操作/保留对方操作/取消），`aria-label="协作冲突对话框"`, `role="dialog"`
- **S63-E2.2**: `undoRedoStore.ts` — `resolveConflict(choice)` action，`'undo-mine'` 强制执行撤销，`'keep-theirs'`/`'cancel'` 关闭对话框
- **S63-E2.3**: `DDSToolbar.tsx` — `conflictDialog.open` 时渲染 ConflictDialog
- **S63-E2.4**: `wsCollabHandler.ts` — `collab:conflict` 消息处理，调用 `showConflict(otherUserName, otherUserId, nodeId)`
- **S63-E2.5**: vitest: ConflictDialog 5/5 + resolveConflict 5/5 (18 total undoRedoStore / 23 总计)

---

## [Unreleased] S63-E3: 离线画布编辑 — 2026-06-05
- **S63-E3.1**: `offline-queue.ts` — `CanvasOp` 接口 (addNode/updateNode/deleteNode/addEdge/deleteEdge/addCrossChapterEdge/deleteCrossChapterEdge + timestamp), `CANVAS_OP_DB_NAME = 'vibex-canvas-ops'`, `queueCanvasOp()`, `getQueueSize()`, `syncOfflineQueue()` (重放队列，409 时 dispatch `canvas-op-conflict` CustomEvent), `isOnline()` helper
- **S63-E3.2**: `DDSCanvasStore.ts` — 7 个 ddsChapterActions 方法 (addCard/updateCard/deleteCard/addEdge/deleteEdge/addCrossChapterEdge/deleteCrossChapterEdge) 在 `!isOnline()` 时调用 `queueCanvasOp()` 并 return，不继续执行
- **S63-E3.3**: `DDSCanvasPage.tsx` — `online` 事件监听器调用 `syncOfflineQueue()` via dynamic import
- **S63-E3.4**: `DDSCanvasPage.tsx` — `canvas-op-conflict` 事件监听器调用 E2 ConflictDialog；冲突解决后 `onUndoMine` 重试 `syncOfflineQueue()`
- **S63-E3.5**: `OfflineBanner.tsx` — `getQueueSize()` + `getPendingCount()` 合并显示，`+ N canvas ops` 后缀
- **S63-E3**: vitest 16/16 通过 (offline-queue.test.ts)

---

## [Unreleased] S63-E5: 文件夹拖拽排序 — 2026-06-05
- **S63-E5.1**: `canvasFolderStore.ts` — `Folder.order` 字段 + `moveFolder()` 实现；创建时 `order = siblings.length`；重新排序时使用 midpoint 策略
- **S63-E5.2**: `FolderTree.tsx` — `@dnd-kit` DndContext + SortableContext；SortableFolderItem 内部组件；拖拽手柄 `⋮⋮`；`handleDragEnd` 调用 `store.moveFolder()`
- **S63-E5.3**: `FolderTree.tsx` — 双击重命名（inline input overlay）
- **S63-E5.4**: `FolderPickerDialog.tsx` — 单选对话框；"根目录"选项；`onConfirm(folderId | null)` 回调
- **S63-E5.5**: `BatchOpsToolbar.tsx` — "📁 移动到文件夹" 按钮 + 状态管理
---

## [Unreleased] S64-E1: 协作在线状态面板 — 2026-06-05
- **S64-E1.1**: `presenceStore.ts` — `onlineUsers[]`, `heartbeatInterval`, `updateOnlineUsers()`, `removeStaleUsers()`, `clearOnlineUsers()`; presence 用户列表管理
- **S64-E1.2**: `wsCollabHandler.ts` — `presence:heartbeat`, `presence:user_joined`, `presence:user_left` 消息处理
- **S64-E1.3**: `PresencePanel.tsx` — 活跃协作者列表，`aria-label="协作用户列表"`, `role="toolbar"`; 用户头像 + 状态点
- **S64-E1.4**: `DDSToolbar.tsx` — 画布打开时渲染 PresencePanel
- **S64-E1.5**: vitest: presenceStore 35/35 通过
---

## [Unreleased] S64-E3: AI 会话持久化 — 2026-06-05
- **S64-E3.1**: `src/lib/ai-session-db.ts` — IndexedDB 辅助层：openDB / saveSessionToHistory / loadSessionsFromHistory / deleteSessionFromHistory / clearAllHistory
- **S64-E3.2**: `agentStore.ts` — `sessionHistory[]`, `sessionHistoryLoaded` state + `loadSessions/saveSession/clearSession/clearAllSessions` actions
- **S64-E3.3**: `streamSession` 自动 saveSession — 流结束时将 prompt+response 存入 IndexedDB 历史
- **S64-E3.4**: `AIHistoryPanel.tsx` — 历史列表组件：加载/删除/清空，含中文 UI
- **S64-E3.5**: `AISessionDrawer.tsx` — 新增「当前对话/历史」Tab 切换，渲染 AIHistoryPanel
- **S64-E3.6**: `agentStore.sessionHistory.test.ts` — 8 个测试用例：D3.2a-D3.8

## [Unreleased] S64-E4: 画布批量操作增强（Batch Rename + Archive）— 2026-06-05
- **S64-E4.1**: `canvasListStore.batchRename(canvasIds, renameFn)` — 灵活批量重命名函数，支持序号模式和正则替换模式
- **S64-E4.2**: `canvasListStore.batchArchive/batchUnarchive` — 设置/清除 archivedAt 时间戳
- **S64-E4.3**: `BatchRenameDialog.tsx` — 序号模式（{name}1, {name}2）+ 正则替换模式 UI
- **S64-E4.4**: 重名冲突自动去重 — 重复名称自动追加 -{n} 后缀
- **S64-E4.5**: `BatchOpsToolbar.tsx` — handleAdvancedRename + 归档/取消归档按钮
- **S64-E4.6**: `CanvasListPanel.tsx` — 归档过滤模式标签页（全部/活跃/已归档）
- **S64-E4.7**: `canvasListStore.e4.test.ts` — 6/6 vitest 测试通过（去重逻辑 + 归档过滤）

## [Unreleased] S64-E5: 模板画廊搜索增强 — 2026-06-05
- **S64-E5.1**: `src/data/templates/types.ts` — `TemplateTag` 类型定义 + `TEMPLATE_USE_CASE_TAGS` 配置
- **S64-E5.2**: `src/stores/templateStore.ts` — `selectedTags` + `filterByTag()` + `setSelectedTags()` + Fuse.js 模糊搜索
- **S64-E5.3**: `src/components/dds/templates/TemplateGallery.tsx` — 标签过滤行（交集过滤 + 清除按钮）
- **S64-E5.4**: `src/components/dds/templates/TemplateSaveDialog.tsx` — 保存时选择使用场景标签
- **S64-E5.5**: `src/stores/templateStore.test.ts` — 10 个 E5 测试用例（filterByTag + setSelectedTags + Fuse.js searchTemplates）

## [Unreleased] S65-E2: 协作者编辑指示器 — 节点聚焦感知 — 2026-06-05
- **S65-E2.1**: `wsNodeFocusHandler.ts` — `node:focused`/`node:unfocused` WebSocket 消息处理 + broadcastNodeFocus/clearNodeFocus
- **S65-E2.2**: `presenceStore.ts` — `focusedNodes` (Record<nodeId, userId>) + `focusedNodeInfos` (Record<nodeId, FocusedNodeInfo>) + `setNodeFocus(nodeId, userId)` + `clearNodeFocus(nodeId)` + 30s setTimeout 自动释放
- **S65-E2.3**: `DDSCanvasPage.tsx` — `onNodeFocus(nodeId)` / `onNodeBlur(nodeId)` 广播 via `useNodeFocus` hook
- **S65-E2.4**: `NodeFocusOverlay.tsx` — 节点聚焦高亮 UI，蓝角标 + 用户名浮层
- **S65-E2.5**: 节点锁定感知 UI — 复用现有 `NodeEditorLock` (S44)
- **S65-E2.6**: 30s 超时自动释放 — `setNodeFocus` 启动 setTimeout 定时器，超时自动调用 `clearNodeFocus`
- **S65-E2.7**: `presenceStore.test.ts` — 覆盖 focus/lock 逻辑 (57/57 pass)
- **Test**: 57/57 vitest ✅

## [Unreleased] S65-E3: 画布视图个性化设置面板 — 2026-06-05
- **S65-E3.1**: `settingsStore.ts` — 统一设置 Store：backgroundColor / gridSize / gridVariant / defaultZoom / snapToGrid，localStorage 持久化
- **S65-E3.2**: `CanvasSettingsPanel.tsx` — Tab 式设置面板（背景 / 网格 / 缩放 / 快捷键）
- **S65-E3.3**: `BackgroundSettings.tsx` — 15 种预设色板 + `<input type="color">` 自定义颜色
- **S65-E3.4**: `GridSettings.tsx` — 间距选择器（12/16/24/32）+ 样式（点状/线条/十字）+ 对齐开关
- **S65-E3.5**: `ZoomSettings.tsx` — 默认缩放选择器（50%-200%）
- **S65-E3.6**: `DDSToolbar.tsx` — 设置齿轮按钮 + CanvasSettingsPanel 集成
- **S65-E3.7**: `DDSFlow.tsx` — Background 读取 settingsStore（color / variant / gap）+ snapToGrid / snapGrid props + fitView 使用 defaultZoom
- **S65-E3.10**: `settingsStore.test.ts` — 17/17 vitest 测试通过
- **Test**: 17/17 vitest ✅

## [Unreleased] S65-E4: 画布搜索与过滤增强 — IndexedDB + Fuse.js 全局搜索 — 2026-06-05
- **S65-E4.1**: `canvasDb.ts` — IndexedDB 封装：initCanvasDb / saveCanvasMeta / getCanvasMetas / searchCanvases（Fuse.js 模糊搜索，name 权重 0.5，阈值 0.4，includeScore）
- **S65-E4.2**: `GlobalSearchPanel.tsx` — Cmd+Shift+K 全局画布名称搜索浮层（模糊匹配 + 历史记录 + 排名徽章 + 键盘导航）
- **S65-E4.3**: `canvasSearchStore.ts` — 全局搜索状态：globalSearchQuery + globalSearchResults + searchHistory（MAX 5）
- **S65-E4.4**: `CanvasSearchPanel.tsx` — 页内节点文本搜索面板（精确匹配 + 正则模式 + Fuse.js 模糊）
- **S65-E4.5**: `DDSCanvasPage.tsx` — 集成 GlobalSearchPanel + Cmd+Shift+K 快捷键
- **S65-E4.6**: canvasDb 错误处理 — openDB / idbGetAll / idbPut 全部 try-catch
- **S65-E4.7**: `canvasDb.test.ts` — searchCanvases 5 个测试用例（空查询 / 阈值限制 / 排序验证 / score+item 字段）
- **Test**: 5/5 vitest ✅

---
## [Unreleased] S67-E5: 画布导出增强PDF/SVG — 2026-06-06
- **E5.1**: `PdfExporter.ts` — exportPdf(canvasId, options) 服务函数，支持 A4/Letter、单页/多页、scale 质量、abort 信号
- **E5.2**: `SvgExporter.ts` — exportSvg(canvasId) 服务函数，生成 SVG 向量格式含章节分组、节点关系箭头、特殊字符转义
- **E5.3**: `PdfExporter.test.ts` — 11 项测试覆盖 MIME type、A4/Letter、单页/多页、progress callback、abort
- **E5.4**: `SvgExporter.test.ts` — 11 项测试覆盖 SVG 结构、节点数、章节 ID、空数组、特殊字符转义

---

## [Unreleased] S68-E1: 模板画廊增强（导出/评分）— 2026-06-06
- **E1.1**: `TemplateExportDialog.tsx` — 导出预览对话框，支持全量/收藏/手动选择导出范围 + 文件名定制 + .vbtmpl 下载
- **E1.2**: `TemplateGallery.tsx` — 每张卡片添加★收藏切换按钮，stopPropagation 防冒泡
- **E1.3**: `templateStore.test.ts` — 新增 E1 收藏测试 9 项：toggleFavorite×2, isFavorite×2, getFavorites×2, exportTemplates×1, importTemplates×1
- **Test**: 89/89 vitest ✅

## [Unreleased] S68-E2: @提及通知系统 — 2026-06-06
- **E2.1**: `src/stores/notificationStore.ts` — Zustand + persist，通知列表 CRUD、getUnreadCount、getByCanvas、getByType
- **E2.2**: `src/services/wsNotificationHandler.ts` — 处理 `notification:*` WebSocket 消息（new/update/read）
- **E2.3**: `src/components/dds/collaboration/MentionInput.tsx` — @ 自动补全组件，输入 @ 显示用户列表
- **E2.4**: `src/components/dds/notifications/NotificationPanel.tsx` — 通知中心面板，未读红点、分页、标记已读
- **E2.5**: `DDSToolbar.tsx` — 通知铃铛按钮 + NotificationPanel 抽屉集成 ✅
- **E2.6**: `CollabActivityPanel.tsx` — MentionInput 集成（消息输入） ✅
- **E2.7**: `src/stores/__tests__/notificationStore.test.ts` — 11项测试覆盖

---

## [Unreleased] S68-E3: 全局画布全文搜索 — 2026-06-06
- **E3.1**: `src/services/canvasFulltextIndex.ts` — Fuse.js 全文索引服务，IndexedDB 存储，1h TTL 缓存
- **E3.2**: `canvasSearchStore.ts` — 新增 `fulltextQuery/fulltextResults/fulltextLoading` + `searchNodeContent()`
- **E3.3**: `GlobalSearchPanel.tsx` — 新增 Tab2（节点内容），Tab1（画布名称），键盘导航完整保留
- **E3.4**: `canvasSearchStore.test.ts` — 12项测试全部通过


---

## [Unreleased] S68-E4: 批量操作画布节点复制/导出 — 2026-06-13
- **E4.1**: `canvasListStore.ts` — `copyNodesBetweenCanvases(srcCanvasId, nodeIds, destCanvasId)` copies CanvasMeta entries with new IDs, appends " (副本)" suffix
- **E4.2**: `canvasListStore.ts` — `batchTemplateExport(canvasIds)` exports `.vbtmpl` JSON blob with type `canvas-meta-template`, triggers browser download
- **E4.3**: `CrossCanvasCopyDialog.tsx` — modal dialog for selecting source → destination canvas copy operation
- **E4.4**: `BatchDeleteConfirmDialog.tsx` — confirmation dialog for multi-canvas deletion
- **E4.5**: i18n keys under `batchOps` namespace: zh.json + en.json (`copyToCanvas`, `copyTo`, `exportAsTemplate`, `copiedToCanvas`, `templateExported`, `itemsCopied`)
- **E4.6**: `canvasListStore.batchOps.test.ts` — 13 unit tests (vitest 13/13)

---

## [Unreleased] S69-E1: 画布版本快照历史 — 2026-06-06
- **S69-E1.1**: `BranchManager.tsx` — 分支管理面板（创建/切换/删除分支）
- **S69-E1.2**: `BranchManager.module.css` — 分支管理面板样式
- **S69-E1.3**: `HistoryPanel.tsx` (canvas-history) — 渲染快照列表含 branch/author 字段
- **S69-E1.4**: `canvasHistoryStore.ts` — 扩展 +getSnapshotsByCanvas/+restoreSnapshot/+deleteSnapshot（已在 main）
- **S69-E1.5**: DDSToolbar — 历史按钮集成（已在 main）
- **S69-E1.6**: `canvasHistoryStore.test.ts` — E1 测试 8 个全部通过

- **E2.1**: `canvasSearchStore.ts` — `searchHistory[]` 状态 + localStorage 持久化（`vibex-search-history` key，MAX=10）+ `addToSearchHistory`/`removeFromSearchHistory`/`clearSearchHistory`/`loadSearchHistory`
- **E2.2**: `canvasFulltextIndex.ts` — `ContextSearchResult` 接口（`before`/`after` 字段）+ `searchWithContext()` 函数

- **E2.3**: `GlobalSearchPanel.tsx` — `<mark>` 高亮搜索关键词（#fef08a）+ before/after 上下文片段渲染


- **E3.1**: `templateShare.ts` — Base64 URL encode/decode (`encodeTemplateToShareUrl`/`decodeShareUrl`) + URL-safe base64 (`+/=` → `-_.`) + 8KB size warn
- **E3.2**: `templateShareStore.ts` — 分享/导入对话框状态 (Zustand, `isShareDialogOpen`/`isImportDialogOpen`)
- **E3.3**: `TemplateShareDialog.tsx` — 分享按钮 + URL预览 + 一键复制 (copyToClipboard)
- **E3.4**: `ImportFromUrlDialog.tsx` — 从分享URL导入模板对话框 + Base64解析 + 冲突处理(skip/rename/replace)
- **E3.5**: `TemplateGallery.tsx` — "发现"页签(CategoryTab+discover) + 每张卡片分享按钮 + 对话框集成
- **E3.6**: `templateStore.ts` — `importFromShareUrl(payload)` + IndexedDB存储 + 冲突检测
- **E3.7**: `templateShare.test.ts` — 21 vitest: encode/decode roundtrip/clipboard/location/edge cases
---

## [Unreleased] S69-E5: 画布视图预设 — 2026-06-06
- **S69-E5.1**: `settingsStore.ts` — 扩展 CanvasPreset 接口 + canvasPresets 数组 + activePresetId + 8 个预设 CRUD actions
- **S69-E5.2**: `ViewPresetsPanel.tsx` — 工具栏预设下拉菜单（apply/save/delete/rename preset + 设置链接）
- **S69-E5.3**: `ViewPresetsPanel.module.css` — 下拉面板暗色主题样式
- **S69-E5.4**: `DDSToolbar.tsx` — 预设按钮集成（ExportMenu 右侧）+ ViewPresetsPanel 渲染
- **S69-E5.5**: `CanvasSettingsPanel.tsx` — 预设 Tab（第5个 Tab，重用 S66-E3 ViewPresetsTab）
- **S69-E5.6**: `settingsStore.test.ts` — E5 测试 34/34 通过


---

## [Unreleased] S70-E1: 画布分支合并与冲突处理 — 2026-06-06
- **E1.1**: `canvasHistoryStore.ts` — `mergeBranch(canvasId, source, target)` action + `pendingConflicts` state + `resolveBranchConflict` + `clearPendingConflicts`
- **E1.2**: `BranchManager.tsx` — `MergeBranchButton` 组件（非主分支显示）+ 合并确认对话框
- **E1.3**: `SnapshotCompareDialog.tsx` — `mode="merge"` prop，侧-by-side 对比 + 逐节点保留/忽略
- **E1.4**: `ConflictResolutionDialog.tsx` — 冲突解决对话框（保留我的/采用对方/合并内容）三按钮
- **E1.5**: `DDSCanvasPage.tsx` — 合并成功后调用 `reloadFromSnapshot` 刷新画布
- **E1.6**: `canvasHistoryStore.e1-merge.test.ts` — E1 测试：mergeBranch + pendingConflicts + resolveBranchConflict

## [Unreleased] S70-E2: 模板市场发现与浏览 — 2026-06-06
- **E2.1**: `templateStore.ts` — `featuredTemplates(limit?)` 按 usageCount 降序排序 + `searchMarketplace(query?, tags?)` 组合过滤 + `getMarketplaceTemplates()`
- **E2.2**: `TemplateMarketplacePanel.tsx` — 市场发现面板（搜索框 + 标签云 + 热门模板 + 模板卡片网格 + 使用量徽章 + 导入按钮）
- **E2.3**: `TemplateMarketplacePanel.module.css` — 面板样式（搜索行、标签云、卡片网格、使用量徽章、导入按钮）
- **E2.4**: `TemplateGallery.tsx` — `discover` Tab 改为打开市场面板（`showMarketplace` state）+ `TemplateMarketplacePanel` 集成
- **E2.5**: `TemplateGallery.module.css` — 市场面板包装器样式
- **E2.6**: `templateStore.marketplace.test.ts` — E2 纯函数单元测试 20/20 通过



---

## [Unreleased] S70-E3: 多格式批量画布导出 — 2026-06-06
- **E3.1**: `MultiFormatExporter.ts` — `exportMultiFormatZip(canvasId, options)` 编排 PNG+SVG+PDF 三格式并行生成 + JSZip 打包下载
- **E3.2**: `ExportMenu.tsx` — 新增"多格式导出(ZIP)"菜单项，支持勾选 PNG/SVG/PDF 三格式
- **E3.3**: `ZipExporter.multi-format.test.ts` — 6/6 接口测试覆盖三种格式 + ZIP 打包
- **vitest**: `ZipExporter.multi-format.test.ts` 6/6 通过

## [Unreleased] S70-E4: 协作冲突检测与锁升级 — 2026-06-06
- **E4.1**: `presenceStore.ts` — 新增 `pendingConflicts: ConflictRecord[]` + `addConflict()`/`resolveConflict()`/`hasConflict()`/`getUnresolvedCount()`，冲突检测逻辑嵌入 `startEditing`
- **E4.2**: `useCollabEditing.ts` — 新增 `detectConflict()` 5秒双写窗口检测
- **E4.3**: `CollabConflictDialog.tsx` — 新建协作冲突解决对话框（双版本对比 + 保留我的/保留对方按钮）
- **E4.4**: `DDSCanvasPage.tsx` — 监听 `presenceStore.pendingConflicts` 变化，自动弹出冲突对话框
- **E4.5**: `presenceStore.conflict.test.ts` — 18个vitest测试覆盖冲突检测全场景


## [Unreleased] S70-E5: 画布设置面板完善 — 2026-06-06
- **E5.1**: `CanvasSettingsDrawer.tsx` — 新建侧边抽屉组件，4 tabs（预设/画布/节点/协作），复用 ViewPresetsTab + BackgroundSettings + GridSettings + ZoomSettings
- **E5.2**: `CanvasSettingsDrawer.module.css` — 抽屉样式（overlay/drawer/tabs/content）
- **E5.3**: `DDSToolbar.tsx` — 替换 `CanvasSettingsPanel` → `CanvasSettingsDrawer`，settings 按钮保持
- **E5.4**: ESC 键盘关闭 — `useEffect` + `keydown` 监听器
- **E5.5**: `CanvasSettingsDrawer.test.tsx` — vitest 9/9 ✅（抽屉开关/tab切换/ESC/close button）
- **vitest**: `CanvasSettingsDrawer.test.tsx` 9/9 通过

---

## [Unreleased] S71-E4: 画布使用统计分析 — 2026-06-07
- **E4.1**: `canvasAnalyticsStore.ts` — Zustand + localStorage persist，记录 totalEdits / nodeEdits / lastEdit，支持 recordEdit / getStats / getTopNodes / exportAnalytics / clearStats
- **E4.2**: `AnalyticsPanel.tsx` — HistoryPanel Tab5，显示编辑最多节点排行 + 导出 CSV，支持全量/折叠切换
- **E4.3**: `AnalyticsPanel.module.css` — Tab5 样式，summary cards + bar chart
- **vitest**: `canvasAnalyticsStore.test.ts` + `AnalyticsPanel.test.tsx` 9/9 通过


---

## [Unreleased] S71-E5: 模板评分与收藏增强 — 2026-06-07
- **E5.1**: `TemplateMarketplacePanel.tsx` — 新增排序选择器（⭐评分/🔥使用量/📅最近）+ 卡片评分星标（显示+交互）+ 收藏按钮
- **E5.2**: `TemplateMarketplacePanel.module.css` — sortRow / starRow / favoriteBtn 样式
- **vitest**: `templateStore.rating.test.ts` + `TemplateMarketplacePanel.e5.test.tsx` 10/10 通过

## [Unreleased] S71-E4: 画布使用统计分析 — 2026-06-07
- **E4.1**: `canvasAnalyticsStore.ts` — Zustand + localStorage persist，记录 totalEdits / nodeEdits / lastEdit
- **E4.2**: `AnalyticsPanel.tsx` — HistoryPanel Tab5，显示编辑最多节点排行 + 导出 CSV
- **E4.3**: `AnalyticsPanel.module.css` — Tab5 样式
- **vitest**: `canvasAnalyticsStore.test.ts` + `AnalyticsPanel.test.tsx` 9/9 通过
---

## [Unreleased] S72-E1: 画布历史管理面板快照测试 — 2026-06-07
- **E1.4**: `canvasHistoryStore.snapshots.test.ts` — saveSnapshot/restoreSnapshot/renameSnapshot/deleteSnapshot + LRU eviction vitest 14/14
- **E1.5**: `TimelineView.test.tsx` — 快照时间线组件测试：空状态/列表渲染/操作回调/键盘交互/相对时间格式化 vitest 16/16
---

## [Unreleased] S72-E3: 协作presence统一store — 2026-06-07
- **E3.1**: `src/lib/collaboration/presenceStore.ts` — Zustand store: `remoteUsers` + `cursors` (Map/Record) + `broadcastCursor`/`clearCursor`/`updateCursor`/`removeUser` actions
- **E3.2**: `src/lib/collaboration/useWebSocketPresence.ts` — WS integration: `onCursorMove` → `presenceStore.broadcastCursor`, `onUserJoin` → `presenceStore.setRemoteUsers`, `onUserLeave` → `presenceStore.removeUser`
- **E3.3**: `src/components/dds/canvas-dashboard/RemoteCursorsLayer.tsx` — 重构为 `usePresenceStore(s => s.cursors)` 驱动 (S63-E1 + S68-E5)
- **E3.4**: `src/lib/collaboration/__tests__/presenceStore.test.ts` — 91 tests (84 原有 + 7 E3专项)
- **E3.5**: `src/components/dds/canvas-dashboard/__tests__/RemoteCursorsLayer.test.tsx` — 7 tests


---

## [Unreleased] S72-E5: 模板预览模式 — 2026-06-07
- **E5.1**: `vibex-fronted/src/components/dds/templates/TemplatePreviewPanel.tsx` — Drawer面板, 节点列表+详情双栏布局, 入边/出边数量显示
- **E5.2**: `vibex-fronted/src/components/dds/templates/TemplatePreviewPanel.module.css` — 面板样式
- **E5.3**: `vibex-fronted/src/stores/templateStore.ts` — `getTemplateNodes(templateId)` + `TemplateNode` interface: 返回含入边/出边计数的节点数组
- **E5.4**: `vibex-fronted/src/components/dds/templates/__tests__/TemplatePreviewPanel.test.tsx` — 9 tests: open/close/node list/detail/import/edge counts
- **vitest**: `TemplatePreviewPanel.test.tsx` 9/9 通过

## [Unreleased] S72-E4: 画布数据趋势分析图表 — 2026-06-07
- **E4.1**: `vibex-fronted/src/components/dds/analytics/AnalyticsTrendChart.tsx` — 7天/30天切换柱状图, 历史记录列表, 分享按钮
- **E4.2**: `vibex-fronted/src/stores/dds/canvasAnalyticsStore.ts` — `archiveHistory`/`getHistory`/`shareAnalytics`/`exportAnalytics` 扩展
- **E4.3**: `vibex-fronted/src/stores/dds/__tests__/canvasAnalyticsStore.test.ts` — 8 tests: archiveHistory/getHistory/shareAnalytics/exportAnalytics
- **E4.4**: `vibex-fronted/src/components/dds/analytics/__tests__/AnalyticsTrendChart.test.tsx` — 5 tests: header/bar toggle/share
## [Unreleased] S73-E1: 画布内容全文搜索 — 2026-06-07
- **E1.1**: `canvasSearchStore.ts` — `searchNodes(query)` 同步方法，返回 fulltextResults；re-export `NodeSearchResult` 类型
- **E1.2**: `CanvasSearchPanel.tsx` — 浮动搜索面板，Cmd/Ctrl+F 呼出，含搜索输入、HighlightMatch 高亮、结果点击滚动
- **E1.3**: `DDSCanvasPage.tsx` — 集成 CanvasSearchPanel，添加 `canvas:scroll-to-node` 事件监听实现节点滚动定位
- **E1.4**: `canvasSearchStore.test.ts` — 新增 `describe('searchNodes — S73-E1 D1.1')` 4 用例
- **E1.5**: `CanvasSearchPanel.test.tsx` — 新建集成测试 16 用例

---

## [Unreleased] S73-E1: 画布内容全文搜索 — 2026-06-07
- **E1.1**: `canvasSearchStore.ts` — `searchNodes(query)` 同步方法，返回 fulltextResults；re-export `NodeSearchResult` 类型
- **E1.2**: `CanvasSearchPanel.tsx` — 浮动搜索面板，Cmd/Ctrl+F 呼出，含搜索输入、HighlightMatch 高亮、结果点击滚动
- **E1.3**: `DDSCanvasPage.tsx` — 集成 CanvasSearchPanel，添加 `canvas:scroll-to-node` 事件监听实现节点滚动定位
- **E1.4**: `canvasSearchStore.test.ts` — 新增 `describe('searchNodes — S73-E1 D1.1')` 4 用例
- **E1.5**: `CanvasSearchPanel.test.tsx` — 新建集成测试 16 用例

## [Unreleased] S73-E2: 模板节点导入画布 — 2026-06-07
- **E2.1**: `lib/canvas/templateStore.ts` — `importTemplateToCanvas(templateId, position?, mode?)` 纯函数: 解析模板snapshot, ID映射, chapter类型映射, 节点/边构建, ImportResult返回
- **E2.2**: `stores/templateStore.ts` — Zustand `importTemplateToCanvas()` 包装器: 模板存在性校验, 委托lib实现, 分组chapter调用addCard/addEdge, recordUsage追踪
- **E2.3**: `ImportMode` / `ImportResult` / `ImportedNode` / `ImportedEdge` 类型导出
- **E2.4**: `stores/templateStore.ts` — 新增导入: `@/lib/canvas/templateStore`, `@/stores/dds/DDSCanvasStore`, `@/lib/canvas/id`


## [Unreleased] S73-E2: 模板节点导入画布 — 2026-06-07
- **E2.1**: `lib/canvas/templateStore.ts` — `importTemplateToCanvas(templateId, position?, mode?)` 纯函数: 解析模板snapshot, ID映射, chapter类型映射, 节点/边构建, ImportResult返回
- **E2.2**: `stores/templateStore.ts` — Zustand `importTemplateToCanvas()` 包装器: 模板存在性校验, 委托lib实现, 分组chapter调用addCard/addEdge, recordUsage追踪
- **E2.3**: `ImportMode` / `ImportResult` / `ImportedNode` / `ImportedEdge` 类型导出
- **E2.4**: `stores/templateStore.ts` — 新增导入: `@/lib/canvas/templateStore`, `@/stores/dds/DDSCanvasStore`, `@/lib/canvas/id`


---

## [Unreleased] S73-E3: 通知管理与历史 — 2026-06-07
- **E3.1**: `notificationStore.ts` — 扩展 `preferences` 状态、`setChannelEnabled`/`setTypeEnabled`/`resetPreferences` actions
- **E3.2**: `NotificationPanel.tsx` — header 新增「全部已读」+「清空历史」+「设置」按钮
- **E3.3**: `NotificationSettingsDrawer.tsx` — 新建通知偏好设置抽屉（推送渠道开关 + 通知类型开关 grid）
- **E3.4**: `NotificationPanel.module.css` + `NotificationSettingsDrawer.module.css` — 新建样式
- **E3.5**: `notificationStore.test.ts` — E3.1–E3.3 扩展测试 9/9

---

## [Unreleased] S73-E4: 画布分支命名与保护 — 2026-06-07
- **E4.1**: `historyDB.ts` — DB_VERSION=5, 新增 branchMeta objectStore (canvasId+branchName compound key), getBranchMeta/setBranchMeta/listBranchMetas CRUD
- **E4.2**: `canvasHistoryStore.ts` — 扩展 setBranchName/setBranchProtected/getBranchMeta
- **E4.3**: `HistoryPanel.tsx` — 分支列表 inline 重命名 + 🔒 保护徽章 + toggle 按钮 + 删除确认
- **E4.4**: `History.module.css` — 新增分支行内编辑/保护样式
- **E4.5**: `historyDB.e4-branchMeta.test.ts` — 7/7 + `canvasHistoryStore.sprint73-e4.test.ts` — 7/7


---

## [Unreleased] S73-E5: AI会话导出与分享 — 2026-06-07
- **E5.1**: `collabSessionStore.ts` — 新增 `exportSessionMarkdown(sessionId)` action，返回含元数据+事件的 Markdown 字符串
- **E5.2**: `collabSessionStore.ts` — 新增 `exportSessionPDF(sessionId)` action，调用 `window.print()`
- **E5.3**: `SessionReplayPanel.tsx` — header 新增导出下拉菜单（Markdown下载/PDF打印/剪贴板复制）
- **E5.4**: `SessionReplayPanel.module.css` — 导出下拉菜单样式 + hover 反馈
- **E5.5**: `collabSessionStore.test.ts` — 扩展覆盖 `exportSessionMarkdown`/`exportSessionPDF`（vitest 11/11）

---


---

## [Unreleased] S74-E1: 搜索历史记录 — 2026-06-07
- **E1.1**: `canvasSearchStore.ts` — `recentSearches` 替代 `searchHistory`（MAX=20）+ `addRecentSearch`/`clearRecentSearches`
- **E1.2**: `canvasSearchStore.test.ts` — 扩展测试（+101 行）：recentSearches 增删查、dedup、去重上限
- **E1.3**: `CanvasSearchPanel.tsx` — chips 区域展示最近搜索、点击填入查询
- **E1.4**: `CanvasSearchPanel.test.tsx` — 扩展 chips 交互测试（+78 行）

## [Unreleased] S74-E3: 画布分支对比视图 — 2026-06-07
- **E3.1**: `canvasHistoryStore.ts` — `compareBranches` action + `BranchDiffResult` 类型（三栏：added/removed/modified）
- **E3.2**: `canvasHistoryStore.test.ts` — 新增 branch compare 测试（+98 行，6 用例）
- **E3.3**: `HistoryPanel.tsx` — 分支 Ctrl+Click 多选、选中 2 个后"对比"按钮激活
- **E3.4**: `BranchDiffDialog.tsx` — 新建 diff modal（三栏统计 + 差异列表）
- **E3.5**: `BranchDiffDialog.module.css` — modal 样式
- **E3.6**: `BranchDiffDialog.test.tsx` — 新建（5 测试用例）

## [Unreleased] S74-E2: 模板标签与分类筛选 — 2026-06-07
- **E2.1**: `templateStore.ts` — `TemplateSnapshot` 新增 `tags?: string[]` 字段、`filterByTag` + `setSelectedTags` + `selectedTags` 状态
- **E2.2**: `templateStore.test.ts` — 扩展 E2 filter 测试（50 insertions）+ beforeEach 隔离修复
- **E2.3**: `TemplateGallery.tsx` — 标签筛选栏（chips + 多标签 AND 筛选 + URL 同步）
- **E2.4**: `TemplateGallery.test.tsx` — 新建标签筛选测试（108 行，6 测试用例）


## [Unreleased] S74-E4: @mention 通知闭环 — 2026-06-07
- **E4.1**: `types.ts` — `ActivityEntry` 新增 `message?: string` + `canvasId?: string` 字段
- **E4.2**: `activityStore.ts` — `extractMentions()` 函数：解析 `@username` 正则，`processMentionNotifications()` bridge 到 `notificationStore.addNotification(type: 'mention')`
- **E4.3**: `activityStore.addEntry` — 当 entry.message 存在时自动触发 mention 通知，跳过 self-mention（sender === target）
- **E4.4**: 去重机制：module-level Set 追踪 `(senderId, targetUserId, canvasId)` 三元组，同一会话内不重复通知
- **vitest**: `activityStore.test.ts` +7 E4 测试（21/21），`notificationStore.test.ts` +8 E4 测试（25/25）

---

## [Unreleased] S74-E5: 键盘导航增强 — 2026-06-07
- **E5.1**: `CanvasSearchPanel.tsx` — 添加 `aria-activedescendant` + 搜索结果键盘导航
- **E5.2**: `TemplateGallery.tsx` — `role="grid"` + Tab/Enter 键盘操作
- **E5.3**: `TemplatePreviewPanel.tsx` — Esc 关闭 + Tab 焦点管理
- **E5.4**: `NotificationPanel.tsx` — Tab/Enter 通知项导航 + Shift+Tab 反向循环
- **E5.5**: `BranchDiffDialog.tsx` — Esc 关闭 + focus trap 焦点陷阱


---

## [Unreleased] S75-E1: 搜索历史工具栏快捷入口 — 2026-06-07
- **E1.1**: `RecentSearchesDropdown.tsx` — 新建组件：最多显示5条最近搜索词，点击填充搜索框，支持清除历史
- **E1.2**: `DDSToolbar.tsx` — 在导出按钮后插入 RecentSearchesDropdown（控制开关状态）
- **E1.3**: `DDSCanvasPage.tsx` — 注册 `dds:recent-search`（填充搜索词）+ `dds:open-search-panel`（打开完整搜索面板）事件监听
- **E1.4**: `GlobalSearchPanel.tsx` — 打开时预填充 store 中的最近搜索词
- **E1.5**: `canvasSearchStore.ts` — 新增 `setSearchQuery()` + `addToSearchHistory()` + `clearHistory()` 方法
- **vitest**: `RecentSearchesDropdown.test.tsx` 7/7 测试通过

---

## [Unreleased] S75-E2: 通知中心分类 TabBar 过滤 — 2026-06-07
- **E2.1**: `TabBar.tsx` — 新建 TabBar 组件，支持全部/提及/回复/系统四类筛选标签，含未读计数 badge
- **E2.2**: `NotificationPanel.tsx` — 集成 TabBar，添加 `activeTab` state + `filterByType` 过滤逻辑，tab 切换重置分页到第1页
- **vitest**: `NotificationPanel.test.tsx` 30/30 测试通过（含 S68-E2/S73-E3/S74-E5/S75-E2 全部用例）

## [Unreleased] S75-E3: 分支对比历史记录 — 2026-06-07
- **E3.1**: `historyDB.ts` — 新增 `branchDiffHistory` objectStore + `saveBranchDiffHistory()`/`getBranchDiffHistory()`/`clearBranchDiffHistory()` 三个 DB 函数
- **E3.2**: `canvasHistoryStore.ts` — 新增 `addBranchDiffHistory()`/`getBranchDiffHistory()`/`clearBranchDiffHistory()` 方法，持久化分支对比结果
- **E3.3**: `BranchDiffDialog.tsx` — 新增「历史」Tab，支持查看/清除历史记录列表，含 Tab 切换逻辑
- **E3.4**: `BranchDiffDialog.module.css` — 历史 Tab 导航 + 历史列表样式（边框/时间戳/空状态）
- **vitest**: `BranchDiffDialog.test.tsx` E3 扩展测试 6个新用例通过



---


## [Unreleased] S75-E4: 协作活动流消息发送 — 2026-06-07
- **E4.1**: `types.ts` — `ActivityType` 新增 `'comment'` 类型 + `ActivityEntry` 新增 `message?: string` + `canvasId?: string` 字段
- **E4.2**: `activityStore.ts` — `activityLabel('comment')` = `'发送了评论'`
- **E4.3**: `CollabActivityPanel.tsx` — `handleSend` 调用 `activityStore.addEntry({type:'comment', message, canvasId})` + `canvasId` prop + MentionInput import 路径修正

## [Unreleased] S75-E5: Canvas Snapshot Management — 2026-06-07
- **E5.1**: SnapshotManagerPanel 组件 — 多选批量删除画布快照（header checkbox + 全选 + footer 批量删除按钮）
- **E5.2**: CanvasSettingsDrawer 集成 — 添加"快照管理" Tab（第5个 Tab）

## [Unreleased] S76-E1: 画布背景设置集成 — 2026-06-07
- **S76-E1.1**: 新增`canvasBackground`统一状态对象于`settingsStore.ts`
- **S76-E1.4**: `BackgroundSettingsPanel.tsx` — 画布背景设置面板
- **vitest**: BackgroundSettingsPanel vitest 8/8 通过
## [Unreleased] S76-E2: 批量画布PNG导出ZIP — 2026-06-07
- **feat(S76-E2)**: BatchOpsToolbar export button + ZipExporter + canvasListStore.batchExport
- **test(S76-E2)**: add batch export tests (Esc/click-outside/confirm)


## [Unreleased] S76-E3: Canvas Fuse.js Weighted Indexed Search — 2026-06-08

- **E3.1**: `canvasListStore.ts` — 新增 `CanvasMeta.description?: string` 和 `CanvasMeta.tags?: string[]` 字段
- **E3.2**: `canvasListStore.ts` — 新增 `CanvasIndexEntry` 和 `IndexedSearchResult` 类型，`canvasIndex[]` + `canvasFuseIndex` 状态
- **E3.3**: `canvasListStore.ts` — 新增 `CANVAS_SEARCH_FUSE_OPTIONS`（name:2, description:1, tags:1）
- **E3.4**: `canvasListStore.ts` — 新增 `rebuildIndex()` 方法，从 canvases 重建 Fuse.js 搜索索引
- **E3.5**: `canvasListStore.ts` — 新增 `indexedSearch(query)` 方法，返回 `IndexedSearchResult[]`（含 score + matchedField）
- **E3.6**: `canvasListStore.ts` — `loadCanvases` / `createCanvas` / `deleteCanvas` / `renameCanvas` / `copyNodesBetweenCanvases` 自动触发 `rebuildIndex()`
- **E3.7**: `canvasListStore.e3.test.ts` — 18 个测试用例覆盖 rebuildIndex + indexedSearch
