# VibeX Sprint 39 — IMPLEMENTATION PLAN

**Agent**: hermes (coord heartbeat self-implement)
**日期**: 2026-05-28
**触发**: architect-review CLI-dispatch ghost — coord self-implemented architect-review

---

## 功能概览

| ID | 标题 | 优先级 | Epic 数 |
|----|------|--------|---------|
| P001 | i18n 收尾：AI 生成区翻译迁移 | P0 | 1 |
| P002 | 实时协作同步层（WebSocket + 操作广播） | P0 | 3 |
| P003 | DiffOverlay 增强 + 评分卡调优 | P1 | 2 |
| P004 | MiniMap 搜索 + 节点高亮导航 | P1 | 1 |
| P005 | Service Worker 离线缓存 + 加载体验 | P1 | 3 |

**Epic 依赖关系**：
```
P001-E1 (i18n AI 页面)
P002-E1 (WebSocket 连接层) → P002-E2 (OT 冲突检测) → P002-E3 (用户在线状态)
P003-E1 (DiffOverlay 多文件 tab) → P003-E2 (评分卡复杂度)
P004-E1 (MiniMap 搜索 + 视口边框)
P005-E1 (SW 注册) → P005-E2 (语言包 + API 降级) → P005-E3 (manifest, 已完成)
```

---

## P001-E1: i18n AI 页面迁移

**所属功能**: P001 — i18n 收尾：AI 生成区翻译迁移
**预估工时**: 2h
**分支**: `epic/s39-p001-i18n-ai-page`

### DoD Checklist

- [ ] 确认 `src/app/ai/` 目录存在，如不存在则新建
- [ ] 新建/修改 `src/app/ai/page.tsx`，使用 `useTranslations('ai')()` 替换所有硬编码中文
- [ ] `src/i18n/messages/en.json` 包含完整 `ai.*` key 翻译
- [ ] `src/i18n/messages/zh.json` 包含完整 `ai.*` key 翻译
- [ ] App Router 兼容性：`page.tsx` 接受 `locale` 参数，或标记为 Client Component
- [ ] `next-intl` 中间件处理 `Accept-Language` header
- [ ] 语言偏好持久化到 `userPreferencesStore.locale`
- [ ] `pnpm exec tsc --noEmit` 成功
- [ ] dual-CHANGELOG 已更新

### 实现文件

- 新建: `vibex-fronted/src/app/ai/page.tsx`
- 新建: `vibex-fronted/src/app/ai/ai.module.css`
- 修改: `vibex-fronted/src/i18n/messages/en.json` (ai namespace)
- 修改: `vibex-fronted/src/i18n/messages/zh.json` (ai namespace)
- 修改: `vibex-fronted/src/components/DDSToolbar/DDSToolbar.tsx` (如包含 AI 按钮 i18n)

### 参考: DDSToolbar 已有 i18n key
```typescript
// vibex-fronted/src/i18n/messages/en.json 已有:
"toolbar": {
  "aiGenerate": "AI Generate",
  "aiGenerating": "Generating...",
  ...
}
```

---

## P002-E1: WebSocket 连接层 + useCollaboration Hook

**所属功能**: P002 — 实时协作同步层
**预估工时**: 3h
**分支**: `epic/s39-p002-collab-websocket`
**前置依赖**: 无

### DoD Checklist

- [ ] WebSocket 客户端初始化：`new WebSocket('wss://ws.vibex.top?token=<jwt>')`
- [ ] JWT token 注入（从 localStorage 读取 `vibex-token`）
- [ ] `useCollaboration.ts` hook: `connect()`, `disconnect()`, `broadcast(type, payload)`, `subscribe(handler)`
- [ ] 自动重连逻辑：指数退避，最多 3 次重试
- [ ] `businessFlowStore` bridge：`updateNode`/`addNode`/`deleteNode` 时调用 `broadcast()`
- [ ] `pnpm exec tsc --noEmit` 成功
- [ ] dual-CHANGELOG 已更新

