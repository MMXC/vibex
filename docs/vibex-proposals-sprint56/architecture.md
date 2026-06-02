# VibeX Sprint 56 — 架构设计文档

**Sprint**: Sprint 56
**日期**: 2026-06-02
**基于**: analysis.md + prd.md

---

## 现有架构状态（已验证 on origin/main）

### 已有的核心资产（S47-E4 + S55-E3 已交付）

| 资产 | 位置 | 状态 |
|------|------|------|
| `canvasListStore` | `src/stores/canvasListStore.ts` | S47-E4: IndexedDB persist, CRUD, search, batch-export, cross-canvas paste ✅ |
| `CanvasDashboard` | `src/components/dds/canvas-dashboard/CanvasDashboard.tsx` | S55-E3: grid view, create/delete/rename ✅ |
| `/canvas-list` route | `src/app/canvas-list/page.tsx` | S55-E3: renders CanvasDashboard ✅ |
| DDSToolbar | `src/components/dds/toolbar/DDSToolbar.tsx` | S55-E3: Logo → canvas-list 导航已添加 ✅ |

---

## E1: 多画布管理（Canvas List）

### 现有状态
- ✅ `canvasListStore` — S47-E4 已实现：IndexedDB 持久化、CRUD、排序
- ✅ `/canvas-list` 页面 — S55-E3 已实现：CanvasDashboard 渲染
- ✅ DDSToolbar Logo 跳转 — S55-E3 已添加
- ✅ 删除同步 — canvasListStore.deleteCanvas 已实现

### 需新增
- **`src/stores/canvasListStore.test.ts`**（测试文件）：覆盖 IndexedDB 持久化、CRUD、排序等核心场景

### 架构决策
- **技术选型**：复用 `canvasListStore`（无需新建 store）
- **测试策略**：`describe('canvasListStore')` with `beforeEach` using `act()` + `vi.useFakeTimers()` for async operations

---

## E2: 收藏画布 / Favorites

### 现有状态
- `canvasListStore` **不含** `favoriteIds` 字段

### 需新增

| 新增文件 | 职责 |
|---------|------|
| `src/stores/canvasListStore.ts` (修改) | 新增 `favoriteIds: string[]` + `toggleFavorite(id)` + `isFavorite(id)` actions；localStorage 持久化 |
| `src/components/dds/canvas-dashboard/CanvasDashboard.tsx` (修改) | CanvasCard 右上角星标按钮，点击调用 `toggleFavorite` |
| `src/components/dds/canvas-dashboard/CanvasCard.tsx` (新增) | 卡片组件：thumbnail + name + updatedAt + 收藏星标 |

### 架构决策
- **持久化**：`favoriteIds` 存 localStorage（`vibex-favorites` key），`canvasListMeta` 独立于 IndexedDB 存储（避免 IndexedDB 结构膨胀）
- **排序逻辑**：`CanvasDashboard` 调用 `store.getFilteredCanvases()` 时 favorites 优先（sorted favorites + rest）
- **测试策略**：在 `canvasListStore.test.ts` 中新增 favorites describe block

---

## E3: 离线模式 / PWA 缓存

### 需新增

| 新增文件 | 职责 |
|---------|------|
| `public/sw.js` | Service Worker：App Shell 缓存策略（canvas-list 页面 + 静态资源） |
| `public/manifest.json` | PWA manifest：name, icons, start_url, display: standalone |
| `src/components/dds/canvas/OfflineBanner.tsx` | 离线 Banner：检测 `navigator.onLine`，断网时显示，联网时自动消失 |
| `src/app/layout.tsx` (修改) | 注册 SW + 挂载 OfflineBanner |
| `src/__tests__/pwa.test.ts` (新增) | PWA 相关测试 |

### 架构决策
- **Service Worker**：原生 Fetch 拦截 + Cache-First 策略（App Shell 优先，动态内容走网络）
- **离线 Banner**：Zustand `offlineBannerStore`（`isOnline: boolean`），监听 `window.online/offline` 事件更新
- **兼容性**：优先原生 API，无需 Workbox 依赖（保持 bundle size）

### 测试策略
- SW 注册：`navigator.serviceWorker.register` mock 验证注册调用
- Banner 可见性：手动设置 `navigator.onLine = false` 触发显示

---

## Epic 汇总

| Epic | 功能 | 优先级 | 现有完成度 | 增量范围 |
|------|------|--------|-----------|---------|
| E1 | 多画布管理 | P0 | ~90%（store+页面+DDSToolbar） | 测试文件 |
| E2 | 收藏画布 | P0 | 0% | store扩展 + CanvasCard + 星标按钮 |
| E3 | 离线模式 PWA | P1 | 0% | SW + manifest + Banner + layout集成 |
