/**
 * wsCollabHandler — WebSocket handler for collaboration editing + undo/redo messages
 * S62-E1: 协作者实时同步 — collab:editing:start / collab:editing:end
 * S62-E4: 协作 Undo/Redo — collab:undo / collab:redo
 * S63-E1: 实时游标追踪 — cursor:move
 * S63-E2: 协作撤销冲突 — collab:conflict
 * S64-E1: 协作者在线状态 — presence:heartbeat
 *
 * Registers with CollabWebSocket to handle:
 * - collab:editing:start — another user started editing a node
 * - collab:editing:end — another user stopped editing a node
 * - collab:undo — another user performed an undo operation
 * - collab:redo — another user performed a redo operation
 * - cursor:move — another user's cursor moved
 * - collab:conflict — another user triggered a conflict for the local user
 * - presence:heartbeat — another user's presence heartbeat (30s interval)
 */

import type { CollabWSHandler } from './websocket';
import { usePresenceStore } from './presenceStore';
import { useUndoRedoStore } from '@/stores/dds/undoRedoStore';

/** S62-E1: WebSocket editing message payload */
export interface CollabEditingStartMessage {
  type: 'collab:editing:start';
  nodeId: string;
  userId: string;
  userName: string;
  avatar: string;
}

export interface CollabEditingEndMessage {
  type: 'collab:editing:end';
  nodeId: string;
  userId: string;
}

/** S62-E4: WebSocket undo message payload */
export interface CollabUndoMessage {
  type: 'collab:undo';
  userId: string;
  userName: string;
  canvasId: string;
}

/** S62-E4: WebSocket redo message payload */
export interface CollabRedoMessage {
  type: 'collab:redo';
  userId: string;
  userName: string;
  canvasId: string;
}

/** S63-E1: WebSocket cursor move message payload — server relays from one client to all others */
export interface CollabCursorMoveMessage {
  type: 'cursor:move';
  userId: string;
  x: number;
  y: number;
}

/** S63-E2: WebSocket conflict message payload — server notifies that an undo hit a conflict */
export interface CollabConflictMessage {
  type: 'collab:conflict';
  operatorId: string;
  otherUserId: string;
  otherUserName: string;
  nodeId: string;
}

/** S64-E1: WebSocket presence heartbeat payload — server relays heartbeat from one client to all others */
export interface PresenceHeartbeatMessage {
  type: 'presence:heartbeat';
  userId: string;
  userName: string;
  avatar: string;
  /** Page visibility: 'visible' when page is shown, 'hidden' when page is hidden */
  visibility: 'visible' | 'hidden';
}

/** E4 callback types — called when peer undo/redo is received */
export type UndoCallback = (msg: CollabUndoMessage) => void;
export type RedoCallback = (msg: CollabRedoMessage) => void;

/**
 * Register collab:editing:start / collab:editing:end handlers on a CollabWebSocket instance.
 * The `onMessage` callback is provided by the CollabWebSocket internals.
 */
export function registerCollabHandler(
  onMessage: (handler: CollabWSHandler) => void
): void {
  onMessage((msg) => {
    switch (msg.type) {
      case 'collab:editing:start': {
        const m = msg as CollabEditingStartMessage;
        usePresenceStore.getState().handleEditingStartedMessage(
          m.nodeId,
          m.userId,
          m.userName,
          m.avatar
        );
        break;
      }
      case 'collab:editing:end': {
        const m = msg as CollabEditingEndMessage;
        usePresenceStore.getState().handleEditingEndedMessage(m.nodeId);
        break;
      }
      // S63-E1: cursor:move — update remote cursor position
      case 'cursor:move': {
        const m = msg as CollabCursorMoveMessage;
        usePresenceStore.getState().updateCursor(m.userId, m.x, m.y);
        break;
      }
      // S63-E2: collab:conflict — another user triggered a conflict for this user
      case 'collab:conflict': {
        const m = msg as CollabConflictMessage;
        useUndoRedoStore.getState().showConflict(
          m.otherUserName,
          m.otherUserId,
          m.nodeId
        );
        break;
      }
      // S64-E1: presence:heartbeat — update online user status
      case 'presence:heartbeat': {
        const m = msg as PresenceHeartbeatMessage;
        const status = m.visibility === 'hidden' ? 'idle' : 'online';
        usePresenceStore.getState().updateOnlineUsers(m.userId, status, m.userName, m.avatar);
        break;
      }
      // S62-E4: collab:undo / collab:redo are handled by undoRedoStore via setBroadcasters
    }
  });
}

/**
 * D4.2: Broadcast an undo event to other collaborators.
 * Call this instead of directly calling undoRedoStore.undo() to also emit the WS message.
 */
export function broadcastUndo(
  broadcaster: ((msg: CollabUndoMessage) => void) | null,
  userId: string,
  userName: string,
  canvasId: string
): void {
  if (broadcaster) {
    broadcaster({ type: 'collab:undo', userId, userName, canvasId });
  }
}

/**
 * D4.2: Broadcast a redo event to other collaborators.
 */
export function broadcastRedo(
  broadcaster: ((msg: CollabRedoMessage) => void) | null,
  userId: string,
  userName: string,
  canvasId: string
): void {
  if (broadcaster) {
    broadcaster({ type: 'collab:redo', userId, userName, canvasId });
  }
}
