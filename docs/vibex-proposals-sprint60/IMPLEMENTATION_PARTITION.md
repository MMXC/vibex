# VibeX Sprint60 实施计划

**Sprint**: Sprint60
**日期**: 2026-06-03
**版本**: 1.0

---

## DoD 验收清单

### E1: 画布版本历史 UI 增强

| # | DoD 条件 | 验证方式 | 状态 |
|---|----------|---------|------|
| D1.1 | `HistoryPanel.tsx` 新增"时间线视图"Tab，与"列表视图"并列 | 视觉验证 | 待实现 |
| D1.2 | 时间线视图展示快照创建时间轴，点击弹出预览浮层 | 单元测试 | 待实现 |
| D1.3 | `SnapshotDiffDialog` 正确显示两快照差异（Added/Removed/Modified） | 单元测试 | 待实现 |
| D1.4 | `canvasHistoryStore.compareSnapshots()` 方法通过 vitest 测试 | vitest | 待实现 |
| D1.5 | 快照重命名和星标功能通过 UI 测试 | 单元测试 | 待实现 |
| D1.6 | vitest 测试覆盖时间线渲染、diff 对比、快照操作 | vitest | 待实现 |

### E2: 批量操作增强

| # | DoD 条件 | 验证方式 | 状态 |
|---|----------|---------|------|
| D2.1 | `CanvasListPanel.tsx` 支持 checkbox 多选 | 单元测试 | 待实现 |
| D2.2 | 选中后显示 `BatchOpsToolbar` 浮层 | 单元测试 | 待实现 |
| D2.3 | 批量删除显示确认对话框，调用 `DDSCanvasStore.batchDeleteCanvas()` | 单元测试 | 待实现 |
| D2.4 | 批量重命名支持替换模式（前缀/后缀） | 单元测试 | 待实现 |
| D2.5 | vitest 测试覆盖 `batchOpsStore`、`BatchOpsToolbar` | vitest | 待实现 |

### E3: 协作活动流 + 在线状态指示

| # | DoD 条件 | 验证方式 | 状态 |
|---|----------|---------|------|
| D3.1 | `activityStore.ts` 管理协作者活动状态 | 单元测试 | 待实现 |
| D3.2 | WS `activity:update` 消息广播（间隔 5s） | 集成测试 | 待实现 |
| D3.3 | `ActivityFeed` 面板展示最近 5 条活动 | 单元测试 | 待实现 |
| D3.4 | `RemoteCursor` 有明确在线/空闲状态指示（脉冲动画） | 单元测试 | 待实现 |
| D3.5 | vitest 测试覆盖 `activityStore`、`RemoteCursor` 在线状态 | vitest | 待实现 |

### E4: 画布导出增强

| # | DoD 条件 | 验证方式 | 状态 |
|---|----------|---------|------|
| D4.1 | `ZipExporter` 支持 PNG、PDF 格式批量导出 | 单元测试 | 待实现 |
| D4.2 | `CanvasListPanel` 批量导出支持 PNG/PDF | 单元测试 | 待实现 |
| D4.3 | `DDSToolbar` 有 PNG/PDF 导出按钮 | 单元测试 | 待实现 |
| D4.4 | 导出过程显示进度条（`ExportProgress`） | 单元测试 | 待实现 |
| D4.5 | vitest 测试覆盖 `ZipExporter` PNG/PDF 方法 | vitest | 待实现 |

### E5: 搜索体验增强

| # | DoD 条件 | 验证方式 | 状态 |
|---|----------|---------|------|
| D5.1 | 搜索面板显示"最近搜索"Tab（最多 10 条，localStorage 持久化） | 单元测试 | 待实现 |
| D5.2 | 搜索结果节点中高亮匹配关键词（`<mark>` 标签） | 单元测试 | 待实现 |
| D5.3 | ↑↓ 键可选择搜索结果，Enter 跳转 | 单元测试 | 待实现 |
| D5.4 | `canvasSearchStore.searchHistory` localStorage 持久化 | 单元测试 | 待实现 |
| D5.5 | vitest 测试覆盖 `canvasSearchStore`、`DDSSearchPanel` 搜索历史 | vitest | 待实现 |

---

## 新增文件清单

| 文件路径 | Epic | 说明 |
|---------|------|------|
| `vibex-fronted/src/components/dds/history/HistoryPanel.tsx` | E1 | 双 Tab 时间线视图 |
| `vibex-fronted/src/components/dds/history/SnapshotDiffDialog.tsx` | E1 | 三栏 diff 对比 |
| `vibex-fronted/src/components/dds/history/TimelineView.tsx` | E1 | 垂直时间轴组件 |
| `vibex-fronted/src/components/dds/history/SnapshotCard.tsx` | E1 | 时间线节点卡片 |
| `vibex-fronted/src/stores/dds/batchOpsStore.ts` | E2 | 批量选择状态管理 |
| `vibex-fronted/src/components/dds/canvas-dashboard/BatchOpsToolbar.tsx` | E2 | 批量操作浮层 |
| `vibex-fronted/src/stores/dds/activityStore.ts` | E3 | 活动状态管理 |
| `vibex-fronted/src/lib/collaboration/activityStore.ts` | E3 | lib 层活动状态 |
| `vibex-fronted/src/lib/collaboration/activityHandler.ts` | E3 | WS activity:update 消息处理 |
| `vibex-fronted/src/components/dds/collaboration/ActivityFeed.tsx` | E3 | 活动流面板 |
| `vibex-fronted/src/components/dds/collaboration/RemoteCursor.tsx` | E3 | 带状态指示的光标 |
| `vibex-fronted/src/components/dds/export/ExportBatchDialog.tsx` | E4 | 批量导出格式选择 |
| `vibex-fronted/src/stores/dds/canvasSearchStore.ts` | E5 | 搜索历史状态管理 |

