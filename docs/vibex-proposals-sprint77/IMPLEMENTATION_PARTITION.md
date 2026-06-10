# VibeX Sprint77 实现分区计划

**Sprint**: vibex-proposals-sprint77
**日期**: 2026-06-08
**Architect**: coord-self-impl

---

## 概述

本 Sprint 实现 5 个 Epic：通知持久化（E1）、WebSocket 稳定性（E2）、分支权限（E3）、离线缓存（E4）、DPR 性能（E5）。E1-E4 涉及 store 扩展，E5 主要是配置逻辑。

---

## E1: 通知持久化与跨设备同步

### DoD 检查表

- [ ] `notificationStore.ts` 扩展 IndexedDB 持久化，`NotificationEntry` 接口含 `id/isRead/timestamp/payload/type/userId/canvasId/nodeId`
- [ ] `historyDB.ts` 新增 `notifications` objectStore（含 `saveNotification`/`getNotifications`/`markAsRead`/`getUnreadCount`）
- [ ] 用户登录时从后端 REST API `/api/notifications?unread=true` 拉取离线未读通知
- [ ] `markAsRead` 同时更新本地 store + 调用 `PATCH /api/notifications/:id`
- [ ] `getUnreadCount()` 聚合本地 store + 后端未读数
- [ ] vitest notificationStore E1 扩展测试 ≥ 15 个用例

### 新增/扩展文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `vibex-fronted/src/stores/notificationStore.ts` | 扩展 | 新增 IndexedDB 持久化方法 |
| `vibex-fronted/src/lib/canvas/historyDB.ts` | 扩展 | 新增 notifications objectStore |
| `vibex-fronted/src/stores/__tests__/notificationStore.e1.test.ts` | 新增 | E1 扩展测试 |

### expect() 断言
```typescript
expect(getState().notifications).toHaveLength(0);
getState()._addForTest({ id: 'n1', type: 'mention', isRead: false });
expect(getState().getUnreadCount()).toBe(1);
getState().markAsRead('n1');
expect(getState().getUnreadCount()).toBe(0);
expect(getState().notifications[0].isRead).toBe(true);
```

---

## E2: WebSocket 连接稳定性增强

### DoD 检查表

- [ ] `useWebSocket.ts` 新增心跳 ping/pong 机制（30s interval）
- [ ] 断线检测：3次心跳超时触发 `connectionStatus = 'reconnecting'`
- [ ] `exponentialBackoff` 重连策略：delay = min(1000 * 2^attempt, 30000)
- [ ] 重连成功后调用 `presenceStore.reSync()` + `GET /api/canvas/:id`
- [ ] `presenceStore` 新增 `connectionStatus: 'connected' | 'reconnecting' | 'disconnected'`
- [ ] UI 连接状态指示器（DDSToolbar 三色图标）
- [ ] vitest 覆盖重连场景

### 新增/扩展文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `vibex-fronted/src/hooks/useWebSocket.ts` | 扩展 | 重构为 WebSocketManager class |
| `vibex-fronted/src/stores/presenceStore.ts` | 扩展 | 新增 connectionStatus |
| `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx` | 扩展 | 新增连接状态图标 |
| `vibex-fronted/src/hooks/__tests__/useWebSocket.e2.test.ts` | 新增 | E2 心跳+重连测试 |

### expect() 断言
```typescript
expect(store.connectionStatus).toBe('connected');
act(() => { wsInstance.simulateDisconnect(); });
expect(store.connectionStatus).toBe('reconnecting');
act(() => { wsInstance.simulateReconnect(); });
expect(store.connectionStatus).toBe('connected');
```

---

## E3: 画布版本分支权限控制

### DoD 检查表

- [ ] `SnapshotEntry` 新增 `branchOwner` 字段，DB_VERSION bump 至 5
- [ ] `BranchPermission` 接口定义
- [ ] `getBranchList()` 返回含 branchOwner 信息
- [ ] `deleteBranch`/`mergeBranch` 权限校验
- [ ] UI `BranchDiffPanel`/`HistoryPanel` 权限判断
- [ ] `BranchPermissionDialog` — 权限管理弹窗
- [ ] vitest 覆盖权限校验（owner/非owner/admin）

### 新增/扩展文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `vibex-fronted/src/lib/canvas/historyDB.ts` | 扩展 | SnapshotEntry.branchOwner + DB_VERSION=5 |
| `vibex-fronted/src/lib/canvas/canvasHistoryStore.ts` | 扩展 | 权限校验方法 |
| `vibex-fronted/src/components/dds/canvas-history/BranchDiffPanel.tsx` | 扩展 | 权限判断 |
| `vibex-fronted/src/components/dds/canvas-history/HistoryPanel.tsx` | 扩展 | 分支操作按钮权限 |
| `vibex-fronted/src/components/dds/canvas-history/BranchPermissionDialog.tsx` | 新增 | 权限管理弹窗 |
| `vibex-fronted/src/lib/canvas/__tests__/canvasHistoryStore.e3.test.ts` | 新增 | E3 权限测试 |

