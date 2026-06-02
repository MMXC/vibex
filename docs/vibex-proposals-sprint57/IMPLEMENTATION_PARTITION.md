# VibeX Sprint57 实现分工计划

## E1: CanvasList 批量导出

### DoD Checklist

- [ ] **E1.1**: `src/components/dds/export/BatchExportPanel.tsx` — 批量导出配置面板，含格式选择（.vibex/.json）、画布勾选列表
- [ ] **E1.2**: `src/hooks/canvas/useBatchExportList.ts` — 新 Hook，遍历 canvasListStore.favoriteIds 调用 useBatchExport.exportMultiple()，支持进度回调
- [ ] **E1.3**: 导出格式支持 .vibex（含 manifest.json + 多画布 JSON 数组），manifest 包含 canvasId/name/updatedAt/nodes/edges 元数据
- [ ] **E1.4**: `BatchExportProgress.tsx` 扩展：新增 `total` prop，显示「画布 N/M」进度
- [ ] **E1.5**: `src/components/dds/DDSToolbar.tsx` — 工具栏新增批量导出按钮（ExportIcon + aria-label="批量导出"）
- [ ] **E1.6**: `useBatchExportList.test.ts` — vitest 覆盖：空列表/单画布/多画布/进度回调/格式选择

### 新增文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/components/dds/export/BatchExportPanel.tsx` | 组件 | 批量导出配置面板 |
| `src/hooks/canvas/useBatchExportList.ts` | Hook | CanvasList 批量导出 Hook |
| `src/hooks/canvas/__tests__/useBatchExportList.test.ts` | 测试 | 6 个测试 |

### 扩展文件

| 文件 | 修改 | 说明 |
|------|------|------|
| `src/components/dds/export/BatchExportProgress.tsx` | 扩展 | 新增 `total: number` prop |
| `src/components/dds/DDSToolbar.tsx` | 扩展 | 工具栏新增导出按钮 |
| `src/services/export/ZipExporter.ts` | 扩展 | exportZip 支持 .vibex 格式（manifest + JSON 数组） |

### expect() 断言

```typescript
// useBatchExportList.test.ts
const { result } = renderHook(() => useBatchExportList());
act(() => { result.current.exportBatch(['c1', 'c2'], 'vibex'); });
expect(result.current.progress).toBeGreaterThanOrEqual(0);

act(() => { result.current.exportBatch(['c1'], 'json'); });
expect(result.current.files).toHaveLength(1);
expect(result.current.files[0]).toContain('manifest.json');
```

---

## E2: 画布内 AI Session 嵌入面板

### DoD Checklist

- [ ] **E2.1**: `src/components/dds/DDSDrawer.tsx` 或 `DDSCanvasPage.tsx` — 新增 EmbeddedAgentPanel 抽屉组件（direction="right", width=320px）
- [ ] **E2.2**: `src/components/dds/agent/EmbeddedAgentPanel.tsx` — 抽屉内容：session 列表 + 消息历史 + 输入框 + 发送按钮
- [ ] **E2.3**: `src/hooks/agent/useEmbeddedAgent.ts` — Hook 连接 agentStore（subscribe）+ flowStore（addAgentNodes），暴露 isOpen / activeSessionId / togglePanel
- [ ] **E2.4**: 抽屉内消息展示：读取 agentStore.sessions[sessionId].messages，渲染 AI/User 消息气泡
- [ ] **E2.5**: 「Insert to Canvas」按钮 → 调用 `flowStore.addAgentNodes(aiNodes)` 将 AI 节点注入画布
- [ ] **E2.6**: `useEmbeddedAgent.test.ts` — vitest 覆盖：isOpen toggle / session 切换 / addAgentNodes 调用

### 新增文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/components/dds/agent/EmbeddedAgentPanel.tsx` | 组件 | AI 抽屉面板 |
| `src/hooks/agent/useEmbeddedAgent.ts` | Hook | AI 面板状态管理 |
| `src/hooks/agent/__tests__/useEmbeddedAgent.test.ts` | 测试 | 6 个测试 |

### 扩展文件

| 文件 | 修改 | 说明 |
|------|------|------|
| `src/stores/dds/flowStore.ts` | 扩展 | 新增 `addAgentNodes(aiNodes: Node[])` action |
| `src/components/dds/DDSCanvasPage.tsx` | 扩展 | EmbeddedAgentPanel 挂载 + toolbar AI 按钮 |
| `src/components/dds/DDSDrawer.tsx` | 扩展 | 如需新建则复用现有 Drawer 模式 |

