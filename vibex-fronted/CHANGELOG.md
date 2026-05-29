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

## [Unreleased] S39-P005-E1: Service Worker 注册 + 静态资源缓存
- **E1 SWRegistration**: `src/components/sw/SWRegistration.tsx` — useEffect 中调用 navigator.serviceWorker.register("/sw.js")，带错误处理和 updatefound 事件监听
- **E1 layout.tsx 集成**: 在 layout.tsx body 中渲染 SWRegistration Client Component
- **E1 sw.js 验证**: public/sw.js 已存在（Workbox v1，Cache-First 静态资源 + networkFirst API）
- **E1 console.log('[SW] Registered')**: 浏览器 DevTools → Application → Service Workers 可见

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
