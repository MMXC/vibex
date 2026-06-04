# VibeX Sprint63 提案分析

**Sprint**: Sprint63  
**Date**: 2026-06-05  
**Analyst**: Hermes Coord (self-impl due to analyst phantom ghost)

## 执行摘要

基于 S62 已完成功能（协作者编辑同步 / 文件夹管理 / 云端备份 / 协作 Undo/Redo / PWA 离线）识别 5 项迭代缺口，涵盖协作者实时游标追踪、撤销冲突对话、离线画布编辑、AI 流式响应增强、画布拖拽排序。

## S62 产出盘点

| Epic | 核心产出 | 状态 |
|------|----------|------|
| E1 | presenceStore editingNodeIds + NodeEditorLock 叠加层 | ✅ |
| E2 | canvasFolderStore CRUD + FolderTree UI | ✅ |
| E3 | cloudBackup via API routes + BackupPanel Tab2 | ✅ |
| E4 | undoRedoStore + wsCollabHandler undo/redo broadcast | ✅ |
| E5 | offline-queue + SWRegistration + OfflineBanner | ✅ |

## P001: 协作者实时游标追踪

### 问题描述
S62-E1 的 `presenceStore` 仅追踪"谁在编辑哪个节点"，但**没有广播和渲染其他协作者的实时游标位置**。用户无法看到他人在画布上的精确位置，只能看到"正在编辑"状态。

### 根因
`wsCollabHandler` 在 S62-E1 中仅处理 `editing:start/end` 消息类型，游标位置广播 (`cursor:move`) 尚未实现，`DDSCanvas` 也没有渲染 `RemoteCursor` 组件。

### 影响
- 协作体验停留在"锁定通知"阶段，缺乏"实时位置感"
- 与 Figma/Notion 等协作工具体验差距大

### 技术方案
1. `presenceStore` 新增 `remoteCursors: Map<userId, {x: number, y: number}>` + `updateCursor(userId, x, y)` action
2. `wsCollabHandler` 新增 `cursor:move` 消息类型处理，throttle 50ms 广播
3. `DDSCanvas` 新增 `<RemoteCursorsLayer>`，渲染其他用户的 SVG 游标（带用户名标签）
4. `useCollaboration` sendRaw() 已在 S62-E1 支持，直接复用

### 验收标准
- [ ] `presenceStore` 有 `remoteCursors` Map 和 `updateCursor` 方法
- [ ] `wsCollabHandler` 能处理 `cursor:move` 并更新 store
- [ ] `RemoteCursorsLayer.tsx` 渲染所有远程用户游标，带 username 标签
- [ ] vitest: `presenceStore` cursor 方法 5/5 通过
- [ ] 两个用户打开同一画布时，能看到彼此的游标移动

---

## P002: 协作撤销冲突对话

### 问题描述
S62-E4 实现了 `undoRedoStore` + `conflictDialog` 状态机，但**conflict dialog UI 未实现**。两个用户同时编辑同一节点时，撤销操作弹出对话框的 UI 和交互流程缺失。

### 根因
`undoRedoStore` 的 `conflictDialog: {open: true, ...}` 状态已存在，但对应的 `ConflictDialog.tsx` UI 组件未创建，DDSToolbar 也没有渲染它。

### 影响
- 协作 Undo/Redo 功能不可用——store 状态正确但用户看不到对话框
- S62-E4 的 DoD 明确要求 "conflictDialog" 但未完成 UI

