# VibeX Sprint63 PRD

**Project**: vibex-proposals-sprint63  
**Date**: 2026-06-05  
**Status**: Draft

---

## 执行摘要

基于 S62 协作者编辑同步 / 文件夹管理 / 云端备份 / 协作 Undo/Redo / PWA 离线五项功能，识别 S63 五项迭代缺口：

| ID | Epic | 核心目标 |
|----|------|----------|
| E1 | 协作者实时游标追踪 | 广播并渲染其他协作者的画布游标位置 |
| E2 | 协作撤销冲突对话 | 实现 ConflictDialog UI，响应 undoRedoStore 的 conflictDialog 状态 |
| E3 | 离线画布编辑 | 将所有画布操作纳入 offline-queue，支持离线增删改 |
| E4 | AI 流式响应 + 可视化重试 | agentStore 支持 SSE 流式，AIDraftDrawer 打字机效果 + 重试按钮 |
| E5 | 画布拖拽排序与批量移动 | FolderTree 拖拽排序 + Dashboard 批量选择多画布移动 |

---

## Epic × DoD Checklist

### E1: 协作者实时游标追踪

**DoD D1.1**: `presenceStore` 新增 `remoteCursors: Map<userId, {x: number, y: number, color: string}>` + `updateCursor(userId, x, y)` + `removeCursor(userId)` actions  
**DoD D1.2**: `wsCollabHandler` 新增 `cursor:move` 消息类型，收到后调用 `updateCursor`，throttle 50ms  
**DoD D1.3**: `useCollaboration` sendCursor(x, y) 方法，throttle 50ms 广播 `cursor:move` 消息  
**DoD D1.4**: `RemoteCursorsLayer.tsx` 组件，渲染所有远程用户 SVG 游标（彩色圆形 + username 标签）  
**DoD D1.5**: `DDSCanvas` 集成 `<RemoteCursorsLayer>`，在 `<ReactFlow>` 之上渲染  
**DoD D1.6**: vitest: `presenceStore` cursor 方法 5/5 通过  
**DoD D1.7**: 端到端测试：两用户打开同一画布，移动鼠标 → 彼此能看到对方游标  

**expect() 断言示例**:
```typescript
expect(store.getState().remoteCursors.has('user-2')).toBe(true);
expect(store.getState().remoteCursors.get('user-2')?.x).toBe(100);
```

---

### E2: 协作撤销冲突对话

**DoD D2.1**: 创建 `ConflictDialog.tsx`，渲染三个选项："撤销你的操作" / "保留对方操作" / "取消"，`aria-label="协作冲突对话框"`  
**DoD D2.2**: `undoRedoStore` 新增 `resolveConflict(choice: 'undo-mine' | 'keep-theirs' | 'cancel')` action，清空 conflictDialog 状态并执行对应操作  
**DoD D2.3**: `DDSToolbar` 集成 `ConflictDialog`，`showConflict()` 时渲染，`<div role="dialog" aria-modal="true">`  
**DoD D2.4**: wsCollabHandler 收到 `collab:conflict` 消息时调用 `showConflict({operatorId, otherUser, ...})`  
**DoD D2.5**: vitest: `undoRedoStore` conflict resolution 5/5 通过  

**expect() 断言示例**:
```typescript
store.getState().resolveConflict('undo-mine');
expect(store.getState().conflictDialog.open).toBe(false);
```

---

### E3: 离线画布编辑

**DoD D3.1**: `offline-queue.ts` 新增 `CanvasOp` 类型 + `queueCanvasOp(op: CanvasOp)` + `syncOfflineQueue()` 函数，队列持久化到 localStorage  
**DoD D3.2**: `canvasStore` 拦截所有 mutation 方法（addNode/updateNode/deleteNode/addEdge/removeEdge），离线时调用 `queueCanvasOp` 而非直接 commit  
**DoD D3.3**: `OfflineBanner` 升级：显示"离线编辑模式（X 个操作待同步）"，有 pending 操作时显示 count  
**DoD D3.4**: 重连时 `syncOfflineQueue()` 按 FIFO 顺序重放，回放冲突时调用 `showConflict()`  
**DoD D3.5**: vitest: `offline-queue` queue + replay + conflict 8/8 通过  

