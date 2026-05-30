/**
 * presenceStore — Zustand store for WebSocket-based presence
 * S42-P002-E2: Presence 光标同步 — WebSocket 升级
 * S44-P003-E3: 协作节点锁定 — lockedNodes + lockNode/unlockNode
 *
 * Replaces Firebase usePresence with WebSocket-backed state.
 * Updated by useCollaboration's onPresence callback.
 */

import { create } from 'zustand';
import type { CollabUser } from './types';

export interface RemoteUser {
  userId: string;
  name: string;
  avatar: string;
  /** Cursor position relative to viewport (set by WebSocket presence relay) */
  cursorX?: number;
  cursorY?: number;
  /** Last heartbeat timestamp */
  lastSeen: number;
}

interface PresenceState {
  /** Remote users currently on the same canvas (excluding self) */
  remoteUsers: Map<string, RemoteUser>;

  /** Locked nodes: nodeId → userId of the user who locked it */
  lockedNodes: Record<string, string>;

  /** Update remote users from WebSocket presence message */
  setRemoteUsers: (users: CollabUser[]) => void;

  /** Update a single user's cursor position */
  updateCursor: (userId: string, x: number, y: number) => void;

  /** Remove a user who left */
  removeUser: (userId: string) => void;

  /** Clear all remote users */
  clearAll: () => void;

  /** Lock a node — called when user acquires a lock */
  lockNode: (nodeId: string, userId: string) => void;

  /** Unlock a node — called when user releases a lock */
  unlockNode: (nodeId: string) => void;

  /** Check if a node is locked by any user */
  isLocked: (nodeId: string) => boolean;

  /** Handle incoming node_locked WebSocket message */
  handleNodeLockedMessage: (nodeId: string, userId: string) => void;

  /** Handle incoming node_unlocked WebSocket message */
  handleNodeUnlockedMessage: (nodeId: string) => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  remoteUsers: new Map(),
  lockedNodes: {},

  setRemoteUsers: (users: CollabUser[]) =>
    set((state) => {
      const next = new Map<string, RemoteUser>();
      for (const user of users) {
        const existing = state.remoteUsers.get(user.userId);
        next.set(user.userId, {
          userId: user.userId,
          name: user.name,
          avatar: user.avatar,
          cursorX: existing?.cursorX,
          cursorY: existing?.cursorY,
          lastSeen: Date.now(),
        });
      }
      return { remoteUsers: next };
    }),

  updateCursor: (userId: string, x: number, y: number) =>
    set((state) => {
      const existing = state.remoteUsers.get(userId);
      if (!existing) return state;
      const updated = new Map(state.remoteUsers);
      updated.set(userId, { ...existing, cursorX: x, cursorY: y, lastSeen: Date.now() });
      return { remoteUsers: updated };
    }),

  removeUser: (userId: string) =>
    set((state) => {
      const updated = new Map(state.remoteUsers);
      updated.delete(userId);
      return { remoteUsers: updated };
    }),

  clearAll: () => set({ remoteUsers: new Map() }),

  lockNode: (nodeId: string, userId: string) =>
    set((state) => ({
      lockedNodes: { ...state.lockedNodes, [nodeId]: userId },
    })),

  unlockNode: (nodeId: string) =>
    set((state) => {
      const { [nodeId]: _removed, ...rest } = state.lockedNodes;
      return { lockedNodes: rest };
    }),

  isLocked: (nodeId: string) => nodeId in get().lockedNodes,

  handleNodeLockedMessage: (nodeId: string, userId: string) =>
    set((state) => ({
      lockedNodes: { ...state.lockedNodes, [nodeId]: userId },
    })),

  handleNodeUnlockedMessage: (nodeId: string) =>
    set((state) => {
      const { [nodeId]: _removed, ...rest } = state.lockedNodes;
      return { lockedNodes: rest };
    }),
}));
