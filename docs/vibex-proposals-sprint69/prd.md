# S69 PRD：VibeX Sprint69 产品需求文档

**项目**: vibex-proposals-sprint69
**日期**: 2026-06-06
**分析来源**: docs/vibex-proposals-sprint69/analysis.md

---

## 执行摘要

| Epic | 名称 | 优先级 | 负责人 |
|------|------|--------|--------|
| E1 | 画布版本快照历史：快照浏览与恢复 | P0 | — |
| E2 | 全局搜索增强：结果高亮与键盘导航 | P0 | — |
| E3 | 模板市场：分享链接导入与公开模板浏览 | P1 | — |
| E4 | 节点评论系统：画布节点级讨论线程 | P1 | — |
| E5 | 画布视图预设：个性化视图保存与快速切换 | P2 | — |

---

## E1: 画布版本快照历史

### 概述
在已有 `canvasHistoryStore` 快照存储基础上，增加快照历史面板浏览、快照恢复和分支管理功能。

### 功能列表
- E1.1: `HistoryPanel.tsx` — 快照历史列表（timestamp / branch / author）+ 缩略预览
- E1.2: `canvasHistoryStore.ts` — `getSnapshotsByCanvas()` / `restoreSnapshot()` / `deleteSnapshot()`
- E1.3: `DDSToolbar.tsx` — 历史按钮 → 打开 HistoryPanel
- E1.4: `SnapshotDiffDialog.tsx` — 快照对比浮层
- E1.5: `BranchManager.tsx` — 分支管理：创建/切换/删除画布分支

### DoD（Definition of Done）
- [ ] HistoryPanel 渲染快照列表（按时间倒序）
- [ ] 点击快照预览内容（read-only，read-only 标记）
- [ ] 恢复快照：restoreSnapshot(canvasId, snapshotId) → 更新画布 Store
- [ ] 快照与分支关联过滤
- [ ] vitest: canvasHistoryStore 测试 ≥ 8 个

### expect() 断言示例
```typescript
expect(store.getState().getSnapshotsByCanvas('c1').length).toBeGreaterThan(0);
expect(store.getState().restoreSnapshot('c1', snapId)).resolves.toBeDefined();
```

---

## E2: 全局搜索增强

### 概述
在 S68-E3 全局全文搜索基础上，增加关键词高亮、上下文预览和键盘导航。

### 功能列表
- E2.1: `canvasFulltextIndex.ts` — `searchWithContext(query)` 返回匹配片段
- E2.2: `GlobalSearchPanel.tsx` — `<mark>` 高亮关键词 + 上下文预览片段
- E2.3: 键盘导航：↑↓ 选择、Enter 跳转、Escape 关闭
- E2.4: `searchHistory` 持久化（localStorage，MAX 10 条）+ 历史下拉

### DoD（Definition of Done）
- [ ] 搜索结果中匹配关键词用 `<mark>` 高亮（背景色 #fef08a）
- [ ] 每条结果显示：节点标题 + 前后各 30 字上下文片段
- [ ] ↑↓ 键盘选择当前结果项，背景色变化
- [ ] Enter 跳转到节点并关闭浮层，Escape 关闭
- [ ] 最近 10 条搜索历史持久化显示
- [ ] vitest: canvasSearchStore 测试 ≥ 6 个

### expect() 断言示例
```typescript
expect(store.getState().searchHistory.length).toBeLessThanOrEqual(10);
expect(store.getState().searchWithContext('test').results[0]).toHaveProperty('snippet');
```

---

## E3: 模板市场

### 概述
在 S68-E1 本地导出基础上，增加分享链接和 URL 导入功能，实现模板的传播闭环。

### 功能列表
- E3.1: `templateShareStore.ts` — 分享状态管理（shareUrl / shareToken / importedTemplates[]）
- E3.2: `TemplateShareDialog.tsx` — 生成含模板数据的 Base64 URL，复制分享链接
- E3.3: `ImportFromUrlDialog.tsx` — 解析 URL 并导入模板
- E3.4: `TemplateGallery.tsx` — 新增"发现" Tab（当前为本地模板，未来支持后端）
- E3.5: `templateStore.ts` — `importFromShareUrl(url)` 方法

### DoD（Definition of Done）
- [ ] 分享按钮生成含模板数据的 URL（Base64 编码）
- [ ] URL 可一键复制到剪贴板
- [ ] 导入 URL 后模板自动进入画廊
- [ ] 重复导入（同名模板）→ 提示覆盖/跳过/重命名
- [ ] vitest: templateStore 测试 ≥ 6 个