### expect() 断言

```typescript
// useEmbeddedAgent.test.ts
const { result } = renderHook(() => useEmbeddedAgent());
expect(result.current.isOpen).toBe(false);

act(() => { result.current.togglePanel(); });
expect(result.current.isOpen).toBe(true);
expect(result.current.activeSessionId).toBeDefined();
```

---

## E3: 模板创建 — 画布另存为模板

### DoD Checklist

- [ ] **E3.1**: `src/stores/dds/templateStore.ts` — 新增 `createFromCanvas(canvasId, name, description, category)` action，写入 templates[] 并持久化 localStorage
- [ ] **E3.2**: `src/components/dds/templates/SaveAsTemplateDialog.tsx` — 模态框，含 name（必填）/description（可选）/category（select）输入框 + 保存/取消按钮
- [ ] **E3.3**: `src/hooks/canvas/useTemplateSnapshot.ts` — Hook 调用 html-to-image 截取画布 DOM，返回 base64 缩略图
- [ ] **E3.4**: `src/components/dds/DDSCanvasPage.tsx` — 工具栏新增「另存为模板」按钮（SaveAsIcon + aria-label="另存为模板"）
- [ ] **E3.5**: TemplateGallery.tsx — 新增「我的模板」分类 Tab，`templates.filter(t => t.isUserCreated)` 展示用户创建的模板
- [ ] **E3.6**: `templateStore.test.ts` — 新增 createFromCanvas 3 个测试（正常/无 canvasId/重复名称）

### 新增文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/components/dds/templates/SaveAsTemplateDialog.tsx` | 组件 | 另存为模板对话框 |
| `src/hooks/canvas/useTemplateSnapshot.ts` | Hook | 画布快照截取 |
| `src/stores/dds/__tests__/templateStore.test.ts` | 测试 | createFromCanvas 3 个测试 |

### 扩展文件

| 文件 | 修改 | 说明 |
|------|------|------|
| `src/stores/dds/templateStore.ts` | 扩展 | 新增 createFromCanvas action + isUserCreated/thumbnail 字段 |
| `src/components/dds/templates/TemplateGallery.tsx` | 扩展 | 新增「我的模板」Tab 过滤逻辑 |
| `src/components/dds/DDSCanvasPage.tsx` | 扩展 | toolbar SaveAsTemplate 按钮 |

### expect() 断言

```typescript
// templateStore.test.ts
const store = createTemplateStore();
const template = store.getState().createFromCanvas('c1', 'My Template', 'desc', 'custom');
expect(template.id).toBeDefined();
expect(template.isUserCreated).toBe(true);
expect(template.thumbnail).toBeTruthy();
expect(template.name).toBe('My Template');
```

---

## E4: 画布批量重命名 / 删除

### DoD Checklist

- [ ] **E4.1**: `src/stores/dds/canvasListStore.ts` — 新增 `selectedIds: string[]` + `setSelectedIds(ids)` + `toggleSelected(id)` state
- [ ] **E4.2**: CanvasDashboard — 多选模式切换按钮 + 全选 Checkbox + 每卡片左上角 Checkbox
- [ ] **E4.3**: `src/stores/dds/canvasListStore.ts` — 新增 `batchDelete(canvasIds: string[])` action，循环调用 deleteCanvas + IndexedDB 同步
- [ ] **E4.4**: `src/stores/dds/canvasListStore.ts` — 新增 `batchRename(ops: {id: string; name: string}[])` action，支持 `{n}` 占位符替换
- [ ] **E4.5**: `src/components/dds/canvas-dashboard/BatchOpsPanel.tsx` — 多选模式工具栏，显示「已选 N 个」+ 删除/重命名按钮
- [ ] **E4.6**: `src/components/dds/canvas-dashboard/BatchDeleteConfirmDialog.tsx` — 删除确认，显示即将删除的画布名称列表
- [ ] **E4.7**: `src/components/dds/canvas-dashboard/BatchRenameDialog.tsx` — 批量重命名，支持 `{n}` 占位符预览
- [ ] **E4.8**: `canvasListStore.test.ts` — 新增 batchDelete / batchRename vitest 覆盖

