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
const { mockSaveSnapshotToDB, mockLoadSnapshotFromDB, mockListSnapshotsFromDB, mockDeleteSnapshotFromDB } =
  vi.hoisted(() => ({
    mockSaveSnapshotToDB: vi.fn().mockResolvedValue(undefined),
    mockLoadSnapshotFromDB: vi.fn().mockResolvedValue(null),
    mockListSnapshotsFromDB: vi.fn().mockResolvedValue([]),
    mockDeleteSnapshotFromDB: vi.fn().mockResolvedValue(undefined),
  }));

// Mock the historyDB module — vi.hoisted refs are used inside the factory so
// both the mock AND the test body share the same spy instances
vi.mock('@/lib/canvas/historyDB', () => ({
  saveSnapshotToDB: mockSaveSnapshotToDB,
  loadSnapshotFromDB: mockLoadSnapshotFromDB,
  listSnapshotsFromDB: mockListSnapshotsFromDB,
  deleteSnapshotFromDB: mockDeleteSnapshotFromDB,
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
    expect(mockListSnapshotsFromDB).toHaveBeenCalledWith('my-canvas');
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
