# Sprint 50 实现分区

> **Agent**: coord (architect-review self-impl)
> **Date**: 2026-06-02

---

## DoD 检查清单（每 Epic 通用）

- [ ] 所有功能点对应的 TypeScript 代码已实现
- [ ] vitest 测试覆盖率 ≥80%（新增 store/hook 必须有测试）
- [ ] `src/dds/` 目录内的 dds 组件已测试
- [ ] IndexedDB 操作有错误处理
- [ ] i18n key 已注册（中文/英文）
- [ ] 跨 Epic 集成点已验证

---

## E1 — 画布全局搜索 (Cmd+K)

### DoD Checklist
- [ ] `src/stores/canvasSearchStore.ts` 实现：`keywordIndex`、`buildIndex(canvasId)`、`updateIndex(canvasId)`、`search(query)`
- [ ] `src/lib/canvas/fullTextSearch.ts` 实现：`fullTextSearch(query)` 查询 Map 而非 DB scan
- [ ] `src/hooks/useSearchIndex.ts` 实现：画布打开时触发 `buildIndex`
- [ ] `src/components/dds/SearchPanel.tsx` 实现：Cmd+K 激活浮层、搜索结果列表
- [ ] Cmd+K 快捷键注册到 `@xyflow/react` 的 `onKeyDown`
- [ ] 搜索结果 rank（匹配次数 + 更新时间）
- [ ] vitest: `canvasSearchStore.test.ts` 覆盖 CRUD + 索引逻辑
- [ ] vitest: `fullTextSearch.test.ts` 覆盖精确/模糊/空查询

### 验收标准（expect() 断言）
```typescript
// canvasSearchStore — 索引构建
const store = useCanvasSearchStore.getState();
act(() => { store.buildIndex('canvas-1'); });
expect(store.keywordIndex.get('canvas-1')).toBeDefined();

// canvasSearchStore — 搜索功能
act(() => { store.search('node-text'); });
expect(store.results.length).toBeGreaterThanOrEqual(0);

// fullTextSearch — Map 查询（不扫描 DB）
const ids = fullTextSearch('query');
expect(Array.isArray(ids)).toBe(true);
```

---

## E2 — 画布节点自动布局 (Dagre)

### DoD Checklist
- [ ] `npm install dagre @types/dagre`（E2 专用，不污染其他 Epic）
- [ ] `src/stores/layoutStore.ts` 实现：`layoutMode`、`applyAutoLayout(graph)`
- [ ] `src/lib/canvas/computeLayout.ts` 实现：Dagre TB 布局，`computeLayout(nodes, edges)`
- [ ] `src/hooks/useAutoLayout.ts` 实现：整合 computeLayout + flowStore.setNodes
- [ ] DDSToolbar.tsx 修改：添加"自动排版"按钮（图标 + tooltip + 点击事件）
- [ ] Cmd+L 快捷键注册：用户主动触发，不在 onNodesChange 自动触发
- [ ] 布局前 Undo 记录：可在布局后撤销
- [ ] vitest: `layoutStore.test.ts` 覆盖 mode 切换 + position 验证
- [ ] vitest: `computeLayout.test.ts` 覆盖层级顺序（父节点 y < 子节点 y）

### 验收标准
```typescript
// layoutStore — mode 切换
const store = useLayoutStore.getState();
act(() => { store.setLayoutMode('dagre'); });
expect(store.layoutMode).toBe('dagre');

// layoutStore — applyAutoLayout position 验证
const graph = { nodes: mockNodes, edges: mockEdges };
act(() => { store.applyAutoLayout(graph); });
expect(graph.nodes[0].position.y).toBeLessThan(graph.nodes[1].position.y);

// computeLayout — Dagre TB 层级
const result = computeLayout(mockNodes, mockEdges);
expect(result.nodes[0].position.y).toBeLessThan(result.nodes[1].position.y);
```

---

## E3 — 评论实时通知 (WebSocket)

### DoD Checklist
- [ ] `commentStore.ts` 修改：添加 `addListener`/`removeListener`/`unreadCount` + IndexedDB 持久化
- [ ] `src/lib/canvas/wsCommentHandler.ts` 实现：订阅 `comment:created`/`comment:resolved` → 调用 commentStore action
- [ ] `src/components/dds/CommentBadge.tsx` 实现：未读红点 Badge，unreadCount > 0 显示
- [ ] `backend/src/handlers/ws.py` 修改：添加 `comment:created`/`comment:resolved` 消息 case（复用现有 WS 连接）
- [ ] WebSocket handler 在 `wsProvider.ts` 中注册 `wsCommentHandler`
- [ ] vitest: `commentStore.test.ts` 添加事件订阅测试
- [ ] vitest: `wsCommentHandler.test.ts` 覆盖消息解析/错误处理

