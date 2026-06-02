# Sprint 51 PRD — 画布编辑体验补强

## 1. 执行摘要

**背景：** Sprint 50 完成了画布搜索、自动布局、评论通知、模板导入导出的核心功能。Sprint 51 聚焦编辑体验补强（P001 Undo/Redo 持久化、P002 PNG 批量导出）和协作深化（P003 MiniMap、P004 多选批量操作、P005 @提及评论）。

**目标：** 在 Sprint 50 基础上，提升大型画布的编辑效率和数据安全性。

**成功指标：**
- Undo/Redo 刷新后可用 ≥ 10 步
- 批量导出 10 张 PNG < 30s
- MiniMap 渲染性能 ≤ 16ms/帧

---

## 2. Epic 拆分

| ID | Epic | 优先级 | 核心改动 | 工时估计 |
|----|------|--------|----------|----------|
| E1 | Undo/Redo 持久化 | P0 | IndexedDB 存储、historyStore 扩展、画布切换历史恢复 | 8h |
| E2 | PNG 批量导出 | P1 | 批量导出 API、CanvasListPanel 集成、ZIP 打包 | 6h |
| E3 | MiniMap 缩略导航 | P1 | @xyflow/react MiniMap 集成、节点采样、Panel 定位 | 4h |
| E4 | 多选批量操作 | P1 | 框选 hook、浮动 Toolbar、对齐工具 | 6h |
| E5 | @提及 + 评论深化 | P2 | @解析、补全 UI、坐标评论、WebSocket 通知 | 5h |

---

## 3. 验收标准（expect() 断言）

### E1 — Undo/Redo 持久化

```typescript
// IndexedDB 存储
expect(canvasHistoryStore.getState().historyDB).toBeDefined();
const saved = await loadHistoryFromDB('canvas-123');
expect(saved.snapshots.length).toBeGreaterThan(0);

// 历史恢复
expect(saved.snapshots[0].operations.length).toBeGreaterThanOrEqual(10);

// 存储上限
const size = await getHistoryDBSize('canvas-123');
expect(size).toBeLessThan(5 * 1024 * 1024); // < 5MB
```

### E2 — PNG 批量导出

```typescript
const blobs = await exportMultipleAsPNG(['c1', 'c2', 'c3']);
expect(blobs.length).toBe(3);
expect(blobs[0].type).toBe('image/png');

// ZIP 打包
const zip = await packageAsZip(blobs);
expect(zip.type).toBe('application/zip');
expect(zip.size).toBeGreaterThan(0);
```

### E3 — MiniMap 缩略导航

```typescript
// MiniMap 可见
expect(screen.queryByRole('img', { name: /minimap/i })).toBeInTheDocument();

// 节点采样（性能）
const minimapNodeCount = screen.queryAllByTestId('minimap-node');
expect(minimapNodeCount.length).toBeLessThanOrEqual(canvasNodes.length);

// 点击跳转
userEvent.click(screen.queryByTestId('minimap-viewport'));
expect(mockFitView).toHaveBeenCalled();
```

### E4 — 多选批量操作

```typescript
// 框选
const selected = selectCardsInRect(cards, { x: 0, y: 0, w: 100, h: 100 });
expect(selected.length).toBeGreaterThan(1);

// 批量复制
const duplicates = duplicateCards(['c1', 'c2']);
expect(duplicates.length).toBe(2);
expect(duplicates[0].position.x).toBe(cards[0].position.x + 20);

// 批量删除
act(() => { deleteCards(['c1', 'c2']); });
expect(canvasCards.length).toBe(originalCount - 2);
```

### E5 — @提及

```typescript
const mentions = parseMentions('@alice @bob 你好');
expect(mentions).toEqual(['alice', 'bob']);

// @补全触发
userEvent.type(commentInput, '@');
expect(screen.queryByRole('listbox')).toBeInTheDocument();

// WebSocket 通知
expect(wsServer.sentTo('alice')).toContainEqual(
  expect.objectContaining({ type: 'comment:mention', from: 'bob' })
);
```

---

## 4. Definition of Done

### 通用 DoD（所有 Epic）

- [ ] 核心功能代码实现完成
- [ ] Vitest 单元测试覆盖率 ≥ 80%
- [ ] E2E 测试（Playwright）关键路径通过
- [ ] 无 TypeScript 编译错误
- [ ] dual-CHANGELOG（root + vibex-fronted）已更新
- [ ] 已合并到 `origin/main`

### E1 特定 DoD

- [ ] IndexedDB `canvas_history` 表创建成功
- [ ] 刷新页面后 Undo 可用（≥ 10 步）
- [ ] 画布切换后历史不丢失
- [ ] 存储占用 ≤ 5MB 自动清理机制验证
- [ ] LIRS 驱逐策略单元测试通过

### E2 特定 DoD

- [ ] 批量导出进度条显示
- [ ] ZIP 文件可正常解压（验证 3 个 PNG）
- [ ] 导出可取消（AbortController）
- [ ] 服务端 `/api/export/batch-png` 端点可用

### E3 特定 DoD

- [ ] MiniMap 位于画布右下角
- [ ] 点击 MiniMap 区域视口跳转
- [ ] 100 节点画布 MiniMap 渲染 ≤ 16ms
- [ ] 不同节点类型颜色区分（普通/AI生成/导出前）

### E4 特定 DoD

- [ ] 框选工具可见（鼠标拖拽生成选区框）
- [ ] 选中 2+ 卡片时浮动 Toolbar 出现
- [ ] 对齐工具（左/右/水平/垂直居中）功能正常
- [ ] Delete 键批量删除触发确认提示

### E5 特定 DoD

- [ ] @ 触发补全下拉
- [ ] 评论发送后被 @ 用户收到通知
- [ ] 坐标评论（非卡片评论）可添加且正确显示
- [ ] 无 @mention 解析语法错误

---

## 5. 页面集成

| Epic | 页面 | 组件 |
|------|------|------|
| E1 | DDSCanvasPage | canvasHistoryStore（透明集成） |
| E2 | CanvasListPanel | ExportPanel（新增批量导出入口） |
| E3 | DDSCanvasPage | MiniMap（右下角 Panel） |
| E4 | DDSCanvasPage | SelectionToolbar（浮动）+ AlignmentTools |
| E5 | CommentPanel | CommentInput（@补全）+ CommentCard（坐标评论） |

---

## 6. 依赖关系

- E1 独立（不依赖其他 Epic）
- E2 依赖 E1（历史快照可导出）
- E3 独立
- E4 独立
- E5 依赖 S50-E3（评论基础设施）

---

*PRD 版本：1.0 | 2026-06-02 | VibeX Team*
