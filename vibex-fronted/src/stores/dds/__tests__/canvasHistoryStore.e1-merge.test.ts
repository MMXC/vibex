/**
 * canvasHistoryStore.e1-merge.test.ts — Sprint70 E1: Branch Merge & Conflict Resolution
 * Tests: mergeBranch action, pendingConflicts state, resolveBranchConflict, clearPendingConflicts
 * Pattern: vi.hoisted() for dynamic await import() mocking (confirmed 2026-06-10)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasHistoryStore } from '../canvasHistoryStore';

// jsdom has no indexedDB → store returns early without calling dynamic import
Object.defineProperty(globalThis, 'indexedDB', {
  value: { open: () => ({ result: { transaction: () => ({ objectStore: () => ({}) }) } }) },
  writable: true,
  configurable: true,
});

// vi.hoisted: shared mock refs accessible from mock factory AND test body
const { mockMergeBranchInDB, mockListSnapshotsFromDB } = vi.hoisted(() => ({
  mockMergeBranchInDB: vi.fn(),
  mockListSnapshotsFromDB: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/canvas/historyDB', () => ({
  mergeBranchInDB: mockMergeBranchInDB,
  listSnapshotsFromDB: mockListSnapshotsFromDB,
}));

describe('E1 Branch Merge — mergeBranch action (Sprint70)', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({
      past: [],
      future: [],
      isPerforming: false,
      snapshots: [],
      pendingConflicts: [],
      currentBranch: 'feature-branch',
      restoringSnapshotId: null,
    });
    vi.clearAllMocks();
    mockMergeBranchInDB.mockResolvedValue(undefined);
    mockListSnapshotsFromDB.mockResolvedValue([]);
  });

  it('mergeBranch should call mergeBranchInDB with correct args', async () => {
    mockListSnapshotsFromDB.mockResolvedValueOnce([
      { id: 'snap-target', canvasId: 'canvas-1', branch: 'main', timestamp: Date.now() }
    ]);
    const store = useCanvasHistoryStore.getState();
    await store.mergeBranch('canvas-1', 'feature-branch', 'main');
    expect(mockMergeBranchInDB).toHaveBeenCalledWith(
      'canvas-1', 'feature-branch', 'main', 'snap-target'
    );
  });

  it('mergeBranch should refresh snapshots after success', async () => {
    const mockSnaps = [
      { id: 'snap-target', canvasId: 'canvas-1', branch: 'main', timestamp: Date.now() },
      { id: 'snap-new', canvasId: 'canvas-1', branch: 'main', timestamp: Date.now() + 100 },
    ];
    mockListSnapshotsFromDB
      .mockResolvedValueOnce([mockSnaps[0]])
      .mockResolvedValueOnce([mockSnaps[1]]);
    const store = useCanvasHistoryStore.getState();
    await store.mergeBranch('canvas-1', 'feature-branch', 'main');
    const { snapshots } = useCanvasHistoryStore.getState();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].id).toBe('snap-new');
  });

  it('resolveBranchConflict should remove one conflict from pendingConflicts', async () => {
    const conflicts = [
      { id: 'c1', nodeId: 'node-1', canvasId: 'canvas-1', localBranch: 'fb', remoteBranch: 'main',
        localData: null, remoteData: null, detectedAt: Date.now() },
      { id: 'c2', nodeId: 'node-2', canvasId: 'canvas-1', localBranch: 'fb', remoteBranch: 'main',
        localData: null, remoteData: null, detectedAt: Date.now() },
    ];
    useCanvasHistoryStore.setState({ pendingConflicts: conflicts });
    const store = useCanvasHistoryStore.getState();
    expect(useCanvasHistoryStore.getState().pendingConflicts).toHaveLength(2);
    await store.resolveBranchConflict('canvas-1', 'node-1', 'keep-local');
    const remaining = useCanvasHistoryStore.getState().pendingConflicts;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].nodeId).toBe('node-2');
  });

  it('clearPendingConflicts should empty pendingConflicts array', async () => {
    const conflicts = [
      { id: 'c1', nodeId: 'node-1', canvasId: 'canvas-1', localBranch: 'fb', remoteBranch: 'main',
        localData: null, remoteData: null, detectedAt: Date.now() },
    ];
    useCanvasHistoryStore.setState({ pendingConflicts: conflicts });
    const store = useCanvasHistoryStore.getState();
    expect(useCanvasHistoryStore.getState().pendingConflicts).toHaveLength(1);
    store.clearPendingConflicts();
    expect(useCanvasHistoryStore.getState().pendingConflicts).toHaveLength(0);
  });

  it('setCurrentBranch should update currentBranch state', async () => {
    const store = useCanvasHistoryStore.getState();
    expect(store.currentBranch).toBe('feature-branch');
    store.setCurrentBranch('main');
    expect(useCanvasHistoryStore.getState().currentBranch).toBe('main');
  });
});
