# VibeX Sprint63 架构文档

**Project**: vibex-proposals-sprint63
**Date**: 2026-06-05
**Author**: Hermes Coord (self-impl architect phantom)

## 执行摘要

S63 在 S62 协作者基础（editing sync / 文件夹 / 云备份 / UndoRedo / PWA）之上，推进 5 项迭代缺口：

| Epic | 核心目标 | 依赖 S62 资产 |
|------|----------|---------------|
| E1 | 协作者实时游标追踪 | presenceStore, useCollaboration, wsCollabHandler |
| E2 | 协作撤销冲突对话框 | undoRedoStore, wsCollabHandler |
| E3 | 离线画布编辑 | offline-queue.ts |
| E4 | AI 流式响应 + 重试 | agentStore.ts |
| E5 | 画布拖拽排序与批量移动 | canvasFolderStore, FolderTree.tsx |

---

## E1: 协作者实时游标追踪

### 架构决策

**AD-E1.1: Cursor 数据模型扩展 presenceStore**
- S62 presenceStore 已有 `editingNodeIds: Map<nodeId, Set<userId>>`
- S63 扩展为 `remoteCursors: Map<userId, {x: number, y: number, color: string, userName: string}>` + `updateCursor(userId, x, y)` + `removeCursor(userId)` actions
- Cursor color 从 user profile 中获取，未定义则随机分配 HSL

**AD-E1.2: WebSocket 消息类型**
- 新增 `cursor:move` 消息：`{ type: 'cursor:move', payload: { userId, x, y } }`
- `wsCollabHandler.ts` (S62-E1 已存在) 新增 case 处理
- Throttle: 广播端 50ms，本地 store 更新无 throttle

**AD-E1.3: 渲染层 RemoteCursorsLayer**
- `DDSCanvasPage` 或 `DDSFlow` 上新增 `<RemoteCursorsLayer>` 叠加层
- 使用 `useReactFlow()` 的 `screenToFlowPosition` 将 flow coordinates 转 screen
- SVG 渲染：彩色圆形光标 + username label
- 100ms throttle on mousemove event

**AD-E1.4: sendCursor API**
- `useCollaboration.ts` 新增 `sendCursor(x: number, y: number)` 方法
- 内部 50ms throttle，调用 `sendRaw({ type: 'cursor:move', payload: { userId, x, y } })`

### 跨 Epic 集成点
- E1 cursor 组件 → `DDSCanvasPage.tsx` 集成
- E1 cursor 广播 → E2 conflict 时保留 cursor 位置

### 现有资产映射

| 文件 | 来源 | S63 角色 |
|------|------|----------|
| `vibex-fronted/src/lib/collaboration/presenceStore.ts` | S62-E1 ✅ | 扩展 remoteCursors |
| `vibex-fronted/src/lib/collaboration/useCollaboration.ts` | S62-E1 ✅ | 新增 sendCursor |
| `vibex-fronted/src/lib/collaboration/wsCollabHandler.ts` | S62-E1 ✅ | 新增 cursor:move handler |
| `RemoteCursorsLayer.tsx` | **NEW** | S63 新建 |

---

## E2: 协作撤销冲突对话框

### 架构决策

**AD-E2.1: ConflictDialog UI**
- 独立组件 `ConflictDialog.tsx`（非模态框，在 Toolbar 区域内浮动显示）
- 三选项：撤销你的操作 / 保留对方操作 / 取消
- `aria-label="协作冲突对话框"`, `role="dialog"`, `aria-modal="false"`

**AD-E2.2: undoRedoStore 扩展**
- S62-E4 已实现：`undoRedoStore.conflictDialog: { open: true, operatorId, otherUser }`
- S63 新增：`resolveConflict(choice: 'undo-mine' | 'keep-theirs' | 'cancel')` action
- `cancel`: 什么都不做，dismiss
- `undo-mine`: 调用 `performUndo()`
- `keep-theirs`: 丢弃本地 pending 操作，接受对方版本

**AD-E2.3: DDSToolbar 集成**
- S62-E4 已实现 operator badge in Toolbar
- S63: Toolbar 底部或 Modal overlay 区域渲染 `<ConflictDialog>`
- 当 `showConflict()` 被调用时自动渲染

**AD-E2.4: wsCollabHandler collab:conflict 消息**
- 收到 `collab:conflict` 消息时调用 `showConflict()`
- S62-E4 已实现 `broadcastUndo/broadcastRedo`；S63 新增 `broadcastConflict`

### 现有资产映射

| 文件 | 来源 | S63 角色 |
|------|------|----------|
| `vibex-fronted/src/stores/dds/undoRedoStore.ts` | S62-E4 ✅ | 扩展 resolveConflict |
| `vibex-fronted/src/lib/collaboration/wsCollabHandler.ts` | S62-E4 ✅ | 新增 collab:conflict |
| `ConflictDialog.tsx` | **NEW** | S63 新建 |
| `vibex-fronted/src/components/dds/DDSToolbar.tsx` | S62-E4 ✅ | 集成 ConflictDialog |

---

## E3: 离线画布编辑

### 架构决策

