/**
 * wsCollabHandler — WebSocket handler for collaboration editing + undo/redo messages
 * S62-E1: 协作者实时同步 — collab:editing:start / collab:editing:end
 * S62-E4: 协作 Undo/Redo — collab:undo / collab:redo
 *
 * Registers with CollabWebSocket to handle:
 * - collab:editing:start — another user started editing a node
 * - collab:editing:end — another user stopped editing a node
 * - collab:undo — another user performed an undo operation
 * - collab:redo — another user performed a redo operation
 */

import type { CollabWSHandler } from './websocket';
import { usePresenceStore } from './presenceStore';

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
