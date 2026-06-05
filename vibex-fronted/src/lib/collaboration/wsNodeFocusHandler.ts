/**
 * wsNodeFocusHandler — WebSocket handler for node focus/unfocus messages
 * S65-E2: 协作者编辑指示器 — node:focused / node:unfocused
 *
 * Registers with CollabWebSocket to handle:
 * - node:focused — another user focused on a node (30s auto-release on sender side)
 * - node:unfocused — another user unfocused from a node
 *
 * Usage:
 *   import { registerNodeFocusHandler } from './wsNodeFocusHandler';
 *   registerNodeFocusHandler(useCollabWebSocket.subscribe);
 */

import type { CollabWSHandler } from './websocket';
import { usePresenceStore } from './presenceStore';
import type { NodeFocusedMessage, NodeUnfocusedMessage } from './types';

/**
 * Register node:focused / node:unfocused handlers on a CollabWebSocket instance.
 */
export function registerNodeFocusHandler(
  onMessage: (handler: CollabWSHandler) => void
): void {
  onMessage((msg) => {
    switch (msg.type) {
      case 'node:focused': {
        const m = msg as NodeFocusedMessage;
        usePresenceStore.getState().handleNodeFocusedMessage(
          m.nodeId,
          m.userId,
          m.userName,
          m.avatar
        );
        break;
      }
      case 'node:unfocused': {
        const m = msg as NodeUnfocusedMessage;
        usePresenceStore.getState().handleNodeUnfocusedMessage(m.nodeId, m.userId);
        break;
      }
    }
  });
}
