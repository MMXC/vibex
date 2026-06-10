# VibeX Sprint77 产品需求文档

**Sprint**: vibex-proposals-sprint77
**目标**: 基于 S75/S76 已完成功能（搜索历史/通知过滤/分支对比/快照管理/快捷键导入导出/批量导出/协作冲突检测）识别下一轮迭代缺口
**日期**: 2026-06-08
**Analyst**: coord-self-impl (Phase1 entry-point phantom)

---

## 执行摘要

| Epic | 功能 | 优先级 | 复杂度 | 风险 |
|------|------|--------|--------|------|
| E1 | 通知持久化与跨设备同步 | P0 | 高 | 中 |
| E2 | WebSocket 连接稳定性增强 | P0 | 中 | 低 |
| E3 | 画布版本分支权限控制 | P1 | 中 | 中 |
| E4 | 画布离线缓存与冲突解决 | P1 | 高 | 高 |
| E5 | Canvas DPR 缩放性能优化 | P2 | 低 | 低 |

---

## E1: 通知持久化与跨设备同步

### Epic 故事
用户在小明离线期间收到 @mentions 评论通知。小明重新上线后，通知中心自动展示所有离线期间的通知，未读计数准确。用户点击通知跳转到对应画布节点。

### DoD (Definition of Done)
- [ ] `notificationStore.ts` 扩展 IndexedDB 持久化，`NotificationEntry` 接口含 `id/isRead/timestamp/payload/type/userId/canvasId/nodeId`
- [ ] `historyDB.ts` 新增 `notifications` objectStore（含 `saveNotification`/`getNotifications`/`markAsRead`/`getUnreadCount`）
- [ ] 用户登录时从后端 REST API `/api/notifications?unread=true` 拉取离线未读通知
- [ ] `markAsRead` 同时更新本地 store + 调用 `PATCH /api/notifications/:id`
- [ ] `getUnreadCount()` 聚合本地 store + 后端未读数
- [ ] vitest notificationStore E1 扩展测试 ≥ 15 个用例

### 页面集成
- `NotificationPanel.tsx` — 无改动（store 变更对 UI 透明）
- `CommentThread.tsx` — 发送评论后通知持久化到 IndexedDB

### 风险
- 后端 REST API `/api/notifications` 端点需确认是否存在，若不存在需后端配合

### expect() 断言
```typescript
// notificationStore.test.ts
expect(getState().notifications).toHaveLength(0);
// simulate offline notification
getState()._addForTest({ id: 'n1', type: 'mention', isRead: false });
expect(getState().getUnreadCount()).toBe(1);
getState().markAsRead('n1');
expect(getState().getUnreadCount()).toBe(0);
expect(getState().notifications[0].isRead).toBe(true);
```

---

## E2: WebSocket 连接稳定性增强

### Epic 故事
协作者在电梯/地铁等弱网环境编辑画布。WS 断线后 UI 显示"重连中..."状态，自动以指数退避策略重连。3次心跳丢失后触发重连，重连成功后所有协作者状态完整恢复。

### DoD (Definition of Done)
- [ ] `useWebSocket.ts` 新增心跳 ping/pong 机制（30s interval，`lastPongReceived` timestamp）
- [ ] 断线检测：3次心跳超时（90s 无 pong）触发 `connectionStatus = 'reconnecting'`
- [ ] `exponentialBackoff` 重连策略：delay = min(1000 * 2^attempt, 30000)
- [ ] 重连成功后调用 `presenceStore.reSync()` 重新订阅 + `GET /api/canvas/:id` 拉取最新状态
- [ ] `presenceStore` 新增 `connectionStatus: 'connected' | 'reconnecting' | 'disconnected'`
- [ ] UI 连接状态指示器（DDSToolbar 或 CollabPresenceBar 显示图标）
- [ ] vitest 覆盖重连场景（mock WS close + reopen）

### 页面集成
- `DDSToolbar.tsx` — 新增连接状态图标（绿/黄/红三色）
- `CollabPresenceBar` — `connectionStatus` 变化时触发 toast 提示

### 风险
- 心跳消息增加服务器负载，需后端配合支持 pong 响应

### expect() 断言
```typescript
// useWebSocket.test.ts
const store = useConnectionStore.getState();
expect(store.connectionStatus).toBe('connected');
// simulate disconnect
act(() => { wsInstance.simulateDisconnect(); });
expect(store.connectionStatus).toBe('reconnecting');
// simulate reconnect
act(() => { wsInstance.simulateReconnect(); });
expect(store.connectionStatus).toBe('connected');
```

---

## E3: 画布版本分支权限控制

### Epic 故事
用户 A 创建了 experiment-v2 分支，用户 B 无法删除或合并该分支。权限不足时 UI 显示灰色按钮并提示"仅分支所有者可操作"。分支所有者可将 admin 权限授予其他协作者。

### DoD (Definition of Done)
- [ ] `historyDB.ts` `SnapshotEntry` 新增 `branchOwner: string` 字段，DB_VERSION bump 至 5
- [ ] `canvasHistoryStore.ts` 新增 `BranchPermission` 接口：`type Owner | Write | Read`
- [ ] `getBranchList()` 返回 `SnapshotEntry[]` 含 branchOwner 信息
- [ ] `deleteBranch(branchName)` 前检查权限：仅 owner 或 admin 可删除
- [ ] `mergeBranch(source, target)` 前检查权限：source owner 或 admin
- [ ] UI `BranchDiffPanel` / `HistoryPanel` 根据权限显示/隐藏操作按钮
- [ ] `BranchPermissionDialog` — owner 管理权限 UI（授予/撤销 admin）
- [ ] vitest 覆盖权限校验（owner/非owner/admin 三种场景）

