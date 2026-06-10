/**
 * wsPresenceHandler — S84-E2: WebSocket presence subscription & reconnect logic
 *
 * Handles:
 * - presence:join  — new collaborator joined the room
 * - presence:leave — collaborator left / disconnected
 * - presence:update — collaborator cursor/status update
 * - presence:heartbeat — periodic heartbeat to keep presence alive
 * - Reconnect: re-subscribes and re-broadcasts join on WS reconnect
 *
 * All handlers update presenceStore.
 */

import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import type { CollabUser } from '@/lib/collaboration/types';

// 8-color pool — S84-E2 DoD requirement
export const COLLABORATOR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
] as const;

/**
 * Deterministic 8-color pool assignment — S84-E2 DoD
 * Color is stable per userId (same user always gets same color).
 */
export function getCollaboratorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return COLLABORATOR_COLORS[Math.abs(hash) % COLLABORATOR_COLORS.length]!;
}

/** S84-E2: Presence event types from WebSocket */
export type PresenceEventType = 'presence:join' | 'presence:leave' | 'presence:update' | 'presence:heartbeat';

export interface PresenceJoinPayload {
  userId: string;
  name: string;
  avatar: string;
  color?: string;
  cursorX?: number;
  cursorY?: number;
}

export interface PresenceLeavePayload {
  userId: string;
}

export interface PresenceUpdatePayload {
  userId: string;
  cursorX?: number;
  cursorY?: number;
  status?: 'online' | 'idle' | 'offline';
}

export interface PresenceHeartbeatPayload {
  userId: string;
  timestamp: number;
}

export type PresenceMessage =
  | { type: 'presence:join'; payload: PresenceJoinPayload }
  | { type: 'presence:leave'; payload: PresenceLeavePayload }
  | { type: 'presence:update'; payload: PresenceUpdatePayload }
  | { type: 'presence:heartbeat'; payload: PresenceHeartbeatPayload };

/**
 * Process a single presence WebSocket message — updates presenceStore.
 */
export function handlePresenceMessage(msg: PresenceMessage): void {
  const store = usePresenceStore.getState();

  switch (msg.type) {
    case 'presence:join': {
      const { userId, name, avatar, cursorX, cursorY } = msg.payload;
      // Add to remoteUsers if not self (self is tracked separately)
      const existing = store.remoteUsers.get(userId);
      const remoteUser: CollabUser = {
        userId,
        name,
        avatar,
        cursorX,
        cursorY,
        lastSeen: Date.now(),
      };
      if (!existing) {
        store.setRemoteUsers([...(Array.from(store.remoteUsers.values())), remoteUser]);
      } else {
        // Update existing
        const all = Array.from(store.remoteUsers.values()).filter(u => u.userId !== userId);
        all.push(remoteUser);
        store.setRemoteUsers(all);
      }
      // Update cursors
      if (cursorX !== undefined && cursorY !== undefined) {
        store.broadcastCursor(userId, cursorX, cursorY);
      }
      // Set online status
      store.updateLastActive(userId);
      break;
    }

    case 'presence:leave': {
      const { userId } = msg.payload;
      // Remove user from remoteUsers
      store.removeUser(userId);
      // Remove cursor
      store.clearCursor(userId);
      break;
    }

    case 'presence:update': {
      const { userId, cursorX, cursorY, status } = msg.payload;
      const user = store.remoteUsers.get(userId);
      if (user) {
        const updated: CollabUser = {
          ...user,
          cursorX,
          cursorY,
          lastSeen: Date.now(),
        };
        const all = Array.from(store.remoteUsers.values()).filter(u => u.userId !== userId);
        all.push(updated);
        store.setRemoteUsers(all);
      }
      if (cursorX !== undefined && cursorY !== undefined) {
        store.broadcastCursor(userId, cursorX, cursorY);
      }
      if (status) {
        store.updateLastActive(userId);
      }
      break;
    }

    case 'presence:heartbeat': {
      const { userId } = msg.payload;
      store.updateLastActive(userId);
      break;
    }
  }
}

/**
 * S84-E2: Reconnect handler — clears stale state and re-broadcasts presence join.
 * Call this after WebSocket reconnects successfully.
 */
export function handleReconnect(currentUserId: string, currentUserName: string, currentUserAvatar: string): void {
  const store = usePresenceStore.getState();

  // Clear all cursors and remote users (stale after reconnect)
  store.clearAllCursors();
  store.clearAll();

  // Set connection status
  store.setConnectionStatus('connected');

  // Re-sync presence
  store.reSync();

  // Re-broadcast own presence
  // The actual WS broadcast is done by the caller (useCollaboration)
  // This handler just ensures store state is consistent
}

/**
 * Subscribe to presence WebSocket messages.
 * Returns an unsubscribe function.
 */
export function subscribePresenceMessages(
  subscribe: (handler: (msg: PresenceMessage) => void) => () => void
): () => void {
  return subscribe((msg) => {
    if (
      msg.type === 'presence:join' ||
      msg.type === 'presence:leave' ||
      msg.type === 'presence:update' ||
      msg.type === 'presence:heartbeat'
    ) {
      handlePresenceMessage(msg as PresenceMessage);
    }
  });
}
