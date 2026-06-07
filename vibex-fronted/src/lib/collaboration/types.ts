/**
 * Collaboration Types — VibeX P002-E1 + S60-E3 + S63-E1 + S65-E2
 *
 * WebSocket protocol types shared between websocket.ts and useCollaboration.ts
 * S60-E3: Activity stream + online status indicators
 * S63-E1: cursor:move message type for real-time cursor tracking
 * S65-E2: node:focused/unfocused message types for node focus awareness
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

/** S63-E1: Cursor position broadcast — sent by client on mouse move */
export interface CursorMoveMessage {
  type: 'cursor:move';
  userId: string;
  x: number;
  y: number;
}

/** S65-E2: Node focus broadcast — sent by client when a node receives focus */
export interface NodeFocusedMessage {
  type: 'node:focused';
  nodeId: string;
  userId: string;
  userName: string;
  avatar: string;
}

/** S65-E2: Node unfocus broadcast — sent by client when a node loses focus */
export interface NodeUnfocusedMessage {
  type: 'node:unfocused';
  nodeId: string;
  userId: string;
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
  | 'focus'      // User focused on a node
  | 'blur'       // User blurred from a node
  | 'cursor_move'; // User moved cursor (throttled — not broadcast on every move)

/** Single activity entry for the activity feed */
export interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  type: ActivityType;
  nodeId?: string;
  nodeName?: string;
  /** S74-E4: Optional message text for @mention parsing */
  message?: string;
  /** S74-E4: Canvas ID for notification routing */
  canvasId?: string;
  timestamp: number;
}

/** WebSocket message: server broadcasts activity updates every 5s */
export interface ActivityMessage {
  type: 'activity:update';
  entries: ActivityEntry[];
}

// ==================== E2: User Activity ====================

export interface UserActivityMessage {
  type: 'user:activity';
  entries: ActivityEntry[];
  userId: string;
}

// ==================== Union ====================

export type CollabMessage =
  | AuthMessage
  | ActionMessage
  | CursorMoveMessage
  | NodeFocusedMessage
  | NodeUnfocusedMessage
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