**AD-E3.1: 统一离线队列扩展**
- S62-E5 `offline-queue.ts` 已有 `queueCloudBackup()` / `queueUndoRedo()`
- S63 新增 `queueCanvasOp(op: CanvasOp)` — op 形如 `{ type: 'addNode'|'updateNode'|'deleteNode'|'addEdge'|'deleteEdge', payload, timestamp }`
- 重放策略：按 timestamp 顺序（FIFO），冲突时以服务器时间戳为准

**AD-E3.2: canvasStore 拦截层**
- `canvasStore` 的 mutations（addNode/updateNode/deleteNode/addEdge/deleteEdge）检查 `navigator.onLine`
- 离线时：调用 `queueCanvasOp()` 替代直接 commit
- 重连监听：`window.addEventListener('online', syncOfflineQueue)`

**AD-E3.3: syncOfflineQueue**
- 按队列顺序逐一重放，成功后移除
- 重放失败的 op：保留在队列中，提示用户
- 冲突场景：调用 E2 的 ConflictDialog 处理

**AD-E3.4: OfflineBanner 增强**
- S62-E5 已实现 `OfflineBanner.tsx`
- S63: 显示队列中待同步操作数：`"离线编辑模式（X 个操作待同步）"`

### 现有资产映射

| 文件 | 来源 | S63 角色 |
|------|------|----------|
| `vibex-fronted/src/lib/offline-queue.ts` | S62-E5 ✅ | 扩展 queueCanvasOp/syncOfflineQueue |
| `vibex-fronted/src/stores/dds/canvasStore.ts` | **待确认** | 拦截层（需检查） |
| `vibex-fronted/src/components/canvas/CanvasPage.tsx` | S62-E5 ✅ | OfflineBanner 增强 |

---

## E4: AI 流式响应 + 可视化重试

### 架构决策

**AD-E4.1: agentStore SSE 流式支持**
- S62 agentStore 已有 `createSession()` / `updateSession()` / `searchSessions()`
- S63 新增：`streamSession(sessionId, prompt)` — 发起 SSE 连接
- SSE handler: 将 stream chunk 追加到 `streamingContent` + 设置 `isStreaming: true`
- 流结束时：`isStreaming: false`

**AD-E4.2: AIDraftDrawer 打字机效果**
- S62 无 AIDraftDrawer（需要确认是否存在）
- S63: 新建 `AIDraftDrawer.tsx`，渲染 AI 会话草稿
- 使用 `useEffect` + `streamingContent` 更新触发 rerender 逐字显示

**AD-E4.3: 重试按钮**
- `AIDraftDrawer` 显示 "重试" 按钮，调用 `streamSession(sessionId, lastPrompt)`
- 保存 `lastPrompt` 到 session store

### 现有资产映射

| 文件 | 来源 | S63 角色 |
|------|------|----------|
| `vibex-fronted/src/stores/dds/agentStore.ts` | S62 ✅ | 扩展 SSE 流式 |
| `AIDraftDrawer.tsx` | **NEW** | S63 新建 |

---

## E5: 画布拖拽排序与批量移动

### 架构决策

**AD-E5.1: FolderTree 拖拽排序**
- S62-E2 已有 FolderTree UI + 右键菜单
- S63: 启用 `@dnd-kit` 或原生 HTML5 DnD，在 FolderTree 内部拖拽排序
- `canvasFolderStore` 新增 `moveFolder(folderId, targetParentId, insertIndex)`

**AD-E5.2: Dashboard 批量选择**
- `DDSCanvasListPanel` 或 `DashboardPage` 新增批量选择模式
- Checkbox 选中 → "移动到" 按钮 → FolderPicker dialog
- 调用 `canvasFolderStore.batchMoveToFolder(canvasIds, targetFolderId)`

**AD-E5.3: 批量移动 API**
- S62-E2 已有 `moveCanvasToFolder` / `batchMoveToFolder`
- S63 验证并确保 `batchMoveToFolder` 支持 1-N 个 canvasId

### 现有资产映射

| 文件 | 来源 | S63 角色 |
|------|------|----------|
| `vibex-fronted/src/stores/dds/canvasFolderStore.ts` | S62-E2 ✅ | 扩展 moveFolder/batchMoveToFolder |
| `FolderTree.tsx` | S62-E2 ✅ | 拖拽排序 UI |
| `CanvasListPanel.tsx` | **待确认** | 批量选择 UI |

---

## 跨 Epic 集成矩阵

| 集成点 | 涉及 Epic | 方向 |
|--------|-----------|------|
| E1 cursor → E2 conflict | E1→E2 | ConflictDialog 出现时保留远程 cursor 位置 |
| E3 queue → E2 conflict | E3→E2 | 离线重放冲突时触发 ConflictDialog |
| E4 retry → agentStore | E4 内部 | streamSession 失败时 expose 重试接口 |
| E5 batch → canvasFolderStore | E5 内部 | batchMoveToFolder 已有，需 UI 触发 |

---

## 技术债务与风险

1. **wsCollabHandler 膨胀风险**: S62-E1/E4 + S63-E1/E2 都会修改 wsCollabHandler，需要协调
2. **离线队列与 ConflictDialog 耦合**: E3 sync 时遇到冲突需要能调用 E2 的对话框
3. **cursor throttle vs presence 刷新**: E1 的 50ms cursor throttle 与 S62-E1 的 editing presence 需要独立配置
4. **@dnd-kit 依赖**: FolderTree 拖拽如需新库，检查 package.json 是否已有
