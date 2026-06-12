/**
 * presenceStore — Zustand store for WebSocket-based presence
 * S42-P002-E2: Presence 光标同步 — WebSocket 升级
 * S44-P003-E3: 协作节点锁定 — lockedNodes + lockNode/unlockNode
 * S62-E1: 协作者实时同步 — editingNodeIds 编辑锁定感知
 * S63-E1: 实时游标追踪 — cursor:move, removeCursor
 * S64-E1: 协作者在线状态面板 — onlineUsers + heartbeat
 * S65-E2: 协作者编辑指示器 — focusedNodes + node focus 感知
 * S66-E2: 协作者冲突检测与通知 — nodeLocks Map + focusNode/blurNode + 30s auto-release
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

/** S65-E2: Info about who is focusing on which node */
export interface FocusedNodeInfo {
  userId: string;
  userName: string;
  avatar: string;
  startedAt: number;
}

/** S66-E2: Lock info for a node — includes lock metadata */
export interface NodeLockInfo {
  nodeId: string;
  userId: string;
  userName: string;
  avatar: string;
  lockedAt: number;
}


/** S68-E5: Dedicated cursors field */
export interface CursorState {
  userId: string;
  userName: string;
  avatar: string;
  /** Flow-space X coordinate */
  x: number;
  /** Flow-space Y coordinate */
  y: number;
  /** Last update timestamp */
  lastSeen: number;
}

/** S80-E5: Last activity timestamp per user — used for online/idle detection */
export interface LastActivityInfo {
  userId: string;
  lastActiveAt: number;
}

/** S70-E4: Collaboration conflict record */
export interface ConflictRecord {
  nodeId: string;
  nodeName: string;
  localVersion: string;
  remoteVersion: string;
  localUserId: string;
  localUserName: string;
  remoteUserId: string;
  remoteUserName: string;
  detectedAt: number;
  /** 'keep-local' | 'keep-remote' | 'pending' */
  resolution: 'keep-local' | 'keep-remote' | 'pending';
}

/** S89-E3: Heartbeat timeout in milliseconds (10s — optimized from 30s) */
const HEARTBEAT_TIMEOUT_MS = 10_000;

/** S65-E2: Focus timeout in milliseconds (30s auto-release) */
const FOCUS_TIMEOUT_MS = 30_000;

interface PresenceState {
  /** Remote users currently on the same canvas (excluding self) */
  remoteUsers: Map<string, RemoteUser>;

  /** Locked nodes: nodeId → userId of the user who locked it */
  lockedNodes: Record<string, string>;

  /** S62-E1: Nodes currently being edited (merged: local + remote, remote wins on conflict) */
  editingNodeIds: Map<string, EditingNodeInfo>;

  /** S62-E1: Local + remote editing tracking (local: started by local user; remote: started by remote user) */
  localEditing: Map<string, EditingNodeInfo>;

  /** S64-E1: Online users tracked via presence:heartbeat */
  onlineUsers: OnlineUser[];

  /** S65-E2: Nodes currently focused by remote users: nodeId → userId */
  focusedNodes: Record<string, string>;

  /** S65-E2: Detailed focus info for overlay display */
  focusedNodeInfos: Map<string, FocusedNodeInfo>;

  /** S66-E2: Node locks: nodeId → NodeLockInfo */
  nodeLocks: Map<string, NodeLockInfo>;

  // S68-E5: Dedicated cursors field
  /** S68-E5: Dedicated cursor tracking: userId → CursorState */
  cursors: Record<string, CursorState>;

  // S80-E5: Online presence & activity tracking
  /** S80-E5: Last activity timestamps per user (userId → timestamp) */
  lastActiveAt: Record<string, number>;

  /** S80-E5: Update last activity for a user (called on mouse move / node edit) */
  updateLastActive: (userId: string) => void;

  /** S80-E5: Check if a user is online based on 5-minute activity threshold */
  isOnline: (userId: string) => boolean;

  // S77-E2: WebSocket connection status
  /** S77-E2: WebSocket connection state */
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';

  /** S77-E2: Set connection status */
  setConnectionStatus: (status: 'connected' | 'reconnecting' | 'disconnected') => void;

  /** S77-E2: Re-sync presence after reconnect — clears stale state and re-subscribes */
  reSync: () => void;

