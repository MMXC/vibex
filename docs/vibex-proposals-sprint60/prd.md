# VibeX Sprint60 产品需求文档 (PRD)

**Sprint**: Sprint60
**日期**: 2026-06-03
**版本**: 1.0

---

## 执行摘要

Sprint60 基于 S58-S59 已完成功能（画布版本历史数据层、批量导入导出、协作基础）进行 UI 层最后一公里交付 + 三项高频功能增强。核心目标：

1. **P0**: 完成画布版本历史 UI — 时间线视图 + 快照对比（依赖 S58-E1 数据层）
2. **P1**: 批量画布操作面板（删除/重命名/导出），协作活动流
3. **P1**: 画布导出增强（PNG/PDF）
4. **P2**: 搜索体验优化（历史 + 高亮 + 键盘导航）

---

## Epic-Story 映射

### E1: 画布版本历史 UI 增强

| Story | 功能点 | 验收条件 |
|-------|--------|---------|
| E1.1 | 时间线视图 Tab | HistoryPanel 新增 Tab，可展示快照创建时间轴 |
| E1.2 | 快照预览浮层 | 点击时间线节点弹出预览，展示节点数量、创建时间 |
| E1.3 | 快照对比 Dialog | SnapshotDiffDialog 显示两快照差异（新增/删除/修改） |
| E1.4 | 快照重命名/星标 | 支持对快照重命名和标记星标 |
| E1.5 | compareSnapshots 方法 | canvasHistoryStore.compareSnapshots() 返回 {added,removed,modified} |

**DoD**:
- [ ] HistoryPanel.tsx 新增 "时间线视图" Tab，与"列表视图"并列
- [ ] 时间线视图展示快照创建时间轴，点击弹出预览浮层
- [ ] SnapshotDiffDialog 正确显示两快照差异
- [ ] canvasHistoryStore.compareSnapshots() 方法通过 vitest 测试
- [ ] 快照重命名和星标功能通过 UI 测试
- [ ] vitest 测试覆盖时间线渲染、diff 对比、快照操作

### E2: 批量操作增强

| Story | 功能点 | 验收条件 |
|-------|--------|---------|
| E2.1 | 批量选择模式 | CanvasListPanel checkbox 多选 |
| E2.2 | BatchOpsToolbar | 批量删除/重命名/导出浮层 |
| E2.3 | 批量删除确认 | 显示即将删除 N 个画布，确认后执行 |
| E2.4 | 批量重命名替换 | 支持前缀/后缀批量替换 |
| E2.5 | 批量导出入口 | BatchOpsToolbar 触发导出面板 |

**DoD**:
- [ ] CanvasListPanel 支持 checkbox 多选
- [ ] 选中后显示 BatchOpsToolbar 浮层
- [ ] 批量删除显示确认对话框，调用 canvasStore.batchDeleteCanvas()
- [ ] 批量重命名支持替换模式
- [ ] vitest 测试覆盖 batchDeleteCanvas, renameCanvas, BatchOpsToolbar

### E3: 协作活动流

| Story | 功能点 | 验收条件 |
|-------|--------|---------|
| E3.1 | activityStore | 协作者活动状态管理（最近操作类型、时间戳） |
| E3.2 | WS activity 消息 | wsCollaborationHandler 支持 activity:update 消息类型 |
| E3.3 | ActivityFeed 面板 | DDSSidePanel 内展示最近 5 条协作者活动 |
| E3.4 | RemoteCursor 在线状态 | 绿色脉冲 = 在线，灰色 = 空闲>5min |
| E3.5 | 空闲降级 | 最新操作 30s 后自动降级为"空闲"状态 |

**DoD**:
- [ ] activityStore.ts 管理协作者活动状态
- [ ] WS activity:update 消息广播间隔 5s
- [ ] ActivityFeed 面板展示最近 5 条活动
- [ ] RemoteCursor 有明确在线/空闲状态指示
- [ ] vitest 测试覆盖 activityStore, RemoteCursor 在线状态渲染

### E4: 画布导出增强

| Story | 功能点 | 验收条件 |
|-------|--------|---------|
| E4.1 | ZipExporter PNG/PDF | exportMultipleAsPNG() / exportMultipleAsPDF() 方法 |
| E4.2 | html-to-image 集成 | PNG 截取使用 html-to-image 库 |
| E4.3 | 批量导出面板 | CanvasListPanel 批量操作导出 PNG/PDF |
| E4.4 | 单画布导出按钮 | CanvasToolbar 新增 PNG/PDF 导出按钮 |
| E4.5 | 导出进度条 | 使用 ExportProgress 组件模式显示进度 |

**DoD**:
- [ ] ZipExporter 支持 PNG、PDF 格式导出
- [ ] CanvasListPanel 批量导出支持三种格式
- [ ] 单画布 CanvasToolbar 有 PNG/PDF 导出按钮
- [ ] 导出过程显示进度条
- [ ] vitest 测试覆盖 ZipExporter PNG/PDF 方法