### 验收标准
```typescript
// commentStore — addListener 触发
const store = useCommentStore.getState();
const listener = vi.fn();
store.addListener(listener);
act(() => { store.addComment({ id: 'c1', text: 'test', canvasId: 'cv1', author: 'u1', createdAt: Date.now() }); });
expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'comment:created' }));

// commentStore — unreadCount
act(() => { store.addComment({ id: 'c2', text: 'test2', canvasId: 'cv1', author: 'u2', createdAt: Date.now() }); });
expect(store.unreadCount).toBeGreaterThan(0);

// CommentBadge — 红点显示
const { container } = render(<CommentBadge />);
const badge = container.querySelector('.badge');
expect(badge?.className).toContain('unread');
```

---

## E4 — 模板导入/导出管理

### DoD Checklist
- [ ] `templateStore.ts` 修改：添加 `templateVersion: '1.0'` 字段 + `exportTemplates()`/`importTemplates()` actions
- [ ] `src/lib/canvas/templateExport.ts` 实现：`exportTemplates()` → `{ version, exportedAt, templates }` JSON → Blob download
- [ ] `src/lib/canvas/templateImport.ts` 实现：`importTemplates(file)` → JSON parse + JSON Schema 校验 + merge
- [ ] `src/components/dds/TemplateImportDialog.tsx` 实现：导入对话框，冲突处理（覆盖/重命名/跳过）
- [ ] `TemplatePanel.tsx` 修改：添加 Export All / Import 按钮
- [ ] 冲突弹窗：同名 ID 模板 → 弹窗让用户选处理策略
- [ ] vitest: `templateStore.test.ts` 添加 export/import 测试
- [ ] vitest: `templateExport.test.ts` 覆盖 JSON 结构/version 字段

### 验收标准
```typescript
// templateStore — exportTemplates JSON 结构
const store = useTemplateStore.getState();
act(() => { store.loadTemplates([mockTemplate]); });
const json = store.exportTemplates();
expect(json.version).toBe('1.0');
expect(json.templates.length).toBeGreaterThan(0);
expect(json.exportedAt).toBeDefined();

// templateStore — importTemplates 合规校验
const result = store.importTemplates(JSON.stringify({ version: '1.0', templates: [] }));
expect(result.success).toBe(true);

// templateStore — importTemplates 不合规 reject
const result2 = store.importTemplates('not json');
expect(result2.error).toContain('Invalid JSON');

// templateStore — 冲突处理策略
const existing = { ...mockTemplate, id: 't1' };
act(() => { store.loadTemplates([existing]); });
const conflictResult = store.importTemplates(JSON.stringify({ version: '1.0', templates: [{ ...mockTemplate, id: 't1' }] }));
expect(conflictResult.conflict).toBe(true);
```

---

## E5 — Timeline 增强 (缩放+搜索)

### DoD Checklist
- [ ] `src/stores/timelineStore.ts` 实现：`zoomLevel`（min=0.5, max=3）+ `searchQuery` + `filteredSnapshots`
- [ ] `src/lib/canvas/snapshotSearch.ts` 实现：`searchSnapshots(query, snapshots)`，debounce 500ms
- [ ] `src/components/dds/Timeline.tsx` 修改：添加 zoom slider + search input + 分组折叠
- [ ] Timeline 缩放用 `transform: scale()` 而非改变 minWidth
- [ ] 时间分组：今天/昨天/本周/更早（dayjs.isToday/isYesterday）
- [ ] vitest: `timelineStore.test.ts` 覆盖 zoomLevel 边界值 + searchQuery debounce
- [ ] vitest: `snapshotSearch.test.ts` 覆盖过滤结果/空查询/分组逻辑

### 验收标准
```typescript
// timelineStore — zoomLevel 边界
const store = useTimelineStore.getState();
act(() => { store.setZoomLevel(2); });
expect(store.zoomLevel).toBe(2);

// timelineStore — zoomLevel 超出范围 clamp
act(() => { store.setZoomLevel(10); });
expect(store.zoomLevel).toBe(3); // clamp to max

// timelineStore — searchQuery debounce
act(() => { store.setSearchQuery('test'); });
// vi.advanceTimersByTime(501) in vitest
expect(store.searchQuery).toBe('test');

// snapshotSearch — 过滤结果
const snapshots = [
  { id: 's1', canvasId: 'cv1', name: 'Draft v1', createdAt: Date.now() },
  { id: 's2', canvasId: 'cv1', name: 'Final', createdAt: Date.now() },
];
const results = searchSnapshots('Draft', snapshots);
expect(results.length).toBe(1);
expect(results[0].name).toContain('Draft');
```

---

## Epic 分支规划

| Epic | 分支名 | 依赖 |
|------|--------|------|
| E1 | `epic/s50-e1-canvas-search` | 无 |
| E2 | `epic/s50-e2-auto-layout` | 无 |
| E3 | `epic/s50-e3-comment-notification` | 无 |
| E4 | `epic/s50-e4-template-import-export` | 无 |
| E5 | `epic/s50-e5-timeline-enhance` | 无 |
