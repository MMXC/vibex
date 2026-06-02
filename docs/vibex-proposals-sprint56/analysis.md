# VibeX Sprint 56 — 功能分析

**Sprint**: Sprint 56
**日期**: 2026-06-02
**基于**: proposals/20260602/analyst.md

---

## P001: 多画布管理（Canvas List） — P0

### 问题描述
当前 VibeX 每个画布独立 URL，无统一管理界面。用户无法快速切换、创建、删除、重命名画布。

### 根因分析
缺乏 `canvasListStore`（IndexedDB 存储 canvasId + title + updatedAt）和 `DDSCanvasListPage`（列表管理页面）。核心协作场景体验严重受损。

### 影响评估
- 高频用户每次需手动记住画布 URL
- 多项目并行工作流受阻
- 新用户引导体验差（无"我的画布"入口）

### 技术方案
1. `canvasListStore`: IndexedDB 持久化 `{id, title, updatedAt, thumbnail?}`，画布创建/打开/删除时同步 store
2. `DDSCanvasListPage`: `/canvas-list` 路由，网格/列表视图，卡片显示 title + updatedAt
3. DDSToolbar Logo 导航: 点击 Logo → 跳转 canvas-list
4. 创建/删除/重命名: 列表页内联操作

### 验收标准（可测试）
- [ ] `canvasListStore` 在 IndexedDB 中持久化
- [ ] `/canvas-list` 显示所有画布卡片
- [ ] DDSToolbar Logo 点击跳转 canvas-list
- [ ] 删除画布后 IndexedDB + store 同步清除
- [ ] vitest `canvasListStore.test.ts` 全通过

---

## P002: 收藏画布 / Favorites — P0

### 问题描述
高频用户无收藏/置顶功能，每次需从列表中找到目标画布，查找成本高。

### 根因分析
无 favoritesStore。canvasListStore 已有但无 `isFavorite` 字段。

### 影响评估
- 影响高频用户每日工作效率
- 协作场景下需记住哪些画布最重要

### 技术方案
1. `canvasListStore` 扩展: 新增 `favoriteIds: string[]` 字段，localStorage 持久化
2. 收藏切换: canvas-list 卡片右上角星标按钮，点击 toggle favorites
3. 排序优先: canvas-list 默认按 favorites 排序
4. FavoritesFilter: "显示收藏" / "显示全部" 筛选

### 验收标准（可测试）
- [ ] 收藏状态 localStorage 持久化，刷新后保留
- [ ] 收藏画布在 canvas-list 置顶显示
- [ ] 点击星标切换收藏状态，无需刷新
- [ ] vitest `canvasListStore.test.ts` favorites 用例通过

---

## P003: 离线模式 / PWA Service Worker — P1

### 问题描述
VibeX 无 Service Worker，断网后画布完全不可用。移动端/弱网用户受影响严重。

### 根因分析
无 PWA 配置（manifest.json + service-worker.js）。IndexedDB 已有但 canvas 数据未离线缓存。

### 影响评估
- 移动端用户体验受损
- "随时随地工作" 承诺无法兑现

### 技术方案
1. Service Worker 注册: `navigator.serviceWorker.register('/sw.js')`，Workbox 缓存策略
2. App Shell 缓存: HTML + CSS + JS 静态资源 cache-first
3. IndexedDB 数据层: canvasListStore 已有
4. Offline Banner: 检测 `navigator.onLine === false` 时显示离线提示

### 验收标准（可测试）
- [ ] `/sw.js` 注册成功，Service Worker 安装无报错
- [ ] 离线状态下 `/canvas-list` 可加载（App Shell）
- [ ] 离线 banner 断网时显示，联网后消失
- [ ] vitest 相关用例通过
