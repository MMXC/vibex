# VibeX Sprint 56 — 功能提案分析

**Sprint**: Sprint 56
**日期**: 2026-06-02
**分析依据**: Sprint 53-55 (E1-E5) 交付物 CHANGELOG 回顾 + 遗留 gap 识别

---

## 提案总览

| ID | 优先级 | 功能名称 | 根因 | 影响 |
|----|--------|---------|------|------|
| P001 | P0 | 多画布管理（Canvas List） | 用户无法管理多个画布，只能逐一导出/导入 | 影响核心工作流 |
| P002 | P0 | 收藏画布 / Favorites | 无收藏功能，高频画布查找成本高 | 影响高频用户效率 |
| P003 | P1 | 离线模式 / PWA 缓存 | 无离线支持，断网后画布不可用 | 影响移动/弱网场景 |

---

## P001: 多画布管理（Canvas List） — P0

### 问题描述
当前 VibeX 每个画布独立 URL，无统一管理界面。用户无法：
- 在画布之间快速切换
- 创建新画布
- 删除画布
- 重命名画布

### 根因
缺乏 `canvasListStore`（IndexedDB 存储 canvasId + title + updatedAt）和 `DDSCanvasListPage`（列表管理页面）。

### 影响
用户必须手动记住画布 URL，无法可视化浏览所有画布。核心协作场景（多项目并行）体验严重受损。

### 技术方案
1. **canvasListStore**: IndexedDB 存储 `{id, title, updatedAt, thumbnail?}`，自动同步每个打开画布的 metadata
2. **DDSCanvasListPage**: 画布列表页，`/canvas-list` 路由，网格/列表视图，卡片显示 title + thumbnail + updatedAt
3. **DDSToolbar 新增 Logo 导航**: 点击 Logo → 跳转 canvas-list
4. **创建/删除/重命名**: 列表页内联操作，IndexedDB 同步更新

### 验收标准
- [ ] `canvasListStore` 在 IndexedDB 中持久化，画布创建/打开/删除后 store 同步更新
- [ ] `/canvas-list` 页面显示所有画布卡片，title + updatedAt 可读
- [ ] DDSToolbar Logo 点击跳转 canvas-list
- [ ] 删除画布后 IndexedDB + store 同步清除
- [ ] vitest `canvasListStore.test.ts` 全通过

---

## P002: 收藏画布 / Favorites — P0

### 问题描述
高频用户（每天使用多个画布）无收藏/置顶功能。每次需要从列表中找到目标画布，查找成本高。

### 根因
无 favoritesStore。canvasListStore 已有，但无 `isFavorite` 字段。

### 影响
影响高频用户每日工作效率。协作场景下尤其明显——用户需记住哪些画布最重要。

### 技术方案
1. **canvasListStore 扩展**: 新增 `favoriteIds: string[]` 字段，localStorage 持久化
2. **收藏切换**: canvas-list 卡片右上角星标按钮，点击 toggle favorites
3. **排序优先**: canvas-list 默认按 favorites 排序，收藏画布置顶
4. **FavoritesFilter**: 列表顶部筛选按钮，"显示收藏" / "显示全部"

### 验收标准
- [ ] 收藏状态在 localStorage 中持久化，刷新后保留
- [ ] 收藏画布在 canvas-list 置顶显示
- [ ] 点击星标切换收藏状态，无需刷新
- [ ] vitest `canvasListStore.test.ts` favorites 相关用例通过

---

## P003: 离线模式 / PWA Service Worker — P1

### 问题描述
VibeX 无 Service Worker，浏览器关闭后画布状态不可用。移动端/弱网用户断网后画布完全不可用。

### 根因
无 PWA 配置（manifest.json + service-worker.js）。IndexedDB 仅用于 commentStore 和 canvasListStore，canvas 数据本身未离线缓存。

### 影响
影响移动端用户和弱网环境（地铁、飞机等）用户体验。VibeX 的"随时随地工作"承诺无法兑现。

### 技术方案
1. **Service Worker 注册**: `navigator.serviceWorker.register('/sw.js')`，Workbox 缓存策略
2. **App Shell 缓存**: HTML + CSS + JS 静态资源 cache-first
3. **IndexedDB 数据层**: canvasListStore 已有，数据层已支持离线
4. **Offline Banner**: 检测 `navigator.onLine === false` 时在画布页显示离线提示 banner

### 验收标准
- [ ] `/sw.js` 注册成功，Service Worker 安装无报错
- [ ] 离线状态下 `/canvas-list` 页面可加载（App Shell）
- [ ] 离线 banner 在断网时显示，连网后自动消失
- [ ] vitest `canvasListStore.test.ts` 离线相关用例通过
