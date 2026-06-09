/**
 * canvasHistoryStore.e5.test.ts — S82-E5: resolveConflict method
 * Tests: resolveConflict(branchId, strategy) with 'auto-merge'/'keep-mine'/'keep-theirs' strategies
 *
 * Required: ≥5 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasHistoryStore } from '../canvasHistoryStore';

// jsdom has no indexedDB — mock window.indexedDB to prevent early return
Object.defineProperty(globalThis, 'indexedDB', {
  value: { open: () => ({ result: { transaction: () => ({ objectStore: () => ({}) }) } }) },
  writable: true,
  configurable: true,
});

// Mock historyDB module
const { mockMergeBranchInDB, mockListSnapshotsFromDB } = vi.hoisted(() => ({
  mockMergeBranchInDB: vi.fn(),
  mockListSnapshotsFromDB: vi.fn(),
}));

vi.mock('@/lib/canvas/historyDB', () => ({
  mergeBranchInDB: mockMergeBranchInDB,
  listSnapshotsFromDB: mockListSnapshotsFromDB,
}));

describe('canvasHistoryStore — S82-E5 resolveConflict', () => {
  beforeEach(() => {
    // Reset store state
    useCanvasHistoryStore.setState({
      pendingConflicts: [],
      past: [],
      future: [],
      currentBranch: 'main',
    });
    vi.clearAllMocks();
    mockMergeBranchInDB.mockResolvedValue(undefined);
    mockListSnapshotsFromDB.mockResolvedValue([]);
  });

  // TC-E5-01: resolveConflict returns error when no pending conflicts exist
  it('returns error when no pending conflicts exist', async () => {
    const store = useCanvasHistoryStore.getState();
    const result = await store.resolveConflict('canvas-1', 'auto-merge');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('No pending conflicts to resolve');
  });

  // TC-E5-02: keep-mine strategy clears pendingConflicts
  it('keep-mine strategy clears pendingConflicts', async () => {
    useCanvasHistoryStore.setState({
      pendingConflicts: [
        {
          id: 'conflict-1',
          nodeId: 'node-1',
          localBranch: 'feature-a',
          remoteBranch: 'main',
          localData: { label: 'Local' },
          remoteData: { label: 'Remote' },
          detectedAt: Date.now(),
        },
      ],
    });
    const store = useCanvasHistoryStore.getState();
    const result = await store.resolveConflict('canvas-1', 'keep-mine');
    expect(result.ok).toBe(true);
    expect(useCanvasHistoryStore.getState().pendingConflicts).toEqual([]);
  });

  // TC-E5-03: keep-theirs strategy clears pendingConflicts and clears history
  it('keep-theirs strategy clears pendingConflicts and past/future', async () => {
    useCanvasHistoryStore.setState({
      pendingConflicts: [
        {
          id: 'conflict-2',
          nodeId: 'node-2',
          localBranch: 'feature-b',
          remoteBranch: 'main',
          localData: { label: 'Local B' },
          remoteData: { label: 'Remote B' },
          detectedAt: Date.now(),
        },
      ],
      past: [{ id: 'cmd-1', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() }],
      future: [{ id: 'cmd-2', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() }],
    });
    const store = useCanvasHistoryStore.getState();
    const result = await store.resolveConflict('canvas-1', 'keep-theirs');
    expect(result.ok).toBe(true);
    expect(useCanvasHistoryStore.getState().pendingConflicts).toEqual([]);
    expect(useCanvasHistoryStore.getState().past).toEqual([]);
    expect(useCanvasHistoryStore.getState().future).toEqual([]);
  });

  // TC-E5-04: auto-merge strategy calls mergeBranchInDB when snapshot exists
  it('auto-merge strategy calls mergeBranchInDB with current branch', async () => {
    const mockSnapshot = {
      id: 'snap-1',
      name: 'latest',
      timestamp: Date.now(),
      data: { nodes: [], edges: [] },
      branchName: 'main',
    };
    mockListSnapshotsFromDB.mockResolvedValue([mockSnapshot]);

    useCanvasHistoryStore.setState({
      pendingConflicts: [
        {
          id: 'conflict-3',
          nodeId: 'node-3',
          localBranch: 'feature-c',
          remoteBranch: 'main',
          localData: { label: 'Local C' },
          remoteData: { label: 'Remote C' },
          detectedAt: Date.now(),
        },
      ],
      currentBranch: 'main',
    });
    const store = useCanvasHistoryStore.getState();
    const result = await store.resolveConflict('canvas-1', 'auto-merge');
    expect(result.ok).toBe(true);
    expect(mockMergeBranchInDB).toHaveBeenCalledWith('canvas-1', 'main', 'main', 'snap-1');
    expect(useCanvasHistoryStore.getState().pendingConflicts).toEqual([]);
  });

  // TC-E5-05: auto-merge still clears conflicts when no snapshot exists
  it('auto-merge clears conflicts even when no snapshot found', async () => {
    mockListSnapshotsFromDB.mockResolvedValue([]);

    useCanvasHistoryStore.setState({
      pendingConflicts: [
        {
          id: 'conflict-4',
          nodeId: 'node-4',
          localBranch: 'feature-d',
          remoteBranch: 'main',
          localData: { label: 'Local D' },
          remoteData: { label: 'Remote D' },
          detectedAt: Date.now(),
        },
      ],
      currentBranch: 'feature-d',
    });
    const store = useCanvasHistoryStore.getState();
    const result = await store.resolveConflict('canvas-1', 'auto-merge');
    expect(result.ok).toBe(true);
    // mergeBranchInDB should not be called without a target snapshot
    expect(mockMergeBranchInDB).not.toHaveBeenCalled();
    expect(useCanvasHistoryStore.getState().pendingConflicts).toEqual([]);
  });

  // TC-E5-06: keep-mine preserves past/future history
  it('keep-mine strategy preserves past and future history', async () => {
    const pastCmd = { id: 'cmd-past', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };
    const futureCmd = { id: 'cmd-future', execute: vi.fn(), rollback: vi.fn(), timestamp: Date.now() };

    useCanvasHistoryStore.setState({
      pendingConflicts: [
        {
          id: 'conflict-5',
          nodeId: 'node-5',
          localBranch: 'feature-e',
          remoteBranch: 'main',
          localData: { label: 'Local E' },
          remoteData: { label: 'Remote E' },
          detectedAt: Date.now(),
        },
      ],
      past: [pastCmd],
      future: [futureCmd],
    });
    const store = useCanvasHistoryStore.getState();
    const result = await store.resolveConflict('canvas-1', 'keep-mine');
    expect(result.ok).toBe(true);
    // Past and future should be preserved (keep-local = keep the local history)
    expect(useCanvasHistoryStore.getState().past).toHaveLength(1);
    expect(useCanvasHistoryStore.getState().future).toHaveLength(1);
  });
});