### E5: 搜索体验增强

| Story | 功能点 | 验收条件 |
|-------|--------|---------|
| E5.1 | 搜索历史 | searchHistory localStorage 持久化（最多10条） |
| E5.2 | 最近搜索 Tab | 搜索面板有"最近搜索"Tab |
| E5.3 | 搜索结果高亮 | 匹配关键词用 <mark> 标签高亮 |
| E5.4 | 键盘导航 | ↑↓ 选择搜索结果，Enter 跳转 |
| E5.5 | Fuse.js 优化 | threshold=0.2 提高中文精确度 |

**DoD**:
- [ ] 搜索面板显示"最近搜索"Tab（最多10条）
- [ ] 搜索结果节点中高亮匹配关键词
- [ ] ↑↓ 键可选择搜索结果，Enter 跳转
- [ ] canvasSearchStore.searchHistory localStorage 持久化
- [ ] vitest 测试覆盖 searchHistory, fullTextSearch, 高亮渲染

---

## 验收标准 (expect 断言)

### E1 expect()
```typescript
// canvasHistoryStore.compareSnapshots
const diff = canvasHistoryStore.getState().compareSnapshots('snap-a', 'snap-b');
expect(diff).toHaveProperty('added');
expect(diff).toHaveProperty('removed');
expect(diff).toHaveProperty('modified');
expect(Array.isArray(diff.added)).toBe(true);

// HistoryPanel 时间线 Tab 渲染
expect(screen.getByRole('tab', { name: /时间线/i })).toBeInTheDocument();

// SnapshotDiffDialog 差异展示
expect(screen.getByText(/新增.*节点/)).toBeInTheDocument();
```

### E2 expect()
```typescript
// batchDeleteCanvas
await canvasStore.batchDeleteCanvas(['id1', 'id2']);
expect(canvasStore.getState().canvases.find(c => c.id === 'id1')).toBeUndefined();
expect(canvasStore.getState().canvases.find(c => c.id === 'id2')).toBeUndefined();

// BatchOpsToolbar 渲染
expect(screen.getByRole('button', { name: /批量删除/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /批量重命名/i })).toBeInTheDocument();
```

### E3 expect()
```typescript
// activityStore
activityStore.getState().addActivity('user-1', 'edit', 'node-1');
const activities = activityStore.getState().activities;
expect(activities.length).toBeGreaterThan(0);
expect(activities[0].type).toBe('edit');

// RemoteCursor 在线状态
expect(screen.getByLabelText(/在线/i)).toBeInTheDocument();
```

### E4 expect()
```typescript
// ZipExporter PNG/PDF
const zip = new JSZip();
await ZipExporter.exportMultipleAsPNG(['canvas-id-1', 'canvas-id-2'], zip);
expect(zip.file(/\.png$/)).toBeDefined();

await ZipExporter.exportMultipleAsPDF(['canvas-id-1'], zip);
expect(zip.file(/\.pdf$/)).toBeDefined();
```

### E5 expect()
```typescript
// searchHistory 持久化
canvasSearchStore.getState().addToHistory('测试搜索');
const history = canvasSearchStore.getState().searchHistory;
expect(history).toContain('测试搜索');
expect(history.length).toBeLessThanOrEqual(10);

// 搜索结果高亮
expect(container.innerHTML).toContain('<mark>');
```

---

## 页面集成表

| 功能 | 页面/组件 | 路由 | 依赖 |
|------|-----------|------|------|
| 时间线视图 | HistoryPanel.tsx | /canvas/{id} | canvasHistoryStore |
| 快照对比 | SnapshotDiffDialog.tsx | /canvas/{id} | canvasHistoryStore |
| 批量操作 | CanvasListPanel.tsx + BatchOpsToolbar.tsx | /canvas-list | canvasStore |
| 批量导出 | BatchOpsToolbar.tsx | /canvas-list | ZipExporter |
| 活动流 | ActivityFeed.tsx (DDSSidePanel) | /canvas/{id} | activityStore, wsCollaborationHandler |
| 在线状态 | RemoteCursor.tsx | /canvas/{id} | presenceStore |
| PNG/PDF 导出 | CanvasToolbar.tsx | /canvas/{id} | ZipExporter |
| 搜索历史 | DDSSearchPanel.tsx | /canvas/{id} | canvasSearchStore |

---

## 技术风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| html-to-image 在大型画布上 PNG 截取超时 | 中 | 高 | 添加超时检测 + 分块截取 |
| 快照对比在有 100+ 节点的画布上性能差 | 中 | 中 | diff 算法优化或懒加载 |
| WS activity 消息频繁导致带宽问题 | 低 | 中 | 5s 批量推送替代实时推送 |
