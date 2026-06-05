/**
 * wsNodeFocusHandler — WebSocket handler for node focus/unfocus messages
 * S65-E2: 协作者编辑指示器 — node:focused / node:unfocused
 * S66-E2: 协作者冲突检测与通知 — node:focus / node:blur
 *
 * Registers with CollabWebSocket to handle:
 * - node:focused — another user focused on a node (30s auto-release on sender side)
 * - node:unfocused — another user unfocused from a node
 * - node:focus — another user locked a node (S66-E2)
 * - node:blur — another user unlocked a node (S66-E2)
 *
 * Usage:
 *   import { registerNodeFocusHandler } from './wsNodeFocusHandler';
 *   registerNodeFocusHandler(useCollabWebSocket.subscribe);
 */

import type { CollabWSHandler } from './websocket';
import { usePresenceStore } from './presenceStore';
import type { NodeFocusedMessage, NodeUnfocusedMessage } from './types';

/**
 * Register node:focused / node:unfocused / node:focus / node:blur handlers
 * on a CollabWebSocket instance.
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
      // S66-E2: node:focus — another user locked a node
      case 'node:focus': {
        const m = msg as NodeFocusMessage;
        usePresenceStore.getState().handleNodeFocusMessage(
          m.nodeId,
          m.userId,
          m.userName,
          m.avatar
        );
        break;
      }
      // S66-E2: node:blur — another user unlocked a node
      case 'node:blur': {
        const m = msg as NodeBlurMessage;
        usePresenceStore.getState().handleNodeBlurMessage(m.nodeId, m.userId);
        break;
      }
    }
  });
}

/** S66-E2: WebSocket node:focus message payload */
export interface NodeFocusMessage {
  type: 'node:focus';
  nodeId: string;
  userId: string;
  userName: string;
  avatar: string;
}

/** S66-E2: WebSocket node:blur message payload */
export interface NodeBlurMessage {
  type: 'node:blur';
  nodeId: string;
  userId: string;
}