### 实现文件

- 新建: `vibex-fronted/src/lib/collaboration/useCollaboration.ts`
- 新建: `vibex-fronted/src/lib/collaboration/websocket.ts`
- 修改: `vibex-fronted/src/stores/businessFlowStore.ts` (broadcast bridge)
- 新建: `vibex-fronted/src/lib/collaboration/__tests__/useCollaboration.test.ts`

### WebSocket 协议

```typescript
// Client → Server
{ type: 'auth', token: string }
{ type: 'action', payload: { nodeId: string, action: 'update'|'add'|'delete', data: any, timestamp: number } }

// Server → Client
{ type: 'remote_action', payload: { userId: string, nodeId: string, action: string, data: any } }
{ type: 'presence', users: [{ userId: string, name: string, avatar: string }] }
{ type: 'conflict', nodeId: string, conflictingUserId: string }
```

---

## P002-E2: canvas 操作 OT 合并 + 冲突检测

**所属功能**: P002 — 实时协作同步层
**预估工时**: 2h
**分支**: `epic/s39-p002-collab-websocket`
**前置依赖**: P002-E1

### DoD Checklist

- [ ] 收到远程 `updateNode` 时，检查本地 `oplog` 最近 1s 内是否有同 `nodeId` 的写入
- [ ] 冲突时：本地 Toast 显示"⚠️ 与用户 X 的修改冲突"
- [ ] 冲突节点边框变黄（复用 `confirmationStore.conflictSnapshots`）
- [ ] `confirmationStore.conflictNodeIds` 更新
- [ ] `pnpm exec tsc --noEmit` 成功
- [ ] dual-CHANGELOG 已更新

### 实现文件

- 修改: `vibex-fronted/src/stores/confirmationStore.ts` (conflictNodeIds)
- 修改: `vibex-fronted/src/lib/collaboration/useCollaboration.ts` (conflict detection)
- 修改: `vibex-fronted/src/components/DDSCanvas/DDSFlow.tsx` (yellow border style)

---

## P002-E3: 用户在线状态 UI

**所属功能**: P002 — 实时协作同步层
**预估工时**: 1h
**分支**: `epic/s39-p002-collab-websocket`
**前置依赖**: P002-E2

### DoD Checklist

- [ ] 解析 WS `presence` 消息，更新在线用户列表
- [ ] DDSToolbar 右下角显示在线用户头像堆叠（最多 3 个 + `+N`）
- [ ] 用户下线时从列表移除（WebSocket close 事件）
- [ ] `pnpm exec tsc --noEmit` 成功
- [ ] dual-CHANGELOG 已更新

### 实现文件

- 新建: `vibex-fronted/src/components/OnlineUsers/OnlineUsers.tsx`
- 新建: `vibex-fronted/src/components/OnlineUsers/online-users.module.css`
- 修改: `vibex-fronted/src/components/DDSToolbar/DDSToolbar.tsx` (集成 OnlineUsers)

---

## P003-E1: DiffOverlay 多文件 Tab + Token 估算

**所属功能**: P003 — DiffOverlay 增强 + 评分卡调优
**预估工时**: 1.5h
**分支**: `epic/s39-p003-diffoverlay-enhance`

### DoD Checklist

- [ ] DiffOverlay 增加 `files: DiffFile[]` state 和 `activeTab` state
- [ ] 每个文件一个 tab，tab label = 文件名
- [ ] 切换 tab 时显示对应文件的 diff 内容
- [ ] Token 估算显示：`new Blob([code]).size * 0.75` ≈ tokens
- [ ] Token 估算显示在文件概览区
- [ ] `pnpm exec tsc --noEmit` 成功
- [ ] dual-CHANGELOG 已更新

### 实现文件

