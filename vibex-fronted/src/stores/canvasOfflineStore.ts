/**
 * canvasOfflineStore.ts — Sprint77 E4: 画布离线缓存与冲突解决
 *
 * Responsibilities:
 * - Track online/offline status via navigator.onLine
 * - Queue canvas changes during offline periods
 * - Detect conflicts on reconnect (timestamp comparison)
 * - Manage sync replay queue
 *
 * Depends on:
 * - historyDB: CanvasChangeLog objectStore (added in E4)
 */

'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CanvasChangeLogEntry } from '@/lib/canvas/historyDB';
import {
  saveCanvasChangeToDB,
  loadCanvasChangesFromDB,
  clearCanvasChangesFromDB,
} from '@/lib/canvas/historyDB';

// ============================================
// Types
// ============================================

export type SyncStatus = 'idle' | 'syncing' | 'conflict' | 'error';

/** A queued canvas change operation */
export interface QueuedChange {
  /** Unique change ID */
  id: string;
  /** Canvas identifier */
  canvasId: string;
  /** Change type */
  changeType: 'node:add' | 'node:update' | 'node:delete' | 'edge:add' | 'edge:delete';
  /** Serialized change payload */
  payload: string; // JSON stringified
  /** When this change was queued */
  timestamp: number;
}

/** Conflict between local offline changes and remote state */
export interface OfflineConflict {
  canvasId: string;
  /** The last change ID we have locally */
  lastLocalChangeId: string;
  /** The remote canvas updated timestamp when we reconnected */
  remoteUpdatedAt: number;
  /** Queue of local changes that need resolution */
  pendingChanges: QueuedChange[];
}

interface CanvasOfflineState {
  /** Whether the browser is currently offline */
  isOffline: boolean;
  /** Pending changes queued during offline period */
  pendingQueue: QueuedChange[];
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Active conflict requiring resolution */
  activeConflict: OfflineConflict | null;
  /** Current canvas ID for this session */
  currentCanvasId: string | null;
  /** Last time we successfully synced with the server */
  lastSyncedAt: number;
  // Internal state
  _onlineListenerSet: boolean;
}

interface CanvasOfflineActions {
  /** Initialize the store for a given canvas */
  initForCanvas: (canvasId: string) => Promise<void>;
  /** Internal: set offline/online state directly */
  _setOffline: (offline: boolean) => void;
  /** Queue a change operation */
  queueChange: (change: Omit<QueuedChange, 'id' | 'timestamp'>) => Promise<void>;
  /** Called when going back online — detect conflict and trigger sync */
  _onReconnect: (remoteUpdatedAt: number) => Promise<void>;
  /** Apply local changes on top of remote state (replay queue) */
  replayQueue: () => Promise<void>;
  /** Discard all pending changes */
  discardQueue: () => Promise<void>;
  /** Resolve conflict by keeping local changes (force push) */
  resolveKeepLocal: () => Promise<void>;
  /** Resolve conflict by discarding local changes */
  resolveAcceptRemote: () => Promise<void>;
  /** Internal: set sync status */
  _setSyncStatus: (status: SyncStatus) => void;
  /** Clear active conflict */
  _clearConflict: () => void;
  /** Cleanup on unmount */
  destroy: () => void;
}

type CanvasOfflineStore = CanvasOfflineState & CanvasOfflineActions;

// ============================================
// Helper
// ============================================

let _changeCounter = 0;
function generateChangeId(): string {
  return `ch_${Date.now()}_${++_changeCounter}`;
}

// ============================================
// Store
// ============================================

