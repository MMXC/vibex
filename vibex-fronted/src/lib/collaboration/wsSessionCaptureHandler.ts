/**
 * wsSessionCaptureHandler — S66-E5: WebSocket event capture for session recording
 *
 * Registers with CollabWebSocket to capture collaboration events into the
 * collabSessionStore when a session is being recorded.
 *
 * Usage:
 *   import { registerSessionCapture } from './wsSessionCaptureHandler';
 *   registerSessionCapture(useCollabWebSocket.subscribe, {
 *     currentUserId: userId,
 *     currentUserName: userName,
 *   });
 */

import type { CollabWSHandler } from './websocket';
import { useCollabSessionStore } from './collabSessionStore';

interface RegisterOptions {
  currentUserId: string;
  currentUserName: string;
  canvasId?: string;
}

/**
 * Register all collaboration event capture handlers.
 * When a session is recording, each event is forwarded to the store.
 */
export function registerSessionCapture(
  onMessage: (handler: CollabWSHandler) => void,
  options: RegisterOptions
): void {
  const { currentUserId, currentUserName, canvasId } = options;

  onMessage((msg) => {
    const store = useCollabSessionStore.getState();
    if (!store.isRecording) return;

    const base = { userId: currentUserId, userName: currentUserName };

    switch (msg.type) {
      case 'node:focused': {
        const m = msg as { type: 'node:focused'; nodeId: string; userId: string; userName: string; avatar?: string };
        if (m.userId === currentUserId) return; // Don't record own events
        store.addEvent({ ...base, userId: m.userId, userName: m.userName, avatar: m.avatar, type: 'node:focused', nodeId: m.nodeId });
        break;
      }
      case 'node:unfocused': {
        const m = msg as { type: 'node:unfocused'; nodeId: string; userId: string };
        if (m.userId === currentUserId) return;
        store.addEvent({ ...base, userId: m.userId, userName: base.userName, type: 'node:unfocused', nodeId: m.nodeId });
        break;
      }
      case 'node:focus': {
        const m = msg as { type: 'node:focus'; nodeId: string; userId: string; userName: string; avatar?: string };
        if (m.userId === currentUserId) return;
        store.addEvent({ ...base, userId: m.userId, userName: m.userName, avatar: m.avatar, type: 'node:focus', nodeId: m.nodeId });
        break;
      }
      case 'node:blur': {
        const m = msg as { type: 'node:blur'; nodeId: string; userId: string };
        if (m.userId === currentUserId) return;
        store.addEvent({ ...base, userId: m.userId, userName: base.userName, type: 'node:blur', nodeId: m.nodeId });
        break;
      }
      case 'cursor:move': {
        const m = msg as { type: 'cursor:move'; userId: string; userName: string; x: number; y: number };
        if (m.userId === currentUserId) return;
        store.addEvent({ ...base, userId: m.userId, userName: m.userName, type: 'cursor:move', x: m.x, y: m.y });
        break;
      }
      case 'user:join': {
        const m = msg as { type: 'user:join'; userId: string; userName: string; avatar?: string };
        store.addEvent({ ...base, userId: m.userId, userName: m.userName, avatar: m.avatar, type: 'user:join' });
        break;
      }
      case 'user:leave': {
        const m = msg as { type: 'user:leave'; userId: string };
        store.addEvent({ ...base, userId: m.userId, userName: base.userName, type: 'user:leave' });
        break;
      }
      case 'collab:editing:start': {
        const m = msg as { type: 'collab:editing:start'; nodeId: string; userId: string; userName: string };
        if (m.userId === currentUserId) return;
        store.addEvent({ ...base, userId: m.userId, userName: m.userName, type: 'editing:start', nodeId: m.nodeId });
        break;
      }
      case 'collab:editing:end': {
        const m = msg as { type: 'collab:editing:end'; nodeId: string; userId: string };
        if (m.userId === currentUserId) return;
        store.addEvent({ ...base, userId: m.userId, userName: base.userName, type: 'editing:end', nodeId: m.nodeId });
        break;
      }
    }
  });
}
