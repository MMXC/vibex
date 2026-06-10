# VibeX Sprint77 架构设计文档

**Sprint**: vibex-proposals-sprint77
**日期**: 2026-06-08
**Architect**: coord-self-impl (Phase1 entry-point phantom)

---

## 架构决策

### E1 决策: 通知持久化架构

**问题**: 通知仅存在内存中，WS 断开时丢失。

**方案**: Zustand + IndexedDB 双写 + 后端 REST API

```
WS message arrives
    ↓
notificationStore._addNotification(payload)
    ↓
┌─────────────────┐
│ 1. Store 内存   │ → Zustand state (即时 UI 更新)
│ 2. IndexedDB    │ → notificationStore._saveToDB() (持久化)
│ 3. 后端 POST     │ → /api/notifications (跨设备同步)
└─────────────────┘
```

**技术细节**:
- `notificationStore.ts` 新增 `_saveToDB()` / `_loadFromDB()` / `_markRead()`
- IndexedDB schema: `notifications` objectStore (keyPath: id)
- REST API: `GET /api/notifications?unread=true` (登录时拉取)
- Offline-first: 先写 IndexedDB，后异步 POST 后端

**向后兼容**: 现有 `notificationStore.ts` 的 `addNotification()` 调用不变，新增 `_addForTest` 内部方法

---

### E2 决策: WS 心跳与重连架构

**问题**: WS 断线无感知，协作者状态恢复不及时。

**方案**: 心跳 + 指数退避 + 状态重同步

```
WS instance
├── heartbeat: 30s interval ping
├── onPong: lastPongReceived = Date.now()
└── onClose:
    ├── connectionStatus = 'reconnecting'
    ├── exponentialBackoff reconnect
    │   └── delay = min(1000 * 2^attempt, 30000)
    └── onReconnect:
        ├── presenceStore.reSync()
        ├── GET /api/canvas/:id (拉取最新)
        └── connectionStatus = 'connected'
```

**技术细节**:
- `useWebSocket.ts` — 重构为 class-based `WebSocketManager`
- 心跳 ping: `{ type: 'ping', timestamp }`
- 心跳 pong: `{ type: 'pong', timestamp }`
- 3次心跳丢失: 90s 无 pong → 重连
- 重连后调用 `presenceStore.reSync()` — 重新 broadcast presence

---

### E3 决策: 分支权限架构

**问题**: 所有协作者可任意操作任意分支。

**方案**: SnapshotEntry.branchOwner + 操作前权限校验

```
historyDB.ts SnapshotEntry
{
  id, canvasId, snapshotId, branchName,
  parentSnapshotId?, branchOwner,    ← 新增
  createdAt, data
}
```

**权限检查逻辑**:
```typescript
// canvasHistoryStore.ts
deleteBranch(branchName: string, userId: string): boolean {
  const branch = getBranchList().find(b => b.branchName === branchName);
  if (!branch) throw new Error('Branch not found');
  const permission = getPermission(branchName, userId);
  if (permission !== 'owner' && permission !== 'admin') {
    return false; // or throw PermissionError
  }
  return deleteBranchFromDB(branchName);
}
```

**向后兼容**: 已有分支的 `branchOwner` 默认为空字符串，空 owner → 允许所有登录用户操作（graceful migration）

---

### E4 决策: 离线缓存与冲突解决架构

**问题**: 网络中断时工作中断，恢复后冲突无引导。

**方案**: IndexedDB 操作队列 + 三选项冲突解决

```
网络中断 (navigator.onLine = false)
    ↓
canvasOfflineStore.isOffline = true
    ↓
handleNodesChange → 写入 CanvasChangeLog (IndexedDB)
    ↓
用户继续编辑（乐观更新本地状态）
    ↓
网络恢复 (navigator.onLine = true)
    ↓
GET /api/canvas/:id → 拉取远程最新
    ↓
检测冲突（本地 queue 非空 且 远程 timestamp > 本地快照时间）
    ↓
弹出 ConflictResolutionDialog（三选项）
    ├── 保留本地 → replay queue 到远程状态
    ├── 接受远程 → 清空 queue，丢弃本地
    └── 手动合并 → diff UI，逐项决策
```

