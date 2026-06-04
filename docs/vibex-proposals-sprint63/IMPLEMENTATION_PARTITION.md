# VibeX Sprint63 IMPLEMENTATION_PARTITION.md

**Project**: vibex-proposals-sprint63
**Date**: 2026-06-05
**Author**: Hermes Coord (self-impl architect phantom)

## E1: 协作者实时游标追踪

### DoD Checklist

- [ ] **D1.1**: `presenceStore` 新增 `remoteCursors: Map<userId, {x: number, y: number, color: string, userName: string}>` + `updateCursor(userId, x, y, color, userName)` + `removeCursor(userId)` actions
- [ ] **D1.2**: `wsCollabHandler` 新增 `cursor:move` 消息类型处理，收到后调用 `updateCursor`，throttle 50ms
- [ ] **D1.3**: `useCollaboration` 新增 `sendCursor(x, y)` 方法，throttle 50ms，调用 `sendRaw({ type: 'cursor:move', payload: { userId, x, y } })`
- [ ] **D1.4**: 创建 `RemoteCursorsLayer.tsx` 组件，渲染所有远程用户 SVG 游标（彩色圆形光标 + username 标签），使用 `useReactFlow()` 的 `screenToFlowPosition` 坐标转换
- [ ] **D1.5**: `DDSCanvasPage.tsx` 或 `DDSFlow.tsx` 集成 `<RemoteCursorsLayer>`，在 ReactFlow 之上渲染；`onNodeMouseMove` 事件 → `screenToFlowPosition` → `sendCursor`
- [ ] **D1.6**: vitest: `presenceStore` cursor 方法（updateCursor/removeCursor/remoteCursors Map）5/5 通过
- [ ] **D1.7**: 端到端测试：两用户打开同一画布，移动鼠标 → 彼此能看到对方游标

### 新增文件

| 文件 | 路径 | 说明 |
|------|------|------|
| remoteCursors | `vibex-fronted/src/lib/collaboration/presenceStore.ts` | 扩展现有 store |
| RemoteCursorsLayer | `vibex-fronted/src/components/dds/canvas-dashboard/RemoteCursorsLayer.tsx` | **NEW** |
| Cursor hook | `vibex-fronted/src/lib/collaboration/useCursorBroadcast.ts` | **NEW** |

### 扩展文件

| 文件 | 改动 |
|------|------|
| `vibex-fronted/src/lib/collaboration/presenceStore.ts` | +remoteCursors Map, +updateCursor, +removeCursor |
| `vibex-fronted/src/lib/collaboration/useCollaboration.ts` | +sendCursor |
| `vibex-fronted/src/lib/collaboration/wsCollabHandler.ts` | +cursor:move case |
| `vibex-fronted/src/components/dds/DDSCanvasPage.tsx` | +RemoteCursorsLayer + onNodeMouseMove |

### expect() 断言示例

```typescript
expect(store.getState().remoteCursors.has('user-2')).toBe(true);
expect(store.getState().remoteCursors.get('user-2')?.x).toBe(100);
expect(store.getState().remoteCursors.get('user-2')?.color).toBe('#FF6B6B');
store.getState().updateCursor('user-2', 200, 300, '#4ECDC4', 'Alice');
expect(store.getState().remoteCursors.get('user-2')?.x).toBe(200);
store.getState().removeCursor('user-2');
expect(store.getState().remoteCursors.has('user-2')).toBe(false);
```

### 测试命令

```bash
cd vibex-fronted
npx vitest run presenceStore --reporter=verbose
```

---

## E2: 协作撤销冲突对话框

### DoD Checklist

- [ ] **D2.1**: 创建 `ConflictDialog.tsx`，渲染三个选项按钮：`"撤销你的操作"` / `"保留对方操作"` / `"取消"`，`aria-label="协作冲突对话框"`, `role="dialog"`
- [ ] **D2.2**: `undoRedoStore` 新增 `resolveConflict(choice: 'undo-mine' | 'keep-theirs' | 'cancel')` action，清空 conflictDialog 状态并执行对应操作
- [ ] **D2.3**: `DDSToolbar.tsx` 集成 `ConflictDialog`，当 `conflictDialog.open === true` 时渲染
- [ ] **D2.4**: `wsCollabHandler` 收到 `collab:conflict` 消息时调用 `showConflict({ operatorId, otherUser, ... })`
- [ ] **D2.5**: vitest: `undoRedoStore` conflict resolution 5/5 通过（undo-mine / keep-theirs / cancel 各场景）

### 新增文件

