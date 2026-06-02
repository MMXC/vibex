# VibeX Sprint57 PRD — 产品需求文档

## 执行摘要

Sprint57 在 S54-S56 基础上推进四个核心方向：**批量画布管理**（导出/重命名/删除）、**AI Session 画布内集成**、**模板用户创建**、**协作通知完善**。目标是提升画布管理效率、加强 AI 与画布的工作流融合、完善实时协作通知链路。

---

## Epic-Story Table

| Epic | 名称 | 优先级 | 产出文件 |
|------|------|--------|---------|
| E1 | CanvasList 批量导出 | P0 | BatchExportPanel.tsx, useBatchExport.ts |
| E2 | 画布内 AI Session 嵌入面板 | P0 | EmbeddedAgentPanel.tsx, useEmbeddedAgent.ts |
| E3 | 模板创建：画布另存为模板 | P0 | SaveAsTemplateDialog.tsx, templateStore.ts |
| E4 | 画布批量重命名/删除 | P1 | CanvasDashboard 多选模式, BatchOpsPanel.tsx |
| E5 | @提及 → 通知链路完善 | P1 | mentionsStore.ts 增强, NotificationBell 分类 |

---

## E1: CanvasList 批量导出

### Story
作为用户，我希望一次性导出多个收藏画布为单个压缩包，以便备份或分享整个工作区。

### DoD
- [ ] E1.1: CanvasDashboard 工具栏新增「批量导出」图标按钮 (DDSToolbar)
- [ ] E1.2: `useBatchExport.ts` 新增 `exportCanvasList(canvasIds[], format)` 方法
- [ ] E1.3: 导出格式支持 JSON（含 canvasId/name/updatedAt/nodes/edges 元数据）
- [ ] E1.4: `BatchExportProgress.tsx` 支持显示「画布 N/M」进度
- [ ] E1.5: 导出完成为单个 `.vibex` 压缩包（含 manifest.json + 多画布 JSON）
- [ ] E1.6: vitest: `useBatchExport.test.ts` 新增 CanvasList 场景 5 个测试

### 集成页面
- CanvasListPage (Dashboard): 工具栏按钮 → 批量导出面板

### expect() 断言
```typescript
expect(store.batchExport(['c1', 'c2'], 'json').progress).toBeGreaterThanOrEqual(0);
expect(store.batchExport(['c1'], 'vibex').files).toHaveLength(1);
```

---

## E2: 画布内 AI Session 嵌入面板

### Story
作为用户，我希望在画布编辑时直接使用 AI 助手，AI 生成的节点可直接插入画布，而不用切换到独立的 Agent 面板。

### DoD
- [ ] E2.1: DDSCanvasPage 工具栏新增「AI Assistant」按钮
- [ ] E2.2: `EmbeddedAgentPanel.tsx` — 右侧抽屉组件（320px 宽），显示对话历史
- [ ] E2.3: `useEmbeddedAgent.ts` — Hook 监听 agentStore 当前 session，连接 WebSocket
- [ ] E2.4: 抽屉内支持发送消息、查看 AI 响应
- [ ] E2.5: AI 响应中的「Insert to Canvas」按钮 → 调用 `flowStore.addNodes(aiNodes)`
- [ ] E2.6: vitest: `useEmbeddedAgent.test.ts` 6 个测试

### 集成页面
- DDSCanvasPage: 右侧抽屉 (Drawer)

### expect() 断言
```typescript
expect(useEmbeddedAgent().isOpen).toBe(false);
act(() => { useEmbeddedAgent().togglePanel(); });
expect(useEmbeddedAgent().isOpen).toBe(true);
```

---

## E3: 模板创建 — 画布另存为模板

### Story
作为用户，我希望将当前画布保存为自定义模板，以便在其他画布中复用这个结构。

