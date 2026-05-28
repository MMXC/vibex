## [Unreleased] S39-P005-E1: Service Worker 注册 + 静态资源缓存
- **E1 SWRegistration**: `src/components/sw/SWRegistration.tsx` — useEffect 中调用 navigator.serviceWorker.register("/sw.js")，带错误处理和 updatefound 事件监听
- **E1 layout.tsx 集成**: 在 layout.tsx body 中渲染 SWRegistration Client Component
- **E1 sw.js 验证**: public/sw.js 已存在（Workbox v1，Cache-First 静态资源 + networkFirst API）
- **E1 console.log('[SW] Registered')**: 浏览器 DevTools → Application → Service Workers 可见

## [Unreleased] S39-P002-E1: WebSocket 连接层 + useCollaboration Hook
- **E1 WebSocket 客户端**: `src/lib/collaboration/websocket.ts` — JWT token 注入（localStorage vibex-token）、自动重连（指数退避，最多 3 次）
- **E1 useCollaboration hook**: `src/lib/collaboration/useCollaboration.ts` — connect/disconnect/broadcast/subscribe，onlineUsers 状态
- **E1 useCanvasCollabBridge**: `src/lib/collaboration/canvasCollabBridge.ts` — DDSCanvasStore ↔ WebSocket 广播桥接，远程操作冲突检测
- **E1 单元测试**: `src/lib/collaboration/__tests__/useCollaboration.test.ts` — WebSocket 消息收发、远程操作、在线用户、冲突检测

## [Unreleased] S39-P002-E2: Canvas 操作 OT 合并 + 冲突检测
- **E2 冲突检测 (5s窗口)**: `src/stores/oplogStore.ts` — addOplogEntry() 内嵌冲突检测，同节点ID在5秒内有写入则触发 conflictToastEmitter
- **E2 Toast UI**: conflictToastEmitter + useOplogConflictToast hook，已集成到 DDSToolbar + CanvasPage
- **E2 ConfirmationStore**: `src/stores/confirmationStore.ts` — conflictNodeIds（Record<string,number>，含过期时间戳）、conflictSnapshots（Record<string,OperationEntry[]>）
- **E2 冲突边框**: canvasCollabBridge.ts onConflict 回调调用 conflictToastEmitter.emit()，冲突节点 DDSCanvas 黄色边框由 confirmationStore 状态驱动

## [Unreleased] S39-P002-E3: 用户在线状态 UI
- **E3 OnlineUsers 组件**: `src/components/dds/toolbar/OnlineUsers.tsx` — 头像堆叠展示，最多3个 + "+N" 溢出，支持 initials 回退
- **E3 DDSToolbar 集成**: DDSToolbar 右下角渲染 `<OnlineUsers users={onlineUsers} maxVisible={4} />`
- **E3 WebSocket Presence**: useCollaboration.ts 解析 `presence` WS 消息，setOnlineUsers() 更新在线用户列表
- **E3 WebSocket Close**: WS close 事件触发 setOnlineUsers([])，用户下线自动从列表移除

## [Unreleased] S39-P005-E2: SW Cache Strategy 验证
- **E2 sw.js 缓存策略**: public/sw.js 已包含完整 Workbox 缓存 — cacheFirst（JS/CSS/图片/font）、networkFirst（/api/）、stale-while-revalidate（其他）、离线写入队列（IndexedDB）

## [Unreleased] S39-P005-E3: manifest.json + PWA 图标 + Lighthouse 优化
- **E3 manifest.json 验证**: public/manifest.json 已包含 name, short_name, start_url, display, icons (192x192 + 512x512)，无需修改
## [Unreleased] S39-P004-E2: Canvas 节点点击 → 视口导航
- **E2 onNodeClick**: ReactFlow onNodeClick → reactFlow.setViewport() 300ms 动画居中

## [Unreleased] S39-P004-E1: MiniMap 搜索 + 节点高亮 + 视口边框
- **E1 useMiniMapSearch hook**: `src/hooks/useMiniMapSearch.ts` — 搜索词、高亮节点集、搜索回调
- **E1 搜索输入框**: `src/app/domain/DomainPageContent.tsx` — 搜索节点...输入框，带清除按钮
- **E1 节点高亮**: MiniMap nodeColor 动态化，匹配节点返回红色高亮（#ef4444）
- **E1 视口边框**: MiniMapViewportBorder 组件，ViewportPortal + SVG rect 标注当前视口范围