- 修改: `vibex-fronted/src/components/DiffOverlay/DiffOverlay.tsx`
- 修改: `vibex-fronted/src/components/DiffOverlay/diff-overlay.module.css`
- 新建: `vibex-fronted/src/components/DiffOverlay/__tests__/DiffOverlay.test.tsx`

---

## P003-E2: 评分卡复杂度指标

**所属功能**: P003 — DiffOverlay 增强 + 评分卡调优
**预估工时**: 1h
**分支**: `epic/s39-p003-diffoverlay-enhance`
**前置依赖**: P003-E1

### DoD Checklist

- [ ] AIScoreCard 显示 "代码行数: N 行"
- [ ] AIScoreCard 显示 "Token 估算: ~M tokens"
- [ ] 圈复杂度估算：使用 Halstead Volume / LOC 近似，显示 "复杂度评分: X/10"
- [ ] 总评分 = 行数分 × 0.4 + Token分 × 0.3 + 复杂度分 × 0.3
- [ ] `pnpm exec tsc --noEmit` 成功
- [ ] dual-CHANGELOG 已更新

### 实现文件

- 修改: `vibex-fronted/src/components/AIScoreCard/AIScoreCard.tsx`
- 修改: `vibex-fronted/src/components/AIScoreCard/ai-score-card.module.css`
- 新建: `vibex-fronted/src/lib/analysis/complexity.ts` (复杂度估算)

---

## P004-E1: MiniMap 搜索 + 节点高亮 + 视口边框

**所属功能**: P004 — MiniMap 搜索 + 节点高亮导航
**预估工时**: 2h
**分支**: `epic/s39-p004-minimap-search`

### DoD Checklist

- [ ] `useMiniMapSearch.ts` hook: `searchTerm`, `setSearchTerm`, `highlightedNodes`
- [ ] DDSCanvasPage 增加搜索输入框（`搜索节点...`）
- [ ] MiniMap `nodeColor` prop：高亮节点蓝色 `#3b82f6`，普通节点灰色 `#2d3748`
- [ ] MiniMap `onClick`：调用 `fitView()` 或 `setViewport` 跳转到节点
- [ ] MiniMap viewport border：使用 `@xyflow/react` `ViewportPortal` + SVG `<rect>` 标注当前视口范围
- [ ] 搜索无结果时 MiniMap 显示全部节点（`highlightedNodes = []` 时不过滤）
- [ ] `pnpm exec tsc --noEmit` 成功
- [ ] dual-CHANGELOG 已更新

### 实现文件

- 新建: `vibex-fronted/src/hooks/useMiniMapSearch.ts`
- 新建: `vibex-fronted/src/components/DDSCanvas/DDSCanvasPage.module.css` (搜索框样式)
- 修改: `vibex-fronted/src/components/DDSCanvas/DDSFlow.tsx` (集成 MiniMap)
- 修改: `vibex-fronted/src/components/DDSCanvas/DDSCanvasPage.tsx` (搜索框 + MiniMap 搜索集成)
- 新建: `vibex-fronted/src/components/DDSCanvas/__tests__/useMiniMapSearch.test.ts`

### 验证命令

```bash
grep -n "MiniMap" vibex-fronted/src/components/DDSCanvas/DDSFlow.tsx
grep "export.*MiniMap" vibex-fronted/node_modules/@xyflow/react/dist/esm/index.js
```

### @xyflow/react 内置组件确认

`@xyflow/react ^12.10.1` 已导出：`MiniMap`, `MiniMapNode`, `ViewportPortal`, `Controls`, `Background`, `Panel`。**无需安装额外 npm 包**。

---

## P005-E1: Service Worker 注册 + 静态资源缓存

**所属功能**: P005 — Service Worker 离线缓存 + 加载体验
**预估工时**: 2h
**分支**: `epic/s39-p005-service-worker`
**前置依赖**: 无

### DoD Checklist

