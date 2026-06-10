# S78 产品需求文档 — Sprint78 PRD

**项目**: vibex-proposals-sprint78
**日期**: 2026-06-08
**版本**: 1.0

---

## 执行摘要

Sprint78 实现 5 个 Epic，聚焦画布分支协作效率提升（S78-E1）、模板生态增强（S78-E2）、协作评论深化（S78-E3）、导出自动化（S78-E4）和画布关系网络（S78-E5）。

---

## Epic-Story 映射表

| Epic | Epic名称 | 用户故事 | 验收标准 |
|------|---------|---------|---------|
| S78-E1 | Canvas 分支自动合并与智能冲突解决 | 作为画布协作者，我希望分支合并时无冲突节点自动合并，这样我可以专注于处理真正需要决策的冲突 | 无冲突分支对合并自动成功，无需弹窗；有冲突时仅需处理冲突节点；autoMergeBranch vitest 覆盖 |
| S78-E2 | 模板市场订阅与更新通知 | 作为模板用户，我希望订阅感兴趣的模板和作者，这样模板更新时我能及时获知 | 订阅/退订正常；模板更新后通知正常推送；localStorage 持久化 |
| S78-E3 | Canvas 内联评论与协作批注 | 作为协作者，我希望在特定画布节点添加评论，这样我可以提供明确的上下文讨论 | 节点显示评论数量 badge；点击呼出评论面板；评论添加/删除/回复正常 |
| S78-E4 | 画布批量导出定时任务与 Webhook 通知 | 作为企业用户，我希望定时触发画布备份并通知外部系统，这样可以自动化运维流程 | 定时任务 CRUD 正常；导出完成后 webhook POST 正确发送；vitest 10/10 |
| S78-E5 | 画布间关系与依赖追踪 | 作为项目经理，我希望在画布之间建立关系，这样我可以追踪项目间的依赖和引用 | 关系添加/删除正常；关系网络图显示正确；vitest 6/6 |

---

## S78-E1: Canvas 分支自动合并与智能冲突解决

### DoD (Definition of Done)

**功能 DoD:**
- [ ] `canvasHistoryStore.ts` 新增 `autoMergeBranch(canvasId, source, target)` 方法，实现无冲突节点自动合并
- [ ] `BranchAutoMergeDialog.tsx` 新建，显示合并预览（自动/手动/冲突分类）+ 确认执行按钮
- [ ] `BranchManager.tsx` 集成：在 MergeBranchButton 点击时优先调用 `autoMergeBranch`，若有冲突节点则降级到 `BranchAutoMergeDialog`
- [ ] `DDSCanvasPage.tsx` — 合并成功后 `reloadFromSnapshot` 刷新画布（复用 S70-E1 逻辑）
- [ ] `canvasHistoryStore.auto-merge.test.ts` 新建：覆盖 autoMergeBranch 核心路径（无冲突/有冲突/无分支/非法参数）

**验收测试:**
- [ ] 无冲突分支：`autoMergeBranch` 后 `pendingConflicts` 为空，画布内容正确合并
- [ ] 有冲突分支：`pendingConflicts` 包含所有冲突节点，非冲突节点已自动合并
- [ ] `BranchAutoMergeDialog` 预览正确分类（自动=绿/手动=黄/冲突=红）

### expect() 断言模式

```typescript
// canvasHistoryStore.auto-merge.test.ts
const store = createCanvasHistoryStore();

// 无冲突场景
await store.autoMergeBranch('canvas1', 'branch-a', 'main');
expect(store.getState().pendingConflicts).toHaveLength(0);
const snapshot = await store.getSnapshot('canvas1', 'main');
expect(snapshot.nodes).toContain(expect.objectContaining({ id: 'node-from-a' }));

// 有冲突场景
await store.autoMergeBranch('canvas1', 'branch-b', 'main');
expect(store.getState().pendingConflicts.length).toBeGreaterThan(0);
expect(store.getState().pendingConflicts[0].nodeId).toBeDefined();

// 非法参数
await expect(store.autoMergeBranch('canvas1', 'nonexistent', 'main'))
  .rejects.toThrow('Source branch does not exist');
```

---

