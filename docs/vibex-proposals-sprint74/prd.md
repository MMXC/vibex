# S74 PRD — VibeX Sprint74 产品需求文档

**Sprint**: vibex-proposals-sprint74  
**日期**: 2026-06-07  
**提案数**: 5（E1–E5）

---

## 执行摘要

| Epic | 名称 | 优先级 | 预估工时 |
|------|------|--------|----------|
| E1 | 搜索历史记录 | P1 | 中 |
| E2 | 模板标签与分类筛选 | P1 | 中 |
| E3 | 画布分支对比视图 | P1 | 中 |
| E4 | @mention 通知推送闭环 | P1 | 高 |
| E5 | 键盘导航增强 | P2 | 低 |

---

## E1: 搜索历史记录与最近搜索

### 用户故事
作为用户，我希望搜索历史被保存，这样我可以快速重复之前的搜索，无需重新输入。

### DoD（Definition of Done）
- [ ] `canvasSearchStore` 新增 `recentSearches: string[]` 状态（Zustand persist，max 20 条）
- [ ] `canvasSearchStore` 新增 `addRecentSearch(query: string)` action（去重 + 截断）
- [ ] `CanvasSearchPanel` UI 渲染最近搜索 chips（header 区域）
- [ ] 搜索提交时自动追加历史
- [ ] 提供"清除历史"按钮
- [ ] `canvasSearchStore.test.ts` 新增 recentSearch 测试（≥4 用例）
- [ ] `CanvasSearchPanel.test.tsx` 新增历史渲染测试（≥3 用例）

### expect() 断言
```typescript
expect(store.recentSearches.length).toBeLessThanOrEqual(20);
expect(store.recentSearches[0]).toBe('最新搜索词');
// 去重：重复搜索同一词不追加
addRecentSearch('test');
addRecentSearch('test');
expect(store.recentSearches.filter(s => s === 'test').length).toBe(1);
// 持久化：刷新后恢复
```

---

## E2: 模板标签与分类筛选

### 用户故事
作为用户，我希望按标签筛选模板，这样可以快速找到需要的模板类型。

### DoD（Definition of Done）
- [ ] `TemplateSnapshot` 接口新增 `tags: string[]` 字段
- [ ] `templateStore` 新增 `filterTemplatesByTag(tag: string | null)` getter
- [ ] `TemplateGallery` 顶部新增标签筛选栏（chip 按钮 All + 预设标签）
- [ ] 多标签 AND 筛选逻辑
- [ ] 现有模板补充默认 tags（Design/Analysis/Collab）
- [ ] 标签筛选状态在面板内保留
- [ ] `templateStore.test.ts` 新增 filterTemplatesByTag 测试（≥4 用例）
- [ ] `TemplateGallery.test.tsx` 新增标签筛选测试（≥4 用例）

### expect() 断言
```typescript
expect(template.tags).toContain('Design');
expect(filterByTag('Analysis').length).toBeLessThanOrEqual(all.length));
// 多标签 AND
const result = filterByTag(['Design', 'Analysis']);
expect(result.every(t => t.tags.includes('Design') && t.tags.includes('Analysis'))).toBe(true);
```

---

## E3: 画布分支对比视图

### 用户故事
作为用户，我希望对比两个分支的差异，这样我可以决定是否需要合并。

### DoD（Definition of Done）
- [ ] `canvasHistoryStore` 新增 `compareBranches(sourceId, targetId)` action，返回 `BranchDiffResult`
- [ ] `BranchDiffResult` 类型：`{ added: Node[], removed: Node[], modified: Node[] }`
- [ ] `HistoryPanel` 分支列表选中模式（checkbox 或多选）
- [ ] "对比"按钮：选中 2 个分支后激活
- [ ] 新增 `BranchDiffDialog.tsx` + `BranchDiffDialog.module.css`
- [ ] 支持"对比到主分支"快捷操作
- [ ] `canvasHistoryStore.test.ts` 新增 compareBranches 测试（≥6 用例）
- [ ] `BranchDiffDialog.test.tsx`（≥5 用例）

### expect() 断言
```typescript
const diff = compareBranches('branch-A', 'branch-B');
expect(diff.added.length).toBeGreaterThanOrEqual(0);
expect(diff.removed.length).toBeGreaterThanOrEqual(0);
expect(diff.modified.length).toBeGreaterThanOrEqual(0);
expect(diff.added.every(n => n.branchId === 'branch-B')).toBe(true);
```

---

## E4: @mention 通知推送闭环

### 用户故事
作为协作者，我希望 @mention 后对方收到通知，这样我可以确保对方看到我的消息。

### DoD（Definition of Done）
- [ ] `useActivityStore.addEntry` 解析消息中的 `@username` 模式
- [ ] 每个被 @ 用户 → 调用 `notificationStore.addNotification({ type: 'mention', ... })`
- [ ] `notificationStore` mention 类型支持 `isTypeEnabled` 过滤
- [ ] `NotificationPanel` 展示 mention 类型通知（独立 section）
- [ ] mention 通知点击跳转至对应消息
- [ ] 多次 @ 同一用户不重复通知
- [ ] `notificationStore.test.ts` 新增 mention 通知测试（≥5 用例）

### expect() 断言
```typescript
// @mention 触发通知
activityStore.addEntry({ message: 'Hello @alice how are you?' });
const notifs = notificationStore.notifications.filter(n => n.type === 'mention');
expect(notifs.some(n => n.targetUserId === 'alice')).toBe(true);
// 不重复通知
activityStore.addEntry({ message: '@alice again' });
expect(notifs.filter(n => n.targetUserId === 'alice').length).toBeLessThanOrEqual(2);
```

---

## E5: 键盘导航增强

### 用户故事
作为键盘用户，我希望所有面板支持键盘导航，这样我可以不使用鼠标完成操作。

### DoD（Definition of Done）
- [ ] `CanvasSearchPanel`：`↑↓` 导航结果，Enter 选中，Esc 关闭，`aria-activedescendant` 语义
- [ ] `TemplateGallery`：Tab 在卡片间导航，Enter 打开预览，`role="grid"` 语义
- [ ] `TemplatePreviewPanel`：Esc 关闭，Tab 在详情区域导航
- [ ] `NotificationPanel`：Tab 导航通知项，Enter 标记已读/跳转，`role="list"` 语义
- [ ] 面板打开时 `focus()` 移入，关闭时焦点还原到触发元素
- [ ] 现有 vitest 测试中增加键盘交互测试（每面板 ≥3 用例）

### expect() 断言
```typescript
// 搜索面板键盘导航
const searchInput = screen.getByRole('searchbox');
fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
expect(screen.getByRole('listbox').querySelector('[aria-selected="true"]')).not.toBeNull();
// Esc 关闭
fireEvent.keyDown(searchInput, { key: 'Escape' });
expect(screen.queryByRole('dialog')).toBeNull();
```

---

## 跨 Epic 集成点

| 集成点 | 涉及 Epic | 说明 |
|--------|-----------|------|
| canvasSearchStore | E1+E5 | 搜索历史 + 键盘导航 |
| templateStore | E2+E5 | 标签筛选 + 键盘导航 |
| notificationStore | E4+E5 | mention 通知 + 键盘导航 |
| HistoryPanel | E3+E5 | 分支对比 + 键盘导航 |

---

## 技术风险表

| 风险 | 缓解方案 |
|------|----------|
| BranchDiff 大型画布性能 | 异步计算 + AbortController 取消，虚拟列表展示 |
| NotificationStore 类型扩展 | mention 作为现有 type 枚举的扩展值 |
| 模板标签迁移 | 增量迁移脚本，default tags 保底 |
