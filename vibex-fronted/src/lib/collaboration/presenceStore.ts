/**
 * presenceStore — Zustand store for WebSocket-based presence
 * S42-P002-E2: Presence 光标同步 — WebSocket 升级
 * S44-P003-E3: 协作节点锁定 — lockedNodes + lockNode/unlockNode
 * S62-E1: 协作者实时同步 — editingNodeIds 编辑锁定感知
 * S63-E1: 实时游标追踪 — cursor:move, removeCursor
 * S64-E1: 协作者在线状态面板 — onlineUsers + heartbeat
 *
 * Replaces Firebase usePresence with WebSocket-backed state.
 * Updated by useCollaboration's onPresence callback.
 */

import { create } from 'zustand';
import type { CollabUser } from './types';

/** S64-E1: Online user status */
export type OnlineStatus = 'online' | 'idle' | 'offline';

/** S64-E1: Online user entry — tracked via presence:heartbeat */
export interface OnlineUser {
  userId: string;
  name: string;
  avatar: string;
  /** Current status */
  status: OnlineStatus;
  /** Last heartbeat timestamp (Date.now()) */
  lastSeen: number;
}

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

/** S62-E1: Info about who is editing which node */
export interface EditingNodeInfo {
  userId: string;
  userName: string;
  avatar: string;
  startedAt: number;
}

/** Heartbeat timeout in milliseconds (30s) */
const HEARTBEAT_TIMEOUT_MS = 30_000;

interface PresenceState {
  /** Remote users currently on the same canvas (excluding self) */
  remoteUsers: Map<string, RemoteUser>;

  /** Locked nodes: nodeId → userId of the user who locked it */
  lockedNodes: Record<string, string>;

  /** S62-E1: Nodes currently being edited (merged: local + remote, remote wins on conflict) */
  editingNodeIds: Map<string, EditingNodeInfo>;

  /** S62-E1: Local + remote editing tracking (local: started by local user; remote: started by remote user) */
  localEditing: Map<string, EditingNodeInfo>; // nodeId → entry started locally OR by remote (merged view)

  /** S64-E1: Online users tracked via presence:heartbeat */
  onlineUsers: OnlineUser[];

  /** Update remote users from WebSocket presence message */
  setRemoteUsers: (users: CollabUser[]) => void;

  /** Update a single user's cursor position */
  updateCursor: (userId: string, x: number, y: number) => void;

  /** Remove a user who left */
  removeUser: (userId: string) => void;

  /** S63-E1: Remove only the cursor position — user stays in remoteUsers map */
  removeCursor: (userId: string) => void;

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

  // S62-E1: Editing Node actions

  /** Start editing a node — broadcast to other users */
  startEditing: (nodeId: string, userId: string, userName: string, avatar: string) => void;

  /** End editing a node — broadcast to other users */
  endEditing: (nodeId: string) => void;

  /** End all editing for a user (e.g., user disconnected) */
  endEditingByUser: (userId: string) => void;

  /** Check if a node is being edited by a remote user */
  isBeingEdited: (nodeId: string) => boolean;

  /** Get editor info for a node */
  getEditor: (nodeId: string) => EditingNodeInfo | undefined;

  /** Handle incoming collab:editing:start WebSocket message */
  handleEditingStartedMessage: (
    nodeId: string,
    userId: string,
    userName: string,
    avatar: string
  ) => void;

  /** Handle incoming collab:editing:end WebSocket message */
  handleEditingEndedMessage: (nodeId: string) => void;

  // S64-E1: Online users actions

  /**
   * D1.1: Update online user status (or add if new).
   * Called on every presence:heartbeat message.
   */
  updateOnlineUsers: (userId: string, status: OnlineStatus, name?: string, avatar?: string) => void;

  /**
   * D1.5: Remove users who have not sent a heartbeat in >30s.
   * Call this periodically (e.g., on interval or on heartbeat processing).
   */
  removeStaleUsers: () => void;

  /** Clear all online users (on disconnect) */
  clearOnlineUsers: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  remoteUsers: new Map(),
  lockedNodes: {},
  editingNodeIds: new Map(),
  localEditing: new Map(),
  onlineUsers: [],

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