### 页面集成
- `BranchDiffPanel.tsx` — 权限判断 + 操作按钮显示
- `HistoryPanel.tsx` — 分支操作按钮权限控制
- 新建 `BranchPermissionDialog.tsx` — 权限管理弹窗

### 风险
- 已有分支的 branchOwner 字段初始值为空（需向后兼容处理）

### expect() 断言
```typescript
// canvasHistoryStore.e3.test.ts
getState()._setBranchOwner('feature-a', 'user1');
// user2 attempts delete — should throw or return error
const result = getState().deleteBranch('feature-a', 'user2');
expect(result).toBeFalsy(); // or throw
// user1 (owner) deletes — should succeed
const result2 = getState().deleteBranch('feature-a', 'user1');
expect(result2).toBeTruthy();
```

---

## E4: 画布离线缓存与冲突解决

### Epic 故事
用户在地铁中编辑画布时网络中断。系统自动将所有操作写入 IndexedDB 队列（CanvasChangeLog）。用户继续编辑（乐观更新），网络恢复后系统检测到冲突，弹出三选项对话框：保留本地 / 接受远程 / 手动合并。

### DoD (Definition of Done)
- [ ] `canvasOfflineStore.ts` — Zustand store，`isOffline`/`pendingQueue`/`syncStatus`
- [ ] `CanvasChangeLog` IndexedDB objectStore（id/canvasId/changeType/payload/timestamp）
- [ ] `navigator.onLine` 监听 + `isOffline` 自动切换
- [ ] WS 断线时将 handleNodesChange 写入 `CanvasChangeLog`
- [ ] 网络恢复时 `GET /api/canvas/:id` 拉取远程最新状态
- [ ] 冲突检测：本地快照时间戳 < 远程更新时间戳 且本地有未同步操作 → 触发 `ConflictResolutionDialog`
- [ ] `ConflictResolutionDialog` 扩展为三选项：保留本地（强制推送）/ 接受远程（丢弃本地）/ 手动合并（diff UI）
- [ ] 离线队列重放：`replayQueue()` 按顺序应用本地操作到远程状态
- [ ] vitest 覆盖：离线状态切换 / 队列重放 / 冲突检测

### 页面集成
- `DDSCanvasPage.tsx` — 离线 banner + 状态指示
- `ConflictResolutionDialog.tsx` — 三选项扩展
- 新建 `OfflineBanner.tsx` — 离线状态提示

### 风险
- 冲突解决 UI 复杂度高，可能影响其他 Sprint 进度
- 乐观更新可能导致 UX 不一致，需谨慎设计

### expect() 断言
```typescript
// canvasOfflineStore.test.ts
getState()._setOffline(true);
expect(getState().isOffline).toBe(true);
// queue an operation
getState().queueChange({ type: 'node:update', payload: {...}, id: 'c1' });
expect(getState().pendingQueue).toHaveLength(1);
// go online
getState()._setOffline(false);
expect(getState().syncStatus).toBe('syncing');
```

---

## E5: Canvas DPR 缩放性能优化

### Epic 故事
用户在 Retina MacBook（devicePixelRatio=2）打开 150 节点的画布，缩放和拖拽流畅无卡顿。性能模式下 DPR 降为 1，渲染速度更快。

### DoD (Definition of Done)
- [ ] `DDSCanvasPage.tsx` — 计算 `effectiveDPR = Math.min(devicePixelRatio, 2)`
- [ ] `handleNodesChange` — debounce 100ms 批量更新，减少中间状态渲染
- [ ] `CanvasSettingsDrawer` 新增「性能模式」Tab，含 DPR 限制选项（自动/1x/2x）
- [ ] `useMemo` / `React.memo` 优化关键节点渲染组件
- [ ] 性能测试：100节点画布缩放操作 < 100ms（通过 Performance API 测量）
- [ ] vitest 覆盖 DPR 限制逻辑

### 页面集成
- `CanvasSettingsDrawer.tsx` — 新增「性能」Tab
- `DDSCanvasPage.tsx` — DPR 计算逻辑

### 风险
- DPR 降低可能导致 Retina 屏幕显示模糊，需保留"自动"选项

### expect() 断言
```typescript
// DDSCanvasPage.e5.test.ts
// DPR = 1.5 → clamped to 1.5 (< 2, no change)
expect(calculateEffectiveDPR(1.5)).toBe(1.5);
// DPR = 3 → clamped to 2
expect(calculateEffectiveDPR(3)).toBe(2);
// DPR = 1 → unchanged
expect(calculateEffectiveDPR(1)).toBe(1);
```

---

## 跨 Epic 集成表

| 集成点 | E1 | E2 | E3 | E4 | E5 |
|--------|----|----|----|----|-----|
| notificationStore | ★ | — | — | — | — |
| presenceStore | — | ★ | — | — | — |
| historyDB | — | — | ★ | ★ | — |
| canvasHistoryStore | — | — | ★ | ★ | — |
| DDSToolbar | — | ★ | — | ★ | — |
| ConflictResolutionDialog | — | — | — | ★ | — |

---

## 技术风险表

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 后端 `/api/notifications` 不存在 | 中 | 高 | Phase1 coord-decision 前确认后端 API |
| WS pong 响应增加服务器负载 | 低 | 中 | 心跳间隔可配置 |
| 离线队列重放导致循环冲突 | 中 | 高 | 重放前检测时间戳，无冲突才重放 |
| DPR 优化影响其他 Sprint UI | 低 | 低 | CanvasSettingsDrawer Tab 隔离 |