- [ ] `public/sw.js` 存在（Workbox build 输出，已有，E05 产物）
- [ ] `src/app/layout.tsx` 客户端组件中调用 `navigator.serviceWorker.register('/sw.js')`
- [ ] Workbox 配置: `CacheFirst` for `/static/*`, `StaleWhileRevalidate` for fonts
- [ ] SW 激活日志：`console.log('[SW] Registered')` 在 browser console
- [ ] 离线验证：DevTools → Network → Offline → 刷新页面，资源仍加载
- [ ] `pnpm build` 成功
- [ ] dual-CHANGELOG 已更新

### 实现文件

- 修改: `vibex-fronted/src/app/layout.tsx` (SW 注册，客户端组件)
- 新建: `vibex-fronted/src/components/OfflineIndicator/OfflineIndicator.tsx`
- 新建: `vibex-fronted/src/stores/uiStore.ts` (isOffline state)

### 现有 sw.js 评估

现有 `public/sw.js`（E05 产物）已实现：CacheFirst 静态、NetworkFirst API、IndexedDB 离线队列、App Shell 预缓存。**无需重写**，只需在 layout.tsx 中注册。

---

## P005-E2: 语言包 + API 降级离线

**所属功能**: P005 — Service Worker 离线缓存 + 加载体验
**预估工时**: 1h
**分支**: `epic/s39-p005-service-worker`
**前置依赖**: P005-E1

### DoD Checklist

- [ ] 语言包缓存：`workbox.precaching.precacheAndRoute([...])` 包含 `/i18n/messages/*.json`
- [ ] API 降级：`fetch('/api/...')` 包装器，失败时返回 `Cache.match()` 或 `{ offline: true }`
- [ ] 离线指示器：`isOffline` state → DDSToolbar 显示"📴 离线" badge
- [ ] `pnpm exec tsc --noEmit` 成功
- [ ] dual-CHANGELOG 已更新

### 实现文件

- 修改: `vibex-fronted/public/sw.js` (语言包 precache 列表)
- 新建: `vibex-fronted/src/lib/api/apiClient.ts` (fetch wrapper with offline fallback)
- 修改: `vibex-fronted/src/components/DDSToolbar/DDSToolbar.tsx` (离线 badge)

---

## P005-E3: manifest.json + PWA 图标 + Lighthouse 优化

**所属功能**: P005 — Service Worker 离线缓存 + 加载体验
**预估工时**: 1h
**分支**: `epic/s39-p005-service-worker`
**前置依赖**: P005-E2

### 现状评估

现有 `public/manifest.json` 已包含：
- `name`, `short_name`, `start_url: '/'`, `display: 'standalone'`
- `icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]`
- `background_color`, `theme_color`

**manifest.json 目标已达成**，本 Epic 专注于 Lighthouse PWA 评分验证。

### DoD Checklist

- [ ] 验证 manifest.json 所有字段符合 PWA 标准
- [ ] Lighthouse PWA 评分 ≥ 70（首次），目标 ≥ 90
- [ ] 修复 Lighthouse 发现的可安装性问题
- [ ] `pnpm build` 成功
- [ ] dual-CHANGELOG 已更新

### Lighthouse 常见 PWA 问题

- 缺少 `apple-touch-icon`
- 缺少 `theme-color` meta tag
- SW 未正确激活

---

## 测试策略

| Epic | vitest 单元测试 | Playwright E2E |
|------|---------------|----------------|
| P001-E1 | `src/i18n/` 相关测试 | `/en/ai` 和 `/zh/ai` 语言切换 |
| P002-E1 | `useCollaboration.test.ts` (mock WebSocket) | — |
| P002-E2 | 冲突检测单元测试 | 双窗口同时编辑 |
| P002-E3 | 在线用户列表组件测试 | 用户上线/下线验证 |
| P003-E1 | `DiffOverlay.test.tsx` | DiffOverlay 多文件 tab 切换 |
| P003-E2 | `AIScoreCard.test.tsx` (复杂度计算) | 评分卡指标展示 |
| P004-E1 | `useMiniMapSearch.test.ts` | MiniMap 搜索 + 跳转 |
| P005-E1 | — | DevTools 离线验证 |
| P005-E2 | `apiClient.test.ts` (offline fallback) | API 降级验证 |
| P005-E3 | — | Lighthouse CLI |

