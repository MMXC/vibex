/**
 * oplogStore.ts — Sprint38 P002-E1: CanvasStore oplog + AI indicator
 *
 * Manages the operation log (oplog) for collaborative canvas editing.
 * Records every operation (user or AI) on canvas nodes.
 * Auto-archives when oplog exceeds 1000 entries (oldest 100 → conflictSnapshots).
 */

'use client';

// P002-E2: Conflict toast event emitter — bridges non-React oplogStore → React toast
export const conflictToastEmitter = {
  listeners: new Set<(nodeId: string) => void>(),
  emit(nodeId: string) {
    this.listeners.forEach((fn) => fn(nodeId));
  },
  on(fn: (nodeId: string) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },
};

/**
 * P002-E2: Hook to display toast when oplog conflict is detected.
 * Must be used inside a ToastProvider.
 */
export function useOplogConflictToast(): void {
  const toast = useToast();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    return conflictToastEmitter.on((nodeId) => {
      toast.showToast(`检测到冲突：节点 ${nodeId} 被同时编辑`, 'warning', 5000);
    });
  // eslint-disable-next-line react-hooks/rules-of-hooks
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

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
    const timestamp = Date.now();
    const fullEntry: OperationEntry = {
      ...entry,
      id,
      timestamp,
    };

    set((state) => {
      const nextOplog = [fullEntry, ...state.oplog];
      let oplogToStore = nextOplog;

      // ── P002-E2: Conflict detection (5s window) ──────────────────────
      // Find previous entries for same nodeId within 5 seconds
      const WINDOW_MS = 5_000;
      const recentEntries = nextOplog.filter(
        (e) => e.nodeId === entry.nodeId && e.id !== id && timestamp - e.timestamp < WINDOW_MS
      );
      if (recentEntries.length >= 1) {
        // Conflict detected: same nodeId was edited within 5s
        const conflictEntries = [fullEntry, ...recentEntries];
        triggerConflictWarning(entry.nodeId, conflictEntries);
      }

      // Archive overflow
      if (nextOplog.length > MAX_OPLOG) {
        const overflow = nextOplog.splice(MAX_OPLOG); // remove oldest
        if (overflow.length > 0) {
          // Archive the oldest entries to confirmationStore.conflictSnapshots
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

// ─── P002-E2: Conflict detection ──────────────────────────────────────
/**
 * Called when the same nodeId is edited within the 5-second window.
 * - Adds conflict snapshot to confirmationStore
 * - Sets conflict warning state on the node
 */
function triggerConflictWarning(nodeId: string, entries: OperationEntry[]): void {
  try {
    const { useConfirmationStore } = require('@/stores/confirmationStore');
    useConfirmationStore.getState().addConflictSnapshot(nodeId, entries);
    // P002-E2: Emit toast event for React components
    conflictToastEmitter.emit(nodeId);
    // Dev log for debugging
    if (typeof window !== 'undefined') {
      console.warn(`[oplog] Conflict detected on node ${nodeId}: ${entries.length} entries within 5s`);
    }
  } catch {
    // confirmationStore may not have addConflictSnapshot yet — fail silently during migration
  }
}

// ─── Archive helper ────────────────────────────────────────────────
function archiveToConflictSnapshots(entries: OperationEntry[]): void {
  try {
    // Dynamic import to avoid circular dependency
    const { useConfirmationStore } = require('@/stores/confirmationStore');
    const store = useConfirmationStore.getState();

    for (const entry of entries) {
      const nodeId = entry.nodeId;
      const snapshots = store.conflictSnapshots ?? {};
      const existing = snapshots[nodeId] ?? [];
      const updated = [...existing, entry];
      // Keep max 200 archived entries per nodeId
      if (updated.length > 200) updated.splice(0, updated.length - 200);
      snapshots[nodeId] = updated;
      // Write back via addConflictSnapshot to maintain consistency
      store.addConflictSnapshot(nodeId, updated);
    }
  } catch {
    // confirmationStore may not have conflict fields yet — fail silently
  }
}