### expect() 断言
```typescript
getState()._setBranchOwner('feature-a', 'user1');
const result = getState().deleteBranch('feature-a', 'user2');
expect(result).toBeFalsy(); // permission denied
const result2 = getState().deleteBranch('feature-a', 'user1');
expect(result2).toBeTruthy(); // owner allowed
```

---

## E4: 画布离线缓存与冲突解决

### DoD 检查表

- [ ] `canvasOfflineStore.ts` — Zustand store (isOffline/pendingQueue/syncStatus)
- [ ] `CanvasChangeLog` IndexedDB objectStore
- [ ] `navigator.onLine` 监听 + isOffline 切换
- [ ] 离线时 handleNodesChange 写入 `CanvasChangeLog`
- [ ] 网络恢复后冲突检测（时间戳 + queue 非空）
- [ ] `ConflictResolutionDialog` 三选项（本地/远程/手动合并）
- [ ] 离线队列重放 `replayQueue()`
- [ ] vitest 覆盖离线队列 + 冲突检测

### 新增/扩展文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `vibex-fronted/src/stores/canvasOfflineStore.ts` | 新增 | 离线队列 store |
| `vibex-fronted/src/components/dds/canvas-dashboard/ConflictResolutionDialog.tsx` | 扩展 | 三选项 UI |
| `vibex-fronted/src/components/dds/OfflineBanner.tsx` | 新增 | 离线状态 banner |
| `vibex-fronted/src/lib/canvas/historyDB.ts` | 扩展 | CanvasChangeLog objectStore |
| `vibex-fronted/src/stores/__tests__/canvasOfflineStore.test.ts` | 新增 | E4 离线测试 |

### expect() 断言
```typescript
getState()._setOffline(true);
expect(getState().isOffline).toBe(true);
getState().queueChange({ type: 'node:update', payload: {}, id: 'c1' });
expect(getState().pendingQueue).toHaveLength(1);
getState()._setOffline(false);
expect(getState().syncStatus).toBe('syncing');
```

---

## E5: Canvas DPR 缩放性能优化

### DoD 检查表

- [ ] `DDSCanvasPage.tsx` — `effectiveDPR = Math.min(devicePixelRatio, 2)`
- [ ] `handleNodesChange` debounce 100ms 批量更新
- [ ] `CanvasSettingsDrawer` 新增"性能"Tab（DPR 模式: auto/1x/2x）
- [ ] `React.memo` 优化关键节点渲染
- [ ] vitest 覆盖 DPR 限制逻辑
- [ ] 性能基准: 100节点缩放 < 100ms

### 新增/扩展文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `vibex-fronted/src/components/dds/DDSCanvasPage.tsx` | 扩展 | DPR 计算 + debounced handleNodesChange |
| `vibex-fronted/src/components/dds/settings/CanvasSettingsDrawer.tsx` | 扩展 | 新增"性能"Tab |
| `vibex-fronted/src/components/dds/__tests__/DDSCanvasPage.e5.test.ts` | 新增 | E5 DPR 测试 |

### expect() 断言
```typescript
expect(calculateEffectiveDPR(1.5)).toBe(1.5);
expect(calculateEffectiveDPR(3)).toBe(2);    // clamped
expect(calculateEffectiveDPR(1)).toBe(1);
```

---

## 测试命令

```bash
cd /root/.openclaw/vibex/vibex-fronted

# E1: notificationStore
npx vitest run notificationStore.e1 --reporter=verbose

# E2: useWebSocket
npx vitest run useWebSocket.e2 --reporter=verbose

# E3: canvasHistoryStore
npx vitest run canvasHistoryStore.e3 --reporter=verbose

# E4: canvasOfflineStore
npx vitest run canvasOfflineStore --reporter=verbose

# E5: DDSCanvasPage
npx vitest run DDSCanvasPage.e5 --reporter=verbose

# 全量（全部完成后）
npx vitest run --reporter=verbose
```

---

## Epic 依赖关系

```
E1 (notification) ← E2 (WS 重连后拉取通知)
E3 (branch permission) ← E4 (冲突解决时调用权限)
E4 (offline) ← E5 (性能模式不影响离线队列)
```

---

## 关键实现顺序

1. **E2 (WS 稳定性)** — 基础组件，其他 Epic 依赖其重连机制
2. **E1 (通知持久化)** — 独立，与其他 Epic 无依赖
3. **E3 (分支权限)** — 独立，与其他 Epic 无依赖
4. **E4 (离线缓存)** — 依赖 E3（权限系统）
5. **E5 (DPR 性能)** — 独立，与其他 Epic 无依赖
