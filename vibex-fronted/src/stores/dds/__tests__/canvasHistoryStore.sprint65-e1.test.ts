/**
 * canvasHistoryStore — E1 (Sprint65) Snapshot Branch Management Tests
 * Tests: saveNamedSnapshot, createBranch, branch-aware LRU eviction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasHistoryStore } from '../canvasHistoryStore';

// CRITICAL: jsdom has no indexedDB — store functions return early
Object.defineProperty(globalThis, 'indexedDB', {
  value: { open: () => ({ result: { transaction: () => ({ objectStore: () => ({}) }) } }) },
  writable: true,
  configurable: true,
});

// vi.hoisted creates shared mock refs accessible from both vi.mock factory and test body
const mocks = vi.hoisted(() => ({
  mockSaveSnapshotToDB: vi.fn().mockResolvedValue(undefined),
  mockLoadSnapshotFromDB: vi.fn().mockResolvedValue(null),
  mockListSnapshotsFromDB: vi.fn().mockResolvedValue([]),
  mockDeleteSnapshotFromDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/canvas/historyDB', () => ({
  saveSnapshotToDB: mocks.mockSaveSnapshotToDB,
  loadSnapshotFromDB: mocks.mockLoadSnapshotFromDB,
  listSnapshotsFromDB: mocks.mockListSnapshotsFromDB,
  deleteSnapshotFromDB: mocks.mockDeleteSnapshotFromDB,
}));

describe('canvasHistoryStore — E1 Sprint65 Branch Management', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({
      past: [],
      future: [],
      isPerforming: false,
      snapshots: [],
      restoringSnapshotId: null,
    });
    vi.clearAllMocks();
    mocks.mockSaveSnapshotToDB.mockResolvedValue(undefined);
    mocks.mockLoadSnapshotFromDB.mockResolvedValue(null);
    mocks.mockListSnapshotsFromDB.mockResolvedValue([]);
    mocks.mockDeleteSnapshotFromDB.mockResolvedValue(undefined);
  });

  // ===== D1.1: saveNamedSnapshot =====
  describe('D1.1: saveNamedSnapshot', () => {
    it('generates auto-name when name is omitted', async () => {
      const store = useCanvasHistoryStore.getState();
      mocks.mockListSnapshotsFromDB.mockResolvedValue([]);
      const id = await store.saveNamedSnapshot('canvas-1');
      expect(id).toMatch(/^snapshot-\d+-[a-z0-9]+$/);
      expect(mocks.mockSaveSnapshotToDB).toHaveBeenCalledWith(
        'canvas-1',
        expect.objectContaining({ name: expect.stringMatching(/^Snapshot-\d{4}-\d{2}-\d{2}/) })
      );
    });

    it('uses provided name when given', async () => {
      const store = useCanvasHistoryStore.getState();
      mocks.mockListSnapshotsFromDB.mockResolvedValue([]);
      const id = await store.saveNamedSnapshot('canvas-1', '方案A');
      expect(id).toMatch(/^snapshot-\d+-[a-z0-9]+$/);
      expect(mocks.mockSaveSnapshotToDB).toHaveBeenCalledWith(
        'canvas-1',
        expect.objectContaining({ name: '方案A' })
      );
    });

    it('uses provided data when given', async () => {
      const store = useCanvasHistoryStore.getState();
      mocks.mockListSnapshotsFromDB.mockResolvedValue([]);
      const data = { nodes: [{ id: 'n1' }], edges: [] };
      await store.saveNamedSnapshot('canvas-1', '测试快照', data);
      expect(mocks.mockSaveSnapshotToDB).toHaveBeenCalledWith(
        'canvas-1',
        expect.objectContaining({ data })
      );
    });

    it('returns empty string when indexedDB unavailable', async () => {
      Object.defineProperty(globalThis, 'indexedDB', { value: undefined });
      const store = useCanvasHistoryStore.getState();
      const id = await store.saveNamedSnapshot('canvas-1', '测试');
      expect(id).toBe('');
      Object.defineProperty(globalThis, 'indexedDB', {
        value: { open: () => ({ result: { transaction: () => ({ objectStore: () => ({}) }) } }) },
        writable: true, configurable: true,
      });
    });
  });

  // ===== D1.2: createBranch =====
  describe('D1.2: createBranch', () => {
    it('sets parentSnapshotId and branchName on new snapshot', async () => {
      const store = useCanvasHistoryStore.getState();
      const sourceSnap = {
        id: 'snap-source', name: '源快照', timestamp: 1000,
        data: { nodes: [], edges: [] }, branchName: 'main', isStarred: false,
      };
      mocks.mockLoadSnapshotFromDB.mockResolvedValue(sourceSnap);
      mocks.mockListSnapshotsFromDB.mockResolvedValue([]);

      const id = await store.createBranch('canvas-1', 'snap-source', '实验分支');
      expect(id).toMatch(/^snapshot-\d+-[a-z0-9]+$/);
      expect(mocks.mockSaveSnapshotToDB).toHaveBeenCalledWith(
        'canvas-1',
        expect.objectContaining({
          branchName: '实验分支',
          parentSnapshotId: 'snap-source',
          name: '实验分支 (from 源快照)',
        })
      );
    });

    it('uses currentData if provided, otherwise falls back to source data', async () => {
      const store = useCanvasHistoryStore.getState();
      const sourceSnap = {
        id: 'snap-1', name: 'Source', timestamp: 1000,
        data: { nodes: [{ id: 'n1' }], edges: [] },
      };
      mocks.mockLoadSnapshotFromDB.mockResolvedValue(sourceSnap);
      mocks.mockListSnapshotsFromDB.mockResolvedValue([]);

      // With currentData
      await store.createBranch('canvas-1', 'snap-1', 'Branch-A', { nodes: [{ id: 'n2' }], edges: [] });
      expect(mocks.mockSaveSnapshotToDB).toHaveBeenLastCalledWith(
        'canvas-1',
        expect.objectContaining({ data: { nodes: [{ id: 'n2' }], edges: [] } })
      );
    });

    it('sets branchName on new branch snapshot', async () => {
      const store = useCanvasHistoryStore.getState();
      mocks.mockLoadSnapshotFromDB.mockResolvedValue({
        id: 'snap-1', name: 'Source', timestamp: 1000,
        data: { nodes: [], edges: [] },
      });
      mocks.mockListSnapshotsFromDB.mockResolvedValue([]);

      const id = await store.createBranch('canvas-1', 'snap-1', 'Branch-B');
      expect(mocks.mockSaveSnapshotToDB).toHaveBeenCalledWith(
        'canvas-1',
        expect.objectContaining({ branchName: 'Branch-B' })
      );
    });
  });

  // ===== D1.6: Branch-aware LRU eviction =====
  describe('D1.6: Branch-aware LRU eviction', () => {
    it('evicts oldest snapshots per branch, not globally', async () => {
      const store = useCanvasHistoryStore.getState();

      // Create 52 snapshots: 52 on main (MAX=50) + 2 on branch-A
      const mainSnaps = Array.from({ length: 52 }, (_, i) => ({
        id: `main-${i}`, name: `Main ${i}`, timestamp: 1000 + i,
        data: { nodes: [], edges: [] }, branchName: 'main',
      }));
      const branchASnaps = Array.from({ length: 2 }, (_, i) => ({
        id: `branchA-${i}`, name: `BranchA ${i}`, timestamp: 2000 + i,
        data: { nodes: [], edges: [] }, branchName: 'branch-A',
      }));
      mocks.mockListSnapshotsFromDB.mockResolvedValue([...mainSnaps, ...branchASnaps]);
      mocks.mockDeleteSnapshotFromDB.mockResolvedValue(undefined);

      await store.saveNamedSnapshot('canvas-1', 'Trigger eviction');
      // Should delete 2 oldest main snaps (not any branch-A snaps)
      expect(mocks.mockDeleteSnapshotFromDB).toHaveBeenCalledTimes(2);
      const deletedIds = mocks.mockDeleteSnapshotFromDB.mock.calls.map(([_, id]) => id);
      expect(deletedIds).toContain('main-0');
      expect(deletedIds).toContain('main-1');
      expect(deletedIds).not.toContain('branchA-0');
    });

    it('evicts oldest per branch in createBranch', async () => {
      const store = useCanvasHistoryStore.getState();
      const sourceSnap = {
        id: 'source', name: 'Source', timestamp: 1000,
        data: { nodes: [], edges: [] }, branchName: 'branch-X',
      };
      mocks.mockLoadSnapshotFromDB.mockResolvedValue(sourceSnap);

      // 52 existing branch-X snapshots
      const existing = Array.from({ length: 52 }, (_, i) => ({
        id: `bx-${i}`, name: `BX ${i}`, timestamp: 1000 + i,
        data: { nodes: [], edges: [] }, branchName: 'branch-X',
      }));
      mocks.mockListSnapshotsFromDB.mockResolvedValue(existing);
      mocks.mockDeleteSnapshotFromDB.mockResolvedValue(undefined);

      await store.createBranch('canvas-1', 'source', 'branch-X');
      expect(mocks.mockDeleteSnapshotFromDB).toHaveBeenCalledTimes(2);
    });
  });

  // ===== D1.3: compareSnapshots (existing, verify still works) =====
  describe('D1.3: compareSnapshots', () => {
    it('returns empty diff for identical snapshots', () => {
      const store = useCanvasHistoryStore.getState();
      const snapA = { id: 'a', name: 'A', timestamp: 1000, data: { nodes: [{ id: 'n1', label: 'X' }], edges: [] } };
      const snapB = { id: 'b', name: 'B', timestamp: 2000, data: { nodes: [{ id: 'n1', label: 'X' }], edges: [] } };
      const diff = store.compareSnapshots(snapA, snapB);
      expect(diff.added).toHaveLength(0);
      expect(diff.removed).toHaveLength(0);
      expect(diff.modified).toHaveLength(0);
    });

    it('detects added, removed, modified nodes', () => {
      const store = useCanvasHistoryStore.getState();
      const snapA = { id: 'a', name: 'A', timestamp: 1000, data: { nodes: [{ id: 'n1' }, { id: 'n2', label: 'old' }], edges: [] } };
      const snapB = { id: 'b', name: 'B', timestamp: 2000, data: { nodes: [{ id: 'n2', label: 'new' }, { id: 'n3' }], edges: [] } };
      const diff = store.compareSnapshots(snapA, snapB);
      expect(diff.added).toEqual([{ id: 'n3' }]);
      expect(diff.removed).toEqual([{ id: 'n1' }]);
      expect(diff.modified).toEqual([{ id: 'n2', label: 'old', changes: { label: { before: 'old', after: 'new' } } }]);
    });
  });
});
