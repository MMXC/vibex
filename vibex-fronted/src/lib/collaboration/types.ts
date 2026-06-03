/**
 * Collaboration Types — VibeX P002-E1 + S60-E3
 *
 * WebSocket protocol types shared between websocket.ts and useCollaboration.ts
 * S60-E3: Activity stream + online status indicators
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

// ==================== S60-E3: Activity Stream ====================

/** Activity type enumeration for activity feed */
export type ActivityType =
  | 'join'       // User joined canvas
  | 'leave'      // User left canvas
  | 'edit'       // User edited a node
  | 'add'        // User added a node
  | 'delete'     // User deleted a node
  | 'lock'       // User locked a node
  | 'unlock'     // User unlocked a node
  | 'cursor_move'; // User moved cursor (throttled — not broadcast on every move)

/** Single activity entry for the activity feed */
export interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  type: ActivityType;
  nodeId?: string;
  nodeName?: string;
  timestamp: number;
}

/** WebSocket message: server broadcasts activity updates every 5s */
export interface ActivityMessage {
  type: 'activity:update';
  entries: ActivityEntry[];
}

// ==================== Union ====================

export type CollabMessage =
  | AuthMessage
  | ActionMessage
  | RemoteActionMessage
  | PresenceMessage
  | ConflictMessage
  | ActivityMessage;

// ==================== Action Payload ====================

export type CollabActionType = 'update' | 'add' | 'delete';

export interface CollabActionPayload {
  nodeId: string;
  action: CollabActionType;
  data: unknown;
  timestamp: number;
}