| 文件 | 路径 | 说明 |
|------|------|------|
| ConflictDialog | `vibex-fronted/src/components/dds/canvas-dashboard/ConflictDialog.tsx` | **NEW** |

### 扩展文件

| 文件 | 改动 |
|------|------|
| `vibex-fronted/src/stores/dds/undoRedoStore.ts` | +resolveConflict action |
| `vibex-fronted/src/lib/collaboration/wsCollabHandler.ts` | +collab:conflict handler |
| `vibex-fronted/src/components/dds/DDSToolbar.tsx` | +ConflictDialog 渲染 |

### expect() 断言示例

```typescript
// conflictDialog 打开状态
expect(store.getState().conflictDialog.open).toBe(true);
expect(store.getState().conflictDialog.operatorId).toBe('user-1');

// resolve with undo-mine
store.getState().resolveConflict('undo-mine');
expect(store.getState().conflictDialog.open).toBe(false);
// verify undo was performed (history.length decreased or undoStack popped)

// resolve with keep-theirs
store.getState().resolveConflict('keep-theirs');
expect(store.getState().conflictDialog.open).toBe(false);
// verify undo was NOT performed

// resolve with cancel
store.getState().resolveConflict('cancel');
expect(store.getState().conflictDialog.open).toBe(false);
```

### 测试命令

```bash
cd vibex-fronted
npx vitest run undoRedoStore --reporter=verbose
```

---

## E3: 离线画布编辑

### DoD Checklist

- [ ] **D3.1**: `offline-queue.ts` 新增 `queueCanvasOp(op: { type: string; payload: unknown; timestamp: number })` 函数 + `syncOfflineQueue()` 函数 + `getQueueSize()` + `clearQueue()`
- [ ] **D3.2**: `canvasStore` 拦截层：在 addNode/updateNode/deleteNode/addEdge/deleteEdge 入口处检测 `navigator.onLine`，离线时调用 `queueCanvasOp()` 替代直接 commit
- [ ] **D3.3**: 重连时自动触发 `syncOfflineQueue()` — `window.addEventListener('online', syncOfflineQueue)` 在 CanvasPage 中注册
- [ ] **D3.4**: 重放失败时保留在队列中并提示用户；重放冲突时调用 E2 的 ConflictDialog
- [ ] **D3.5**: `OfflineBanner` 增强：显示待同步操作数 `pendingOps`
- [ ] **D3.6**: vitest: `offline-queue` queueCanvasOp + syncOfflineQueue 5/5 通过

### 新增文件

| 文件 | 路径 | 说明 |
|------|------|------|
| queueCanvasOp | `vibex-fronted/src/lib/offline-queue.ts` | 扩展现有文件 |

### 扩展文件

| 文件 | 改动 |
|------|------|
| `vibex-fronted/src/lib/offline-queue.ts` | +queueCanvasOp, +syncOfflineQueue, +getQueueSize, +clearQueue |
| `vibex-fronted/src/stores/dds/canvasStore.ts` | +离线拦截逻辑 |
| `vibex-fronted/src/components/canvas/CanvasPage.tsx` | +online event listener, +pendingOps 显示 |

### expect() 断言示例

```typescript
// offline-queue
queueCanvasOp({ type: 'addNode', payload: { nodeId: 'n1' }, timestamp: Date.now() });
expect(getQueueSize()).toBe(1);
clearQueue();
expect(getQueueSize()).toBe(0);
```

### 测试命令

```bash
cd vibex-fronted
npx vitest run offline-queue --reporter=verbose
```

---

## E4: AI 流式响应 + 可视化重试

### DoD Checklist

- [ ] **D4.1**: `agentStore` 新增 `streamSession(sessionId, prompt)` action，发起 SSE 连接；`streamingContent: string` + `isStreaming: boolean` + `lastPrompt: string` state
- [ ] **D4.2**: SSE handler：将 stream chunk 追加到 `streamingContent`，设置 `isStreaming: true`，结束时 `isStreaming: false`
- [ ] **D4.3**: 创建 `AIDraftDrawer.tsx`，渲染 AI 会话草稿区域，打字机效果（逐字追加 streamingContent），`isStreaming` 时显示加载动画
- [ ] **D4.4**: `AIDraftDrawer` 显示"重试"按钮，调用 `streamSession(sessionId, lastPrompt)`
- [ ] **D4.5**: vitest: `agentStore` streamSession / streamingContent / isStreaming 5/5 通过
- [ ] **D4.6**: vitest: `AIDraftDrawer` 渲染 + 重试按钮 3/3 通过

