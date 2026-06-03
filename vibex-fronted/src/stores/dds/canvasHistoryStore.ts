/**
 * canvasHistoryStore — Command Pattern undo/redo for DDS Canvas
 *
 * P001: Epic1-UndoRedo U1
 *
 * 设计决策：
 * - Command Pattern：每个操作记录 execute/rollback 闭包
 * - 50步限制：past 超长时 shift 淘汰最旧记录
 * - future 在 execute 时清空（撤销后做新操作会覆盖 redo 栈）
 * - isPerforming 标志防止嵌套执行
 *
 * E3 (Sprint52): Undo/Redo 协作冲突处理
 * - baseRevision 乐观锁：每次 execute 时 bump；远程 revision:bump 时 setBaseRevision
 * - saveHistoryWithRevision() 在 revision 不匹配时抛出 RevisionMismatchError
 * - onRevisionConflict 回调：冲突时触发 Toast 提示
 *
 * E1 (Sprint58): 画布版本分支管理
 * - snapshots[] 状态：保存画布命名版本快照
 * - saveSnapshot/loadSnapshot/listSnapshots/deleteSnapshot：快照 CRUD
 * - 快照存储在 IndexedDB snapshots 表（与 history 表分离）
 */

import { create } from 'zustand';

// ==================== Command Interface ====================

export interface Command {
  id: string;
  execute: () => void;
  rollback: () => void;
  timestamp: number;
  description?: string;
}

// ==================== CommandMeta (E1 — Sprint51) ====================

/** Serializable command metadata for IndexedDB persistence */
export interface CommandMeta {
  id: string;
  timestamp: number;
  description?: string;
}

// ==================== E3: Revision Conflict Types ====================

/** Error thrown when IndexedDB revision does not match expected revision (optimistic lock failure) */
export class RevisionMismatchError extends Error {
  readonly canvasId: string;
  readonly expectedRevision: number;
  readonly actualRevision: number;

  constructor(canvasId: string, expectedRevision: number, actualRevision: number, message?: string) {
    super(
      message ??
        `Revision mismatch on canvas "${canvasId}": expected ${expectedRevision}, got ${actualRevision}`
    );
    this.name = 'RevisionMismatchError';
    this.canvasId = canvasId;
    this.expectedRevision = expectedRevision;
    this.actualRevision = actualRevision;
  }
}

/** Conflict resolution strategy */
export type ConflictResolution = 'merge' | 'discard-local' | 'discard-remote';

/** Callback invoked when a remote revision bump conflicts with local state */
export type RevisionConflictHandler = (
  expected: number,
  actual: number
) => ConflictResolution;

// ==================== E1: Canvas Snapshot Types ====================

/** Serializable snapshot of a canvas at a point in time — used for version branching */
export interface SnapshotData {
  nodes: unknown[];
  edges: unknown[];
}

/** A named snapshot of the canvas state — stored in IndexedDB */
export interface Snapshot {
  id: string;
  name: string;
  timestamp: number;
  data: SnapshotData;
}

/** Serializable snapshot metadata (for IndexedDB storage) */
export interface SnapshotMeta {
  id: string;
  name: string;
  timestamp: number;
  /** Size estimate in bytes */
  _size?: number;
}

// ==================== Constants ====================

export const MAX_HISTORY = 50;

// ==================== State Interface ====================

interface CanvasHistoryState {
  past: Command[];
  future: Command[];
  isPerforming: boolean;
  // E3: Revision tracking for collaborative conflict detection
  /** Current revision number — incremented on each execute(); set by remote revision:bump */
  baseRevision: number;
  /** Callback invoked when a remote revision bump conflicts with local pending changes */
  onRevisionConflict: RevisionConflictHandler | null;
  // E1: Canvas snapshots
  /** All saved snapshots for the current canvas (sorted by timestamp desc) */
  snapshots: Snapshot[];
  /** ID of the snapshot currently being restored (for UI loading state) */
  restoringSnapshotId: string | null;

