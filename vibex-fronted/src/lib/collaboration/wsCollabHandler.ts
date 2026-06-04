/**
 * wsCollabHandler — WebSocket handler for collaboration editing messages
 * S62-E1: 协作者实时同步 — collab:editing:start / collab:editing:end
 *
 * Registers with CollabWebSocket to handle:
 * - collab:editing:start — another user started editing a node
 * - collab:editing:end — another user stopped editing a node
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
    }
  });
}
