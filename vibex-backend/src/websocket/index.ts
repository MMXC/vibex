/**
 * WebSocket Collaboration Module
 * 
 * 导出:
 * - CollaborationRoom: Durable Object 实现
 * - useCollaborationWebSocket: 前端 React Hook
 * - 类型定义
 */

export { CollaborationRoom, getCollaborationRoomStub } from './CollaborationRoom';
export { useCollaborationWebSocket } from './useCollaborationWebSocket';

export type {
  Connection,
  WSMessage,
  PresenceUpdate,
  LockRequest,
  LockResult,
  BroadcastMessage,
} from './CollaborationRoom';

export type {
  UseWebSocketOptions,
  PresenceUser,
} from './useCollaborationWebSocket';
