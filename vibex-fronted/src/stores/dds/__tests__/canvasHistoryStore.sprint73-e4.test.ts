/**
 * canvasHistoryStore — E4 Branch Metadata Tests
 * E4 (Sprint73): 画布分支命名与保护
 *
 * Tests: setBranchName, setBranchProtected, getBranchMeta — with partial-field
 * preservation (get-before-set pattern). Same vi.hoisted mock pattern as
 * canvasHistoryStore.e1-snapshot.test.ts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasHistoryStore } from '../canvasHistoryStore';

Object.defineProperty(globalThis, 'indexedDB', {
  value: { open: () => ({ result: { transaction: () => ({ objectStore: () => ({}) }) } }) },
  writable: true,
  configurable: true,
});

const {
  mockGetBranchMeta,
  mockSetBranchMeta,
  mockListBranchMeta,
  mockSaveSnapshotToDB,
  mockLoadSnapshotFromDB,
  mockListSnapshotsFromDB,
  mockDeleteSnapshotFromDB,
} = vi.hoisted(() => ({
  mockGetBranchMeta: vi.fn(),
  mockSetBranchMeta: vi.fn(),
  mockListBranchMeta: vi.fn(),
  mockSaveSnapshotToDB: vi.fn().mockResolvedValue(undefined),
  mockLoadSnapshotFromDB: vi.fn().mockResolvedValue(null),
  mockListSnapshotsFromDB: vi.fn().mockResolvedValue([]),
  mockDeleteSnapshotFromDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/canvas/historyDB', () => ({
  getBranchMeta: mockGetBranchMeta,
  setBranchMeta: mockSetBranchMeta,
  listBranchMeta: mockListBranchMeta,
  saveSnapshotToDB: mockSaveSnapshotToDB,
  loadSnapshotFromDB: mockLoadSnapshotFromDB,
  listSnapshotsFromDB: mockListSnapshotsFromDB,
  deleteSnapshotFromDB: mockDeleteSnapshotFromDB,
}));

describe('canvasHistoryStore — E4 Branch Metadata (Sprint73)', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({
      past: [],
      future: [],
      isPerforming: false,
      snapshots: [],
      restoringSnapshotId: null,
    });
    vi.clearAllMocks();
    mockSetBranchMeta.mockResolvedValue(undefined);
    mockListBranchMeta.mockResolvedValue([]);
  });

  describe('setBranchName', () => {
    it('updates branch name in DB', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'old-name',
        isProtected: false,
        createdAt: 1718000000000,
      });
      mockSetBranchMeta.mockResolvedValue(undefined);

      await useCanvasHistoryStore.getState().setBranchName('canvas-1', 'main', 'v1.0 Release');

      expect(mockGetBranchMeta).toHaveBeenCalledWith('canvas-1', 'main');
      expect(mockSetBranchMeta).toHaveBeenCalledWith('canvas-1', 'main', {
        name: 'v1.0 Release',
        isProtected: false, // preserved from existing
        createdAt: 1718000000000, // preserved from existing
      });
    });

    it('creates new metadata when branch has no existing metadata', async () => {
      mockGetBranchMeta.mockResolvedValue(null);
      mockSetBranchMeta.mockResolvedValue(undefined);

      await useCanvasHistoryStore.getState().setBranchName('canvas-1', 'feature-a', 'Feature Branch');

      expect(mockSetBranchMeta).toHaveBeenCalledWith('canvas-1', 'feature-a', {
        name: 'Feature Branch',
        isProtected: false,
        createdAt: expect.any(Number),
      });
    });
  });

  describe('setBranchProtected', () => {
    it('sets isProtected to true while preserving name and createdAt', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'main',
        isProtected: false,
        createdAt: 1718000000000,
      });
      mockSetBranchMeta.mockResolvedValue(undefined);

      await useCanvasHistoryStore.getState().setBranchProtected('canvas-1', 'main', true);

      expect(mockSetBranchMeta).toHaveBeenCalledWith('canvas-1', 'main', {
        name: 'main', // preserved
        isProtected: true,
        createdAt: 1718000000000, // preserved
      });
    });

    it('sets isProtected to false while preserving name', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'Release v1',
        isProtected: true,
        createdAt: 1718000000000,
      });
      mockSetBranchMeta.mockResolvedValue(undefined);

      await useCanvasHistoryStore.getState().setBranchProtected('canvas-1', 'main', false);

      expect(mockSetBranchMeta).toHaveBeenCalledWith('canvas-1', 'main', {
        name: 'Release v1',
        isProtected: false,
        createdAt: 1718000000000,
      });
    });

    it('creates new metadata when branch has no existing metadata', async () => {
      mockGetBranchMeta.mockResolvedValue(null);
      mockSetBranchMeta.mockResolvedValue(undefined);

      await useCanvasHistoryStore.getState().setBranchProtected('canvas-1', 'feature-b', true);

      expect(mockSetBranchMeta).toHaveBeenCalledWith('canvas-1', 'feature-b', {
        name: 'feature-b',
        isProtected: true,
        createdAt: expect.any(Number),
      });
    });
  });

  describe('getBranchMeta', () => {
    it('returns null when no metadata exists', async () => {
      mockGetBranchMeta.mockResolvedValue(null);

      const result = await useCanvasHistoryStore.getState().getBranchMeta('canvas-1', 'main');

      expect(result).toBeNull();
      expect(mockGetBranchMeta).toHaveBeenCalledWith('canvas-1', 'main');
    });

    it('returns branch metadata when it exists', async () => {
      const meta = { name: 'v1.0', isProtected: true, createdAt: 1718000000000 };
      mockGetBranchMeta.mockResolvedValue(meta);

      const result = await useCanvasHistoryStore.getState().getBranchMeta('canvas-1', 'main');

      expect(result).toEqual(meta);
    });
  });
});
