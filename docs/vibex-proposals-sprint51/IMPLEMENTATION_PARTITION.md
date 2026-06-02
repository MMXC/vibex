# Sprint 51 — IMPLEMENTATION_PARTITION.md

**Sprint:** 51 | **版本:** 1.0 | **日期:** 2026-06-02
**状态:** 已规划（Coord Self-Impl Architect）

---

## 验收标准（expect() 断言）

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

## DoD Checklist

### 通用 DoD（所有 Epic 必须满足）

- [ ] 核心功能代码实现完成
- [ ] Vitest 单元测试覆盖率 ≥ 80%
- [ ] E2E 测试（Playwright）关键路径通过
- [ ] 无 TypeScript 编译错误
- [ ] dual-CHANGELOG（root + vibex-fronted）已更新
- [ ] 已合并到 `origin/main`

### E1 — Undo/Redo 持久化

- [ ] IndexedDB `canvas_history` 表创建成功
- [ ] `historyDB.ts` 封装完成（open/close/read/write/clear）
- [ ] `canvasHistoryStore` 扩展 `saveHistory` / `loadHistory` actions
- [ ] `useHistoryPersistence` hook 防抖保存（500ms）
- [ ] 刷新页面后 Undo 可用（≥ 10 步）
- [ ] 画布切换后历史不丢失
- [ ] 存储占用 ≤ 5MB 自动清理机制验证
- [ ] LIRS 驱逐策略单元测试通过
- [ ] Vitest：historyDB、store、hook 测试

### E2 — PNG 批量导出

- [ ] `exportMultipleAsPNG` 实现（客户端并发）
- [ ] 服务端 `/api/export/batch-png` 端点可用
- [ ] `ExportProgress` 组件显示进度（X/Y）
- [ ] `useBatchExport` hook 管理状态
- [ ] 批量导出进度条显示
- [ ] ZIP 文件可正常解压（验证 3 个 PNG）
- [ ] 导出可取消（AbortController）
- [ ] Vitest：导出逻辑、ZIP 打包测试

### E3 — MiniMap 缩略导航

- [ ] `MiniMap.tsx` wrapper 组件实现
- [ ] `@xyflow/react MiniMap` 集成到 `DDSCanvasPage`
- [ ] MiniMap 位于画布右下角（Panel position="bottom-right"）
- [ ] 节点类型颜色区分（DDS节点/AI节点/导出前）
- [ ] 点击 MiniMap 区域视口跳转（`fitView`）
- [ ] 100 节点画布 MiniMap 渲染 ≤ 16ms（节点采样）
- [ ] Vitest：节点着色、采样逻辑测试

### E4 — 多选批量操作

- [ ] `useSelectionBox` hook 实现（鼠标框选）
- [ ] `ddsChapterStore` 新增 `moveCards` / `duplicateCards` actions
- [ ] `SelectionToolbar` 浮动 Toolbar（选中 2+ 时显示）
- [ ] `useAlignmentTools` 实现（左/右/水平居中/垂直居中）
- [ ] 框选工具可见（鼠标拖拽生成选区框）
- [ ] 选中 2+ 卡片时浮动 Toolbar 出现
- [ ] 对齐工具（左/右/水平/垂直居中）功能正常
- [ ] Delete 键批量删除触发确认提示
- [ ] Vitest：框选计算、批量操作、对齐逻辑测试

### E5 — @提及 + 评论深化

- [ ] `parseMentions` 正则解析实现
- [ ] `useMentionCompletion` hook 实现（@ 触发补全）
- [ ] `CommentInput` 添加 @ 补全下拉 UI
- [ ] `CommentCard` 支持 `position?: {x, y}` 坐标评论
- [ ] `mentionsStore` 新增（mentions[]、通知状态）
- [ ] `/api/comments/mentions` 后端 API
- [ ] `wsCommentHandler` 处理 `comment:mention` 消息
- [ ] @ 触发补全下拉
- [ ] 评论发送后被 @ 用户收到 WebSocket 通知
- [ ] 坐标评论可添加且正确显示
- [ ] 无 @mention 解析语法错误
- [ ] Vitest：@ 解析、补全逻辑、坐标评论布局测试