---

## Phase2 Epic DoD 总览

| Epic | Dev DoD | Tester 验收 | Reviewer 验收 |
|------|---------|-------------|---------------|
| P001-E1 | AI 页面 i18n 化 + tsc + dual-CHANGELOG | vitest i18n + E2E | TypeScript 编译 + CHANGELOG |
| P002-E1 | WebSocket 层 + broadcast bridge | vitest useCollaboration | tsc + CHANGELOG |
| P002-E2 | 冲突检测 + Toast + 边框样式 | vitest + E2E 双窗口 | CHANGELOG |
| P002-E3 | 在线用户 UI + DDSToolbar 集成 | vitest + 手动验证 | tsc + CHANGELOG |
| P003-E1 | DiffOverlay tab + Token 估算 | vitest DiffOverlay | tsc + CHANGELOG |
| P003-E2 | 评分卡复杂度指标 | vitest AIScoreCard | tsc + CHANGELOG |
| P004-E1 | MiniMap 搜索 + 视口边框 | vitest + E2E | tsc + CHANGELOG |
| P005-E1 | SW 注册 + DevTools 离线验证 | 手动离线测试 | build + CHANGELOG |
| P005-E2 | 语言包 precache + API 降级 | 手动离线测试 | tsc + CHANGELOG |
| P005-E3 | Lighthouse ≥ 70 | 手动 Lighthouse | CHANGELOG |

---

## Epic 流水线顺序

```
dev-P001-E1 → tester-P001-E1 → reviewer-P001-E1 → reviewer-push-P001-E1
dev-P002-E1 → tester-P002-E1 → reviewer-P002-E1 → reviewer-push-P002-E1
dev-P002-E2 → tester-P002-E2 → reviewer-P002-E2 → reviewer-push-P002-E2
dev-P002-E3 → tester-P002-E3 → reviewer-P002-E3 → reviewer-push-P002-E3
dev-P003-E1 → tester-P003-E1 → reviewer-P003-E1 → reviewer-push-P003-E1
dev-P003-E2 → tester-P003-E2 → reviewer-P003-E2 → reviewer-push-P003-E2
dev-P004-E1 → tester-P004-E1 → reviewer-P004-E1 → reviewer-push-P004-E1
dev-P005-E1 → tester-P005-E1 → reviewer-P005-E1 → reviewer-push-P005-E1
dev-P005-E2 → tester-P005-E2 → reviewer-P005-E2 → reviewer-push-P005-E2
dev-P005-E3 → tester-P005-E3 → reviewer-P005-E3 → reviewer-push-P005-E3
→ coord-completed
```

**P002-E1 到 P002-E3 为串行流水线**（E1 是基础，E2/E3 依赖 E1）。
**P001/P003/P004/P005 组内各 Epic 可并行开发**（相互独立）。

---

## 技术约束（所有 Epic 通用）

1. 禁止在 `src/app/` 下使用内联 `style={{}}` 定义颜色/间距/字体
2. 禁止 commit 无 Epic 标识的 message（格式: `feat(S39-P00X-EY): ...`）
3. 所有 Epic 变更必须更新 dual-CHANGELOG（`vibex-fronted/CHANGELOG.md` + `/root/.openclaw/vibex/CHANGELOG.md`）
4. `pnpm exec tsc --noEmit` 必须通过后才能提 PR
5. 使用 `@xyflow/react` 内置组件（MiniMap, Controls, Background, Panel, ViewportPortal），无需安装额外 npm 包
