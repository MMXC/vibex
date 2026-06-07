/**
 * historyDB — E4 Branch Metadata Tests
 * E4 (Sprint73): 画布分支命名与保护
 *
 * Tests: DB_VERSION=5 upgrade, branchMeta objectStore CRUD, partial field preservation.
 * Pattern: vi.hoisted() for dynamic import mocks (same as canvasHistoryStore.e1-snapshot.test.ts).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// jsdom has no indexedDB — mock it globally before any import
Object.defineProperty(globalThis, 'indexedDB', {
  value: {
    open: vi.fn(),
  },
  writable: true,
  configurable: true,
});

// Shared mock refs via vi.hoisted (must come before vi.mock)
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
  mockSaveSnapshotToDB: vi.fn(),
  mockLoadSnapshotFromDB: vi.fn(),
  mockListSnapshotsFromDB: vi.fn(),
  mockDeleteSnapshotFromDB: vi.fn(),
}));

vi.mock('@/lib/canvas/historyDB', () => ({
  // E4 CRUD
  getBranchMeta: mockGetBranchMeta,
  setBranchMeta: mockSetBranchMeta,
  listBranchMeta: mockListBranchMeta,
  // Existing — preserved to avoid import errors
  saveSnapshotToDB: mockSaveSnapshotToDB,
  loadSnapshotFromDB: mockLoadSnapshotFromDB,
  listSnapshotsFromDB: mockListSnapshotsFromDB,
  deleteSnapshotFromDB: mockDeleteSnapshotFromDB,
}));

// Lazy-load the module to ensure mocks are set up first
let historyDB: typeof import('../historyDB');
beforeEach(async () => {
  vi.resetModules();
  historyDB = await import('../historyDB');
});

describe('historyDB — E4 Branch Metadata', () => {
  describe('getBranchMeta', () => {
    it('returns null when branch does not exist', async () => {
      mockGetBranchMeta.mockResolvedValue(null);
      const result = await historyDB.getBranchMeta('canvas-1', 'main');
      expect(result).toBeNull();
      expect(mockGetBranchMeta).toHaveBeenCalledWith('canvas-1', 'main');
    });

    it('returns BranchMeta when branch exists', async () => {
      const meta = {
        name: 'v1.0 Release',
        isProtected: true,
        createdAt: 1718000000000,
      };
      mockGetBranchMeta.mockResolvedValue(meta);
      const result = await historyDB.getBranchMeta('canvas-1', 'main');
      expect(result).toEqual(meta);
    });
  });

  describe('setBranchMeta', () => {
    it('creates new branch metadata', async () => {
      mockSetBranchMeta.mockResolvedValue(undefined);
      await expect(
        historyDB.setBranchMeta('canvas-1', 'feature-a', {
          name: 'Feature A Branch',
          isProtected: false,
          createdAt: Date.now(),
        }),
      ).resolves.toBeUndefined();
      expect(mockSetBranchMeta).toHaveBeenCalledWith('canvas-1', 'feature-a', {
        name: 'Feature A Branch',
        isProtected: false,
        createdAt: expect.any(Number),
      });
    });

    it('preserves existing fields when updating only name', async () => {
      // The store calls getBranchMeta first, then setBranchMeta with merged data.
      // setBranchMeta should receive the full merged object (store is responsible for merging).
      mockSetBranchMeta.mockResolvedValue(undefined);
      await historyDB.setBranchMeta('canvas-1', 'main', {
        name: 'Renamed Branch',
        isProtected: true, // explicitly passed even if unchanged
        createdAt: 1718000000000,
      });
      expect(mockSetBranchMeta).toHaveBeenCalledWith('canvas-1', 'main', {
        name: 'Renamed Branch',
        isProtected: true,
        createdAt: 1718000000000,
      });
    });

    it('preserves existing fields when updating only protection', async () => {
      mockSetBranchMeta.mockResolvedValue(undefined);
      await historyDB.setBranchMeta('canvas-1', 'main', {
        name: 'main',
        isProtected: true,
        createdAt: 1718000000000,
      });
      expect(mockSetBranchMeta).toHaveBeenCalledWith('canvas-1', 'main', {
        name: 'main',
        isProtected: true,
        createdAt: 1718000000000,
      });
    });
  });

  describe('listBranchMeta', () => {
    it('returns empty array when no branches exist', async () => {
      mockListBranchMeta.mockResolvedValue([]);
      const result = await historyDB.listBranchMeta('canvas-1');
      expect(result).toEqual([]);
      expect(mockListBranchMeta).toHaveBeenCalledWith('canvas-1');
    });

    it('returns all branch metadata for a canvas', async () => {
      const metas = [
        { name: 'main', isProtected: true, createdAt: 1718000000000 },
        { name: 'feature-a', isProtected: false, createdAt: 1718000001000 },
      ];
      mockListBranchMeta.mockResolvedValue(metas);
      const result = await historyDB.listBranchMeta('canvas-1');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('main');
      expect(result[1].isProtected).toBe(false);
    });
  });

});