## S78-E2: 模板市场订阅与更新通知

### DoD (Definition of Done)

**功能 DoD:**
- [ ] `templateStore.ts` 新增 `subscribedTemplates: string[]` + `subscribedAuthors: string[]` 状态，localStorage 持久化
- [ ] `subscribeTemplate(id)` / `unsubscribeTemplate(id)` / `subscribeAuthor(authorId)` / `unsubscribeAuthor(authorId)` actions
- [ ] `getTemplateUpdates()` 方法：返回订阅模板中有更新的条目（`updatedAt > lastSeenAt`）
- [ ] `notificationStore.ts` 新增通知类型 `'template_update'`（type + title + templateId）
- [ ] `TemplateMarketplacePanel.tsx` — 卡片增加「🔔 订阅」按钮（已订阅态=「已订阅」，点击切换）
- [ ] `templateStore.subscription.test.ts` 新建：6 测试覆盖订阅/退订/更新检测

**验收测试:**
- [ ] 订阅/退订切换正常
- [ ] `localStorage.getItem('vibex-template-subscriptions')` 包含订阅数据
- [ ] `getTemplateUpdates()` 返回正确更新列表
- [ ] 通知触发正常

### expect() 断言模式

```typescript
// templateStore.subscription.test.ts
const store = createTemplateStore();

store.subscribeTemplate('tpl-1');
expect(store.getState().subscribedTemplates).toContain('tpl-1');
expect(localStorage.getItem('vibex-template-subscriptions')).toContain('tpl-1');

store.unsubscribeTemplate('tpl-1');
expect(store.getState().subscribedTemplates).not.toContain('tpl-1');

const updates = store.getTemplateUpdates();
expect(updates.every(u => store.getState().subscribedTemplates.includes(u.templateId))).toBe(true);
```

---

## S78-E3: Canvas 内联评论与协作批注

### DoD (Definition of Done)

**功能 DoD:**
- [ ] `collabSessionStore.ts` 新增 `comments: Record<string, CommentEntry[]>` 状态
- [ ] `addComment(canvasId, nodeId, content, parentId?)` / `deleteComment(commentId)` / `editComment(commentId, content)` / `resolveComment(commentId)` actions
- [ ] `NodeCommentBadge.tsx` 新建：节点工具栏 badge（显示评论数量），点击呼出面板
- [ ] `NodeCommentPanel.tsx` 新建：侧边评论面板，含评论列表 + 回复线程 + 输入框
- [ ] `DDSCanvasPage.tsx` — 节点选中时渲染 `NodeCommentBadge`
- [ ] `collabSessionStore.comments.test.ts` 新建：8 测试覆盖 CRUD + 回复线程

**验收测试:**
- [ ] badge 显示正确数量（无评论=隐藏，1+=显示数字）
- [ ] 评论添加/删除/编辑正常
- [ ] 回复嵌套正确（parentId 正确关联）
- [ ] 标记已解决后 badge 数量减少

### expect() 断言模式

```typescript
// collabSessionStore.comments.test.ts
const store = createCollabSessionStore();

store.addComment('canvas1', 'node-1', 'This needs revision');
const comments = store.getState().comments['node-1'];
expect(comments).toHaveLength(1);
expect(comments[0].content).toBe('This needs revision');
expect(comments[0].resolved).toBe(false);

const replyId = store.addComment('canvas1', 'node-1', 'Agreed', comments[0].id);
const replies = store.getState().comments['node-1'].filter(c => c.parentId === comments[0].id);
expect(replies).toHaveLength(1);

store.resolveComment(comments[0].id);
expect(store.getState().comments['node-1'][0].resolved).toBe(true);
```

---

## S78-E4: 画布批量导出定时任务与 Webhook 通知

### DoD (Definition of Done)

**功能 DoD:**
- [ ] `canvasListStore.ts` 新增 `scheduledExports: ScheduledExport[]` 状态，localStorage 持久化
- [ ] `addScheduledExport(config)` / `removeScheduledExport(id)` / `listScheduledExports()` / `triggerExportNow(id)` actions
- [ ] `ZipExporter.ts` 新增 `exportWithWebhook(canvasId, options, webhookUrl)` 方法
- [ ] `ScheduledExportPanel.tsx` 新建：定时任务管理面板（列表+添加+删除+立即执行）
- [ ] DDSToolbar 或设置入口集成 `ScheduledExportPanel`
- [ ] `canvasListStore.scheduled-export.test.ts` 新建：6 测试
- [ ] `ZipExporter.webhook.test.ts` 新建：4 测试

