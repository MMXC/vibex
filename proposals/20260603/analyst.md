# VibeX Sprint57 功能提案分析

**Sprint**: Sprint57
**日期**: 20260603
**分析师**: coord (self-impl due to agent-submit phantom ghost)
**依据**: Sprint55+Sprint56 交付成果，识别 Sprint57 高优先级功能增强

---

## 执行摘要

Sprint55 完成了背景设置和键盘快捷键激活（E4/E5），Sprint56 完成了画布列表管理+收藏画布（E1.5/E2）和 PWA 离线缓存（E3）。当前 VibeX 在以下方向存在显著缺口：

1. **画布搜索**：只有分类 tab，无关键词搜索
2. **移动端适配**：完全没有移动端布局和导航
3. **模板版本管理**：模板无版本历史，无法追踪修改
4. **冲突解决 UI**：Revision 冲突检测已完成但 ConflictDialog 未集成到画布页面
5. **通知系统**：@提及面板已完成但缺少实时 WebSocket 未读计数角标

---

## P001: 画布搜索功能 — 高优先级

### 问题描述
当前 `CanvasDashboard` 只有分类 Tab（Favorites/Recent/All），用户无法通过关键词搜索画布。当画布数量超过 20 个时，浏览效率极低。

### 根因分析
- `canvasListStore` 只有 `filterByCategory()` 和 `sortCanvases()`，无 `searchCanvases()` 方法
- `CanvasDashboard` 没有搜索输入框 UI
- 模板/画布的 `name`/`description` 字段未被索引

### 技术方案
1. `canvasListStore.ts` 新增 `searchQuery: string` state + `setSearchQuery()` action + `filteredCanvases` selector
2. `CanvasDashboard` 新增 `<SearchInput>` 组件（aria-label="搜索画布"）
3. 搜索过滤逻辑：name/description 的模糊匹配（前端，实时过滤）
4. 持久化搜索历史（localStorage，`recent-searches` 数组，最多 10 条）

### 验收标准
- [ ] 搜索输入框在 CanvasDashboard 顶部显示
- [ ] 输入关键词后，画布列表实时过滤（debounce 300ms）
- [ ] 清空搜索框后恢复完整列表
- [ ] 搜索历史下拉显示最近 10 条（点击回填）
- [ ] `canvasListStore.test.ts` 覆盖搜索逻辑

---

## P002: 移动端响应式布局 — 高优先级

### 问题描述
VibeX 完全没有移动端适配。`DDSCanvasPage` 和 `CanvasDashboard` 在 <768px 视口下布局崩溃，无可用性。

### 根因分析
- 所有组件使用固定 px 宽度，无 `max-width` 或 `flex-wrap`
- `DDSToolbar` 是横向单行工具栏，在窄屏溢出
- `CanvasDashboard` 的卡片网格在移动端无法正常排列

### 技术方案
1. 媒体查询 `@media (max-width: 768px)` — 响应式断点
2. `DDSToolbar` 移动端：工具按钮折叠为 FAB 菜单（汉堡菜单按钮展开）
3. `CanvasDashboard` 移动端：卡片从 3 列 → 1 列，Tab 改为下拉选择器
4. `DDSCanvasPage` 移动端：侧边属性面板变为底部 Sheet，节点缩放适应屏幕
5. 触摸手势：双指缩放（Hammer.js 或原生 touch 事件）

### 验收标准
- [ ] 移动端视口（375px）下 CanvasDashboard 单列卡片布局正常
- [ ] DDSToolbar 在移动端折叠为 FAB 菜单
- [ ] DDSCanvasPage 移动端可正常缩放和拖拽节点
- [ ] vitest 覆盖 Toolbar 响应式切换逻辑
- [ ] Playwright E2E 测试（移动端视口下关键路径可操作）

---

## P003: 模板版本历史 — 中优先级

### 问题描述
用户修改模板后无法回滚。`canvasTemplateStore` 没有版本概念，每次保存直接覆盖旧内容。

### 根因分析
- `CanvasTemplateData` 只有 `updatedAt`，无 `version` 字段
- IndexedDB `canvas_templates` 表没有历史记录表
- 没有"保存版本"和"回滚到版本"功能