### 技术方案
1. 创建 `ConflictDialog.tsx`，渲染三个选项："撤销你的操作" / "保留对方操作" / "取消"
2. `undoRedoStore` 新增 `resolveConflict(choice: 'undo-mine' | 'keep-theirs' | 'cancel')` action
3. `DDSToolbar` 集成 `ConflictDialog`，`showConflict` 时渲染
4. `wsCollabHandler` 在对方撤销时广播 `collab:conflict:，对方触发 conflictDialog

### 验收标准
- [ ] `ConflictDialog.tsx` 渲染在 DDSToolbar 区域内
- [ ] 三个选项按钮均有可访问性标签
- [ ] `resolveConflict('undo-mine')` 正确执行本地撤销
- [ ] vitest: `undoRedoStore` conflict resolution 5/5 通过

---

## P003: 离线画布编辑

### 问题描述
S62-E5 的 PWA 支持仅有 `OfflineBanner` 提示和 SW 缓存，**用户无法在离线状态下编辑画布**。操作被静默丢弃或报错。

### 根因
`offline-queue.ts` 的 `queueCloudBackup/queueUndoRedo` 仅针对备份和 UndoRedo 操作，**普通节点编辑（addNode/updateNode/deleteNode）未被加入队列**。

### 影响
- 离线用户无法正常使用核心画布功能
- 与 Notion/Figma 等离线优先工具体验差距大

### 技术方案
1. `offline-queue.ts` 新增 `queueCanvasOp(op)` 函数，统一队列管理（add/update/delete/edge）
2. `canvasStore` 拦截方法：离线时调用 `queueCanvasOp` 而非直接 commit
3. 重连时 `syncOfflineQueue()` 按顺序重放队列，回放冲突时触发 P003 的 conflictDialog
4. `OfflineBanner` 升级：显示"离线编辑模式（X 个操作待同步）"

### 验收标准
- [ ] `offline-queue.ts` 有 `queueCanvasOp` + `syncOfflineQueue` 函数
- [ ] 离线时节点增删改操作入队不报错
- [ ] 重连后队列按顺序重放
- [ ] vitest: `offline-queue` op queue + replay 8/8 通过

---

## P004: AI 流式响应 + 可视化重试

### 问题描述
S61-E4 的 AI Draft Drawer 有 retry spinner，但**没有真正的流式响应**，也没有 retry button。S62 的协作文档功能完整但 AI 交互仍是 polling 模式。

### 根因
`agentStore` 使用 REST API polling，未使用 SSE 流式。`AIDraftDrawer` 的 retry UI 仅有 spinner，缺少"重试"按钮。

### 技术方案
1. `agentStore` 新增流式方法 `streamSession(sessionId)`，使用 `fetch` + `ReadableStream` 或 `EventSource`
2. `AIDraftDrawer.tsx` 升级：流式输出时逐字显示，打字机效果
3. 新增"重试"按钮（不是 spinner），点击重新发起请求
4. 断线重连 UI 升级：显示重试进度（"正在重连... 尝试 2/3"）

### 验收标准
- [ ] `agentStore` 有 `streamSession` 方法，支持 SSE 流式
- [ ] `AIDraftDrawer` 流式输出时逐字显示（打字机效果）
- [ ] "重试"按钮可点击重新发起请求
- [ ] vitest: `agentStore` streamSession 6/6 通过

---

## P005: 画布拖拽排序与批量移动

### 问题描述
S62-E2 的 `FolderTree` 有右键"移动到"功能，但**不支持画布在文件夹内拖拽排序**，批量移动需要多次操作。

### 根因
`FolderTree` 使用静态渲染列表，`DDSCanvas` 没有实现拖拽排序 API，`canvasFolderStore.moveCanvasToFolder` 存在但 UI 无拖拽集成。

### 技术方案
1. `canvasFolderStore` 新增 `reorderCanvas(canvasId, folderId, newIndex)` action
2. `FolderTree` 升级为可拖拽列表（使用 `@dnd-kit/sortable` 或 HTML5 drag API）
3. `DDSDashboard` 添加批量选择模式：勾选多个画布 → "移动到文件夹" 一次完成
4. `DDSCanvas` 面包屑导航：点击文件夹名跳转

### 验收标准
- [ ] 文件夹内画布可拖拽排序
- [ ] 拖拽时有视觉反馈（placeholder、阴影）
- [ ] 批量选择模式：shift 多选 → "移动到" 一次完成
- [ ] vitest: `canvasFolderStore` reorder 4/4 通过

---

## 优先级矩阵

| ID | 功能 | 价值 | 复杂度 | 优先级 |
|----|------|------|--------|--------|
| P001 | 协作者实时游标追踪 | 高 | 中 | P0 |
| P002 | 协作撤销冲突对话 | 高 | 低 | P0 |
| P003 | 离线画布编辑 | 高 | 高 | P1 |
| P004 | AI 流式响应 + 重试 | 中 | 中 | P1 |
| P005 | 画布拖拽排序与批量移动 | 中 | 低 | P2 |

---

## 附：S62 CHANGELOG 参考

```
## S62-E1: 协作者实时编辑同步 — 2026-06-04
- presenceStore editingNodeIds + NodeEditorLock 叠加层
- useCollabEditing.ts, wsCollabHandler.ts, NodeEditorLock.tsx

## S62-E2: 画布文件夹管理 — 2026-06-04
- canvasFolderStore CRUD + FolderTree UI + CreateFolderDialog
- 30个 vitest

## S62-E3: 画布云端备份与恢复 — 2026-06-04
- cloudBackup via /api/backup routes + BackupPanel Tab2

## S62-E4: 协作 Undo/Redo — 2026-06-04
- undoRedoStore + wsCollabHandler broadcast + DDSToolbar 集成
- conflictDialog 状态存在但 UI 未实现

## S62-E5: 离线 PWA 支持 — 2026-06-04
- offline-queue + SWRegistration + OfflineBanner
- queueCanvasOp 未实现，普通编辑操作未入队
```