**验收测试:**
- [ ] 定时任务增删改查正常
- [ ] Webhook POST 正确发送（含 canvasId/format/results/timestamp）
- [ ] `cronExpression` 解析正确（简化版：every-N-hours/daily/weekly）

### expect() 断言模式

```typescript
// canvasListStore.scheduled-export.test.ts
const store = createCanvasListStore();

const exportId = store.addScheduledExport({
  canvasId: 'canvas-1',
  format: 'zip',
  cronExpression: 'daily',
  webhookUrl: 'https://example.com/notify',
});
expect(store.listScheduledExports()).toHaveLength(1);
expect(store.listScheduledExports()[0].id).toBe(exportId);

store.removeScheduledExport(exportId);
expect(store.listScheduledExports()).toHaveLength(0);

// ZipExporter webhook
const postSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true });
await ZipExporter.exportWithWebhook('canvas-1', { formats: ['png'] }, 'https://example.com/webhook');
expect(postSpy).toHaveBeenCalledWith(
  'https://example.com/webhook',
  expect.objectContaining({ method: 'POST', body: expect.stringContaining('canvas-1') })
);
```

---

## S78-E5: 画布间关系与依赖追踪

### DoD (Definition of Done)

**功能 DoD:**
- [ ] `canvasListStore.ts` 的 `CanvasMeta` 扩展 `parentCanvasId?: string` + `relatedCanvasIds: string[]`
- [ ] `addRelatedCanvas(id)` / `removeRelatedCanvas(id)` / `setParentCanvas(id)` / `removeParentCanvas()` / `getCanvasRelations(canvasId)` actions
- [ ] `CanvasRelationsPanel.tsx` 新建：画布详情页「关系」Tab，显示关系图
- [ ] `CanvasRelationBadge.tsx` 新建：FolderTree 中显示有子画布的画布图标
- [ ] `canvasListStore.relations.test.ts` 新建：6 测试

**验收测试:**
- [ ] 关系添加/删除正常
- [ ] `getCanvasRelations` 返回 `{ parent, children, related }` 结构
- [ ] 自环检测（不能将自己设为父画布）

### expect() 断言模式

```typescript
// canvasListStore.relations.test.ts
const store = createCanvasListStore();

store.createCanvas({ id: 'canvas-parent' });
store.createCanvas({ id: 'canvas-child' });

store.setParentCanvas('canvas-child', 'canvas-parent');
const rel = store.getCanvasRelations('canvas-child');
expect(rel.parent).toBe('canvas-parent');

store.addRelatedCanvas('canvas-child', 'canvas-related');
const rel2 = store.getCanvasRelations('canvas-child');
expect(rel2.related).toContain('canvas-related');

// 自环检测
expect(() => store.setParentCanvas('canvas-1', 'canvas-1')).toThrow('Cannot set self as parent');
```

---

## 跨 Epic 集成点

| 集成点 | 涉及 Epic | 说明 |
|--------|---------|------|
| `canvasHistoryStore` 共享 | E1 + E5 | E1 扩展 mergeBranch；E5 依赖 snapshot 关系 |
| `templateStore` 共享 | E2 + E3 | E2 新增订阅状态；E3 的模板导入功能依赖模板数据 |
| `notificationStore` 共享 | E2 | E2 触发 `template_update` 通知 |
| `DDSCanvasPage` 共享 | E1 + E3 | E1 合并成功后刷新；E3 节点评论 badge |
| `canvasListStore` 共享 | E4 + E5 | E4 定时导出；E5 关系追踪 |

---

## 质量门槛

- 所有 Epic: vitest 总计 ≥ 38 个新测试，全部通过
- PR 需覆盖新功能的单元测试和集成测试
- ESLint + TypeScript 类型检查通过
- 无新增 console.error 或未处理的 Promise rejection