  /** Push a new command, execute it, and push to history */
  execute: (cmd: Command) => void;
  /** Undo last command */
  undo: () => void;
  /** Redo next command */
  redo: () => void;
  /** Clear all history */
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  /** Undo all commands back to (and including) targetIndex in past */
  selectiveUndo: (targetIndex: number) => void;
  /** Returns current position in history stack */
  getPosition: () => { current: number; total: number };
  // E1: IndexedDB persistence actions
  /** Save current history to IndexedDB for a given canvas */
  saveHistory: (canvasId: string) => Promise<void>;
  /** Load history metadata from IndexedDB (closures not restored) */
  loadHistory: (canvasId: string) => Promise<{ past: CommandMeta[]; future: CommandMeta[] } | null>;
  /** Clear history from IndexedDB for a given canvas */
  clearHistory: (canvasId: string) => Promise<void>;
  // E3: Revision-based conflict handling
  /** Set the base revision (called when remote revision:bump arrives) */
  setBaseRevision: (revision: number) => void;
  /** Bump revision and save with optimistic locking; throws RevisionMismatchError on conflict */
  saveHistoryWithRevision: (canvasId: string) => Promise<void>;
  /** Load history from IndexedDB and return revision metadata */
  loadHistoryWithRevision: (canvasId: string) => Promise<{
    past: CommandMeta[];
    future: CommandMeta[];
    revision: number;
  } | null>;
  /** Register a conflict handler called when remote revision bumps conflict with local state */
  setRevisionConflictHandler: (handler: RevisionConflictHandler | null) => void;
  /** Trigger a conflict toast using the UI Toast system */
  triggerConflictToast: (canvasId: string, remoteRevision: number, localRevision: number) => void;
  // E1: Snapshot actions
  /** Save a named snapshot of the current canvas state to IndexedDB */
  saveSnapshot: (canvasId: string, name: string, data: SnapshotData) => Promise<void>;
  /** Load a snapshot from IndexedDB and return its data */
  loadSnapshot: (canvasId: string, snapshotId: string) => Promise<SnapshotData | null>;
  /** Return all snapshots for a canvas, sorted by timestamp descending */
  listSnapshots: (canvasId: string) => Promise<Snapshot[]>;
  /** Delete a snapshot by ID */
  deleteSnapshot: (canvasId: string, snapshotId: string) => Promise<void>;
  /** Set the current restoring snapshot ID (for UI loading state) */
  setRestoringSnapshotId: (id: string | null) => void;
}

// ==================== Helper ====================

/** Pop the last element from an array, returning it (or undefined if empty). */
function popLast<T>(arr: T[]): { item: T | undefined; rest: T[] } {
  if (arr.length === 0) return { item: undefined, rest: arr };
  const rest = arr.slice(0, -1);
  const item = arr[arr.length - 1];
  return { item, rest };
}

// ==================== Store ====================