**expect() 断言示例**:
```typescript
queueCanvasOp({ type: 'addNode', node: {id: 'n1', data: {}} });
expect(getQueue().length).toBe(1);
```

---

### E4: AI 流式响应 + 可视化重试

**DoD D4.1**: `agentStore` 新增 `streamSession(sessionId)` 方法，使用 `fetch` + `ReadableStream` 或 `EventSource`，更新 `streamingMessage` 状态  
**DoD D4.2**: `AIDraftDrawer` 流式输出时逐字追加到 message 末尾（打字机效果），`aria-live="polite"`  
**DoD D4.3**: 新增"重试"按钮（`aria-label="重新生成回复"`），点击重新调用 `streamSession`，替换 spinner  
**DoD D4.4**: 断线重连 UI 升级：显示"正在重连... 尝试 N/3"，倒计时 3-2-1 后自动重试  
**DoD D4.5**: vitest: `agentStore` streamSession 6/6 通过  

**expect() 断言示例**:
```typescript
expect(store.getState().streamingMessage).toBeTruthy();
expect(screen.queryByLabelText('重新生成回复')).toBeInTheDocument();
```

---

### E5: 画布拖拽排序与批量移动

**DoD D5.1**: `canvasFolderStore` 新增 `reorderCanvas(canvasId, folderId, newIndex)` action，持久化到 IndexedDB  
**DoD D5.2**: `FolderTree` 升级为可拖拽列表，使用 HTML5 Drag API 或 `@dnd-kit/sortable`，拖拽时有 visual placeholder  
**DoD D5.3**: `DDSDashboard` 批量选择模式：shift+click 多选 → toolbar 显示"已选中 X 个" + "移动到文件夹"按钮  
**DoD D5.4**: `DDSCanvas` 面包屑导航：显示当前文件夹路径，点击可跳转  
**DoD D5.5**: vitest: `canvasFolderStore` reorder + batchMove 6/6 通过  

**expect() 断言示例**:
```typescript
store.getState().reorderCanvas('c1', 'f1', 2);
expect(store.getState().canvases.find(c => c.id === 'c1')?.folderIndex).toBe(2);
```

---

## 功能 × 页面集成表

| 功能 | 页面 | 组件 | 文件 |
|------|------|------|------|
| E1 RemoteCursors | CanvasPage | `<DDSCanvas>` | `src/components/dds/canvas/DDSCanvas.tsx` |
| E1 Cursor broadcast | CanvasPage | `<DDSCanvas>` + hook | `src/hooks/canvas/useCollaboration.ts` |
| E2 ConflictDialog | CanvasPage | `<DDSToolbar>` | `src/components/dds/toolbar/DDSToolbar.tsx` |
| E3 offline queue | 全局 | `canvasStore` | `src/lib/canvas/stores/canvasStore.ts` |
| E4 AIDraftDrawer | CanvasPage | `<AIDraftDrawer>` | `src/components/dds/ai/AIDraftDrawer.tsx` |
| E5 FolderTree drag | Dashboard | `<DDSDashboard>` | `src/components/dds/dashboard/DDSDashboard.tsx` |

---

## Non-Functional Requirements

- **性能**: RemoteCursorsLayer throttle 50ms，队列重放单个操作 <50ms
- **离线可靠性**: 队列持久化 localStorage，重启不丢失；回放失败时保留队列不丢弃
- **可访问性**: ConflictDialog `role="dialog"`, RemoteCursor 有 `aria-label`
- **测试覆盖率**: 每个 Epic 核心逻辑 vitest ≥ 5/5

---

## Out of Scope (S63)

- 画布版本分支管理（后续 Sprint）
- 协作者 @mentions 通知推送
- AI Agent 多轮对话上下文管理
- 文件夹层级超过 3 层