---

## 扩展文件清单

| 文件路径 | Epic | 扩展内容 |
|---------|------|---------|
| `vibex-fronted/src/stores/dds/canvasHistoryStore.ts` | E1 | add compareSnapshots, branchName, isStarred fields |
| `vibex-fronted/src/stores/dds/DDSCanvasStore.ts` | E2 | add batchDeleteCanvas, renameCanvas |
| `vibex-fronted/src/components/dds/canvas-dashboard/CanvasListPanel.tsx` | E2 | add checkbox multi-select mode |
| `vibex-fronted/src/lib/collaboration/websocket.ts` | E3 | add activity:update message type |
| `vibex-fronted/src/services/export/ZipExporter.ts` | E4 | verify/extend PNG PDF export methods |
| `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx` | E4 | add PNG/PDF export buttons |
| `vibex-fronted/src/components/dds/DDSSearchPanel.tsx` | E5 | add search history Tab + highlight |
| `vibex-fronted/src/hooks/canvas/useCanvasSearch.ts` | E5 | add Fuse.js integration |

---

## expect() 断言规范

每个 Epic 的测试必须包含以下 expect 断言：

### E1 expect 断言
```typescript
// canvasHistoryStore.compareSnapshots
expect(store.getState().compareSnapshots('snap-a', 'snap-b')).toEqual({
  added: expect.any(Array),
  removed: expect.any(Array),
  modified: expect.any(Array),
});

// HistoryPanel Tab 切换
expect(screen.getByRole('tab', { name: /时间线视图/i })).toBeInTheDocument();

// SnapshotDiffDialog 三栏内容
expect(screen.getByText(/Added \(N\)/)).toBeInTheDocument();
expect(screen.getByText(/Removed \(N\)/)).toBeInTheDocument();
expect(screen.getByText(/Modified \(N\)/)).toBeInTheDocument();
```

### E2 expect 断言
```typescript
// batchOpsStore toggleSelect
expect(store.getState().selectedIds.size).toBe(0);
store.getState().toggleSelect('canvas-1');
expect(store.getState().selectedIds.has('canvas-1')).toBe(true);

// BatchOpsToolbar 批量删除确认
expect(screen.getByText(/即将删除 3 个画布/)).toBeInTheDocument();
expect(screen.getByRole('button', { name: /确认删除/ })).toBeInTheDocument();

// 批量重命名替换
expect(screen.getByRole('textbox', { name: /前缀替换/ })).toBeInTheDocument();
```

### E3 expect 断言
```typescript
// activityStore addActivity
store.getState().addActivity({ userId: 'u1', action: 'edit', timestamp: Date.now() });
expect(store.getState().activities.length).toBeGreaterThan(0);

// RemoteCursor 在线状态
expect(screen.getByLabelText(/在线/)).toHaveAttribute('data-status', 'online');
expect(screen.getByLabelText(/空闲/)).toHaveAttribute('data-status', 'idle');

// ActivityFeed 显示最近 5 条
expect(screen.getAllByRole('listitem')).toHaveLength(5);
```

### E4 expect 断言
```typescript
// ZipExporter PNG export
const result = await ZipExporter.exportMultipleAsPNG(['canvas-1', 'canvas-2']);
expect(result).toBeInstanceOf(Blob);
expect(result.type).toBe('application/zip');

// DDSToolbar 导出按钮
expect(screen.getByRole('button', { name: /导出 PNG/ })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /导出 PDF/ })).toBeInTheDocument();

// ExportProgress 进度
expect(screen.getByRole('progressbar')).toBeInTheDocument();
```

### E5 expect 断言
```typescript
// canvasSearchStore searchHistory 持久化
store.getState().addToHistory('search term');
expect(localStorage.getItem('searchHistory')).toContain('search term');
expect(store.getState().searchHistory.length).toBeLessThanOrEqual(10);

// DDSSearchPanel 高亮
const highlighted = screen.getByText(/<mark>search term<\/mark>/);
expect(highlighted).toBeInTheDocument();

// 键盘导航
expect(document.activeElement).toHaveAttribute('data-result-index', '0');
```

---

## 实施顺序

```
Phase 1 (Day 1-2):
  E1: canvasHistoryStore 扩展 → HistoryPanel + SnapshotDiffDialog
  E2: batchOpsStore → BatchOpsToolbar → CanvasListPanel 扩展

Phase 2 (Day 2-3):
  E3: activityStore → ActivityFeed → RemoteCursor → websocket 扩展
  E4: ZipExporter 验证 → DDSToolbar 按钮 → ExportBatchDialog

Phase 3 (Day 3-4):
  E5: canvasSearchStore → DDSSearchPanel 扩展 → Fuse.js 集成
  集成测试 + 全量 vitest
```

---

## 产出验收

| Epic | 关键产出 | 最低测试数 |
|------|---------|-----------|
| E1 | HistoryPanel 双 Tab + SnapshotDiffDialog + compareSnapshots | 5 个测试文件 |
| E2 | batchOpsStore + BatchOpsToolbar + 批量操作 | 3 个测试文件 |
| E3 | activityStore + ActivityFeed + RemoteCursor | 4 个测试文件 |
| E4 | ZipExporter PNG/PDF + DDSToolbar 导出按钮 | 2 个测试文件 |
| E5 | canvasSearchStore + DDSSearchPanel 搜索历史 | 3 个测试文件 |

**全 Sprint 最低测试数**: 17 个测试文件（E1 5 + E2 3 + E3 4 + E4 2 + E5 3）