export const useCanvasHistoryStore = create<CanvasHistoryState>((set, get) => ({
  past: [],
  future: [],
  isPerforming: false,
  // E3: revision tracking
  baseRevision: 0,
  onRevisionConflict: null,
  // E1: snapshots
  snapshots: [],
  restoringSnapshotId: null,

  execute: (cmd: Command) => {
    if (get().isPerforming) return;
    set({ isPerforming: true });
    try {
      cmd.execute();
      set((state) => {
        const past = [...state.past, cmd];
        if (past.length > MAX_HISTORY) {
          past.shift();
        }
        // E3: bump revision on each local command execution
        return { past, future: [], baseRevision: state.baseRevision + 1 };
      });
    } finally {
      set({ isPerforming: false });
    }
  },

  undo: () => {
    const { past, isPerforming } = get();
    if (past.length === 0 || isPerforming) return;
    set({ isPerforming: true });
    try {
      const { item: cmd, rest } = popLast(past);
      if (!cmd) { set({ isPerforming: false }); return; }
      cmd.rollback();
      set({ past: rest, future: [cmd, ...get().future] });
    } finally {
      set({ isPerforming: false });
    }
  },

  redo: () => {
    const { future, isPerforming } = get();
    if (future.length === 0 || isPerforming) return;
    set({ isPerforming: true });
    try {
      const { item: cmd, rest } = popLast([...future].reverse());
      if (!cmd) { set({ isPerforming: false }); return; }
      cmd.execute();
      set((state) => ({
        past: [...state.past, cmd],
        future: rest.reverse(),
      }));
    } finally {
      set({ isPerforming: false });
    }
  },

  clear: () => set({ past: [], future: [] }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  /** Undo all commands from (targetIndex+1) to end of past stack */
  selectiveUndo: (targetIndex: number) => {
    const { past, future, isPerforming } = get();
    if (isPerforming || targetIndex < 0) return;
    set({ isPerforming: true });
    try {
      if (targetIndex < past.length - 1) {
        // targetIndex is within the past — roll back newer commands
        const toUndo = past.slice(targetIndex + 1);
        for (let i = toUndo.length - 1; i >= 0; i--) {
          toUndo[i].rollback();
        }
        set((state) => ({
          past: state.past.slice(0, targetIndex + 1),
          future: [...toUndo, ...state.future],
        }));
      } else {
        // targetIndex >= past.length - 1 (at or past current state)
        // Calculate how many future commands to re-apply
        const steps = targetIndex - (past.length - 1);
        for (let i = 0; i < steps; i++) {
          get().redo();
        }
      }
    } finally {
      set({ isPerforming: false });
    }
  },

  /** Returns { current: position in past (0-indexed), total: past.length } */
  getPosition: () => {
    const { past } = get();
    return { current: past.length, total: past.length };
  },

  // E1: IndexedDB persistence actions (Sprint51)
  saveHistory: async (canvasId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    const { past, future } = get();
    const { saveHistoryToDB } = await import('@/lib/canvas/historyDB');
    await saveHistoryToDB(canvasId, past, future);
  },

  loadHistory: async (canvasId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return null;
    const { loadHistoryFromDB } = await import('@/lib/canvas/historyDB');
    return loadHistoryFromDB(canvasId);
  },

  clearHistory: async (canvasId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    const { clearHistoryFromDB } = await import('@/lib/canvas/historyDB');
    await clearHistoryFromDB(canvasId);
  },

  // E3: Revision-based conflict handling
  setBaseRevision: (revision: number) => {
    const { baseRevision, past, onRevisionConflict } = get();
    // If local has unsaved changes (past is non-empty), this is a conflict
    if (revision > baseRevision && past.length > 0 && onRevisionConflict) {
      const resolution = onRevisionConflict(baseRevision, revision);
      if (resolution === 'discard-local') {
        // Remote wins — clear local history and accept remote revision
        set({ baseRevision: revision, past: [], future: [] });
        return;
      }
      // 'merge' or 'discard-remote': keep local, set revision but don't clear
    }
    set({ baseRevision: revision });
  },

  saveHistoryWithRevision: async (canvasId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    const { past, future, baseRevision } = get();
    const { saveHistoryWithRevision: dbSaveWithRevision } = await import(
      '@/lib/canvas/historyDB'
    );
    await dbSaveWithRevision(canvasId, past, future, baseRevision);
  },

  loadHistoryWithRevision: async (canvasId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return null;
    const { loadHistoryWithRevision: dbLoadWithRevision } = await import(
      '@/lib/canvas/historyDB'
    );
    return dbLoadWithRevision(canvasId);
  },

  setRevisionConflictHandler: (handler) => {
    set({ onRevisionConflict: handler });
  },

  triggerConflictToast: async (canvasId: string, remoteRevision: number, localRevision: number) => {
    try {
      const { showToast } = await import('@/components/ui/Toast');
      showToast(
        `协作冲突：画布 ${canvasId} 在本地 revision ${localRevision} vs 远程 revision ${remoteRevision}，请刷新页面`,
        'warning',
        8000
      );
    } catch {
      // Toast not available (e.g., outside React tree)
      console.warn(
        `[canvasHistoryStore] Conflict on canvas ${canvasId}: local=${localRevision}, remote=${remoteRevision}`
      );
    }
  },

  // ==================== E1: Canvas Snapshot Actions ====================

  saveSnapshot: async (canvasId: string, name: string, data: { nodes: unknown[]; edges: unknown[] }) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    const { saveSnapshotToDB } = await import('@/lib/canvas/historyDB');
    const id = `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const snapshot = { id, name, timestamp: Date.now(), data };
    await saveSnapshotToDB(canvasId, snapshot);
    // Refresh the snapshots list
    const list = await get().listSnapshots(canvasId);
    set({ snapshots: list });
  },

  loadSnapshot: async (canvasId: string, snapshotId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return null;
    const { loadSnapshotFromDB } = await import('@/lib/canvas/historyDB');
    const snapshot = await loadSnapshotFromDB(canvasId, snapshotId);
    return snapshot ? snapshot.data : null;
  },

  listSnapshots: async (canvasId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return [];
    const { listSnapshotsFromDB } = await import('@/lib/canvas/historyDB');
    const list = await listSnapshotsFromDB(canvasId);
    return list.sort((a, b) => b.timestamp - a.timestamp);
  },

  deleteSnapshot: async (canvasId: string, snapshotId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    const { deleteSnapshotFromDB } = await import('@/lib/canvas/historyDB');
    await deleteSnapshotFromDB(canvasId, snapshotId);
    set((state) => ({
      snapshots: state.snapshots.filter((s) => s.id !== snapshotId),
    }));
  },

  setRestoringSnapshotId: (id: string | null) => {
    set({ restoringSnapshotId: id });
  },
}));


/**
 * Save current history state to localStorage.
 * Note: Command execute/rollback closures are NOT serialized.
 * Only metadata is persisted. On restore, history starts empty (fresh commands needed).
 *
 * Key format: vibex-dds-history-{canvasId}
 */
export function saveHistoryToStorage(canvasId: string): void {
  try {
    const state = useCanvasHistoryStore.getState();
    const payload = {
      past: state.past.map((cmd) => ({
        id: cmd.id,
        timestamp: cmd.timestamp,
        description: cmd.description,
      })),
      future: state.future.map((cmd) => ({
        id: cmd.id,
        timestamp: cmd.timestamp,
        description: cmd.description,
      })),
      revision: state.baseRevision,
    };
    localStorage.setItem(`vibex-dds-history-${canvasId}`, JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable (e.g., private browsing, quota exceeded)
  }
}

/**
 * Restore history metadata from localStorage.
 * Returns null if no history saved or parse fails.
 * Note: The actual Command objects cannot be restored (closures lost in serialization).
 * Callers should initialize empty history and require fresh commands.
 */
export function loadHistoryFromStorage(canvasId: string): {
  pastMeta: Array<{ id: string; timestamp: number; description?: string }>;
  futureMeta: Array<{ id: string; timestamp: number; description?: string }>;
  revision?: number;
} | null {
  try {
    const raw = localStorage.getItem(`vibex-dds-history-${canvasId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      pastMeta: Array.isArray(parsed.past) ? parsed.past : [],
      futureMeta: Array.isArray(parsed.future) ? parsed.future : [],
      revision: typeof parsed.revision === 'number' ? parsed.revision : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Clear history from localStorage for a given canvasId.
 */
export function clearHistoryFromStorage(canvasId: string): void {
  try {
    localStorage.removeItem(`vibex-dds-history-${canvasId}`);
  } catch {
    // ignore
  }
}

export type { CanvasHistoryState };