  // S76-E5: Remote editing tracking
  /** S76-E5: Inverse mapping from userId → node they're editing (remote users only) */
  remoteEditing: Map<string, { nodeId: string; userName: string }>;

  /** S76-E5: Set which node a remote user is editing */
  setRemoteEditing: (userId: string, nodeId: string, userName: string) => void;

  /** S76-E5: Clear a user's remote editing state */
  clearRemoteEditing: (userId: string) => void;

  /** S76-E5: Get all remote users editing a specific node */
  getRemoteEditors: (nodeId: string) => { userId: string; userName: string }[];

  /** S76-E5: Clear all remote editing state */
  clearAllRemoteEditing: () => void;

  /** S70-E4: Pending collaboration conflicts requiring resolution */
  pendingConflicts: ConflictRecord[];

  /** S70-E4: Add a new conflict to the pending queue */
  addConflict: (conflict: Omit<ConflictRecord, 'resolution'>) => void;

  /** S70-E4: Resolve a specific conflict by nodeId */
  resolveConflict: (nodeId: string, resolution: 'keep-local' | 'keep-remote') => void;

  /** S70-E4: Check if a conflict exists for a node */
  hasConflict: (nodeId: string) => boolean;

  /** S70-E4: Get the number of unresolved conflicts */
  getUnresolvedCount: () => number;

  /** S68-E5: Update a user's cursor position in the cursors map */
  broadcastCursor: (userId: string, x: number, y: number) => void;

  /** S68-E5: Remove a user's cursor (e.g., on disconnect) */
  clearCursor: (userId: string) => void;

  /** S68-E5: Clear all cursors */
  clearAllCursors: () => void;

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

  // S65-E2: Node Focus actions

  /**
   * S65-E2: Set node focus — starts 30s auto-release timer.
   * If already focused by this user, resets the timer.
   */
  setNodeFocus: (nodeId: string, userId: string, userName: string, avatar: string) => void;

  /**
   * S65-E2: Clear node focus — cancels the auto-release timer.
   */
  clearNodeFocus: (nodeId: string) => void;

  /**
   * S65-E2: Check if a node is focused by a remote user (any user other than self).
   * Returns userId of the focusing user, or undefined.
   */
  getFocusedBy: (nodeId: string, selfUserId: string) => string | undefined;

  /**
   * S65-E2: Get focus info for a node.
   */
  getFocusInfo: (nodeId: string) => FocusedNodeInfo | undefined;

  /** S65-E2: Handle incoming node:focused WebSocket message */
  handleNodeFocusedMessage: (
    nodeId: string,
    userId: string,
    userName: string,
    avatar: string
  ) => void;

  /** S65-E2: Handle incoming node:unfocused WebSocket message */
  handleNodeUnfocusedMessage: (nodeId: string, userId: string) => void;

  /** S65-E2: Clear all focus state (on disconnect) */
  clearAllFocus: () => void;

  // S66-E2: Node Lock actions

  /**
   * S66-E2: Lock a node for a user — starts 30s auto-release timer.
   * If already locked by this user, resets the timer.
   */
  focusNode: (nodeId: string, userId: string, userName: string, avatar: string) => void;

  /**
   * S66-E2: Unlock a node — cancels the auto-release timer.
   */
  blurNode: (nodeId: string) => void;

  /**
   * S66-E2: Get lock info for a node.
   * Returns the userId who locked it, or undefined if not locked.
   */
  getLockedNode: (nodeId: string) => string | undefined;

  /**
   * S66-E2: Check if a node is locked by a remote user (any user other than self).
   */
  isNodeLockedByOther: (nodeId: string, selfUserId: string) => boolean;

  /** S66-E2: Handle incoming node:focus WebSocket message */
  handleNodeFocusMessage: (
    nodeId: string,
    userId: string,
    userName: string,
    avatar: string
  ) => void;

  /** S66-E2: Handle incoming node:blur WebSocket message */
  handleNodeBlurMessage: (nodeId: string, userId: string) => void;

