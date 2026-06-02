# VibeX Sprint 56 — IMPLEMENTATION_PARTITION

**Sprint**: Sprint 56
**日期**: 2026-06-02
**基于**: prd.md + architecture.md

---

## DoD 验收标准

### E1: 多画布管理（Canvas List）

**Epic 描述**：在 `/canvas-list` 页面显示所有画布网格，支持创建/删除/重命名。DDSToolbar Logo 点击跳转列表页。

| ID | 描述 | 验收标准 | 期望结果 |
|----|------|---------|---------|
| E1.1 | canvasListStore 持久化 | 画布创建/打开/删除后 store 与 IndexedDB 同步 | vitest: 3 cases |
| E1.2 | /canvas-list 页面显示 | 网格视图显示所有画布卡片（title + updatedAt） | 页面可渲染，≥1 card |
| E1.3 | DDSToolbar Logo 跳转 | 点击 Logo → `/canvas-list` | URL 变为 /canvas-list |
| E1.4 | 删除同步清除 | 删除画布后 IndexedDB + store 同步清除 | 列表长度 -1 |
| E1.5 | vitest 测试覆盖 | `canvasListStore.test.ts` 全通过 | 8/8 ✅ |

**测试文件**: `src/stores/canvasListStore.test.ts`（新增）

---

### E2: 收藏画布 / Favorites

**Epic 描述**：在 canvas-list 卡片右上角显示星标按钮，点击切换收藏状态。收藏画布在列表置顶显示。

| ID | 描述 | 验收标准 | 期望结果 |
|----|------|---------|---------|
| E2.1 | 收藏状态持久化 | `favoriteIds` 存 localStorage，刷新后保留 | localStorage 键存在 |
| E2.2 | 收藏置顶 | 收藏画布在 canvas-list 默认排在最前 | favoriteIds[0] 在列表首位 |
| E2.3 | 星标切换 | 点击星标 toggle favorites，无需刷新 | 状态即时响应 |
| E2.4 | vitest favorites 用例 | `canvasListStore.test.ts` favorites 覆盖 | favorites 相关用例 4/4 ✅ |

**涉及文件**:
- `src/stores/canvasListStore.ts` — 修改（新增 `favoriteIds` + `toggleFavorite` + `isFavorite` + localStorage persist）
- `src/components/dds/canvas-dashboard/CanvasDashboard.tsx` — 修改（排序逻辑 favorites 优先）
- `src/components/dds/canvas-dashboard/CanvasCard.tsx` — 新增（卡片：thumbnail + name + updatedAt + 收藏星标）

---

### E3: 离线模式 / PWA 缓存

**Epic 描述**：注册 Service Worker 实现 App Shell 离线缓存。断网时显示 Banner，联网后自动消失。

| ID | 描述 | 验收标准 | 期望结果 |
|----|------|---------|---------|
| E3.1 | SW 注册 | `/sw.js` 注册成功，安装无报错 | SW state: 'installed' |
| E3.2 | 离线页面加载 | 断网状态下 `/canvas-list` 可加载 | 页面 DOM 存在 |
| E3.3 | 离线 Banner | 断网显示 Banner，联网自动消失 | Banner visibility 正确切换 |
| E3.4 | vitest PWA 用例 | `pwa.test.ts` 全通过 | 相关用例 ✅ |

**涉及文件**:
- `public/sw.js` — 新增（Cache-First + App Shell 策略）
- `public/manifest.json` — 新增（PWA manifest）
- `src/components/dds/canvas/OfflineBanner.tsx` — 新增（离线状态 Banner 组件）
- `src/app/layout.tsx` — 修改（SW 注册 + OfflineBanner 挂载）
- `src/__tests__/pwa.test.ts` — 新增

---

## 技术风险

| 风险 | 影响 | 缓解方案 |
|------|------|---------|
| Service Worker 在非 HTTPS 环境不可用 | localhost 调试受限 | dev 模式使用 `pnpm dev` (HTTPS via mkcert 或开发 flag) |
| IndexedDB 在 SSR 期间不可用 | Next.js SSR 报错 | `canvasListStore` 仅在 Client Components 中使用，SSR 时 `isLoaded=false` |
| localStorage favorites 与 IndexedDB 数据不同步 | 数据不一致 | favorites 独立存储，画布 CRUD 操作不影响 favorites |

---

## 依赖关系

```
E1 (测试)
  └─ E2 (依赖 canvasListStore 扩展)
        └─ E3 (独立，PWA 基础设施)
```

**注意**：E2 依赖 E1 的 store 基础结构，但 E3 完全独立。

---

## 测试覆盖率目标

| Epic | 目标测试数 | 测试文件 |
|------|-----------|---------|
| E1 | 8 | `src/stores/canvasListStore.test.ts` |
| E2 | 4 | 同上（favorites block） |
| E3 | 4 | `src/__tests__/pwa.test.ts` |
