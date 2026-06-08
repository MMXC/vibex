/**
 * canvasHistoryStore.e3-merge-history.test.ts — Sprint80 E3: Merge History Enriched
 * Tests: MergeHistoryEntry enriched fields (mergedNodeIds, conflictCount, authorIds)
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
const { mockSaveMergeHistoryToDB, mockListMergeHistoryFromDB, mockClearMergeHistoryFromDB } = vi.hoisted(() => ({
  mockSaveMergeHistoryToDB: vi.fn(),
  mockListMergeHistoryFromDB: vi.fn(),
  mockClearMergeHistoryFromDB: vi.fn(),
}));

vi.mock('@/lib/canvas/historyDB', () => ({
  saveMergeHistoryToDB: mockSaveMergeHistoryToDB,
  listMergeHistoryFromDB: mockListMergeHistoryFromDB,
  clearMergeHistoryFromDB: mockClearMergeHistoryFromDB,
}));

describe('E3 MergeHistoryEntry enriched fields (Sprint80)', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({ mergeHistory: [] });
    vi.clearAllMocks();
    mockSaveMergeHistoryToDB.mockResolvedValue(undefined);
    mockListMergeHistoryFromDB.mockResolvedValue([]);
  });

  it('recordMerge stores mergedNodeIds', async () => {
    const store = useCanvasHistoryStore.getState();
    await store.recordMerge({
      canvasId: 'canvas-1',
      sourceBranch: 'feature-a',
      targetBranch: 'main',
      mergedNodeIds: ['node-1', 'node-2', 'node-3'],
      mergedBy: 'user-1',
    });

    expect(mockSaveMergeHistoryToDB).toHaveBeenCalledTimes(1);
    const saved = mockSaveMergeHistoryToDB.mock.calls[0][0];
    expect(saved.mergedNodeIds).toEqual(['node-1', 'node-2', 'node-3']);
  });

  it('recordMerge stores conflictCount', async () => {
    const store = useCanvasHistoryStore.getState();
    await store.recordMerge({
      canvasId: 'canvas-1',
      sourceBranch: 'feature-b',
      targetBranch: 'main',
      conflictCount: 3,
      mergedBy: 'user-2',
    });

    expect(mockSaveMergeHistoryToDB).toHaveBeenCalledTimes(1);
    const saved = mockSaveMergeHistoryToDB.mock.calls[0][0];
    expect(saved.conflictCount).toBe(3);
  });

  it('recordMerge stores authorIds', async () => {
    const store = useCanvasHistoryStore.getState();
    await store.recordMerge({
      canvasId: 'canvas-1',
      sourceBranch: 'feature-c',
      targetBranch: 'main',
      authorIds: ['alice', 'bob', 'charlie'],
      mergedBy: 'user-3',
    });

    expect(mockSaveMergeHistoryToDB).toHaveBeenCalledTimes(1);
    const saved = mockSaveMergeHistoryToDB.mock.calls[0][0];
    expect(saved.authorIds).toEqual(['alice', 'bob', 'charlie']);
  });

  it('recordMerge stores all enriched fields together', async () => {
    const store = useCanvasHistoryStore.getState();
    await store.recordMerge({
      canvasId: 'canvas-1',
      sourceBranch: 'feature-d',
      targetBranch: 'main',
      mergedNodeIds: ['n1', 'n2'],
      conflictCount: 1,
      authorIds: ['u1', 'u2'],
      mergedBy: 'user-4',
    });

    expect(mockSaveMergeHistoryToDB).toHaveBeenCalledTimes(1);
    const saved = mockSaveMergeHistoryToDB.mock.calls[0][0];
    expect(saved.mergedNodeIds).toEqual(['n1', 'n2']);
    expect(saved.conflictCount).toBe(1);
    expect(saved.authorIds).toEqual(['u1', 'u2']);
  });
});