### DoD
- [ ] E3.1: `templateStore.ts` 新增 `createFromCanvas(canvasId, name, description, category)` action
- [ ] E3.2: `SaveAsTemplateDialog.tsx` — 模态框，含 name/description/category 输入框
- [ ] E3.3: DDSCanvasPage 工具栏新增「另存为模板」按钮
- [ ] E3.4: 保存时调用 `html-to-image` 截取画布快照，存入 templateStore.thumbnail
- [ ] E3.5: TemplateGallery 新增「我的模板」分类（`isUserCreated: true`）
- [ ] E3.6: vitest: `templateStore.test.ts` 新增 createFromCanvas 3 个测试

### 集成页面
- DDSCanvasPage: 工具栏按钮 → SaveAsTemplateDialog
- TemplateGallery: 新增分类 Tab

### expect() 断言
```typescript
const template = templateStore.getState().createFromCanvas('c1', 'My Template', 'desc', 'custom');
expect(template.id).toBeDefined();
expect(template.isUserCreated).toBe(true);
expect(template.thumbnail).toBeTruthy();
```

---

## E4: 画布批量重命名 / 删除

### Story
作为用户，我希望在 Canvas Dashboard 中批量选择多个画布进行重命名或删除，提高画布管理效率。

### DoD
- [ ] E4.1: CanvasDashboard 切换到「多选模式」（工具栏 Checkbox 全选 + 每卡片 Checkbox）
- [ ] E4.2: `canvasListStore.ts` 新增 `batchDelete(canvasIds: string[])` action
- [ ] E4.3: `canvasListStore.ts` 新增 `batchRename(ops: {id: string; name: string}[])` action
- [ ] E4.4: 多选模式下显示「删除选中 (N)」「重命名 (N)」操作栏
- [ ] E4.5: `BatchDeleteConfirmDialog.tsx` — 删除确认，显示即将删除的画布名称列表
- [ ] E4.6: `BatchRenameDialog.tsx` — 批量重命名，支持 `{n}` 占位符（自动编号）
- [ ] E4.7: vitest: canvasListStore.batchDelete / batchRename 覆盖

### 集成页面
- CanvasListPage: Dashboard 多选模式

### expect() 断言
```typescript
await act(async () => { store.batchDelete(['c1', 'c2']); });
expect(store.canvases.filter(c => ['c1','c2'].includes(c.id))).toHaveLength(0);
```

---

## E5: @提及 → 通知链路完善

### Story
作为用户，我希望在评论中使用 @username 提及协作者，被提及者能收到实时通知。

### DoD
- [ ] E5.1: `commentStore.addComment` 解析 `@username` 模式 → 调用 `mentionsStore.addMention`
- [ ] E5.2: `parseMentions(text: string): string[]` — 提取所有 @username，返回去重数组
- [ ] E5.3: `mentionsStore.ts` 新增 `sourceType: 'comment' | 'chat'` 字段区分来源
- [ ] E5.4: wsCommentHandler 的 `comment:mention` case 调用 `mentionsStore.addMention`
- [ ] E5.5: NotificationBell 增加「评论提及」tab，与普通 mentions 分类展示
- [ ] E5.6: vitest: `parseMentions.test.ts` 覆盖边界 cases

### 集成页面
- CommentPanel: 评论输入框 → @ 触发 mentions
- NotificationBell: 新增 tab

### expect() 断言
```typescript
expect(parseMentions('@alice @bob hello @alice')).toEqual(['alice', 'bob']);
expect(parseMentions('no mentions')).toEqual([]);
```

---

## 验收标准汇总

| Epic | 核心功能 | 最低测试要求 |
|------|---------|------------|
| E1 | 批量导出 3+ 画布为 vibex 包 | vitest 5+ |
| E2 | AI Assistant 面板打开 + 发送消息 | vitest 6+ |
| E3 | 画布另存为模板并出现在 Gallery | vitest 3+ |
| E4 | 批量删除 2+ 画布 | vitest 3+ |
| E5 | @提及 → 通知 badge 更新 | vitest 4+ |

---

## 技术约束

- 所有 UI 改动必须符合 `DESIGN.md` 设计变量
- 禁止引入新的外部依赖（html-to-image 已存在）
- Zustand store 变更需同步 IndexedDB
- AI Session WebSocket 复用现有 `useAgentSession.ts` 模式
