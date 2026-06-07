/**
 * canvasHistoryStore — Unit Tests
 * P001: U5-P001
 * E1 (Sprint58): 画布版本分支管理 — Snapshot tests
 *
 * Fix (2026-06-10): vi.mock hoisting bug — canvasHistoryStore uses dynamic
 * `await import('@/lib/canvas/historyDB')` inside action bodies. Plain vi.mock
 * only intercepts static imports. Fix: use vi.hoisted() to create shared mock
 * refs accessible from both the mock factory AND the test body.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasHistoryStore, MAX_HISTORY, type Command } from '../canvasHistoryStore';

describe('canvasHistoryStore — P001 U5', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({ past: [], future: [], isPerforming: false });
  });

  // ---- execute ----

  it('execute pushes command to past and clears future', () => {
    const cmd: Command = {
      id: 'c1',
      execute: vi.fn(),
      rollback: vi.fn(),
      timestamp: Date.now(),
    };
    useCanvasHistoryStore.getState().execute(cmd);
    expect(useCanvasHistoryStore.getState().past).toHaveLength(1);
    expect(useCanvasHistoryStore.getState().future).toHaveLength(0);
    expect(cmd.execute).toHaveBeenCalled();
  });

  it('execute calls cmd.execute()', () => {
    const fn = vi.fn();
    const cmd: Command = { id: 'c1', execute: fn, rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  // ---- undo ----

  it('undo calls rollback and moves command to future', () => {
    const rollbackFn = vi.fn();
    const cmd: Command = {
      id: 'c1',
      execute: vi.fn(),
      rollback: rollbackFn,
      timestamp: Date.now(),
    };
    useCanvasHistoryStore.getState().execute(cmd);

    useCanvasHistoryStore.getState().undo();
    expect(rollbackFn).toHaveBeenCalled();
    expect(useCanvasHistoryStore.getState().past).toHaveLength(0);
    expect(useCanvasHistoryStore.getState().future).toContain(cmd);
  });

  it('undo does nothing when past is empty', () => {
    const rollbackFn = vi.fn();
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: rollbackFn, timestamp: Date.now() };
    useCanvasHistoryStore.getState().undo();
    expect(rollbackFn).not.toHaveBeenCalled();
  });

  // ---- redo ----

  it('redo calls execute on the command and moves to past', () => {
    const executeFn = vi.fn();
    const cmd: Command = {
      id: 'c1',
      execute: executeFn,
      rollback: vi.fn(),
      timestamp: Date.now(),
    };
    useCanvasHistoryStore.getState().execute(cmd);
    useCanvasHistoryStore.getState().undo();

    executeFn.mockClear();
    useCanvasHistoryStore.getState().redo();
    expect(executeFn).toHaveBeenCalled();
    expect(useCanvasHistoryStore.getState().past).toContain(cmd);
    expect(useCanvasHistoryStore.getState().future).toHaveLength(0);
  });

  it('redo does nothing when future is empty', () => {
    const executeFn = vi.fn();
    useCanvasHistoryStore.getState().redo();
    expect(executeFn).not.toHaveBeenCalled();
  });

  // ---- 50-step limit ----

  it('past is capped at MAX_HISTORY', () => {
    for (let i = 0; i < MAX_HISTORY + 10; i++) {
      const cmd: Command = {
        id: `c${i}`,
        execute: vi.fn(),
        rollback: vi.fn(),
        timestamp: Date.now(),
      };
      useCanvasHistoryStore.getState().execute(cmd);
    }
    expect(useCanvasHistoryStore.getState().past).toHaveLength(MAX_HISTORY);
  });

  it('oldest command is evicted when limit exceeded', () => {
    const first: Command = {
      id: 'first',
      execute: vi.fn(),
      rollback: vi.fn(),
      timestamp: Date.now(),
    };
    useCanvasHistoryStore.getState().execute(first);

    // Add MAX_HISTORY more to push total to MAX_HISTORY + 1 → first is evicted
    for (let i = 0; i < MAX_HISTORY; i++) {
      const cmd: Command = {
        id: `c${i}`,
        execute: vi.fn(),
        rollback: vi.fn(),
        timestamp: Date.now(),
      };
      useCanvasHistoryStore.getState().execute(cmd);
    }

    expect(useCanvasHistoryStore.getState().past).not.toContain(first);
    expect(useCanvasHistoryStore.getState().past).toHaveLength(MAX_HISTORY);
  });

  // ---- clear ----

  it('clear empties both past and future', () => {
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    useCanvasHistoryStore.getState().undo();
    expect(useCanvasHistoryStore.getState().past).toHaveLength(0);
    expect(useCanvasHistoryStore.getState().future).toHaveLength(1);
    useCanvasHistoryStore.getState().clear();
    expect(useCanvasHistoryStore.getState().past).toHaveLength(0);
    expect(useCanvasHistoryStore.getState().future).toHaveLength(0);
  });

  // ---- canUndo / canRedo ----

  it('canUndo returns true when past is non-empty', () => {
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    expect(useCanvasHistoryStore.getState().canUndo()).toBe(false);
    useCanvasHistoryStore.getState().execute(cmd);
    expect(useCanvasHistoryStore.getState().canUndo()).toBe(true);
  });

  it('canRedo returns true when future is non-empty', () => {
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    useCanvasHistoryStore.getState().undo();
    expect(useCanvasHistoryStore.getState().canRedo()).toBe(true);
  });

  // ---- selectiveUndo ----

  it('selectiveUndo rolls back to targetIndex', () => {
    const rollback0 = vi.fn();
    const rollback1 = vi.fn();
    const rollback2 = vi.fn();

    const cmd0: Command = { id: 'c0', execute: vi.fn(), rollback: rollback0, timestamp: Date.now() };
    const cmd1: Command = { id: 'c1', execute: vi.fn(), rollback: rollback1, timestamp: Date.now() };
    const cmd2: Command = { id: 'c2', execute: vi.fn(), rollback: rollback2, timestamp: Date.now() };

    useCanvasHistoryStore.getState().execute(cmd0);
    useCanvasHistoryStore.getState().execute(cmd1);
    useCanvasHistoryStore.getState().execute(cmd2);

    // Roll back to index 1 (keep cmd0 + cmd1)
    useCanvasHistoryStore.getState().selectiveUndo(1);

    expect(rollback2).toHaveBeenCalled();
    expect(rollback1).not.toHaveBeenCalled();
    expect(rollback0).not.toHaveBeenCalled();
    expect(useCanvasHistoryStore.getState().past.map((c) => c.id)).toEqual(['c0', 'c1']);
  });

  it('selectiveUndo handles index beyond past length', () => {
    const cmd: Command = { id: 'c0', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);

    // Should not crash
    useCanvasHistoryStore.getState().selectiveUndo(99);
    expect(useCanvasHistoryStore.getState().past).toHaveLength(1);
  });

  // ---- getPosition ----

  it('getPosition returns correct position', () => {
    expect(useCanvasHistoryStore.getState().getPosition()).toEqual({ current: 0, total: 0 });

    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    expect(useCanvasHistoryStore.getState().getPosition()).toEqual({ current: 1, total: 1 });
  });

  // ---- isPerforming guard ----

  it('execute is no-op when isPerforming is true', () => {
    useCanvasHistoryStore.setState({ isPerforming: true });
    const fn = vi.fn();
    const cmd: Command = { id: 'c1', execute: fn, rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    expect(fn).not.toHaveBeenCalled();
  });

  it('undo is no-op when isPerforming is true', () => {
    const rollbackFn = vi.fn();
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: rollbackFn, timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    useCanvasHistoryStore.setState({ isPerforming: true });
    useCanvasHistoryStore.getState().undo();
    expect(rollbackFn).not.toHaveBeenCalled();
  });
});

// ==================== E1: Snapshot Tests ====================

// CRITICAL: jsdom has no indexedDB → store functions return early without calling
// the dynamic `await import('@/lib/canvas/historyDB')`. Mock it before vi.hoisted.
Object.defineProperty(globalThis, 'indexedDB', {
  value: { open: () => ({ result: { transaction: () => ({ objectStore: () => ({}) }) } }) },
  writable: true,
  configurable: true,
});

// vi.hoisted MUST come before vi.mock — creates shared mock refs that work with
// the store's dynamic `await import('@/lib/canvas/historyDB')` inside action bodies.
// Plain vi.mock factory `vi.fn()` creates local refs invisible to test body.
// vi.hoisted() makes refs accessible from both mock factory AND test code.
const { mockSaveSnapshotToDB, mockLoadSnapshotFromDB, mockListSnapshotsFromDB, mockDeleteSnapshotFromDB, mockGetLatestSnapshotFromDB } =
  vi.hoisted(() => ({
    mockSaveSnapshotToDB: vi.fn().mockResolvedValue(undefined),
    mockLoadSnapshotFromDB: vi.fn().mockResolvedValue(null),
    mockListSnapshotsFromDB: vi.fn().mockResolvedValue([]),
    mockDeleteSnapshotFromDB: vi.fn().mockResolvedValue(undefined),
    mockGetLatestSnapshotFromDB: vi.fn().mockResolvedValue(null),
  }));

// Mock the historyDB module — vi.hoisted refs are used inside the factory so
// both the mock AND the test body share the same spy instances
vi.mock('@/lib/canvas/historyDB', () => ({
  saveSnapshotToDB: mockSaveSnapshotToDB,
  loadSnapshotFromDB: mockLoadSnapshotFromDB,
  listSnapshotsFromDB: mockListSnapshotsFromDB,
  deleteSnapshotFromDB: mockDeleteSnapshotFromDB,
  getLatestSnapshotFromDB: mockGetLatestSnapshotFromDB,
}));

describe('canvasHistoryStore — E1 Snapshots (Sprint58)', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({
      past: [],
      future: [],
      isPerforming: false,
      snapshots: [],
      restoringSnapshotId: null,
    });
    vi.clearAllMocks();
  });

  it('initial state has empty snapshots and null restoringSnapshotId', () => {
    const state = useCanvasHistoryStore.getState();
    expect(state.snapshots).toEqual([]);
    expect(state.restoringSnapshotId).toBeNull();
  });

  it('setRestoringSnapshotId updates and clears state', () => {
    useCanvasHistoryStore.getState().setRestoringSnapshotId('snapshot-123');
    expect(useCanvasHistoryStore.getState().restoringSnapshotId).toBe('snapshot-123');
    useCanvasHistoryStore.getState().setRestoringSnapshotId(null);
    expect(useCanvasHistoryStore.getState().restoringSnapshotId).toBeNull();
  });

  it('saveSnapshot calls saveSnapshotToDB with canvasId and snapshot object', async () => {
    const { saveSnapshot } = useCanvasHistoryStore.getState();
    await saveSnapshot('canvas-1', '版本 1', { nodes: [], edges: [] });
    // verify saveSnapshotToDB was called with canvasId + snapshot object
    expect(mockSaveSnapshotToDB).toHaveBeenCalledWith(
      'canvas-1',
      expect.objectContaining({ id: expect.any(String), name: '版本 1' })
    );
  });

  it('listSnapshots sorts by timestamp descending (newest first)', async () => {
    mockListSnapshotsFromDB.mockResolvedValue([
      { id: 's1', name: 'v1', timestamp: 1000, data: { nodes: [], edges: [] } },
      { id: 's2', name: 'v2', timestamp: 3000, data: { nodes: [], edges: [] } },
      { id: 's3', name: 'v3', timestamp: 2000, data: { nodes: [], edges: [] } },
    ]);

    const { listSnapshots } = useCanvasHistoryStore.getState();
    const result = await listSnapshots('canvas-1');

    // store sorts: newest first (3000, 2000, 1000)
    expect(result[0].id).toBe('s2');
    expect(result[1].id).toBe('s3');
    expect(result[2].id).toBe('s1');
  });

  it('listSnapshots calls listSnapshotsFromDB with canvasId', async () => {
    mockListSnapshotsFromDB.mockResolvedValue([]);
    const { listSnapshots } = useCanvasHistoryStore.getState();
    await listSnapshots('my-canvas');
    expect(mockListSnapshotsFromDB).toHaveBeenCalledWith('my-canvas', undefined);
  });

  it('loadSnapshot returns null when IndexedDB returns null', async () => {
    mockListSnapshotsFromDB.mockResolvedValue(null);
    const { loadSnapshot } = useCanvasHistoryStore.getState();
    const result = await loadSnapshot('canvas-1', 'snap-1');
    expect(result).toBeNull();
  });

  it('loadSnapshot returns snapshot data when found', async () => {
    const snapshot = { id: 'snap-1', name: 'v1', timestamp: 1000, data: { nodes: [], edges: [] } };
    mockLoadSnapshotFromDB.mockResolvedValue(snapshot);
    const { loadSnapshot } = useCanvasHistoryStore.getState();
    // store extracts .data from the snapshot object
    const result = await loadSnapshot('canvas-1', 'snap-1');
    expect(result).toEqual({ nodes: [], edges: [] });
  });

  it('deleteSnapshot calls deleteSnapshotFromDB with canvasId and snapshotId', async () => {
    const { deleteSnapshot } = useCanvasHistoryStore.getState();
    await deleteSnapshot('canvas-1', 's1');
    expect(mockDeleteSnapshotFromDB).toHaveBeenCalledWith('canvas-1', 's1');
  });
});

// ==================== E3: Revision Tests ====================

describe('canvasHistoryStore — E3 Revision (Sprint52)', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({
      past: [],
      future: [],
      isPerforming: false,
      baseRevision: 0,
      onRevisionConflict: null,
    });
  });

  it('baseRevision increments on each execute', () => {
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(1);

    const cmd2: Command = { id: 'c2', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd2);
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(2);
  });

  it('setBaseRevision updates without clearing past when no conflict handler', () => {
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(1);

    useCanvasHistoryStore.getState().setBaseRevision(5);
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(5);
  });

  it('setBaseRevision discards local past on discard-local resolution', () => {
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);

    useCanvasHistoryStore.getState().setRevisionConflictHandler(() => 'discard-local');
    useCanvasHistoryStore.getState().setBaseRevision(5);

    // Past should be cleared, revision should be updated
    expect(useCanvasHistoryStore.getState().past).toHaveLength(0);
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(5);
  });

  it('setBaseRevision keeps local past on merge resolution', () => {
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);

    useCanvasHistoryStore.getState().setRevisionConflictHandler(() => 'merge');
    useCanvasHistoryStore.getState().setBaseRevision(5);

    // Past should be kept, revision updated
    expect(useCanvasHistoryStore.getState().past).toHaveLength(1);
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(5);
  });

  it('undo does NOT bump revision', () => {
    const rollbackFn = vi.fn();
    const cmd: Command = { id: 'c1', execute: vi.fn(), rollback: rollbackFn, timestamp: Date.now() };
    useCanvasHistoryStore.getState().execute(cmd);
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(1);

    useCanvasHistoryStore.getState().undo();
    expect(useCanvasHistoryStore.getState().baseRevision).toBe(1); // unchanged
  });
});

// ==================== E2: Snapshot LRU + Auto-Snapshot Tests ====================

// NOTE: The vi.mock + indexedDB mock from E1 section is still active for all describe blocks below.
// Tests use the same mock instances (mockSaveSnapshotToDB, mockListSnapshotsFromDB,
// mockDeleteSnapshotFromDB) from vi.hoisted() defined at line 238.

describe('canvasHistoryStore — E2 Snapshots LRU (Sprint64)', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({
      past: [],
      future: [],
      isPerforming: false,
      snapshots: [],
      restoringSnapshotId: null,
      autoSnapshotMs: null,
    });
    vi.clearAllMocks();
  });

  it('MAX_SNAPSHOTS is exported and equals 50', async () => {
    const { MAX_SNAPSHOTS } = await import('../canvasHistoryStore');
    expect(MAX_SNAPSHOTS).toBe(50);
  });

  it('saveSnapshot does NOT delete when snapshots are under MAX_SNAPSHOTS', async () => {
    mockListSnapshotsFromDB.mockResolvedValue([
      { id: 's1', name: 'v1', timestamp: 1000, data: { nodes: [], edges: [] } },
    ]);

    const { saveSnapshot } = useCanvasHistoryStore.getState();
    await saveSnapshot('canvas-1', 'v2', { nodes: [], edges: [] });

    // Should have called saveSnapshotToDB but NOT deleteSnapshotFromDB (under limit)
    expect(mockSaveSnapshotToDB).toHaveBeenCalled();
    expect(mockDeleteSnapshotFromDB).not.toHaveBeenCalled();
  });

  it('saveSnapshot evicts oldest when snapshots exceed MAX_SNAPSHOTS after save', async () => {
    // After saveSnapshotToDB runs, listSnapshots returns 51 items (50 existing + 1 new)
    // 51 > MAX_SNAPSHOTS(50) → evict 1 oldest (s0)
    mockListSnapshotsFromDB.mockResolvedValueOnce([
      ...Array.from({ length: 50 }, (_, i) => ({
        id: `s${i}`,
        name: `v${i}`,
        timestamp: 1000 + i,
        data: { nodes: [], edges: [] },
      })),
      { id: 'snapshot-new', name: 'newest', timestamp: 9999, data: { nodes: [], edges: [] } },
    ]);
    // saveSnapshot calls listSnapshots again after eviction — return the trimmed list
    mockListSnapshotsFromDB.mockResolvedValueOnce([
      ...Array.from({ length: 50 }, (_, i) => ({
        id: `s${i}`,
        name: `v${i}`,
        timestamp: 1000 + i,
        data: { nodes: [], edges: [] },
      })),
      { id: 'snapshot-new', name: 'newest', timestamp: 9999, data: { nodes: [], edges: [] } },
    ]);

    const { saveSnapshot } = useCanvasHistoryStore.getState();
    await saveSnapshot('canvas-1', 'newest', { nodes: [], edges: [] });

    // After save: 51 total → delete the oldest 1 → 50 remain
    expect(mockDeleteSnapshotFromDB).toHaveBeenCalledTimes(1);
    expect(mockDeleteSnapshotFromDB).toHaveBeenCalledWith('canvas-1', 's0');
  });

  it('saveSnapshot evicts multiple oldest when saving pushes count far over limit', async () => {
    // Array: 1 new + 50 s0-s49 (from loop, timestamps 1050-1099) + 4 s50-s53 = 55 items
    // After sort desc: [new(9999), s49(1099), s48(1098)...s0(1050), s50(1000), s51(999), s52(998), s53(997)]
    // slice(50): indices 50-54 = [s0(1050), s50(1000), s51(999), s52(998), s53(997)] = 5 evictions
    const snapshot55 = [
      { id: 'snapshot-new', name: 'newest', timestamp: 9999, data: { nodes: [], edges: [] } },
      ...Array.from({ length: 50 }, (_, i) => ({
        id: `s${i}`,
        name: `v${i}`,
        timestamp: 1050 + i,
        data: { nodes: [], edges: [] },
      })),
      // Oldest 4 (s50-s53 evicted via slice(50)): NO s49 here — loop already has s49(1099)
      { id: 's50', name: 'v50', timestamp: 1000, data: { nodes: [], edges: [] } },
      { id: 's51', name: 'v51', timestamp: 999, data: { nodes: [], edges: [] } },
      { id: 's52', name: 'v52', timestamp: 998, data: { nodes: [], edges: [] } },
      { id: 's53', name: 'v53', timestamp: 997, data: { nodes: [], edges: [] } },
    ];
    const listSnapshotsSpy = vi.spyOn(useCanvasHistoryStore.getState(), 'listSnapshots')
      .mockResolvedValue(snapshot55);

    const { saveSnapshot } = useCanvasHistoryStore.getState();
    await saveSnapshot('canvas-1', 'newest', { nodes: [], edges: [] });

    // 55 items > MAX_SNAPSHOTS(50) → evict 5 oldest
    expect(mockDeleteSnapshotFromDB).toHaveBeenCalledTimes(5);
    expect(mockDeleteSnapshotFromDB).toHaveBeenCalledWith('canvas-1', 's49');
    listSnapshotsSpy.mockRestore();
  });
});
describe('canvasHistoryStore — E2 restoreSnapshot (Sprint64)', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({
      past: [],
      future: [],
      isPerforming: false,
      snapshots: [],
      restoringSnapshotId: null,
      autoSnapshotMs: null,
    });
    vi.clearAllMocks();
    // E2 tests need indexedDB available (restoreSnapshot checks window.indexedDB)
    // Must set on window explicitly since jsdom separates window from globalThis
    Object.defineProperty(window, 'indexedDB', {
      value: { databases: vi.fn().mockResolvedValue([]) },
      writable: true,
      configurable: true,
    });
  });

  it('restoreSnapshot sets restoringSnapshotId then clears it', async () => {
    const snapshot = {
      id: 'snap-1',
      name: 'v1',
      timestamp: 1000,
      data: { nodes: [{ id: 'n1' }], edges: [{ id: 'e1' }] },
    };
    mockLoadSnapshotFromDB.mockResolvedValue(snapshot);

    const { restoreSnapshot } = useCanvasHistoryStore.getState();
    expect(useCanvasHistoryStore.getState().restoringSnapshotId).toBeNull();

    await restoreSnapshot('canvas-1', 'snap-1');

    expect(mockLoadSnapshotFromDB).toHaveBeenCalledWith('canvas-1', 'snap-1');
    expect(useCanvasHistoryStore.getState().restoringSnapshotId).toBeNull(); // cleared after completion
  });

  it('restoreSnapshot returns early when snapshot not found', async () => {
    mockLoadSnapshotFromDB.mockResolvedValue(null);

    const { restoreSnapshot } = useCanvasHistoryStore.getState();
    await restoreSnapshot('canvas-1', 'nonexistent');

    // Should not crash and should not set restoringSnapshotId
    expect(useCanvasHistoryStore.getState().restoringSnapshotId).toBeNull();
  });
});

describe('canvasHistoryStore — E2 Auto-Snapshot (Sprint64)', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({
      past: [],
      future: [],
      isPerforming: false,
      snapshots: [],
      restoringSnapshotId: null,
      autoSnapshotMs: null,
    });
    vi.clearAllMocks();
  });

  it('startAutoSnapshot sets autoSnapshotMs state', () => {
    const { startAutoSnapshot } = useCanvasHistoryStore.getState();
    startAutoSnapshot('canvas-1', () => ({ nodes: [], edges: [] }), 300000);
    expect(useCanvasHistoryStore.getState().autoSnapshotMs).toBe(300000);
  });

  it('stopAutoSnapshot clears autoSnapshotMs state', () => {
    const { startAutoSnapshot, stopAutoSnapshot } = useCanvasHistoryStore.getState();
    startAutoSnapshot('canvas-1', () => ({ nodes: [], edges: [] }), 300000);
    stopAutoSnapshot();
    expect(useCanvasHistoryStore.getState().autoSnapshotMs).toBeNull();
  });
});


// S74-E3: Branch comparison tests
describe('canvasHistoryStore — E3 Branch Compare (Sprint74)', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({
      past: [],
      future: [],
      isPerforming: false,
      snapshots: [],
      restoringSnapshotId: null,
      autoSnapshotMs: null,
    });
    vi.clearAllMocks();
  });

  // Helper to build correctly-structured snapshots (data.nodes, not direct nodes)
  const makeSnap = (id: string, branchName: string, nodes: any[], edges: any[] = []) => ({
    id,
    name: `Snap ${id}`,
    timestamp: 1000,
    data: { nodes, edges },
    branchName,
    canvasId: 'c1',
    parentSnapshotId: null,
    isStarred: false,
  });

  it('compareBranches returns empty diff when both branches identical', async () => {
    const snap = makeSnap('snap-a', 'main', [{ id: 'n1', type: 'input' }], []);
    mockGetLatestSnapshotFromDB.mockResolvedValueOnce(snap).mockResolvedValueOnce(snap);
    const result = await useCanvasHistoryStore.getState().compareBranches('c1', 'main', 'main');
    expect(result.error).toBeUndefined();
    expect(result.diffs.added).toHaveLength(0);
    expect(result.diffs.removed).toHaveLength(0);
    expect(result.diffs.modified).toHaveLength(0);
  });

  it('compareBranches returns added nodes when branchB has new nodes', async () => {
    const snapA = makeSnap('snap-a', 'main', [{ id: 'n1', type: 'input' }], []);
    const snapB = makeSnap('snap-b', 'feature', [{ id: 'n1', type: 'input' }, { id: 'n2', type: 'output' }], []);
    mockGetLatestSnapshotFromDB.mockResolvedValueOnce(snapA).mockResolvedValueOnce(snapB);
    const result = await useCanvasHistoryStore.getState().compareBranches('c1', 'main', 'feature');
    expect(result.error).toBeUndefined();
    expect(result.diffs.added).toHaveLength(1);
    expect(result.diffs.added[0].id).toBe('n2');
  });

  it('compareBranches returns removed nodes when branchB is missing nodes', async () => {
    const snapA = makeSnap('snap-a', 'main', [{ id: 'n1', type: 'input' }, { id: 'n2', type: 'output' }], []);
    const snapB = makeSnap('snap-b', 'feature', [{ id: 'n1', type: 'input' }], []);
    mockGetLatestSnapshotFromDB.mockResolvedValueOnce(snapA).mockResolvedValueOnce(snapB);
    const result = await useCanvasHistoryStore.getState().compareBranches('c1', 'main', 'feature');
    expect(result.error).toBeUndefined();
    expect(result.diffs.removed).toHaveLength(1);
    expect(result.diffs.removed[0].id).toBe('n2');
  });

  it('compareBranches returns modified nodes when branchB has changed node properties', async () => {
    const snapA = makeSnap('snap-a', 'main', [{ id: 'n1', type: 'input', data: { label: 'A' } }], []);
    const snapB = makeSnap('snap-b', 'feature', [{ id: 'n1', type: 'input', data: { label: 'B (modified)' } }], []);
    mockGetLatestSnapshotFromDB.mockResolvedValueOnce(snapA).mockResolvedValueOnce(snapB);
    const result = await useCanvasHistoryStore.getState().compareBranches('c1', 'main', 'feature');
    expect(result.error).toBeUndefined();
    expect(result.diffs.modified).toHaveLength(1);
    expect(result.diffs.modified[0].id).toBe('n1');
  });

  it('compareBranches returns error when snapA is null', async () => {
    const snapB = makeSnap('snap-b', 'feature', [], []);
    mockGetLatestSnapshotFromDB.mockResolvedValueOnce(null).mockResolvedValueOnce(snapB);
    const result = await useCanvasHistoryStore.getState().compareBranches('c1', 'main', 'feature');
    expect(result.error).toContain('No snapshot found');
  });

  it('compareBranches returns error when snapB is null', async () => {
    const snapA = makeSnap('snap-a', 'main', [], []);
    mockGetLatestSnapshotFromDB.mockResolvedValueOnce(snapA).mockResolvedValueOnce(null);
    const result = await useCanvasHistoryStore.getState().compareBranches('c1', 'main', 'feature');
    expect(result.error).toContain('No snapshot found');
  });

  it('compareBranches includes summary stats with correct counts', async () => {
    const snapA = makeSnap('snap-a', 'main', [{ id: 'n1', type: 'input' }, { id: 'n2', type: 'input' }], []);
    const snapB = makeSnap('snap-b', 'feature', [{ id: 'n1', type: 'input' }, { id: 'n3', type: 'output' }], []);
    mockGetLatestSnapshotFromDB.mockResolvedValueOnce(snapA).mockResolvedValueOnce(snapB);
    const result = await useCanvasHistoryStore.getState().compareBranches('c1', 'main', 'feature');
    expect(result.error).toBeUndefined();
    expect(result.summary.totalChanges).toBe(2);
    expect(result.summary.contextsAdded).toBe(1);   // n3
    expect(result.summary.contextsRemoved).toBe(1); // n2
    expect(result.summary.contextsModified).toBe(0);
  });
});