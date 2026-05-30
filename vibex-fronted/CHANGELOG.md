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