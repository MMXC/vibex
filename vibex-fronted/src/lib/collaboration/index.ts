/**
 * Collaboration module — VibeX P002-E1 WebSocket Real-time Collaboration
 */

export { CollabWebSocket } from './websocket';
export { useCollaboration } from './useCollaboration';
export { useCanvasCollabBridge } from './canvasCollabBridge';
export type {
  UseCollaborationOptions,
} from './useCollaboration';
export type {
  CollabMessage,
  CollabUser,
  CollabActionPayload,
  CollabActionType,
  AuthMessage,
  ActionMessage,
  RemoteActionMessage,
  PresenceMessage,
  ConflictMessage,
} from './types';
