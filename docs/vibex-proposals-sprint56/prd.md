# VibeX Sprint 56 — 产品需求文档

**Sprint**: Sprint 56
**日期**: 2026-06-02
**基于**: analysis.md + proposals/20260602/analyst.md

---

## 执行摘要

Sprint 56 聚焦三个高价值功能：多画布管理（P0）、收藏画布（P0）、离线模式 PWA（P1）。这三项功能填补了 VibeX 的核心体验缺口——从"单画布可用"升级到"多画布可管理"。

---

## Epic-Story 表格

| Epic | 功能 | 优先级 | 验收标准数 |
|------|------|--------|-----------|
| E1 | 多画布管理（Canvas List） | P0 | 5 |
| E2 | 收藏画布 / Favorites | P0 | 4 |
| E3 | 离线模式 / PWA 缓存 | P1 | 4 |

---

## 功能详情

### E1: 多画布管理（Canvas List）

**用户故事**: 作为高频用户，我希望在一个页面看到所有画布并快速切换，这样无需记住每个画布的 URL。

**DoD**:
- [ ] `canvasListStore` 在 IndexedDB 中持久化，画布创建/打开/删除后 store 同步更新
- [ ] `/canvas-list` 页面显示所有画布卡片（title + updatedAt）
- [ ] DDSToolbar Logo 点击跳转 canvas-list
- [ ] 删除画布后 IndexedDB + store 同步清除
- [ ] vitest `canvasListStore.test.ts` 全通过

**expect() 断言示例**:
```typescript
// canvasListStore.test.ts
expect(store.canvases.length).toBeGreaterThan(0);
expect(store.canvases[0]).toHaveProperty('id');
expect(store.canvases[0]).toHaveProperty('title');
```

**涉及文件**:
- `src/stores/dds/canvasListStore.ts` (新增)
- `src/app/canvas-list/page.tsx` (新增)
- `src/components/dds/toolbar/DDSToolbar.tsx` (修改)
- `src/stores/dds/canvasListStore.test.ts` (新增)

---

### E2: 收藏画布 / Favorites

**用户故事**: 作为高频用户，我希望收藏常用画布，这样在 canvas-list 页面能一眼看到最重要的画布。

**DoD**:
- [ ] 收藏状态在 localStorage 中持久化，刷新后保留
- [ ] 收藏画布在 canvas-list 置顶显示
- [ ] 点击星标切换收藏状态，无需刷新
- [ ] vitest `canvasListStore.test.ts` favorites 相关用例通过

**expect() 断言示例**:
```typescript
// canvasListStore.test.ts
act(() => { store.toggleFavorite('canvas-1'); });
expect(store.favoriteIds).toContain('canvas-1');
act(() => { store.toggleFavorite('canvas-1'); });
expect(store.favoriteIds).not.toContain('canvas-1');
```

**涉及文件**:
- `src/stores/dds/canvasListStore.ts` (修改，扩展 favoriteIds)
- `src/app/canvas-list/page.tsx` (修改，卡片添加星标)
- `src/components/dds/canvas-list/CanvasCard.tsx` (新增)

---

### E3: 离线模式 / PWA 缓存

**用户故事**: 作为移动端用户，我希望在断网后仍能看到 canvas-list 页面和已打开的画布。

**DoD**:
- [ ] `/sw.js` 注册成功，Service Worker 安装无报错
- [ ] 离线状态下 `/canvas-list` 页面可加载（App Shell）
- [ ] 离线 banner 在断网时显示，联网后自动消失
- [ ] vitest 相关用例通过

**expect() 断言示例**:
```typescript
// PWA 相关测试
expect('serviceWorker' in navigator).toBe(true);
// offline banner visibility
expect(offlineBanner).toHaveClass('visible');
```

**涉及文件**:
- `public/sw.js` (新增)
- `public/manifest.json` (新增)
- `src/components/dds/canvas/OfflineBanner.tsx` (新增)
- `src/app/layout.tsx` (修改，注册 SW)

---

## 验收标准汇总

| Epic | expect() 数量 | vitest 文件 |
|------|-------------|------------|
| E1 多画布管理 | 5 | canvasListStore.test.ts |
| E2 收藏画布 | 4 | canvasListStore.test.ts |
| E3 离线模式 | 4 | pwa.test.ts (新增) |

---

## 页面集成

| 页面 | 路由 | 新增/修改 | 依赖 |
|------|------|---------|------|
| Canvas List | `/canvas-list` | 新增 | E1, E2 |
| Canvas 画布页 | `/canvas/[id]` | 修改 | E3 (OfflineBanner) |
| App Layout | `src/app/layout.tsx` | 修改 | E3 (SW 注册) |

---

## 技术约束

- IndexedDB 用于 canvas metadata 持久化（已有 commentStore 模式可参考）
- Service Worker 使用 Workbox 或原生 API
- Zustand store 统一管理 canvasListStore
- vitest 测试覆盖率目标: 每个 Epic ≥ 1 个测试文件
