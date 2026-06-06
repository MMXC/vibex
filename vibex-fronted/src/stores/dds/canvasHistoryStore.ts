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
 *
 * E1 (Sprint60): 画布版本历史 UI 增强
 * - Snapshot 新增 branchName / isStarred 字段
 * - compareSnapshots(snapA, snapB)：返回 added/removed/modified 节点差异
 * - updateSnapshotMetadata()：更新星标/分支名
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

/** A named snapshot of the canvas state — stored in IndexedDB
 * E1 (Sprint60): extended with branchName / isStarred
 * E1 (Sprint65): extended with parentSnapshotId for branch lineage */
export interface Snapshot {
  id: string;
  name: string;
  timestamp: number;
  data: SnapshotData;
  /** Branch name for version branching (default: 'main') */
  branchName?: string;
  /** Whether this snapshot is starred by the user */
  isStarred?: boolean;
  /** Parent snapshot ID for branch lineage (null = root/main snapshot) */
  parentSnapshotId?: string | null;
}

/** Diff result between two snapshots */
interface SnapshotDiff {
  added: Array<{ id: string; label?: string }>;
  removed: Array<{ id: string; label?: string }>;
  modified: Array<{ id: string; label?: string; changes?: Record<string, { before: unknown; after: unknown }> }>;
}

/** E1 (Sprint67): Result of comparing two branches — enriched diff with branch metadata */
export interface BranchDiffResult {
  branchA: string;
  branchB: string;
  snapA?: Snapshot;
  snapB?: Snapshot;
  diffs: SnapshotDiff;
  error?: string;
  summary: {
    totalChanges: number;
    contextsAdded: number;
    contextsRemoved: number;
    contextsModified: number;
    edgesAdded: number;
    edgesRemoved: number;
    edgesModified: number;
  };
}

export interface SnapshotListFilters {
  branch?: string;
  starred?: boolean;
}

// ==================== E1 (Sprint70): Branch Merge Conflict Types ====================

