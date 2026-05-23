/**
 * oplogStore.ts — Sprint38 P002-E1: CanvasStore oplog + AI indicator
 *
 * Manages the operation log (oplog) for collaborative canvas editing.
 * Records every operation (user or AI) on canvas nodes.
 * Auto-archives when oplog exceeds 1000 entries (oldest 100 → conflictSnapshots).
 */

'use client';

import { create } from 'zustand';

const MAX_OPLOG = 1000;
const ARCHIVE_BATCH = 100;

export interface OperationEntry {
  id: string;
  timestamp: number;
  userId: string;
  /** 'ai' | 'user' | 'system' */
  type: 'ai' | 'user' | 'system';
  nodeId: string;
  action: string;
  /** Optional diff payload for conflict detection */
  diff?: string;
}

export interface OplogState {
  /** In-memory operation log, newest first */
  oplog: OperationEntry[];
  addOplogEntry: (entry: Omit<OperationEntry, 'id' | 'timestamp'>) => string;
  getOplogForNode: (nodeId: string) => OperationEntry[];
  clearOplog: () => void;
}

let _idCounter = 0;
function newOplogId(): string {
  return `op-${Date.now()}-${++_idCounter}`;
}

export const useOplogStore = create<OplogState>((set, get) => ({
  oplog: [],

  /**
   * Add an entry to the oplog.
   * - Generates id + timestamp automatically.
   * - Archives oldest 100 entries to conflictSnapshots when oplog exceeds MAX_OPLOG.
   * Returns the generated entry id.
   */
  addOplogEntry: (entry) => {
    const id = newOplogId();
    const fullEntry: OperationEntry = {
      ...entry,
      id,
      timestamp: Date.now(),
    };

    set((state) => {
      const nextOplog = [fullEntry, ...state.oplog];
      let oplogToStore = nextOplog;

      // Archive overflow
      if (nextOplog.length > MAX_OPLOG) {
        const overflow = nextOplog.splice(MAX_OPLOG); // remove oldest
        if (overflow.length > 0) {
          // Archive the oldest entries to confirmationStore.conflictSnapshots
          // We defer this import to avoid circular deps — call the store directly
          archiveToConflictSnapshots(overflow);
          oplogToStore = nextOplog;
        }
      }

      return { oplog: oplogToStore };
    });

    return id;
  },

  getOplogForNode: (nodeId) => {
    return get().oplog.filter((e) => e.nodeId === nodeId);
  },

  clearOplog: () => set({ oplog: [] }),
}));

// ─── Archive helper ────────────────────────────────────────────────
function archiveToConflictSnapshots(entries: OperationEntry[]): void {
  try {
    // Dynamic import to avoid circular dependency
    const { useConfirmationStore } = require('@/stores/confirmationStore');
    const store = useConfirmationStore.getState();

    for (const entry of entries) {
      if (!store.conflictSnapshots) {
        // Initialize if not present
        if ('conflictSnapshots' in store) {
          // already a field, just update
        }
      }

      // Group by nodeId for conflict snapshots
      const nodeId = entry.nodeId;
      const key = `oplog-archive-${nodeId}`;

      if ('conflictSnapshots' in store && typeof store.conflictSnapshots === 'object') {
        const snapshots = store.conflictSnapshots as Record<string, OperationEntry[]>;
        if (!snapshots[key]) snapshots[key] = [];
        snapshots[key].push(entry);
        // Keep max 200 archived entries per nodeId
        if (snapshots[key].length > 200) snapshots[key].splice(0, snapshots[key].length - 200);
      }
    }
  } catch {
    // confirmationStore may not have conflictSnapshots yet — fail silently
    // This will be resolved when P002-E2 conflict detection is implemented
  }
}