---

## 文件清单

### 新增文件

| 文件 | 路径 | Epic |
|------|------|------|
| `historyDB.ts` | `src/lib/canvas/historyDB.ts` | E1 |
| `useHistoryPersistence.ts` | `src/hooks/useHistoryPersistence.ts` | E1 |
| `exportMultipleAsPNG.ts` | `src/lib/canvas/exportMultipleAsPNG.ts` | E2 |
| `ExportProgress.tsx` | `src/components/dds/export/ExportProgress.tsx` | E2 |
| `useBatchExport.ts` | `src/hooks/useBatchExport.ts` | E2 |
| `MiniMap.tsx` | `src/components/dds/MiniMap.tsx` | E3 |
| `useSelectionBox.ts` | `src/hooks/useSelectionBox.ts` | E4 |
| `SelectionToolbar.tsx` | `src/components/dds/SelectionToolbar.tsx` | E4 |
| `useAlignmentTools.ts` | `src/hooks/useAlignmentTools.ts` | E4 |
| `parseMentions.ts` | `src/lib/canvas/parseMentions.ts` | E5 |
| `useMentionCompletion.ts` | `src/hooks/useMentionCompletion.ts` | E5 |
| `mentionsStore.ts` | `src/stores/dds/mentionsStore.ts` | E5 |

### 修改文件

| 文件 | 修改内容 | Epic |
|------|----------|------|
| `src/stores/dds/canvasHistoryStore.ts` | 新增 saveHistory/loadHistory/clearHistory actions | E1 |
| `src/app/dds/[id]/page.tsx` | 集成 MiniMap Panel | E3 |
| `src/lib/canvas/stores/viewportBoundsStore.ts` | 暴露 fitView 方法 | E3 |
| `src/stores/dds/ddsChapterStore.ts` | 新增 moveCards/duplicateCards | E4 |
| `src/components/dds/comment/CommentInput.tsx` | 添加 @ 补全下拉 | E5 |
| `src/components/dds/comment/CommentCard.tsx` | 支持 position 坐标评论 | E5 |
| `src/lib/canvas/wsCommentHandler.ts` | 处理 comment:mention 类型 | E5 |

### 测试文件

| 文件 | 路径 |
|------|------|
| `historyDB.test.ts` | `src/lib/canvas/__tests__/historyDB.test.ts` |
| `canvasHistoryStore.test.ts` | `src/stores/dds/__tests__/canvasHistoryStore.test.ts` |
| `exportMultipleAsPNG.test.ts` | `src/lib/canvas/__tests__/exportMultipleAsPNG.test.ts` |
| `MiniMap.test.ts` | `src/components/dds/__tests__/MiniMap.test.ts` |
| `useSelectionBox.test.ts` | `src/hooks/__tests__/useSelectionBox.test.ts` |
| `useAlignmentTools.test.ts` | `src/hooks/__tests__/useAlignmentTools.test.ts` |
| `parseMentions.test.ts` | `src/lib/canvas/__tests__/parseMentions.test.ts` |

### 后端文件

| 文件 | 路径 | 说明 |
|------|------|------|
| `batch-png.ts` | `vibex-backend/src/routes/export/batch-png.ts` | 批量 PNG 导出 ZIP 合并 |
| `mentions.ts` | `vibex-backend/src/routes/comments/mentions.ts` | 存储评论 mentions 列表 |

---

## 依赖关系

```
E1 (Undo/Redo 持久化) ──┐
                         ├── 无跨依赖（独立）
E3 (MiniMap) ────────────┤
                         │
E2 (PNG 批量导出) ───────┤  ← 依赖 E1（历史快照可导出）
                         │
E4 (多选批量操作) ───────┤  ← 独立
                         │
E5 (@提及) ──────────────┘  ← 依赖 S50-E3（评论基础设施）
```

---

*文档版本：1.0 | 最后更新：2026-06-02 | Architect (Coord Self-Impl)*
