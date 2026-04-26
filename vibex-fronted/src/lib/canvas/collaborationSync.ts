/**
 * Collaboration Sync — 节点变更广播与接收
 * E1-S2: 多用户节点同步
 *
 * 职责：
 * - 节点变更时广播 WebSocket 消息
 * - 接收远端节点变更并合并到本地 store（Last-Write-Wins）
 * - version 乐观锁
 *
 * 规则（AGENTS.md）：
 * - 禁止在 Firebase 回调中直接操作 Canvas DOM（必须走 Zustand Store）
 * - 节点变更必须通过 store action 而非直接修改状态
 */

import { MessageRouter, type MessageType, type NodeSyncPayload, type TreeType, type NodeAction } from '@/lib/websocket/MessageRouter';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

// ============================================================================
// Collaboration Sync Bridge
// ============================================================================

// 全局 router 实例（由 useCollaboration hook 初始化时创建）
let globalRouter: MessageRouter | null = null;

// 当前用户信息
let currentUserId: string = '';
let currentRoomId: string = '';

// broadcast 消息类型
type BroadcastMessage = {
  type: MessageType;
  roomId: string;
  senderId: string;
  payload: unknown;
};

/**
 * 初始化协作同步
 * 由 useCollaboration 调用
 */
export function initCollaborationSync(
  router: MessageRouter,
  userId: string,
  roomId: string
): void {
  globalRouter = router;
  currentUserId = userId;
  currentRoomId = roomId;

  canvasLogger.default.debug('[CollabSync] Initialized:', { userId, roomId });
}

/**
 * 获取当前用户 ID
 */
export function getCurrentUserId(): string {
  return currentUserId;
}

/**
 * 版本号生成器（每操作递增）
 */
let versionCounter = 0;
function nextVersion(): number {
  return ++versionCounter;
}

// ============================================================================
// Broadcast Operations（节点变更 → WebSocket）
// ============================================================================

/**
 * 广播节点创建
 */
export function broadcastNodeCreate(
  treeType: TreeType,
  nodeId: string,
  data: Record<string, unknown>
): void {
  if (!globalRouter || !currentRoomId) return;

  const payload: NodeSyncPayload = {
    treeType,
    action: 'create',
    nodeId,
    data,
    version: nextVersion(),
    userId: currentUserId,
  };

  const msg: BroadcastMessage = {
    type: 'node',
    roomId: currentRoomId,
    senderId: currentUserId,
    payload,
  };

  globalRouter.broadcast(currentRoomId, msg as Parameters<typeof globalRouter.broadcast>[1]);

  canvasLogger.default.debug('[CollabSync] Broadcast create:', payload);
}

/**
 * 广播节点更新
 */
export function broadcastNodeUpdate(
  treeType: TreeType,
  nodeId: string,
  data: Record<string, unknown>
): void {
  if (!globalRouter || !currentRoomId) return;

  const payload: NodeSyncPayload = {
    treeType,
    action: 'update',
    nodeId,
    data,
    version: nextVersion(),
    userId: currentUserId,
  };

  const msg: BroadcastMessage = {
    type: 'node',
    roomId: currentRoomId,
    senderId: currentUserId,
    payload,
  };

  globalRouter.broadcast(currentRoomId, msg as Parameters<typeof globalRouter.broadcast>[1]);

  canvasLogger.default.debug('[CollabSync] Broadcast update:', payload);
}

/**
 * 广播节点删除
 */
export function broadcastNodeDelete(
  treeType: TreeType,
  nodeId: string
): void {
  if (!globalRouter || !currentRoomId) return;

  const payload: NodeSyncPayload = {
    treeType,
    action: 'delete',
    nodeId,
    version: nextVersion(),
    userId: currentUserId,
  };

  const msg: BroadcastMessage = {
    type: 'node',
    roomId: currentRoomId,
    senderId: currentUserId,
    payload,
  };

  globalRouter.broadcast(currentRoomId, msg as Parameters<typeof globalRouter.broadcast>[1]);

  canvasLogger.default.debug('[CollabSync] Broadcast delete:', payload);
}

// ============================================================================
// Merge Operations（远端消息 → 本地 Store）
// ============================================================================

export type NodeMergeHandler = (
  treeType: TreeType,
  action: NodeAction,
  nodeId: string,
  data?: Record<string, unknown>
) => void;

// 全局 merge handler 注册（由各 store 在初始化时注册）
const mergeHandlers: NodeMergeHandler[] = [];

/**
 * 注册节点 merge handler
 * 各 store 初始化时调用，传入自己的 mutation 函数
 */
export function registerMergeHandler(handler: NodeMergeHandler): () => void {
  mergeHandlers.push(handler);
  return () => {
    const idx = mergeHandlers.indexOf(handler);
    if (idx !== -1) mergeHandlers.splice(idx, 1);
  };
}

/**
 * 处理收到的远端节点变更
 * 在 useCollaboration 的消息处理中调用
 */
export function handleRemoteNodeSync(payload: NodeSyncPayload): void {
  // 忽略自己发送的消息
  if (payload.userId === currentUserId) return;

  canvasLogger.default.debug('[CollabSync] Remote node sync:', payload);

  // E8-S3: LWW 仲裁 — 检查本地草稿，决定是否弹出 ConflictDialog
  // 动态导入避免循环依赖
  import('./stores/conflictStore').then(({ useConflictStore }) => {
    const remoteData = payload.data ?? {};
    const remoteVersion = (payload as unknown as { version?: number }).version ?? 0;

    const conflict = useConflictStore.getState().checkConflict(
      payload.nodeId,
      undefined,
      remoteData,
      remoteVersion,
      payload.userId
    );

    if (conflict) {
      // 有冲突 → ConflictDialog 会处理
      canvasLogger.default.info('[CollabSync] LWW conflict shown:', payload.nodeId);
    } else {
      // 无冲突或 LWW 自动 adopt → 合并到本地 store
      canvasLogger.default.debug('[CollabSync] LWW auto-merge:', payload.nodeId);
      for (const handler of mergeHandlers) {
        try {
          handler(payload.treeType, payload.action, payload.nodeId, payload.data);
        } catch (err) {
          canvasLogger.default.error('[CollabSync] Merge handler error:', err);
        }
      }
    }
  }).catch(() => {
    // fallback: 正常合并
    for (const handler of mergeHandlers) {
      try {
        handler(payload.treeType, payload.action, payload.nodeId, payload.data);
      } catch {
        // ignore
      }
    }
  });
}

// ============================================================================
// Conflict Detection
// ============================================================================

import { EventEmitter } from 'eventemitter3';

interface ConflictEvent {
  treeType: TreeType;
  action: NodeAction;
  nodeId: string;
  userId: string;
  userName?: string;
  timestamp: number;
}

const conflictEmitter = new EventEmitter();
const CONFLICT_EVENT = 'conflict';

export function emitConflictEvent(payload: NodeSyncPayload): void {
  conflictEmitter.emit(CONFLICT_EVENT, {
    treeType: payload.treeType,
    action: payload.action,
    nodeId: payload.nodeId,
    userId: payload.userId,
    timestamp: Date.now(),
  } satisfies ConflictEvent);
}

export function onConflict(callback: (event: ConflictEvent) => void): () => void {
  conflictEmitter.on(CONFLICT_EVENT, callback);
  return () => {
    conflictEmitter.off(CONFLICT_EVENT, callback);
  };
}