**技术细节**:
- `CanvasChangeLog` objectStore: `{ id, canvasId, changeType, payload, timestamp }`
- 冲突检测: `remoteSnapshot.updatedAt > localSnapshot.updatedAt && pendingQueue.length > 0`
- 乐观更新: `handleNodesChange` 先更新本地 store，WS 发送时记录到 queue

---

### E5 决策: DPR 性能优化架构

**问题**: Retina 屏幕 DPR=2+ 时 canvas 渲染卡顿。

**方案**: DPR 上限 + debounced 批量更新

```
DDSCanvasPage.tsx
├── onMount:
│   └── effectiveDPR = Math.min(window.devicePixelRatio, 2)
│   └── applyDPR(effectiveDPR)
│
├── handleNodesChange debounced 100ms
│   └── batch apply to canvas
│
└── CanvasSettingsDrawer "性能" Tab:
    ├── DPR 模式: auto (clamp) / 1x / 2x
    └── 性能日志: render time per operation
```

**ReactFlow DPR 配置**:
```typescript
// DDSCanvasPage.tsx
const effectiveDPR = Math.min(window.devicePixelRatio, 2);
// Apply to ReactFlow
<ReactFlow
  style={{ imageRendering: effectiveDPR > 1.5 ? 'pixelated' : 'auto' }}
  // ...
/>
```

---

## 现有资产映射表

| 文件路径 (S77 新增/扩展) | 现有资产 | 说明 |
|--------------------------|----------|------|
| `src/stores/notificationStore.ts` | 现有 (S68-E2) | 扩展 IndexedDB 持久化 |
| `src/lib/canvas/historyDB.ts` | 现有 (S64-E2) | 扩展 notifications objectStore |
| `src/hooks/useWebSocket.ts` | 现有 (S62-E1) | 重构心跳 + 重连 |
| `src/stores/presenceStore.ts` | 现有 (S68-E5) | 新增 connectionStatus |
| `src/lib/canvas/canvasHistoryStore.ts` | 现有 (S64-E2) | 新增权限校验方法 |
| `src/stores/canvasOfflineStore.ts` | **新文件** | 新建离线队列 store |
| `src/components/dds/canvas-dashboard/ConflictResolutionDialog.tsx` | 现有 (S76-E5) | 扩展三选项 |
| `src/components/dds/OfflineBanner.tsx` | **新文件** | 离线状态 banner |
| `src/components/dds/settings/CanvasSettingsDrawer.tsx` | 现有 (S75-E5) | 新增"性能"Tab |
| `src/hooks/useWebSocketPresence.ts` | 现有 (S68-E5) | 新增 reSync 方法 |

---

## 跨 Epic 集成点

- **E1 → E2**: 通知拉取在 WS 重连成功后触发（E2 reSync 末尾调用 `fetchUnreadNotifications()`）
- **E3 → E4**: 分支合并冲突时调用 `ConflictResolutionDialog`（E4 冲突检测逻辑复用 E3 权限系统）
- **E4 → E5**: 性能模式下 DPR=1 时离线渲染更轻量

---

## API 接口设计

### 后端新增

```
GET    /api/notifications?unread=true     → 拉取未读通知列表
PATCH  /api/notifications/:id             → 标记已读
POST   /api/notifications                 → 创建通知（WS 消息同步）
```

### WebSocket 消息扩展

```typescript
// 心跳（E2 新增）
{ type: 'ping', timestamp: number }
{ type: 'pong', timestamp: number }

// 通知同步（E1 依赖 E2 WS）
{ type: 'notification', payload: NotificationEntry }
```