  // S63-E1: Remove only cursor position — user stays in the map
  removeCursor: (userId: string) =>
    set((state) => {
      const existing = state.remoteUsers.get(userId);
      if (!existing) return state;
      const updated = new Map(state.remoteUsers);
      updated.set(userId, { ...existing, cursorX: undefined, cursorY: undefined });
      return { remoteUsers: updated };
    }),

  clearAll: () =>
    set({ remoteUsers: new Map(), editingNodeIds: new Map(), localEditing: new Map(), onlineUsers: [] }),

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

  // S62-E1: Editing Node actions

  startEditing: (nodeId: string, userId: string, userName: string, avatar: string) =>
    set((state) => {
      const updated = new Map(state.editingNodeIds);
      updated.set(nodeId, { userId, userName, avatar, startedAt: Date.now() });
      const localUpdated = new Map(state.localEditing);
      localUpdated.set(nodeId, { userId, userName, avatar, startedAt: Date.now() });
      return { editingNodeIds: updated, localEditing: localUpdated };
    }),

  endEditing: (nodeId: string) =>
    set((state) => {
      // Always remove from editingNodeIds — unconditional exit.
      // editingNodeIds is a merged view; localEditing tracks local state separately.
      // endEditingByUser(userId) should be used to end all edits for a specific user.
      const updated = new Map(state.editingNodeIds);
      updated.delete(nodeId);
      const localUpdated = new Map(state.localEditing);
      localUpdated.delete(nodeId);
      return { editingNodeIds: updated, localEditing: localUpdated };
    }),

  endEditingByUser: (userId: string) =>
    set((state) => {
      const updated = new Map(state.editingNodeIds);
      for (const [nodeId, info] of updated) {
        if (info.userId === userId) {
          updated.delete(nodeId);
        }
      }
      const localUpdated = new Map(state.localEditing);
      for (const [nodeId, info] of localUpdated) {
        if (info.userId === userId) localUpdated.delete(nodeId);
      }
      return { editingNodeIds: updated, localEditing: localUpdated };
    }),

  isBeingEdited: (nodeId: string) => get().editingNodeIds.has(nodeId),

  getEditor: (nodeId: string) => get().editingNodeIds.get(nodeId),

  handleEditingStartedMessage: (
    nodeId: string,
    userId: string,
    userName: string,
    avatar: string
  ) =>
    set((state) => {
      // Always overwrite — latest start message wins (remote edit takes over local edit)
      const updated = new Map(state.editingNodeIds);
      updated.set(nodeId, { userId, userName, avatar, startedAt: Date.now() });
      // Remote edit: does NOT touch localEditing (local tracking is separate)
      return { editingNodeIds: updated };
    }),

  handleEditingEndedMessage: (nodeId: string) =>
    set((state) => {
      const updated = new Map(state.editingNodeIds);
      updated.delete(nodeId);
      return { editingNodeIds: updated };
    }),

  // S64-E1: Online users actions

  updateOnlineUsers: (userId: string, status: OnlineStatus, name?: string, avatar?: string) =>
    set((state) => {
      const existingIdx = state.onlineUsers.findIndex((u) => u.userId === userId);
      const now = Date.now();
      if (existingIdx >= 0) {
        // Update existing user's status and timestamp
        const updated = [...state.onlineUsers];
        const existing = updated[existingIdx];
        updated[existingIdx] = {
          ...existing,
          status,
          lastSeen: now,
          // Allow name/avatar update if provided
          name: name ?? existing.name,
          avatar: avatar ?? existing.avatar,
        };
        return { onlineUsers: updated };
      } else {
        // Add new user
        return {
          onlineUsers: [
            ...state.onlineUsers,
            {
              userId,
              name: name ?? 'Unknown',
              avatar: avatar ?? '',
              status,
              lastSeen: now,
            },
          ],
        };
      }
    }),

  removeStaleUsers: () =>
    set((state) => {
      const cutoff = Date.now() - HEARTBEAT_TIMEOUT_MS;
      const filtered = state.onlineUsers.filter((u) => u.lastSeen > cutoff);
      if (filtered.length === state.onlineUsers.length) return state;
      return { onlineUsers: filtered };
    }),

  clearOnlineUsers: () => set({ onlineUsers: [] }),
}));