  /** S66-E2: Clear all locks (on disconnect) */
  clearAllLocks: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => {
  // S65-E2: Track focus timeout timers per nodeId for auto-release
  const focusTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  function clearFocusTimer(nodeId: string) {
    if (focusTimers[nodeId]) {
      clearTimeout(focusTimers[nodeId]);
      delete focusTimers[nodeId];
    }
  }

  function scheduleFocusTimer(nodeId: string) {
    clearFocusTimer(nodeId);
    focusTimers[nodeId] = setTimeout(() => {
      // Auto-release: remove from both maps
      set((state) => {
        const { [nodeId]: _fn, ...restNodes } = state.focusedNodes;
        const newInfos = new Map(state.focusedNodeInfos);
        newInfos.delete(nodeId);
        return { focusedNodes: restNodes, focusedNodeInfos: newInfos };
      });
      delete focusTimers[nodeId];
    }, FOCUS_TIMEOUT_MS);
  }

  return {
    remoteUsers: new Map(),
    lockedNodes: {},
    editingNodeIds: new Map(),
    localEditing: new Map(),
    onlineUsers: [],
    focusedNodes: {},
    focusedNodeInfos: new Map(),

    // S68-E5: Dedicated cursors field
    cursors: {},

    // S80-E5: Online presence & activity tracking
    lastActiveAt: {},

    updateLastActive: (userId: string) =>
      set((state) => ({
        lastActiveAt: { ...state.lastActiveAt, [userId]: Date.now() },
      })),

    // S89-E3: 10-second threshold (optimized from 5 minutes)
    isOnline: (userId: string) => {
      const lastActive = get().lastActiveAt[userId];
      if (!lastActive) return false;
      return Date.now() - lastActive < 10 * 1000;
    },

    // S76-E5: Remote editing tracking
    remoteEditing: new Map(),

    // S77-E2: Connection status
    connectionStatus: 'disconnected',

    setConnectionStatus: (status) => set({ connectionStatus: status }),

    reSync: () => {
      // S77-E2: After reconnect, clear stale state and trigger re-subscription
      // The actual re-subscription is handled by useCollaboration's reconnect flow.
      // This method signals that the store should refresh its state.
      set((state) => ({
        // Keep cursors and remoteUsers — they'll be repopulated by the WS re-subscription
        // Just ensure conflicts and locks are cleared (may be stale from before disconnect)
        pendingConflicts: [],
      }));
    },

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
        const { [userId]: _c, ...restCursors } = state.cursors;
        const remoteEditingUpdated = new Map(state.remoteEditing);
        remoteEditingUpdated.delete(userId);
        const { [userId]: _la, ...restLastActive } = state.lastActiveAt;
        return { remoteUsers: updated, cursors: restCursors, remoteEditing: remoteEditingUpdated, lastActiveAt: restLastActive };
      }),

    removeCursor: (userId: string) =>
      set((state) => {
        const existing = state.remoteUsers.get(userId);
        if (!existing) return state;
        const updated = new Map(state.remoteUsers);
        updated.set(userId, { ...existing, cursorX: undefined, cursorY: undefined });
        return { remoteUsers: updated };
      }),

    clearAll: () =>
      set({
        remoteUsers: new Map(),
        editingNodeIds: new Map(),
        localEditing: new Map(),
        onlineUsers: [],
        focusedNodes: {},
        focusedNodeInfos: new Map(),
        cursors: {},
        remoteEditing: new Map(),
        lastActiveAt: {},
      }),

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
        // S70-E4: Conflict detection — if a remote user is already editing this node,
        // trigger a conflict (both versions are "current" — no version history captured)
        const existingRemote = state.editingNodeIds.get(nodeId);
        if (existingRemote && existingRemote.userId !== userId) {
          // Remote user is editing — this is a conflict
          const conflict: ConflictRecord = {
            nodeId,
            nodeName: nodeId, // nodeName fallback to nodeId
            localVersion: '(编辑中)',
            remoteVersion: '(编辑中)',
            localUserId: userId,
            localUserName: userName,
            remoteUserId: existingRemote.userId,
            remoteUserName: existingRemote.userName,
            detectedAt: Date.now(),
            resolution: 'pending',
          };
          // addConflict handles dedup
          const store = get();
          if (store.pendingConflicts.every((c) => c.nodeId !== nodeId)) {
            set({ pendingConflicts: [...state.pendingConflicts, conflict] });
          }
        }