### expect() 断言示例
```typescript
expect(templateShareStore.getState().generateShareUrl(template)).toMatch(/^https?:/);
expect(templateStore.getState().importFromShareUrl(url).id).toBeDefined();
```

---

## E4: 节点评论系统

### 概述
在 S68-E2 @提及通知基础上，增加节点级评论线程，支持围绕具体节点展开讨论。

### 功能列表
- E4.1: `commentStore.ts` — Zustand + IndexedDB：commentStore（comments[] / addComment / addReply / markRead）
- E4.2: `CommentThread.tsx` — 节点评论浮层（评论列表 + 回复输入框 + MentionInput）
- E4.3: `NodeCommentBadge.tsx` — 节点旁未读评论数红色徽章
- E4.4: `DDSCanvasPage.tsx` — 右键节点 → "查看评论" → 展开 CommentThread
- E4.5: 通知集成：评论后触发 notificationStore（复用 S68-E2 wsNotificationHandler）

### DoD（Definition of Done）
- [ ] 右键画布节点 → 上下文菜单出现"查看评论"
- [ ] 打开评论浮层显示该节点所有评论
- [ ] 支持回复（嵌套评论），支持 @提及（复用 MentionInput）
- [ ] 未读评论节点显示红色徽章数字
- [ ] 点击徽章 → 打开评论浮层 → 自动标记已读
- [ ] vitest: commentStore 测试 ≥ 8 个

### expect() 断言示例
```typescript
expect(commentStore.getState().getUnreadCount('node-1')).toBe(0);
await commentStore.getState().addComment('node-1', { content: '@Alice 看看这个', mentions: ['Alice'] });
expect(commentStore.getState().getUnreadCount('node-1')).toBe(1);
```

---

## E5: 画布视图预设

### 概述
在 S65-E3 画布视图设置基础上，增加预设保存与快速切换功能。

### 功能列表
- E5.1: `settingsStore.ts` — `canvasPresets[]` / `activePresetId` + `saveAsPreset()` / `applyPreset()` / `deletePreset()`
- E5.2: `ViewPresetsPanel.tsx` — 预设管理面板（创建/编辑/删除 + 图标选择）
- E5.3: `DDSToolbar.tsx` — 视图预设下拉菜单 + "管理预设" 按钮
- E5.4: ShortcutSettingsPanel 同级 Tab4：ViewPresetsPanel

### DoD（Definition of Done）
- [ ] 当前视图设置可保存为命名预设（背景色/网格/缩放等）
- [ ] 工具栏预设下拉菜单可一键应用预设
- [ ] 可编辑预设名称/图标，可删除预设
- [ ] 预设通过 settingsStore persist 持久化
- [ ] vitest: settingsStore 测试 ≥ 6 个

### expect() 断言示例
```typescript
expect(settingsStore.getState().canvasPresets).toBeDefined();
const presetId = settingsStore.getState().saveAsPreset('演示模式', { backgroundColor: '#1f2937', zoom: 1.5 });
expect(settingsStore.getState().canvasPresets.find(p => p.id === presetId)).toBeDefined();
settingsStore.getState().applyPreset(presetId);
expect(settingsStore.getState().activePresetId).toBe(presetId);
```

---

## 跨 Epic 集成

| 集成点 | 涉及 Epic | 说明 |
|--------|----------|------|
| DDSToolbar | E1, E2, E3, E5 | 历史按钮(E1)、搜索(E2)、预设(E5) 均在工具栏 |
| MentionInput | E4 | 评论使用 S68-E2 的 MentionInput 组件 |
| notificationStore | E4 | 评论通知复用 S68-E2 notificationStore |
| GlobalSearchPanel | E2 | 全局搜索浮层（E2 扩展已有组件）|
| canvasHistoryStore | E1 | 快照存储（已有，扩展新方法）|
| templateStore | E3 | 模板导入导出（已有，扩展新方法）|
| settingsStore | E5 | 视图预设（已有，扩展新字段）|

---

## 技术风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| 快照恢复可能覆盖当前编辑 | 高 | 恢复前弹确认对话框 |
| Base64 分享 URL 过长 | 低 | 压缩 + 截断警告 |
| 评论 Store 与通知 Store 并发写入 | 中 | 使用事务型 IndexedDB 操作 |
| 预设字段与 CanvasSettingsPanel 字段需同步 | 中 | settingsStore 作为唯一数据源 |