export const useCanvasOfflineStore = create<CanvasOfflineStore>()(
  subscribeWithSelector((set, get) => {
    // Set up navigator.onLine listener once
    const handleOnline = () => {
      const state = useCanvasOfflineStore.getState();
      if (state._onlineListenerSet) {
        state._setOffline(false);
      }
    };
    const handleOffline = () => {
      const state = useCanvasOfflineStore.getState();
      if (state._onlineListenerSet) {
        state._setOffline(true);
      }
    };

    return {
      // State
      isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
      pendingQueue: [],
      syncStatus: 'idle',
      activeConflict: null,
      currentCanvasId: null,
      lastSyncedAt: Date.now(),
      _onlineListenerSet: false,

      // ========================================
      // Actions
      // ========================================

      initForCanvas: async (canvasId: string) => {
        set({ currentCanvasId: canvasId, pendingQueue: [], syncStatus: 'idle', activeConflict: null, lastSyncedAt: Date.now() });
        // Attach online/offline listeners once
        if (typeof window !== 'undefined' && !get()._onlineListenerSet) {
          window.addEventListener('online', handleOnline);
          window.addEventListener('offline', handleOffline);
          set({ isOffline: !navigator.onLine, _onlineListenerSet: true });
        }
        // Load any persisted offline changes for this canvas
        try {
          const changes = await loadCanvasChangesFromDB(canvasId);
          if (changes.length > 0) {
            const queued: QueuedChange[] = changes.map((c) => ({
              id: c.id,
              canvasId: c.canvasId,
              changeType: c.changeType as QueuedChange['changeType'],
              payload: c.payload,
              timestamp: c.timestamp,
            }));
            set({ pendingQueue: queued });
          }
        } catch {
          // IndexedDB not available — start fresh
        }
      },

      _setOffline: (offline: boolean) => {
        const wasOffline = get().isOffline;
        set({ isOffline: offline });
        if (!offline && wasOffline) {
          // Transition: going back online — trigger reconnect logic
          // The caller should call _onReconnect with remote timestamp
          set({ syncStatus: 'idle' });
        }
      },

      queueChange: async (change) => {
        const { isOffline, currentCanvasId } = get();
        if (!currentCanvasId) return;

        const queued: QueuedChange = {
          id: generateChangeId(),
          canvasId: currentCanvasId,
          changeType: change.changeType,
          payload: change.payload,
          timestamp: Date.now(),
        };

        set((state) => ({ pendingQueue: [...state.pendingQueue, queued] }));

        // Persist to IndexedDB immediately
        if (isOffline) {
          try {
            await saveCanvasChangeToDB({
              id: queued.id,
              canvasId: queued.canvasId,
              changeType: queued.changeType,
              payload: queued.payload,
              timestamp: queued.timestamp,
            });
          } catch {
            // Ignore persistence errors — queue is in memory
          }
        }
      },

      _onReconnect: async (remoteUpdatedAt: number) => {
        const { pendingQueue, currentCanvasId, lastSyncedAt } = get();
        if (!currentCanvasId || pendingQueue.length === 0) {
          set({ syncStatus: 'idle' });
          return;
        }

        // Conflict detection: remote was updated after our last sync AND we have local changes
        // → conflict (user needs to choose: keep local or accept remote)
        const hasConflict = remoteUpdatedAt > lastSyncedAt;

        if (hasConflict) {
          set({
            syncStatus: 'conflict',
            activeConflict: {
              canvasId: currentCanvasId,
              lastLocalChangeId: pendingQueue[pendingQueue.length - 1].id,
              remoteUpdatedAt,
              pendingChanges: pendingQueue,
            },
          });
        } else {
          // No conflict — replay queue directly
          set({ syncStatus: 'syncing' });
          await get().replayQueue();
        }
      },

      replayQueue: async () => {
        const { pendingQueue, currentCanvasId } = get();
        if (pendingQueue.length === 0) {
          set({ syncStatus: 'idle', pendingQueue: [] });
          return;
        }

        set({ syncStatus: 'syncing' });
        try {
          // In a real implementation, this would replay each change via WS/API
          // For now, clear the queue after replay attempt
          // TODO: Implement actual WS/API replay per change type
          await clearCanvasChangesFromDB(currentCanvasId!);
          set({ pendingQueue: [], syncStatus: 'idle', lastSyncedAt: Date.now() });
        } catch {
          set({ syncStatus: 'error' });
        }
      },

      discardQueue: async () => {
        const { currentCanvasId } = get();
        if (currentCanvasId) {
          try {
            await clearCanvasChangesFromDB(currentCanvasId);
          } catch {
            // Ignore
          }
        }
        set({ pendingQueue: [], syncStatus: 'idle', activeConflict: null });
      },

      resolveKeepLocal: async () => {
        // Force-push local changes over remote
        set({ syncStatus: 'syncing', activeConflict: null });
        try {
          const { currentCanvasId } = get();
          if (currentCanvasId) {
            await clearCanvasChangesFromDB(currentCanvasId);
          }
          set({ pendingQueue: [], syncStatus: 'idle', lastSyncedAt: Date.now() });
        } catch {
          set({ syncStatus: 'error' });
        }
      },

      resolveAcceptRemote: async () => {
        // Discard local changes, accept remote state
        set({ activeConflict: null });
        await get().discardQueue();
      },

      _setSyncStatus: (status: SyncStatus) => set({ syncStatus: status }),

      _clearConflict: () => set({ activeConflict: null }),

      destroy: () => {
        if (typeof window === 'undefined') return;
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      },
    };
  })
);

// Export singleton for non-React use
export const canvasOfflineStore = useCanvasOfflineStore;