        const updated = new Map(state.editingNodeIds);
        updated.set(nodeId, { userId, userName, avatar, startedAt: Date.now() });
        const localUpdated = new Map(state.localEditing);
        localUpdated.set(nodeId, { userId, userName, avatar, startedAt: Date.now() });
        return { editingNodeIds: updated, localEditing: localUpdated };
      }),

    endEditing: (nodeId: string) =>
      set((state) => {
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
          if (info.userId === userId) updated.delete(nodeId);
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
        const updated = new Map(state.editingNodeIds);
        updated.set(nodeId, { userId, userName, avatar, startedAt: Date.now() });
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
          const updated = [...state.onlineUsers];
          const existing = updated[existingIdx];
          updated[existingIdx] = {
            ...existing,
            status,
            lastSeen: now,
            name: name ?? existing.name,
            avatar: avatar ?? existing.avatar,
          };
          return { onlineUsers: updated };
        } else {
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

    // S65-E2: Node Focus actions

    setNodeFocus: (nodeId: string, userId: string, userName: string, avatar: string) =>
      set((state) => {
        // Start/reset the 30s auto-release timer
        scheduleFocusTimer(nodeId);
        return {
          focusedNodes: { ...state.focusedNodes, [nodeId]: userId },
          focusedNodeInfos: new Map(state.focusedNodeInfos).set(nodeId, {
            userId,
            userName,
            avatar,
            startedAt: Date.now(),
          }),
        };
      }),

    clearNodeFocus: (nodeId: string) =>
      set((state) => {
        clearFocusTimer(nodeId);
        const { [nodeId]: _removed, ...restNodes } = state.focusedNodes;
        const newInfos = new Map(state.focusedNodeInfos);
        newInfos.delete(nodeId);
        return { focusedNodes: restNodes, focusedNodeInfos: newInfos };
      }),

    getFocusedBy: (nodeId: string, selfUserId: string) => {
      const state = get();
      const userId = state.focusedNodes[nodeId];
      // Return only if focused by a REMOTE user (not self)
      if (userId && userId !== selfUserId) return userId;
      return undefined;
    },

    getFocusInfo: (nodeId: string) => get().focusedNodeInfos.get(nodeId),

    handleNodeFocusedMessage: (
      nodeId: string,
      userId: string,
      userName: string,
      avatar: string
    ) =>
      set((state) => {
        // Remote user focused a node: set the focus entry
        // Remote focus does NOT start a timer on the local side — the remote user is responsible for their timer
        return {
          focusedNodes: { ...state.focusedNodes, [nodeId]: userId },
          focusedNodeInfos: new Map(state.focusedNodeInfos).set(nodeId, {
            userId,
            userName,
            avatar,
            startedAt: Date.now(),
          }),
        };
      }),

    handleNodeUnfocusedMessage: (nodeId: string, userId: string) =>
      set((state) => {
        // Only clear if THIS user was the one unfocusing
        if (state.focusedNodes[nodeId] !== userId) return state;
        clearFocusTimer(nodeId);
        const { [nodeId]: _removed, ...restNodes } = state.focusedNodes;
        const newInfos = new Map(state.focusedNodeInfos);
        newInfos.delete(nodeId);
        return { focusedNodes: restNodes, focusedNodeInfos: newInfos };
      }),

    clearAllFocus: () => {
      // Clear all timers
      for (const nodeId of Object.keys(focusTimers)) {
        clearFocusTimer(nodeId);
      }
      set({ focusedNodes: {}, focusedNodeInfos: new Map() });
    },

    // S68-E5: Dedicated cursor actions
    broadcastCursor: (userId: string, x: number, y: number) =>
      set((state) => {
        const remoteUser = state.remoteUsers.get(userId);
        return {
          cursors: {
            ...state.cursors,
            [userId]: {
              userId,
              userName: remoteUser?.name ?? userId,
              avatar: remoteUser?.avatar ?? '',
              x,
              y,
              lastSeen: Date.now(),
            },
          },
        };
      }),

    clearCursor: (userId: string) =>
      set((state) => {
        const { [userId]: _removed, ...rest } = state.cursors;
        return { cursors: rest };
      }),

    clearAllCursors: () => set({ cursors: {} }),

    // S76-E5: Remote editing tracking
    setRemoteEditing: (userId, nodeId, userName) =>
      set((state) => {
        const updated = new Map(state.remoteEditing);
        updated.set(userId, { nodeId, userName });
        return { remoteEditing: updated };
      }),

    clearRemoteEditing: (userId) =>
      set((state) => {
        const updated = new Map(state.remoteEditing);
        updated.delete(userId);
        return { remoteEditing: updated };
      }),

    getRemoteEditors: (nodeId) => {
      const state = get();
      const editors: { userId: string; userName: string }[] = [];
      for (const [userId, info] of state.remoteEditing) {
        if (info.nodeId === nodeId) {
          editors.push({ userId, userName: info.userName });
        }
      }
      return editors;
    },

    clearAllRemoteEditing: () => set({ remoteEditing: new Map() }),

    // S66-E2: Node Lock actions

    // S66-E2: Track lock timeout timers per nodeId for auto-release
    nodeLocks: new Map(),

    focusNode: (nodeId: string, userId: string, userName: string, avatar: string) => {
      // Schedule 30s auto-release
      if (focusTimers[nodeId]) {
        clearTimeout(focusTimers[nodeId]);
      }
      focusTimers[nodeId] = setTimeout(() => {
        set((state) => {
          const newLocks = new Map(state.nodeLocks);
          newLocks.delete(nodeId);
          return { nodeLocks: newLocks };
        });
        delete focusTimers[nodeId];
      }, FOCUS_TIMEOUT_MS);
      set((state) => {
        const newLocks = new Map(state.nodeLocks);
        newLocks.set(nodeId, { nodeId, userId, userName, avatar, lockedAt: Date.now() });
        return { nodeLocks: newLocks };
      });
    },

    blurNode: (nodeId: string) => {
      if (focusTimers[nodeId]) {
        clearTimeout(focusTimers[nodeId]);
        delete focusTimers[nodeId];
      }
      set((state) => {
        const newLocks = new Map(state.nodeLocks);
        newLocks.delete(nodeId);
        return { nodeLocks: newLocks };
      });
    },

    getLockedNode: (nodeId: string) => {
      return get().nodeLocks.get(nodeId)?.userId;
    },

    isNodeLockedByOther: (nodeId: string, selfUserId: string) => {
      const lock = get().nodeLocks.get(nodeId);
      return !!lock && lock.userId !== selfUserId;
    },

    handleNodeFocusMessage: (
      nodeId: string,
      userId: string,
      userName: string,
      avatar: string
    ) => {
      // Remote user locked a node — update nodeLocks without starting a timer on local side
      set((state) => {
        const newLocks = new Map(state.nodeLocks);
        newLocks.set(nodeId, { nodeId, userId, userName, avatar, lockedAt: Date.now() });
        return { nodeLocks: newLocks };
      });
    },

    handleNodeBlurMessage: (nodeId: string, userId: string) => {
      const lock = get().nodeLocks.get(nodeId);
      if (!lock || lock.userId !== userId) return;
      if (focusTimers[nodeId]) {
        clearTimeout(focusTimers[nodeId]);
        delete focusTimers[nodeId];
      }
      set((state) => {
        const newLocks = new Map(state.nodeLocks);
        newLocks.delete(nodeId);
        return { nodeLocks: newLocks };
      });
    },

    clearAllLocks: () => {
      for (const nodeId of Object.keys(focusTimers)) {
        clearTimeout(focusTimers[nodeId]);
        delete focusTimers[nodeId];
      }
      set({ nodeLocks: new Map() });
    },

    // S70-E4: Conflict detection & resolution actions

    pendingConflicts: [],

    addConflict: (conflict) => {
      set((state) => {
        // Avoid duplicates for same nodeId
        if (state.pendingConflicts.some((c) => c.nodeId === conflict.nodeId)) {
          return state;
        }
        return {
          pendingConflicts: [
            ...state.pendingConflicts,
            { ...conflict, resolution: 'pending' as const },
          ],
        };
      });
    },

    resolveConflict: (nodeId, resolution) => {
      set((state) => ({
        pendingConflicts: state.pendingConflicts.filter((c) => c.nodeId !== nodeId),
      }));
    },

    hasConflict: (nodeId) => {
      return get().pendingConflicts.some((c) => c.nodeId === nodeId);
    },

    getUnresolvedCount: () => {
      return get().pendingConflicts.length;
    },
  };
});