### 新增文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/components/dds/canvas-dashboard/BatchOpsPanel.tsx` | 组件 | 多选工具栏 |
| `src/components/dds/canvas-dashboard/BatchDeleteConfirmDialog.tsx` | 组件 | 删除确认对话框 |
| `src/components/dds/canvas-dashboard/BatchRenameDialog.tsx` | 组件 | 批量重命名对话框 |
| `src/stores/dds/__tests__/canvasListStore.test.ts` | 测试 | batchDelete/batchRename 覆盖 |

### 扩展文件

| 文件 | 修改 | 说明 |
|------|------|------|
| `src/stores/dds/canvasListStore.ts` | 扩展 | selectedIds / batchDelete / batchRename |
| `src/components/dds/canvas-dashboard/CanvasDashboard.tsx` | 扩展 | 多选 Checkbox 模式 |
| `src/components/dds/canvas-dashboard/CanvasCard.tsx` | 扩展 | 左上角 Checkbox |

### expect() 断言

```typescript
// canvasListStore.test.ts
await act(async () => {
  store.getState().batchDelete(['c1', 'c2']);
});
const remaining = store.getState().canvases.filter(c => ['c1','c2'].includes(c.id));
expect(remaining).toHaveLength(0);

await act(async () => {
  store.getState().batchRename([{id: 'c1', name: 'New Canvas {n}'}, {id: 'c2', name: 'New Canvas {n}'}]);
});
const c1 = store.getState().canvases.find(c => c.id === 'c1');
expect(c1.name).toBe('New Canvas 1');
```

---

## E5: @提及 → 通知链路完善

### DoD Checklist

- [ ] **E5.1**: `src/lib/canvas/parseMentions.ts` — 提取 `@username` 正则，返回去重数组。边界：空字符串/无 mentions/重复 mentions
- [ ] **E5.2**: `src/stores/dds/mentionsStore.ts` — 新增 `sourceType: 'comment' | 'chat'` 字段；`addMention(id, userId, sourceType)` 支持 sourceType
- [ ] **E5.3**: `src/stores/dds/commentStore.ts` — `addComment(text, ...)` 内部调用 `parseMentions(text)` → 对每个 username 调用 `mentionsStore.addMention(commentId, userId, 'comment')`
- [ ] **E5.4**: `src/lib/canvas/wsCommentHandler.ts` — 新增 `case 'comment:mention':` handler，解析 payload 并调用 `mentionsStore.addMention`
- [ ] **E5.5**: `src/components/dds/notifications/NotificationBell.tsx` — 新增「评论提及」tab（与普通 mentions 分类展示），Badge 独立计数
- [ ] **E5.6**: `parseMentions.test.ts` — 覆盖边界：去重/@在行首/多 mentions/无 mentions

### 新增文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/lib/canvas/__tests__/parseMentions.test.ts` | 测试 | parseMentions 全覆盖（4+ 测试） |

### 扩展文件

| 文件 | 修改 | 说明 |
|------|------|------|
| `src/stores/dds/mentionsStore.ts` | 扩展 | sourceType 字段 + addMention 扩展 |
| `src/stores/dds/commentStore.ts` | 扩展 | addComment 内调用 parseMentions → mentionsStore |
| `src/lib/canvas/wsCommentHandler.ts` | 扩展 | comment:mention case |
| `src/components/dds/notifications/NotificationBell.tsx` | 扩展 | 评论提及 tab |

### expect() 断言

```typescript
// parseMentions.test.ts
expect(parseMentions('@alice @bob hello @alice')).toEqual(['alice', 'bob']);
expect(parseMentions('no mentions here')).toEqual([]);
expect(parseMentions('@alice @alice @alice')).toEqual(['alice']); // 去重

// commentStore.test.ts
vi.mock('@/stores/dds/mentionsStore');
act(() => { store.getState().addComment('test @alice comment', 'c1', 'u1'); });
expect(useMentionsStore.getState().addMention).toHaveBeenCalledWith(
  expect.any(String), expect.any(String), 'comment'
);
```

---

## 进度里程碑

| 周 | 目标 |
|----|------|
| Week 1 | E1 (BatchExport) + E5 (parseMentions) |
| Week 2 | E2 (EmbeddedAgentPanel) + E3 (SaveAsTemplate) |
| Week 3 | E4 (BatchOps) — 最复杂 UI |
| Week 4 | 集成测试 + E2/E3 vitest 补测 + 端到端验证 |
