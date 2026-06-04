/**
 * canvasHistoryStore — E1 Snapshot Tests
 * E1 (Sprint58): 画布版本分支管理
 *
 * Fix (2026-06-10): vi.mock hoisting bug — canvasHistoryStore uses dynamic
 * `await import('@/lib/canvas/historyDB')` inside action bodies. Plain vi.mock
 * only intercepts static imports. Fix: use vi.hoisted() to create shared mock
 * refs accessible from both the mock factory AND the test body.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasHistoryStore } from '../canvasHistoryStore';

// CRITICAL: jsdom has no indexedDB → store functions return early without calling
// the dynamic `await import('@/lib/canvas/historyDB')`. Mock it before vi.hoisted.
Object.defineProperty(globalThis, 'indexedDB', {
  value: { open: () => ({ result: { transaction: () => ({ objectStore: () => ({}) }) } }) },
  writable: true,
  configurable: true,
});

// vi.hoisted MUST come before vi.mock — creates shared mock refs that work with
// the store's dynamic `await import('@/lib/canvas/historyDB')` inside action bodies.
// Plain vi.mock factory vi.fn() creates refs invisible to test body when used
// inside a vi.mock factory (closure captures value at factory-call time, not hoisting time).
// vi.hoisted() evaluates eagerly and makes refs accessible from the mock factory AND test.
const { mockSaveSnapshotToDB, mockLoadSnapshotFromDB, mockListSnapshotsFromDB, mockDeleteSnapshotFromDB } =
  vi.hoisted(() => ({
    mockSaveSnapshotToDB: vi.fn().mockResolvedValue(undefined),
    mockLoadSnapshotFromDB: vi.fn().mockResolvedValue(null),
    mockListSnapshotsFromDB: vi.fn().mockResolvedValue([]),
    mockDeleteSnapshotFromDB: vi.fn().mockResolvedValue(undefined),
  }));

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
    // Reset mock resolved/rejected state
    mockSaveSnapshotToDB.mockResolvedValue(undefined);
    mockLoadSnapshotFromDB.mockResolvedValue(null);
    mockListSnapshotsFromDB.mockResolvedValue([]);
    mockDeleteSnapshotFromDB.mockResolvedValue(undefined);
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

  it('loadSnapshot returns snapshot data when found', async () => {
    const snapshot = { id: 'snap-1', name: 'v1', timestamp: 1000, data: { nodes: [], edges: [] } };
    mockLoadSnapshotFromDB.mockResolvedValue(snapshot);
    const { loadSnapshot } = useCanvasHistoryStore.getState();
    // store extracts .data from the snapshot object
    const result = await loadSnapshot('canvas-1', 'snap-1');
    expect(result).toEqual({ nodes: [], edges: [] });
  });

  it('loadSnapshot returns null when not found', async () => {
    mockLoadSnapshotFromDB.mockResolvedValue(null);
    const { loadSnapshot } = useCanvasHistoryStore.getState();
    const result = await loadSnapshot('canvas-1', 'snap-1');
    expect(result).toBeNull();
  });

  it('deleteSnapshot calls deleteSnapshotFromDB with canvasId and snapshotId', async () => {
    const { deleteSnapshot } = useCanvasHistoryStore.getState();
    await deleteSnapshot('canvas-1', 's1');
    expect(mockDeleteSnapshotFromDB).toHaveBeenCalledWith('canvas-1', 's1');
  });
});
