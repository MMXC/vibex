/**
 * Collaboration Types — VibeX P002-E1
 *
 * WebSocket protocol types shared between websocket.ts and useCollaboration.ts
 */

// ==================== Client → Server ====================

export interface AuthMessage {
  type: 'auth';
  token: string;
}

export interface ActionMessage {
  type: 'action';
  payload: CollabActionPayload;
}

// ==================== Server → Client ====================

export interface RemoteActionMessage {
  type: 'remote_action';
  payload: {
    userId: string;
    nodeId: string;
    action: string;
    data: unknown;
  };
}

export interface PresenceMessage {
  type: 'presence';
  users: CollabUser[];
}

export interface CollabUser {
  userId: string;
  name: string;
  avatar: string;
}

export interface ConflictMessage {
  type: 'conflict';
  nodeId: string;
  conflictingUserId: string;
}

// ==================== Union ====================

export type CollabMessage =
  | AuthMessage
  | ActionMessage
  | RemoteActionMessage
  | PresenceMessage
  | ConflictMessage;

// ==================== Action Payload ====================

export type CollabActionType = 'update' | 'add' | 'delete';

export interface CollabActionPayload {
  nodeId: string;
  action: CollabActionType;
  data: unknown;
  timestamp: number;
}