### 新增文件

| 文件 | 路径 | 说明 |
|------|------|------|
| AIDraftDrawer | `vibex-fronted/src/components/dds/canvas-dashboard/AIDraftDrawer.tsx` | **NEW** |

### 扩展文件

| 文件 | 改动 |
|------|------|
| `vibex-fronted/src/stores/dds/agentStore.ts` | +streamSession, +streamingContent, +isStreaming, +lastPrompt |

### expect() 断言示例

```typescript
expect(store.getState().isStreaming).toBe(false);
expect(store.getState().streamingContent).toBe('');
// Simulate SSE chunk
act(() => { store.getState().appendStreamChunk('Hello'); });
expect(store.getState().streamingContent).toBe('Hello');
act(() => { store.getState().endStream(); });
expect(store.getState().isStreaming).toBe(false);
```

### 测试命令

```bash
cd vibex-fronted
npx vitest run agentStore --reporter=verbose
npx vitest run AIDraftDrawer --reporter=verbose
```

---

## E5: 画布拖拽排序与批量移动

### DoD Checklist

- [ ] **D5.1**: `canvasFolderStore` 新增 `moveFolder(folderId, targetParentId, insertIndex: number)` action，支持 FolderTree 内部排序
- [ ] **D5.2**: `FolderTree.tsx` 启用拖拽排序（`@dnd-kit/core` 或原生 HTML5 DnD），拖拽时高亮放置目标，`onDragEnd` 调用 `moveFolder`
- [ ] **D5.3**: `DDSCanvasListPanel` 或 `DashboardPage` 新增批量选择模式：checkbox 列 + "移动到" 按钮
- [ ] **D5.4**: FolderPicker dialog：`canvasFolderStore.getRootFolders()` / `getChildFolders()` 选择目标文件夹
- [ ] **D5.5**: 批量移动：`canvasFolderStore.batchMoveToFolder(canvasIds: string[], targetFolderId: string | null)`
- [ ] **D5.6**: vitest: `canvasFolderStore` moveFolder + batchMoveToFolder 5/5 通过

### 新增文件

| 文件 | 路径 | 说明 |
|------|------|------|
| FolderPickerDialog | `vibex-fronted/src/components/dds/canvas-dashboard/FolderPickerDialog.tsx` | **NEW** |

### 扩展文件

| 文件 | 改动 |
|------|------|
| `vibex-fronted/src/stores/dds/canvasFolderStore.ts` | +moveFolder, +batchMoveToFolder |
| `vibex-fronted/src/components/dds/canvas-dashboard/FolderTree.tsx` | +拖拽排序 |
| `vibex-fronted/src/components/dds/canvas-dashboard/CanvasListPanel.tsx` | +批量选择 checkbox + 移动按钮 |

### expect() 断言示例

```typescript
// moveFolder
store.getState().createFolder('Folder A', null);
store.getState().createFolder('Folder B', null);
const folders = store.getState().getRootFolders();
const folderA = folders.find(f => f.name === 'Folder A');
const folderB = folders.find(f => f.name === 'Folder B');
store.getState().moveFolder(folderB.id, null, 0); // move to top
const newOrder = store.getState().getRootFolders();
expect(newOrder[0].id).toBe(folderB.id);

// batchMoveToFolder
store.getState().batchMoveToFolder(['canvas-1', 'canvas-2'], folderA.id);
const canvasesInFolder = store.getState().getCanvasesInFolder(folderA.id);
expect(canvasesInFolder.length).toBeGreaterThanOrEqual(2);
```

### 测试命令

```bash
cd vibex-fronted
npx vitest run canvasFolderStore --reporter=verbose
```

---

## 依赖关系图

```
E1 (remoteCursors)    E2 (ConflictDialog)    E3 (OfflineEdit)    E4 (AI Stream)    E5 (DragSort)
       │                      │                    │                   │              │
       │                      │                    │                   │              │
       │                      │                    ├───────────────────┤              │
       │                      │                    │ E3 conflict → E2  │              │
       └──────────────────────┴────────────────────┘                   │              │
                     E1 cursor visible during E2 conflict               │              │
                                                                          │              │
                                                                          └──────────────┘
```

## 测试统计预估

| Epic | 新增测试数 | 目标 |
|------|-----------|------|
| E1 | 5 | 5/5 |
| E2 | 5 | 5/5 |
| E3 | 5 | 5/5 |
| E4 | 8 | 8/8 |
| E5 | 5 | 5/5 |
| **Total** | **28** | **28+** |
