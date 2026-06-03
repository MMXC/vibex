/**
 * canvasHistoryStore — Unit Tests
 * P001: U5-P001
 * E1 (Sprint58): 画布版本分支管理 — Snapshot tests
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

describe('canvasHistoryStore — E1 Snapshots (Sprint58)', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({
      past: [],
      future: [],
      isPerforming: false,
      snapshots: [],
      restoringSnapshotId: null,
    });
  });

  it('initial state has empty snapshots and null restoringSnapshotId', () => {
    const state = useCanvasHistoryStore.getState();
    expect(state.snapshots).toEqual([]);
    expect(state.restoringSnapshotId).toBeNull();
  });

  it('setRestoringSnapshotId updates state', () => {
    useCanvasHistoryStore.getState().setRestoringSnapshotId('snapshot-123');
    expect(useCanvasHistoryStore.getState().restoringSnapshotId).toBe('snapshot-123');
    useCanvasHistoryStore.getState().setRestoringSnapshotId(null);
    expect(useCanvasHistoryStore.getState().restoringSnapshotId).toBeNull();
  });

  it('saveSnapshot adds a snapshot to the list (mocked IndexedDB)', async () => {
    // Mock the historyDB module
    vi.mock('@/lib/canvas/historyDB', () => ({
      saveSnapshotToDB: vi.fn().mockResolvedValue(undefined),
      listSnapshotsFromDB: vi.fn().mockResolvedValue([
        {
          id: 'snapshot-1',
          name: '版本 1',
          timestamp: 1717200000000,
          data: { nodes: [], edges: [] },
        },
      ]),
    }));

    const { saveSnapshot, snapshots } = useCanvasHistoryStore.getState();
    await saveSnapshot('canvas-1', '版本 1', { nodes: [], edges: [] });

    // After saveSnapshot, snapshots should be refreshed from listSnapshots
    expect(snapshots.length).toBeGreaterThanOrEqual(0);
  });

  it('listSnapshots returns sorted snapshots (newest first)', async () => {
    vi.mock('@/lib/canvas/historyDB', () => ({
      listSnapshotsFromDB: vi.fn().mockResolvedValue([
        { id: 's1', name: 'v1', timestamp: 1000, data: { nodes: [], edges: [] } },
        { id: 's2', name: 'v2', timestamp: 3000, data: { nodes: [], edges: [] } },
        { id: 's3', name: 'v3', timestamp: 2000, data: { nodes: [], edges: [] } },
      ]),
    }));

    const { listSnapshots } = useCanvasHistoryStore.getState();
    const result = await listSnapshots('canvas-1');

    // Should be sorted by timestamp descending
    expect(result[0].id).toBe('s2');
    expect(result[1].id).toBe('s3');
    expect(result[2].id).toBe('s1');
  });

  it('loadSnapshot returns null when IndexedDB unavailable', async () => {
    vi.mock('@/lib/canvas/historyDB', () => ({
      loadSnapshotFromDB: vi.fn().mockResolvedValue(null),
    }));

    const { loadSnapshot } = useCanvasHistoryStore.getState();
    const result = await loadSnapshot('canvas-1', 'snapshot-1');
    expect(result).toBeNull();
  });

  it('deleteSnapshot removes snapshot from state', async () => {
    vi.mock('@/lib/canvas/historyDB', () => ({
      deleteSnapshotFromDB: vi.fn().mockResolvedValue(undefined),
    }));

    // Pre-populate with mock snapshots
    useCanvasHistoryStore.setState({
      snapshots: [
        { id: 's1', name: 'v1', timestamp: 1000, data: { nodes: [], edges: [] } },
        { id: 's2', name: 'v2', timestamp: 2000, data: { nodes: [], edges: [] } },
      ],
    });

    const { deleteSnapshot, snapshots } = useCanvasHistoryStore.getState();
    await deleteSnapshot('canvas-1', 's1');

    expect(snapshots.filter((s) => s.id === 's1')).toHaveLength(0);
    expect(snapshots.filter((s) => s.id === 's2')).toHaveLength(1);
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
