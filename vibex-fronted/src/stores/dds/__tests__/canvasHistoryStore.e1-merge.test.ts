/**
 * canvasHistoryStore.e1-merge.test.ts — Sprint70 E1: Branch Merge & Conflict Resolution
 * Tests: mergeBranch action, pendingConflicts state, resolveBranchConflict, clearPendingConflicts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock IndexedDB
const mockDB = {
  put: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  delete: vi.fn().mockResolvedValue(undefined),
  getAll: vi.fn().mockResolvedValue([]),
  createObjectStore: vi.fn(),
  transaction: vi.fn(),
  objectStoreNames: { contains: () => false },
};
const mockReq = { result: mockDB, onsuccess: null, onerror: null };
vi.stubGlobal('indexedDB', {
  open: vi.fn(() => { setTimeout(() => mockReq.onsuccess && mockReq.onsuccess(), 0); return mockReq; }),
  deleteDatabase: vi.fn(),
});

const mockMergeBranchInDB = vi.fn().mockResolvedValue(undefined);
const mockListSnapshotsFromDB = vi.fn().mockResolvedValue([]);

// Reset modules before each test
beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.doMock('@/lib/canvas/historyDB', () => ({
    mergeBranchInDB: mockMergeBranchInDB,
    listSnapshotsFromDB: mockListSnapshotsFromDB,
    saveSnapshotToDB: vi.fn().mockResolvedValue('snap-1'),
    getSnapshotFromDB: vi.fn().mockResolvedValue({
      id: 'snap-1', canvasId: 'c1', branch: 'main', label: 'Test',
      nodeData: { nodes: [], edges: [] }, createdAt: Date.now(),
    }),
    listSnapshotsFromDB: mockListSnapshotsFromDB,
  }));
});

describe('E1 Branch Merge — mergeBranch action', () => {
  it('mergeBranch should call mergeBranchInDB with correct args', async () => {
    const { createCanvasHistoryStore } = await import('@/stores/dds/canvasHistoryStore');
    const store = createCanvasHistoryStore.getState();

    await store.mergeBranch('canvas-1', 'feature-branch', 'main');

    expect(mockMergeBranchInDB).toHaveBeenCalledWith(
      'canvas-1', 'feature-branch', 'main', null
    );
  });

  it('mergeBranch should set pendingConflicts on conflict', async () => {
    mockMergeBranchInDB.mockRejectedValueOnce(
      new Error('MERGE_CONFLICT:node-1,node-2')
    );

    const { createCanvasHistoryStore } = await import('@/stores/dds/canvasHistoryStore');
    const store = createCanvasHistoryStore.getState();

    await expect(
      store.mergeBranch('canvas-1', 'feature-branch', 'main')
    ).rejects.toThrow('MERGE_CONFLICT');

    const { pendingConflicts } = store.getState();
    expect(pendingConflicts).toHaveLength(2);
    expect(pendingConflicts[0]).toMatchObject({
      nodeId: 'node-1',
      canvasId: 'canvas-1',
      sourceBranch: 'feature-branch',
      targetBranch: 'main',
    });
  });

  it('resolveBranchConflict should remove one conflict from pendingConflicts', async () => {
    mockMergeBranchInDB.mockRejectedValueOnce(
      new Error('MERGE_CONFLICT:node-1,node-2')
    );

    const { createCanvasHistoryStore } = await import('@/stores/dds/canvasHistoryStore');
    const store = createCanvasHistoryStore.getState();

    await expect(
      store.mergeBranch('canvas-1', 'feature-branch', 'main')
    ).rejects.toThrow('MERGE_CONFLICT');

    expect(store.getState().pendingConflicts).toHaveLength(2);

    await store.resolveBranchConflict('canvas-1', 'node-1', 'keep-local');
    expect(store.getState().pendingConflicts).toHaveLength(1);
    expect(store.getState().pendingConflicts[0].nodeId).toBe('node-2');
  });

  it('clearPendingConflicts should empty pendingConflicts array', async () => {
    mockMergeBranchInDB.mockRejectedValueOnce(
      new Error('MERGE_CONFLICT:node-1')
    );

    const { createCanvasHistoryStore } = await import('@/stores/dds/canvasHistoryStore');
    const store = createCanvasHistoryStore.getState();

    await expect(
      store.mergeBranch('canvas-1', 'feature-branch', 'main')
    ).rejects.toThrow('MERGE_CONFLICT');

    expect(store.getState().pendingConflicts).toHaveLength(1);
    store.clearPendingConflicts();
    expect(store.getState().pendingConflicts).toHaveLength(0);
  });
});
