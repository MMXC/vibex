/**
 * canvasHistoryStore — S78-E1 Auto-Merge Tests
 * S78-E1: Canvas 分支自动合并与智能冲突解决
 *
 * Mock strategy: vi.hoisted() for dynamic await import() in store actions.
 * CRITICAL: jsdom has no indexedDB — mock it before vi.hoisted.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasHistoryStore } from '../canvasHistoryStore';

Object.defineProperty(globalThis, 'indexedDB', {
  value: { open: () => ({ result: { transaction: () => ({ objectStore: () => ({}) }) } }) },
  writable: true,
  configurable: true,
});

const {
  mockListSnapshotsFromDB,
  mockSaveSnapshotToDB,
  mockMergeBranchInDB,
  mockListBranchesFromDB,
  mockGetBranchMeta,
} = vi.hoisted(() => ({
  mockListSnapshotsFromDB: vi.fn(),
  mockSaveSnapshotToDB: vi.fn(),
  mockMergeBranchInDB: vi.fn(),
  mockListBranchesFromDB: vi.fn(),
  mockGetBranchMeta: vi.fn(),
}));

vi.mock('@/lib/canvas/historyDB', () => ({
  listSnapshotsFromDB: mockListSnapshotsFromDB,
  saveSnapshotToDB: mockSaveSnapshotToDB,
  mergeBranchInDB: mockMergeBranchInDB,
  listBranchesFromDB: mockListBranchesFromDB,
  getBranchMeta: mockGetBranchMeta,
}));

describe('canvasHistoryStore — S78-E1 autoMergeBranch', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({
      past: [],
      future: [],
      isPerforming: false,
      snapshots: [],
      pendingConflicts: [],
      currentBranch: 'main',
      currentUserId: 'user-1',
    });
    vi.clearAllMocks();
    mockListSnapshotsFromDB.mockResolvedValue([]);
    mockSaveSnapshotToDB.mockResolvedValue(undefined);
    mockMergeBranchInDB.mockResolvedValue(undefined);
    mockListBranchesFromDB.mockResolvedValue([]);
    mockGetBranchMeta.mockResolvedValue({ name: 'test-branch', isProtected: false, createdAt: Date.now(), branchOwner: 'user-1' });
  });

  // ─── autoMergeBranch signature ───────────────────────────────────────────

  it('has autoMergeBranch method on store', () => {
    expect(typeof useCanvasHistoryStore.getState().autoMergeBranch).toBe('function');
  });

  // ─── No conflicts — auto-merge succeeds ───────────────────────────────────

  it('auto-merge succeeds when no conflicting nodes (source has new nodes only)', async () => {
    // Target: has node-1
    // Source: has node-2 (no overlap)
    mockListSnapshotsFromDB.mockResolvedValueOnce([
      // target branch (main) — newest first
      { id: 'main-snap', name: 'main', branchName: 'main', timestamp: 2000, data: { nodes: [{ id: 'node-1' }], edges: [] } },
    ]);
    mockListSnapshotsFromDB.mockResolvedValueOnce([
      // source branch (feature) — newest first
      { id: 'feat-snap', name: 'feature', branchName: 'feature', timestamp: 1000, data: { nodes: [{ id: 'node-2' }], edges: [] } },
    ]);

    const result = await useCanvasHistoryStore.getState().autoMergeBranch('canvas-1', 'feature', 'main');

    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.conflicts).toHaveLength(0);
    // mergeBranchInDB called since no conflicts
    expect(mockMergeBranchInDB).toHaveBeenCalledWith('canvas-1', 'feature', 'main', 'main-snap');
    expect(useCanvasHistoryStore.getState().pendingConflicts).toHaveLength(0);
  });

  it('auto-merge succeeds when target has no snapshots', async () => {
    mockListSnapshotsFromDB.mockResolvedValueOnce([]); // target branch empty
    mockListSnapshotsFromDB.mockResolvedValueOnce([
      { id: 'feat-snap', name: 'feature', branchName: 'feature', timestamp: 1000, data: { nodes: [{ id: 'node-2' }], edges: [] } },
    ]);

    const result = await useCanvasHistoryStore.getState().autoMergeBranch('canvas-1', 'feature', 'main');

    expect(result.ok).toBe(true);
    expect(result.conflicts).toHaveLength(0);
    expect(mockMergeBranchInDB).toHaveBeenCalledWith('canvas-1', 'feature', 'main', null);
  });

  // ─── Conflicts detected ───────────────────────────────────────────────────

  it('returns conflicts when same node modified on both branches', async () => {
    // Both branches have node-1 with different content
    mockListSnapshotsFromDB.mockResolvedValueOnce([
      { id: 'main-snap', name: 'main', branchName: 'main', timestamp: 2000, data: { nodes: [{ id: 'node-1', label: 'target-label' }], edges: [] } },
    ]);
    mockListSnapshotsFromDB.mockResolvedValueOnce([
      { id: 'feat-snap', name: 'feature', branchName: 'feature', timestamp: 1000, data: { nodes: [{ id: 'node-1', label: 'source-label' }], edges: [] } },
    ]);

    const result = await useCanvasHistoryStore.getState().autoMergeBranch('canvas-1', 'feature', 'main');

    expect(result.ok).toBe(true); // merge is OK, conflicts returned for resolution
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].nodeId).toBe('node-1');
    expect(result.conflicts[0].localData).toEqual({ id: 'node-1', label: 'source-label' });
    expect(result.conflicts[0].remoteData).toEqual({ id: 'node-1', label: 'target-label' });
    // mergeBranchInDB NOT called — conflicts must be resolved first
    expect(mockMergeBranchInDB).not.toHaveBeenCalled();
    // conflicts stored in state
    expect(useCanvasHistoryStore.getState().pendingConflicts).toHaveLength(1);
  });

  it('detects multiple conflicting nodes', async () => {
    mockListSnapshotsFromDB.mockResolvedValueOnce([
      { id: 'main-snap', name: 'main', branchName: 'main', timestamp: 2000,
        data: { nodes: [
          { id: 'node-1', label: 'main-1' },
          { id: 'node-2', label: 'main-2' },
        ], edges: [] } },
    ]);
    mockListSnapshotsFromDB.mockResolvedValueOnce([
      { id: 'feat-snap', name: 'feature', branchName: 'feature', timestamp: 1000,
        data: { nodes: [
          { id: 'node-1', label: 'feat-1' },
          { id: 'node-3', label: 'feat-3' }, // new node, no conflict
        ], edges: [] } },
    ]);

    const result = await useCanvasHistoryStore.getState().autoMergeBranch('canvas-1', 'feature', 'main');

    expect(result.conflicts).toHaveLength(1); // only node-1 conflicts
    expect(result.conflicts[0].nodeId).toBe('node-1');
    expect(result.ok).toBe(true);
  });

  // ─── Error cases ──────────────────────────────────────────────────────────

  it('rejects when source and target are the same branch', async () => {
    const result = await useCanvasHistoryStore.getState().autoMergeBranch('canvas-1', 'main', 'main');

    expect(result.ok).toBe(false);
    expect(result.error).toContain('cannot be the same');
    expect(result.conflicts).toHaveLength(0);
  });

  it('rejects when source branch does not exist', async () => {
    mockListSnapshotsFromDB.mockResolvedValueOnce([]); // target
    mockListSnapshotsFromDB.mockResolvedValueOnce([]); // source empty

    const result = await useCanvasHistoryStore.getState().autoMergeBranch('canvas-1', 'nonexistent', 'main');

    expect(result.ok).toBe(false);
    expect(result.error).toContain('does not exist');
  });

  it('rejects when IndexedDB not available', async () => {
    Object.defineProperty(globalThis, 'indexedDB', { value: undefined, writable: true, configurable: true });

    const result = await useCanvasHistoryStore.getState().autoMergeBranch('canvas-1', 'feature', 'main');

    expect(result.ok).toBe(false);
    expect(result.error).toContain('IndexedDB');

    // Restore
    Object.defineProperty(globalThis, 'indexedDB', {
      value: { open: () => ({ result: { transaction: () => ({ objectStore: () => ({}) }) } }) },
      writable: true, configurable: true,
    });
  });

  // ─── BranchAutoMergeDialog preview ─────────────────────────────────────────

  it('sets pendingConflicts with correct BranchConflict shape for dialog rendering', async () => {
    mockListSnapshotsFromDB.mockResolvedValueOnce([
      { id: 'main-snap', name: 'main', branchName: 'main', timestamp: 2000,
        data: { nodes: [{ id: 'node-x', label: 'MAIN' }], edges: [] } },
    ]);
    mockListSnapshotsFromDB.mockResolvedValueOnce([
      { id: 'feat-snap', name: 'feature', branchName: 'feature', timestamp: 1000,
        data: { nodes: [{ id: 'node-x', label: 'FEATURE' }], edges: [] } },
    ]);

    await useCanvasHistoryStore.getState().autoMergeBranch('canvas-1', 'feature', 'main');

    const conflicts = useCanvasHistoryStore.getState().pendingConflicts;
    expect(conflicts).toHaveLength(1);
    const conflict = conflicts[0];
    expect(conflict.nodeId).toBe('node-x');
    expect(conflict.localBranch).toBe('feature');
    expect(conflict.remoteBranch).toBe('main');
    expect(conflict.localData).toEqual({ id: 'node-x', label: 'FEATURE' });
    expect(conflict.remoteData).toEqual({ id: 'node-x', label: 'MAIN' });
    expect(conflict.id).toBeDefined();
    expect(typeof conflict.id).toBe('string');
  });
});
