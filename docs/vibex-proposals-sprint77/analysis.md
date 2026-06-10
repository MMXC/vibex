# VibeX Sprint77 提案分析

## P001: 通知持久化与跨设备同步
**类别**: 协作增强 / 通知系统
**优先级**: P0

### 问题描述
当前 `useNotificationStore` (S68-E2) 仅在 WebSocket 活跃时通过实时推送分发通知。用户离线期间的通知无法送达，下次登录时通知丢失。协作者 @mentions 后的通知无持久化保障。

### 根因分析
- `notificationStore.ts` 使用 Zustand 内存状态，无 IndexedDB 持久化
- WS 断开时，所有未推送通知丢失
- 无通知已读/未读跨设备同步机制

### 影响范围
- 用户错过关键 @mentions 评论通知
- 协作效率下降，重要讨论丢失

### 技术方案
1. 扩展 `notificationStore.ts` + IndexedDB 持久化 (`NotificationEntry` 含 `id/isRead/timestamp/payload`)
2. 后端 WS `notification` 消息同时写入 D1 数据库
3. 用户登录时拉取未读通知列表（WS 或 REST /api/notifications?unread=true）
4. `markAsRead(notificationId)` 同时更新本地 store + 后端

### 验收标准
- [ ] IndexedDB 持久化通知条目（id/isRead/timestamp/payload/type）
- [ ] 用户登录时从后端拉取离线期间未读通知
- [ ] markAsRead 同时更新本地 + 后端
- [ ] vitest notificationStore 覆盖率不下降

---

## P002: WebSocket 连接稳定性增强
**类别**: 协作基础设施
**优先级**: P0

### 问题描述
当前 WS 重连依赖 WS handler 内部逻辑，无统一断线检测。WebSocket 连接不稳定时（网络抖动/切换），协作者状态（光标/编辑中/在线）短暂丢失，影响协作体验。

### 根因分析
- WS 连接无心跳检测机制（heartbeat/ping）
- 断线后重连延迟不可预测
- 协作者离线状态通过 WS close event 感知，有延迟

### 影响范围
- 网络不稳定环境下协作光标闪烁/消失
- 节点锁定状态漂移
- 用户体验：协作者"幽灵在线"

### 技术方案
1. `useWebSocket.ts` — 添加心跳 ping/pong 机制（30s interval）
2. 断线检测：3次心跳丢失触发 reconnect
3. `exponentialBackoff` 重连策略（1s → 2s → 4s → max 30s）
4. 重连成功后重新订阅 presence 状态 + 拉取最新 canvas state
5. `presenceStore` 添加 `connectionStatus: 'connected' | 'reconnecting' | 'disconnected'`

### 验收标准
- [ ] 心跳机制：30s interval ping/pong，不影响正常消息
- [ ] 断线后自动重连，指数退避
- [ ] 重连后协作者状态完整恢复（remoteUsers + cursors + nodeLocks）
- [ ] `connectionStatus` 状态反映在 UI（连接状态指示器）
- [ ] vitest 覆盖重连场景

---

## P003: 画布版本分支权限控制
**类别**: 数据管理 / 安全
**优先级**: P1

### 问题描述
S66-E1 实现了画布分支操作（创建/重命名/删除/合并），但无权限控制。所有协作者可任意删除/合并他人分支，存在协作安全隐患。

### 根因分析
- 分支操作无 owner/permission 概念
- `deleteBranch` / `mergeBranch` 无鉴权检查

### 影响范围
- 协作者误删他人工作分支
- 恶意用户可破坏团队分支结构

### 技术方案
1. `historyDB.ts` — `SnapshotEntry` 新增 `branchOwner: string` 字段
2. `canvasHistoryStore` — 新增 `BranchPermission` 接口（owner/read/write/admin）
3. `deleteBranch`/`mergeBranch` 前检查权限（owner 或 admin）
4. UI：`BranchDiffPanel` / `HistoryPanel` 根据权限显示/隐藏操作按钮
5. 非 owner 操作需确认对话框

### 验收标准
- [ ] `SnapshotEntry` 含 branchOwner 字段 + IndexedDB schema 更新（DB_VERSION bump）
- [ ] `BranchPermission` 接口定义
- [ ] `deleteBranch`/`mergeBranch` 权限校验（无权限时 throw 或返回错误）
- [ ] UI 根据权限显示/隐藏分支操作按钮
- [ ] vitest 覆盖权限校验场景

---

## P004: 画布离线缓存与冲突解决
**类别**: 数据管理 / 离线支持
**优先级**: P1

### 问题描述
用户网络中断时无法继续操作画布，canvas 数据无本地缓存。恢复网络后本地修改与服务器冲突无引导处理。

### 根因分析
- canvas 状态完全依赖 WS 实时同步
- 无 Service Worker 缓存画布数据
- IndexedDB 仅存储快照，无操作日志
- conflict resolution UI（S76-E5）仅提示警告，无自动解决策略

### 影响范围
- 离线用户无法继续工作
- 网络恢复后的数据一致性风险

### 技术方案
1. `OfflineCanvasQueue` — IndexedDB 操作队列，网络恢复后重放
2. `ServiceWorker` 缓存最近访问的画布元数据（canvasId/name/updatedAt）
3. `ConflictResolutionDialog` — 扩展为三选项：保留本地 / 接受远程 / 手动合并
4. `canvasOfflineStore` — 离线状态管理（isOffline/replayQueue/syncStatus）
5. 网络恢复时自动检测冲突并弹出解决对话框

### 验收标准
- [ ] `OfflineCanvasQueue` 操作队列（FIFO，网络恢复重放）
- [ ] Service Worker 缓存画布元数据（navigator.onLine 监听）
- [ ] `ConflictResolutionDialog` 三选项 UI（本地/远程/手动合并）
- [ ] `canvasOfflineStore` 离线状态管理
- [ ] 自动冲突检测触发解决对话框
- [ ] vitest 覆盖离线队列重放场景

---

## P005: Canvas DPR 缩放性能优化
**类别**: 性能优化
**优先级**: P2

### 问题描述
S76-E1 后 BackgroundSettingsPanel 增加了 DPR-aware 缩放，但整体 Canvas 渲染在大 DPR（Retina）屏幕下仍有性能问题。高分辨率屏幕上 canvas 节点过多时出现卡顿。

### 根因分析
- ReactFlow 默认 DPR scaling 无上限
- 节点过多时 re-render 次数过多
- 无虚拟化列表（节点数量 > 100 时明显）

### 影响范围
- Retina 屏幕用户体验差
- 大型画布打开/缩放卡顿

### 技术方案
1. `DDSCanvasPage.tsx` — 限制 ReactFlow `maxWidth/maxHeight` 使用 devicePixelRatio 限制
2. `handleNodesChange` — 批量更新优化，减少中间状态渲染
3. `useVirtualization` — 仅渲染视口内可见节点（viewport culling）
4. CanvasSettingsDrawer 添加「性能模式」开关（减少 DPR 渲染精度）
5. `NodeRenderer` memo 化，避免不必要重渲染

### 验收标准
- [ ] DPR 限制逻辑：max DPR = min(devicePixelRatio, 2)
- [ ] `handleNodesChange` 批量更新（debounce 100ms）
- [ ] 性能模式：低 DPR + 节点懒加载
- [ ] vitest 覆盖 DPR 限制逻辑
- [ ] 性能基准：100节点画布缩放 < 100ms
