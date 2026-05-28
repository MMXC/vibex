## [Unreleased] S39-P005-E1: Service Worker 注册 + 静态资源缓存
- **E1 SWRegistration**: `src/components/sw/SWRegistration.tsx` — useEffect 中调用 navigator.serviceWorker.register("/sw.js")，带错误处理和 updatefound 事件监听
- **E1 layout.tsx 集成**: 在 layout.tsx body 中渲染 SWRegistration Client Component
- **E1 sw.js 验证**: public/sw.js 已存在（Workbox v1，Cache-First 静态资源 + networkFirst API）
- **E1 console.log('[SW] Registered')**: 浏览器 DevTools → Application → Service Workers 可见

## [Unreleased] S39-P005-E3: manifest.json + PWA 图标 + Lighthouse 优化
- **E3 manifest.json 验证**: public/manifest.json 已包含 name, short_name, start_url, display, icons (192x192 + 512x512)，无需修改
## [Unreleased] S39-P004-E1: MiniMap 搜索 + 节点高亮 + 视口边框
- **E1 useMiniMapSearch hook**: `src/hooks/useMiniMapSearch.ts` — 搜索词、高亮节点集、搜索回调
- **E1 搜索输入框**: `src/app/domain/DomainPageContent.tsx` — 搜索节点...输入框，带清除按钮
- **E1 节点高亮**: MiniMap nodeColor 动态化，匹配节点返回红色高亮（#ef4444）
- **E1 视口边框**: MiniMapViewportBorder 组件，ViewportPortal + SVG rect 标注当前视口范围