### 技术方案
1. `CanvasTemplateData` 新增 `versions: TemplateVersion[]` 字段（内联版本数组，最多 20 条）
2. `saveTemplateVersion()`: 保存当前内容到 `versions[]`，带 `version` 编号和 `createdAt`
3. `restoreVersion(versionId: string)`: 从历史版本恢复内容
4. `TemplateHistoryDialog.tsx`: 版本列表对话框，支持预览和回滚
5. `TemplateEditDialog` 新增"历史"按钮，打开版本历史对话框

### 验收标准
- [ ] 模板每次保存自动创建新版本（最多保留 20 条）
- [ ] 版本历史对话框显示时间戳和版本号
- [ ] 点击"回滚"可恢复历史版本内容
- [ ] `canvasTemplateStore.test.ts` 覆盖版本保存/回滚逻辑

---

## P004: 冲突解决 UI 集成 — 高优先级

### 问题描述
Sprint52-E3 已实现 `RevisionMismatchError` 检测和 `ConflictDialog` 组件，但 ConflictDialog **未集成到画布页面**。协作冲突时用户无法真正解决冲突。

### 根因分析
- `ConflictDialog.tsx` 存在但未在任何页面挂载
- `DDSCanvasPage` 未订阅 `canvasHistoryStore` 的 `hasConflict` 状态
- WebSocket `revision:conflict` 消息触发 toast 但未打开对话框

### 技术方案
1. `DDSCanvasPage.tsx` 订阅 `canvasHistoryStore.hasConflict` + `conflictInfo`
2. `hasConflict === true` 时挂载 `<ConflictDialog>`（modal overlay）
3. `ConflictDialog` 三个选项：
   - Discard Local: `clearHistory()` + `reloadFromIndexedDB()`
   - Merge: `mergeHistory()`（需要实现合并逻辑）
   - Discard Remote: `setBaseRevision(remoteRevision)` + 保留本地
4. `wsRevisionHandler.ts` 的 `revision:conflict` case 触发 `conflictInfo` store 写入

### 验收标准
- [ ] 协作冲突时 ConflictDialog 自动弹出
- [ ] Discard Local / Merge / Discard Remote 三个选项均可正常执行
- [ ] `DDSCanvasPage` 集成 ConflictDialog，vitest 覆盖
- [ ] `wsRevisionHandler.test.ts` 覆盖 `revision:conflict` case

---

## P005: 通知实时未读计数 — 中优先级

### 问题描述
Sprint53-E3 完成了 NotificationBell 和 NotificationPanel，但 WebSocket `comment:mention` 消息到达时，NotificationBell 的红点角标**不实时更新**。用户必须手动刷新页面才能看到新的未读数。

### 根因分析
- `NotificationBell` 的 `unreadCount` 从 `mentionsStore` 读取，但 WebSocket `comment:mention` 消息通过 `wsCommentHandler` 写入 store 时未触发 UI 重新渲染
- `useMentionsStore.getState()` 的直接调用可能在 React 组件外执行，绕过了 React 批更新

### 技术方案
1. `mentionsStore.ts` 的 `addMention()` 使用 `get().listeners` 手动通知监听器（zustand 手动监听模式）
2. `NotificationBell.tsx` 使用 `useMentionsStore(state => state.unreadCount)` 订阅
3. 确保 `wsCommentHandler` 的 `comment:mention` case 正确调用 `mentionsStore.getState().addMention()`
4. 新增 `markAllAsRead()` action + NotificationBell 点击时调用

### 验收标准
- [ ] 发送 @mention WebSocket 消息后，NotificationBell 红点角标实时显示
- [ ] 点击 NotificationBell 触发 `markAllAsRead()`，角标消失
- [ ] `mentionsStore.test.ts` 覆盖 `addMention()` + `markAllAsRead()` 逻辑

---

## 提案优先级汇总

| ID | 提案 | 优先级 | 工作量 | 依赖 |
|----|------|--------|--------|------|
| P001 | 画布搜索功能 | P0 | 中 | S56-E2（canvasListStore）|
| P002 | 移动端响应式布局 | P0 | 大 | 无 |
| P003 | 模板版本历史 | P1 | 中 | S52-E4（templateStore）|
| P004 | 冲突解决 UI 集成 | P0 | 小 | S52-E3（ConflictDialog）|
| P005 | 通知实时未读计数 | P1 | 小 | S53-E3（NotificationBell）|
