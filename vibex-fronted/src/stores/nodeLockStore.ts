/**
 * nodeLockStore — Zustand store wrapping the Node Edit Locking API
 * S95-E3: Node Edit Locking — frontend store
 *
 * Manages node-level edit locks via the REST API:
 * - acquireLock(canvasId, nodeId) — POST /api/canvas/[id]/nodes/[nodeId]/lock
 * - releaseLock(canvasId, nodeId) — DELETE /api/canvas/[id]/nodes/[nodeId]/lock
 * - getLock(nodeId) — reads from local state
 *
 * State tracks all known locks (both acquired by current user and held by others)
 * so that CollaboratorEditorBadge can display who holds a lock.
 */

import { create } from 'zustand';
import { generateId } from '@/lib/canvas/id';

/** Lock entry stored in the Map */
export interface LockEntry {
  /** User ID who holds the lock */
  locked_by: string;
  /** Display name of the lock holder */
  user_name: string;
  /** Avatar URL or null */
  avatar: string | null;
  /** Unix timestamp (ms) when the lock expires */
  expires_at: number;
}

/** Result of an acquireLock call */
export interface AcquireLockResult {
  acquired: boolean;
  lock?: LockEntry;
}

/** Auto-cleanup timer handle per nodeId */
type TimerHandle = ReturnType<typeof setTimeout>;

interface NodeLockState {
  /** nodeId → LockEntry */
  lockedNodes: Map<string, LockEntry>;

  /** Internal: per-node auto-cleanup timer handles */
  _cleanupTimers: Map<string, TimerHandle>;

  /**
   * Acquire a lock on a node.
   * POST /api/canvas/{canvasId}/nodes/{nodeId}/lock
   *
   * On success (acquired=true), the lock is recorded in state.
   * On failure (acquired=false), the lock info of the holder is still recorded
   * so CollaboratorEditorBadge can show who has it.
   */
  acquireLock: (canvasId: string, nodeId: string) => Promise<AcquireLockResult>;

  /**
   * Release a lock on a node.
   * DELETE /api/canvas/{canvasId}/nodes/{nodeId}/lock
   */
  releaseLock: (canvasId: string, nodeId: string) => Promise<void>;

  /**
   * Get lock info for a node from local state.
   * Returns undefined if the node is not locked or the lock has expired.
   */
  getLock: (nodeId: string) => LockEntry | undefined;
}

export const useNodeLockStore = create<NodeLockState>((set, get) => {
  function clearLockTimer(nodeId: string) {
    const timers = get()._cleanupTimers;
    const existing = timers.get(nodeId);
    if (existing !== undefined) {
      clearTimeout(existing);
      timers.delete(nodeId);
    }
  }

  function scheduleAutoCleanup(nodeId: string, expiresAt: number) {
    clearLockTimer(nodeId);
    const delay = expiresAt - Date.now();
    if (delay <= 0) {
      // Already expired — clean up immediately
      set((state) => {
        const next = new Map(state.lockedNodes);
        next.delete(nodeId);
        const nextTimers = new Map(state._cleanupTimers);
        nextTimers.delete(nodeId);
        return { lockedNodes: next, _cleanupTimers: nextTimers };
      });
      return;
    }
    const handle = setTimeout(() => {
      set((state) => {
        const next = new Map(state.lockedNodes);
        next.delete(nodeId);
        const nextTimers = new Map(state._cleanupTimers);
        nextTimers.delete(nodeId);
        return { lockedNodes: next, _cleanupTimers: nextTimers };
      });
    }, delay);
    const timers = get()._cleanupTimers;
    timers.set(nodeId, handle);
  }

  return {
    lockedNodes: new Map(),
    _cleanupTimers: new Map(),

    acquireLock: async (canvasId: string, nodeId: string): Promise<AcquireLockResult> => {
      try {
        const res = await fetch(`/api/canvas/${canvasId}/nodes/${nodeId}/lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: generateId() }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        if (data.acquired) {
          const entry: LockEntry = {
            locked_by: data.locked_by,
            user_name: data.user_name,
            avatar: data.avatar ?? null,
            expires_at: data.expires_at,
          };
          set((state) => {
            const next = new Map(state.lockedNodes);
            next.set(nodeId, entry);
            return { lockedNodes: next };
          });
          scheduleAutoCleanup(nodeId, data.expires_at);
          return { acquired: true, lock: entry };
        } else {
          // Another user holds the lock — still record it so the badge can show
          const entry: LockEntry = {
            locked_by: data.locked_by,
            user_name: data.user_name,
            avatar: data.avatar ?? null,
            expires_at: data.expires_at,
          };
          set((state) => {
            const next = new Map(state.lockedNodes);
            next.set(nodeId, entry);
            return { lockedNodes: next };
          });
          scheduleAutoCleanup(nodeId, data.expires_at);
          return { acquired: false, lock: entry };
        }
      } catch (err) {
        // Network / parse errors — surface to caller, do NOT update state
        throw err;
      }
    },

    releaseLock: async (canvasId: string, nodeId: string): Promise<void> => {
      clearLockTimer(nodeId);

      // Optimistically remove from state
      set((state) => {
        const next = new Map(state.lockedNodes);
        next.delete(nodeId);
        const nextTimers = new Map(state._cleanupTimers);
        nextTimers.delete(nodeId);
        return { lockedNodes: next, _cleanupTimers: nextTimers };
      });

      try {
        const res = await fetch(`/api/canvas/${canvasId}/nodes/${nodeId}/lock`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          // Log but don't throw — the optimistic removal has already happened.
          // Re-acquiring the lock is the user's responsibility.
          console.warn('[nodeLockStore] releaseLock: unexpected response', res.status);
        }
      } catch {
        // Network error — state already optimistically cleared
        console.warn('[nodeLockStore] releaseLock: network error');
      }
    },

    getLock: (nodeId: string): LockEntry | undefined => {
      const entry = get().lockedNodes.get(nodeId);
      if (!entry) return undefined;
      // Check expiration
      if (entry.expires_at < Date.now()) {
        // Clean up expired entry synchronously
        set((state) => {
          const next = new Map(state.lockedNodes);
          next.delete(nodeId);
          const nextTimers = new Map(state._cleanupTimers);
          nextTimers.delete(nodeId);
          return { lockedNodes: next, _cleanupTimers: nextTimers };
        });
        return undefined;
      }
      return entry;
    },
  };
});