/** A conflict record when merging two branches — nodes that exist on both branches with different content */
export interface BranchConflict {
  /** Unique identifier for this conflict */
  id: string;
  /** Node ID that has conflicting content in both branches */
  nodeId: string;
  /** Node label for display purposes */
  nodeLabel?: string;
  /** The source branch name (changes we're merging in) */
  localBranch: string;
  /** The target branch name (current branch) */
  remoteBranch: string;
  /** Content of the node in the local branch */
  localData: Record<string, unknown> | null;
  /** Content of the node in the remote branch */
  remoteData: Record<string, unknown> | null;
  /** When this conflict was detected */
  detectedAt: number;
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

/** E2 (Sprint64): Maximum number of snapshots per canvas */
export const MAX_SNAPSHOTS = 50;

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
  // E1 (Sprint70): Branch merge conflicts
  /** Pending conflicts detected during branch merge */
  pendingConflicts: BranchConflict[];
  /** Current active branch name */
  currentBranch: string;

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
  listSnapshots: (canvasId: string, filters?: SnapshotListFilters) => Promise<Snapshot[]>;
  /** Delete a snapshot by ID */
  deleteSnapshot: (canvasId: string, snapshotId: string) => Promise<void>;
  /** Set the current restoring snapshot ID (for UI loading state) */
  setRestoringSnapshotId: (id: string | null) => void;
  // E1 (Sprint60): Snapshot UI enhancement
  /** Compare two snapshots and return added/removed/modified nodes */
  compareSnapshots: (snapA: Snapshot, snapB: Snapshot) => SnapshotDiff;
  /** Update snapshot metadata (branchName, isStarred, name) in IndexedDB */
  updateSnapshotMetadata: (
    canvasId: string,
    snapshotId: string,
    meta: { name?: string; branchName?: string; isStarred?: boolean }
  ) => Promise<void>;
  /** Set the current canvas ID for local snapshot queries */
  setCurrentCanvasId: (canvasId: string | null) => void;
  // E2 (Sprint64): Restore snapshot — applies snapshot data to DDSCanvasStore
  /** Restore a snapshot by loading its data from IndexedDB and applying to DDSCanvasStore */
  restoreSnapshot: (canvasId: string, snapshotId: string) => Promise<void>;
  // E1 (Sprint64): Auto-snapshot timer
  /** Current auto-snapshot interval in ms (null = disabled) */
  autoSnapshotMs: number | null;
  /** Start auto-snapshot: periodically saves canvas state every intervalMs milliseconds */
  startAutoSnapshot: (canvasId: string, getCanvasData: () => { nodes: unknown[]; edges: unknown[] }, intervalMs: number) => void;
  /** Stop auto-snapshot timer */
  stopAutoSnapshot: () => void;
  // E1 (Sprint65): Named snapshot with auto-name generation
  /** Save a named snapshot; if name is omitted, auto-generates "Snapshot-{ISO timestamp}" */
  saveNamedSnapshot: (canvasId: string, name?: string, data?: { nodes: unknown[]; edges: unknown[] }) => Promise<string>;
  /** Create a branch snapshot based on a source snapshot; sets parentSnapshotId */
  createBranch: (canvasId: string, sourceSnapshotId: string, branchName: string, currentData?: { nodes: unknown[]; edges: unknown[] }) => Promise<string>;
  // E1 (Sprint66): Branch operations
  /** Rename all snapshots in a branch */
  renameBranch: (canvasId: string, oldName: string, newName: string) => Promise<void>;
  /** Delete all snapshots in a branch (recursive) */
  deleteBranch: (canvasId: string, branchName: string) => Promise<void>;
  /** Merge source branch into target branch; reparent snapshots to target's latest snapshot tip */
  mergeBranch: (canvasId: string, sourceBranch: string, targetBranch: string) => Promise<void>;
  /** List all unique branch names for a canvas */
  listBranches: (canvasId: string) => Promise<string[]>;
  // E1 (Sprint70): Branch merge conflict resolution
  /** Set the current active branch name */
  setCurrentBranch: (branchName: string) => void;
  /** Resolve a single branch merge conflict — applies resolution and removes from pending */
  resolveBranchConflict: (
    canvasId: string,
    nodeId: string,
    resolution: 'keep-local' | 'keep-remote' | 'merge'
  ) => Promise<void>;
  /** Clear all pending conflicts (on cancel or full resolution) */
  clearPendingConflicts: () => void;
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
  // E1 (Sprint70): Branch merge conflicts
  pendingConflicts: [],
  currentBranch: 'main',

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
    // E2 (Sprint64): LRU eviction — delete oldest when over MAX_SNAPSHOTS
    const list = await get().listSnapshots(canvasId);
    if (list.length > MAX_SNAPSHOTS) {
      const { deleteSnapshotFromDB } = await import('@/lib/canvas/historyDB');
      const toDelete = list.slice(MAX_SNAPSHOTS); // oldest are at end (sorted desc)
      await Promise.all(toDelete.map((s) => deleteSnapshotFromDB(canvasId, s.id)));
    }
    // Refresh the snapshots list
    set({ snapshots: list.slice(0, MAX_SNAPSHOTS) });
  },

  loadSnapshot: async (canvasId: string, snapshotId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return null;
    const { loadSnapshotFromDB } = await import('@/lib/canvas/historyDB');
    const snapshot = await loadSnapshotFromDB(canvasId, snapshotId);
    return snapshot ? snapshot.data : null;
  },

  listSnapshots: async (canvasId: string, filters?: SnapshotListFilters) => {
    if (typeof window === 'undefined' || !window.indexedDB) return [];
    const { listSnapshotsFromDB } = await import('@/lib/canvas/historyDB');
    const dbFilters: DBSnapshotListFilters | undefined = filters
      ? { branch: filters.branch, starred: filters.starred }
      : undefined;
    const list = await listSnapshotsFromDB(canvasId, dbFilters);
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

  // ==================== E1 (Sprint60): Snapshot UI Enhancement ====================

  /** Compare two snapshots and return added/removed/modified node IDs */
  compareSnapshots: (snapA: Snapshot, snapB: Snapshot): SnapshotDiff => {
    const nodesA = (snapA.data.nodes ?? []) as Array<{ id: string; label?: string; [key: string]: unknown }>;
    const nodesB = (snapB.data.nodes ?? []) as Array<{ id: string; label?: string; [key: string]: unknown }>;

    const idsA = new Set(nodesA.map((n) => String(n.id)));
    const idsB = new Set(nodesB.map((n) => String(n.id)));
    const allIds = new Set([...idsA, ...idsB]);

    const mapA = new Map(nodesA.map((n) => [String(n.id), n]));
    const mapB = new Map(nodesB.map((n) => [String(n.id), n]));

    const added: SnapshotDiff['added'] = [];
    const removed: SnapshotDiff['removed'] = [];
    const modified: SnapshotDiff['modified'] = [];

    for (const id of allIds) {
      const inA = idsA.has(id);
      const inB = idsB.has(id);

      if (!inA && inB) {
        added.push({ id, label: (mapB.get(id) as { label?: string })?.label, type: 'added' });
      } else if (inA && !inB) {
        removed.push({ id, label: (mapA.get(id) as { label?: string })?.label, type: 'removed' });
      } else if (inA && inB) {
        // Deep comparison of node properties (excluding id)
        const a = mapA.get(id)!;
        const b = mapB.get(id)!;
        const changes: Record<string, { before: unknown; after: unknown }> = {};
        let isModified = false;

        const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
        for (const key of allKeys) {
          if (key === 'id') continue;
          const before = a[key];
          const after = b[key];
          if (JSON.stringify(before) !== JSON.stringify(after)) {
            changes[key] = { before, after };
            isModified = true;
          }
        }

        if (isModified) {
          modified.push({ id, label: a.label, changes, type: 'modified' });
        }
      }
    }

    return { added, removed, modified };
  },

  /** Update snapshot metadata (branchName, isStarred, name) in IndexedDB */
  updateSnapshotMetadata: async (
    snapshotId: string,
    meta: { name?: string; branchName?: string; isStarred?: boolean },
    canvasId?: string
  ) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    const { updateSnapshotMetadataInDB } = await import('@/lib/canvas/historyDB');
    await updateSnapshotMetadataInDB(snapshotId, meta, canvasId);
    // Refresh local snapshots list (canvasId stored in snapshots store, not in Snapshot)
    const list = await get().listSnapshots(canvasId ?? '');
    set({ snapshots: list });
  },

  setCurrentCanvasId: (_canvasId: string | null) => {
    // Reserved for future use — currently snapshots are queried per canvasId in listSnapshots
    // This state can be used by UI components to track the active canvas
  },

  // ==================== E2 (Sprint64): Restore Snapshot ====================
  autoSnapshotMs: null,

  restoreSnapshot: async (canvasId: string, snapshotId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;

    const { loadSnapshotFromDB } = await import('@/lib/canvas/historyDB');
    const snapshot = await loadSnapshotFromDB(canvasId, snapshotId);
    if (!snapshot) {
      console.warn(`[canvasHistoryStore] restoreSnapshot: snapshot ${snapshotId} not found`);
      return;
    }

    set({ restoringSnapshotId: snapshotId });

    try {
      // Apply snapshot data to DDSCanvasStore
      // E2: Map snapshot nodes → DDSCanvasStore requirement chapter cards
      // E2: Map snapshot edges → DDSCanvasStore requirement chapter edges
      const { useDDSCanvasStore } = await import('@/stores/dds/DDSCanvasStore');
      const { ChapterType, ChapterData } = await import('@/types/dds');

      const chapters: Record<ChapterType, ChapterData> = {
        requirement: { type: 'requirement', cards: snapshot.data.nodes as never[], edges: snapshot.data.edges as never[], loading: false, error: null },
        context: { type: 'context', cards: [], edges: [], loading: false, error: null },
        flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        api: { type: 'api', cards: [], edges: [], loading: false, error: null },
        'business-rules': { type: 'business-rules', cards: [], edges: [], loading: false, error: null },
      };

      useDDSCanvasStore.setState({ chapters });
    } finally {
      set({ restoringSnapshotId: null });
    }
  },

  // ==================== E2 (Sprint64): Auto-Snapshot ====================
  startAutoSnapshot: (canvasId: string, getCanvasData: () => { nodes: unknown[]; edges: unknown[] }, intervalMs: number) => {
    // Stop any existing timer first
    const existing = (window as unknown as { __canvasAutoSnapshotTimer?: ReturnType<typeof setInterval> }).__canvasAutoSnapshotTimer;
    if (existing) clearInterval(existing);

    const timer = setInterval(async () => {
      const data = getCanvasData();
      const store = useCanvasHistoryStore.getState();
      await store.saveSnapshot(canvasId, `Auto-save ${new Date().toLocaleString()}`, data);
    }, intervalMs);

    (window as unknown as { __canvasAutoSnapshotTimer?: ReturnType<typeof setInterval> }).__canvasAutoSnapshotTimer = timer;
    set({ autoSnapshotMs: intervalMs });
  },

  // ==================== E1 (Sprint65): Named Snapshot & Branch Management ====================

  /** Save a named snapshot; name defaults to "Snapshot-{ISO timestamp}" */
  saveNamedSnapshot: async (canvasId: string, name?: string, data?: { nodes: unknown[]; edges: unknown[] }) => {
    if (typeof window === 'undefined' || !window.indexedDB) return '';
    const { saveSnapshotToDB, listSnapshotsFromDB } = await import('@/lib/canvas/historyDB');
    const id = `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const finalName = name ?? `Snapshot-${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;
    const snapshot = { id, name: finalName, timestamp: Date.now(), data: data ?? { nodes: [], edges: [] } };
    await saveSnapshotToDB(canvasId, snapshot);
    // Branch-aware LRU: per-branch MAX_SNAPSHOTS
    const allSnapshots = await listSnapshotsFromDB(canvasId);
    const byBranch = new Map<string, typeof allSnapshots>();
    for (const s of allSnapshots) {
      const branch = s.branchName ?? 'main';
      if (!byBranch.has(branch)) byBranch.set(branch, []);
      byBranch.get(branch)!.push(s);
    }
    const { deleteSnapshotFromDB } = await import('@/lib/canvas/historyDB');
    for (const [, branchSnaps] of byBranch) {
      const sorted = branchSnaps.sort((a, b) => b.timestamp - a.timestamp);
      if (sorted.length > MAX_SNAPSHOTS) {
        const toDelete = sorted.slice(MAX_SNAPSHOTS);
        await Promise.all(toDelete.map((s) => deleteSnapshotFromDB(canvasId, s.id)));
      }
    }
    return id;
  },

  /** Create a branch snapshot with parentSnapshotId linking back to source */
  createBranch: async (canvasId: string, sourceSnapshotId: string, branchName: string, currentData?: { nodes: unknown[]; edges: unknown[] }) => {
    if (typeof window === 'undefined' || !window.indexedDB) return '';
    const { saveSnapshotToDB, loadSnapshotFromDB, listSnapshotsFromDB, deleteSnapshotFromDB } = await import('@/lib/canvas/historyDB');
    const sourceSnap = await loadSnapshotFromDB(canvasId, sourceSnapshotId);
    const id = `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newSnap = {
      id,
      name: `${branchName} (from ${sourceSnap?.name ?? sourceSnapshotId})`,
      timestamp: Date.now(),
      data: currentData ?? sourceSnap?.data ?? { nodes: [], edges: [] },
      branchName,
      parentSnapshotId: sourceSnapshotId,
    };
    await saveSnapshotToDB(canvasId, newSnap);
    // Branch-aware LRU for the new branch
    const allSnaps = await listSnapshotsFromDB(canvasId);
    const branchSnaps = allSnaps.filter((s) => (s.branchName ?? 'main') === branchName).sort((a, b) => b.timestamp - a.timestamp);
    if (branchSnaps.length > MAX_SNAPSHOTS) {
      const toDelete = branchSnaps.slice(MAX_SNAPSHOTS);
      await Promise.all(toDelete.map((s) => deleteSnapshotFromDB(canvasId, s.id)));
    }
    return id;
  },

  // ==================== E1 (Sprint66): Branch Operations ====================

  renameBranch: async (canvasId: string, oldName: string, newName: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    if (oldName === newName) return;
    const { renameBranchInDB, listSnapshotsFromDB } = await import('@/lib/canvas/historyDB');
    await renameBranchInDB(canvasId, oldName, newName);
    // Refresh local snapshots list
    const list = await listSnapshotsFromDB(canvasId);
    set({ snapshots: list.sort((a, b) => b.timestamp - a.timestamp) });
  },

  deleteBranch: async (canvasId: string, branchName: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    if (branchName === 'main') {
      console.warn('[canvasHistoryStore] deleteBranch: cannot delete main branch');
      return;
    }
    const { deleteBranchFromDB, listSnapshotsFromDB } = await import('@/lib/canvas/historyDB');
    await deleteBranchFromDB(canvasId, branchName);
    // Refresh local snapshots list
    const list = await listSnapshotsFromDB(canvasId);
    set({ snapshots: list.sort((a, b) => b.timestamp - a.timestamp) });
  },

  mergeBranch: async (canvasId: string, sourceBranch: string, targetBranch: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    if (sourceBranch === targetBranch) return;
    const { mergeBranchInDB, listSnapshotsFromDB } = await import('@/lib/canvas/historyDB');
    // Find the latest snapshot in target branch as merge tip
    const allSnaps = await listSnapshotsFromDB(canvasId, { branch: targetBranch });
    const targetTip = allSnaps.sort((a, b) => b.timestamp - a.timestamp)[0] ?? null;
    await mergeBranchInDB(canvasId, sourceBranch, targetBranch, targetTip?.id ?? null);
    // Refresh local snapshots list
    const list = await listSnapshotsFromDB(canvasId);
    set({ snapshots: list.sort((a, b) => b.timestamp - a.timestamp) });
  },

  listBranches: async (canvasId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return [];
    const { listBranchesFromDB } = await import('@/lib/canvas/historyDB');
    return listBranchesFromDB(canvasId);
  },

  setCurrentBranch: (branchName: string) => {
    set({ currentBranch: branchName });
  },

  resolveBranchConflict: async (
    _canvasId: string,
    nodeId: string,
    resolution: 'keep-local' | 'keep-remote' | 'merge',
  ) => {
    const { pendingConflicts } = get();
    const conflict = pendingConflicts.find((c) => c.nodeId === nodeId);
    if (!conflict) return;

    // Apply resolution: the caller (DDSCanvasPage) is responsible for actually
    // applying the chosen version to the canvas store. Here we just remove
    // the conflict from the pending list.
    const next = pendingConflicts.filter((c) => c.nodeId !== nodeId);
    set({ pendingConflicts: next });

    // Apply resolution to the store if the caller provides a callback
    // (the DDSCanvasPage handles actual node data replacement)
    console.debug(
      `[canvasHistoryStore] resolveBranchConflict: resolved ${nodeId} with ${resolution}`,
    );
  },

  clearPendingConflicts: () => {
    set({ pendingConflicts: [] });
  },

  // E1 (Sprint67): Branch comparison — compare the latest snapshots of two branches
  compareBranches: async (canvasId: string, branchA: string, branchB: string): Promise<BranchDiffResult> => {
    const emptyResult = (error: string): BranchDiffResult => ({
      branchA, branchB, diffs: { added: [], removed: [], modified: [] },
      error,
      summary: { totalChanges: 0, contextsAdded: 0, contextsRemoved: 0, contextsModified: 0, edgesAdded: 0, edgesRemoved: 0, edgesModified: 0 },
    });

    if (typeof window === 'undefined' || !window.indexedDB) {
      return emptyResult('IndexedDB not available (SSR)');
    }

    const { getLatestSnapshotFromDB } = await import('@/lib/canvas/historyDB');
    const snapA = await getLatestSnapshotFromDB(canvasId, branchA);
    const snapB = await getLatestSnapshotFromDB(canvasId, branchB);

    if (!snapA) return emptyResult(`No snapshot found for branch "${branchA}"`);
    if (!snapB) return emptyResult(`No snapshot found for branch "${branchB}"`);

    const diffs = get().compareSnapshots(snapA, snapB);
    const summary = {
      totalChanges: diffs.added.length + diffs.removed.length + diffs.modified.length,
      contextsAdded: diffs.added.length,
      contextsRemoved: diffs.removed.length,
      contextsModified: diffs.modified.length,
      edgesAdded: 0, edgesRemoved: 0, edgesModified: 0,
    };

    return { branchA, branchB, snapA, snapB, diffs, summary };
  },


  stopAutoSnapshot: () => {
    const timer = (window as unknown as { __canvasAutoSnapshotTimer?: ReturnType<typeof setInterval> }).__canvasAutoSnapshotTimer;
    if (timer) {
      clearInterval(timer);
      (window as unknown as { __canvasAutoSnapshotTimer?: ReturnType<typeof setInterval> }).__canvasAutoSnapshotTimer = undefined;
    }
    set({ autoSnapshotMs: null });
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
