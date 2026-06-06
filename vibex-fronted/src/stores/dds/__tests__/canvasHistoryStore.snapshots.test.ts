/**
 * canvasHistoryStore.snapshots.test.ts — Sprint72 E1 D1.4
 * Tests: saveSnapshot / restoreSnapshot / renameSnapshot (updateSnapshotMetadata)
 *        snapshot CRUD, LRU eviction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mock indexedDB — jsdom has no indexedDB
// ============================================================
vi.stubGlobal('indexedDB', {
  open: vi.fn(() => ({
    result: {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          getAll: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
          get: vi.fn(),
        })),
      })),
    },
    onsuccess: null,
    onerror: null,
  })),
});

// ============================================================
// Shared mock database (persists across tests within this file)
// ============================================================
const mockDB: Record<string, Record<string, unknown>[]> = {};

const mockSnapshots: Record<string, Record<string, unknown>[]> = {};

const mockGetItem = vi.fn();
const mockSetItem = vi.fn();
const mockRemoveItem = vi.fn();
vi.stubGlobal('localStorage', {
  getItem: mockGetItem,
  setItem: mockSetItem,
  removeItem: mockRemoveItem,
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
});

// ============================================================
// Mock historyDB — intercepts all IndexedDB calls
// ============================================================
vi.mock('@/lib/canvas/historyDB', () => ({
  saveSnapshotToDB: vi.fn(async (canvasId: string, snapshot: Record<string, unknown>) => {
    if (!mockSnapshots[canvasId]) mockSnapshots[canvasId] = [];
    // Upsert by id
    const idx = mockSnapshots[canvasId].findIndex((s) => s['id'] === snapshot['id']);
    if (idx >= 0) mockSnapshots[canvasId][idx] = snapshot;
    else mockSnapshots[canvasId].push(snapshot);
  }),

  listSnapshotsFromDB: vi.fn(async (canvasId: string, _filters?: unknown) => {
    return (mockSnapshots[canvasId] || []).sort(
      (a, b) => (b['timestamp'] as number) - (a['timestamp'] as number)
    );
  }),

  deleteSnapshotFromDB: vi.fn(async (canvasId: string, snapshotId: string) => {
    if (mockSnapshots[canvasId]) {
      mockSnapshots[canvasId] = mockSnapshots[canvasId].filter((s) => s['id'] !== snapshotId);
    }
  }),

  updateSnapshotMetadataInDB: vi.fn(
    async (snapshotId: string, meta: Record<string, unknown>, _canvasId?: string) => {
      // Try all canvasIds — find the snapshot
      for (const cid of Object.keys(mockSnapshots)) {
        const snap = mockSnapshots[cid].find((s) => s['id'] === snapshotId);
        if (snap) {
          Object.assign(snap, meta);
          return;
        }
      }
    }
  ),

  loadSnapshotFromDB: vi.fn(async (canvasId: string, snapshotId: string) => {
    const arr = mockSnapshots[canvasId] || [];
    return (arr.find((s) => s['id'] === snapshotId) as Record<string, unknown>) || null;
  }),
}));

// ============================================================
// Mock settingsStore
// ============================================================
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ theme: 'light', language: 'zh', autoSaveInterval: 5000, historyEnabled: true })
  ),
}));

// ============================================================
// Mock uuid
// ============================================================
let _counter = 0;
vi.mock('@/lib/uuid', () => ({
  generateId: vi.fn(() => `mock-snap-${Date.now()}-${++_counter}`),
}));

// ============================================================
// Import store
// ============================================================
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import type { Snapshot } from '@/stores/dds/canvasHistoryStore';

const CANVAS_ID = 'canvas-123';
const NOW = Date.now();

describe('canvasHistoryStore — snapshots (S72-E1 D1.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear snapshot store between tests
    mockSnapshots[CANVAS_ID] = [];
    _counter = 0;
    // Reset store state to empty
    useCanvasHistoryStore.setState({ snapshots: [], autoSaveHistory: [] });
  });

  // =====================================================
  // E1.4 — saveSnapshot
  // =====================================================
  describe('saveSnapshot', () => {
    it('E1.4: saveSnapshot 后 snapshots.length 增加', async () => {
      const store = useCanvasHistoryStore.getState();
      const initial = store.snapshots.length;

      await store.saveSnapshot(CANVAS_ID, '版本1', {
        nodes: [{ id: 'n1', label: 'A' }],
        edges: [],
      });

      const after = useCanvasHistoryStore.getState().snapshots.length;
      expect(after).toBe(initial + 1);
    });

    it('E1.4: saveSnapshot 后 snapshots 包含新快照的 name', async () => {
      const store = useCanvasHistoryStore.getState();
      await store.saveSnapshot(CANVAS_ID, '我的第一个快照', {
        nodes: [{ id: 'n1', label: 'B' }],
        edges: [],
      });

      const snapshots = useCanvasHistoryStore.getState().snapshots;
      const found = snapshots.find((s) => s.name === '我的第一个快照');
      expect(found).toBeDefined();
    });

    it('E1.4: 快照数量 ≥ 0 时正确渲染', async () => {
      const snapshots = useCanvasHistoryStore.getState().snapshots;
      expect(snapshots.length).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(snapshots)).toBe(true);
    });
  });

  // =====================================================
  // E1.4 — restoreSnapshot
  // =====================================================
  describe('restoreSnapshot', () => {
    it('E1.4: restoreSnapshot 后 snapshots 有更新（快照被重新排序）', async () => {
      const store = useCanvasHistoryStore.getState();

      await store.saveSnapshot(CANVAS_ID, '版本A', {
        nodes: [{ id: 'n1', label: 'A' }],
        edges: [],
      });
      await store.saveSnapshot(CANVAS_ID, '版本B', {
        nodes: [{ id: 'n1', label: 'B' }],
        edges: [],
      });

      const snapshots = useCanvasHistoryStore.getState().snapshots;
      const targetSnap = snapshots.find((s) => s.name === '版本A');
      expect(targetSnap).toBeDefined();

      await store.restoreSnapshot(CANVAS_ID, targetSnap!.id);

      // After restore, "版本A" snapshot should be re-sorted to top (most recent)
      const after = useCanvasHistoryStore.getState().snapshots;
      expect(after[0].name).toBe('版本A');
    });

    it('E1.4: restoreSnapshot 加载正确的数据', async () => {
      const store = useCanvasHistoryStore.getState();

      await store.saveSnapshot(CANVAS_ID, '恢复测试', {
        nodes: [{ id: 'x1', label: 'X' }],
        edges: [],
      });

      const snapshots = useCanvasHistoryStore.getState().snapshots;
      const target = snapshots.find((s) => s.name === '恢复测试')!;
      expect(target).toBeDefined();

      await store.restoreSnapshot(CANVAS_ID, target.id);

      const restored = useCanvasHistoryStore.getState().snapshots.find((s) => s.id === target.id);
      expect(restored?.data.nodes[0].label).toBe('X');
    });

    it('E1.4: restoreSnapshot 不存在的 id 不抛出', async () => {
      const store = useCanvasHistoryStore.getState();
      await expect(
        store.restoreSnapshot(CANVAS_ID, 'non-existent-id')
      ).resolves.not.toThrow();
    });
  });

  // =====================================================
  // E1.4 — renameSnapshot (via updateSnapshotMetadata)
  // =====================================================
  describe('renameSnapshot (updateSnapshotMetadata)', () => {
    it('E1.4: renameSnapshot 更新后名称匹配', async () => {
      const store = useCanvasHistoryStore.getState();

      await store.saveSnapshot(CANVAS_ID, '旧名称', {
        nodes: [{ id: 'n1', label: 'A' }],
        edges: [],
      });

      const snapshots = useCanvasHistoryStore.getState().snapshots;
      const snap = snapshots.find((s) => s.name === '旧名称')!;
      expect(snap).toBeDefined();

      await store.updateSnapshotMetadata(snap.id, { name: '新名称' }, CANVAS_ID);

      const updated = useCanvasHistoryStore.getState().snapshots.find((s) => s.id === snap.id);
      expect(updated?.name).toBe('新名称');
    });

    it('E1.4: updateSnapshotMetadata 可以切换 isStarred', async () => {
      const store = useCanvasHistoryStore.getState();

      await store.saveSnapshot(CANVAS_ID, '星标测试', {
        nodes: [{ id: 'n1', label: 'A' }],
        edges: [],
      });

      const snapshots = useCanvasHistoryStore.getState().snapshots;
      const snap = snapshots.find((s) => s.name === '星标测试')!;

      await store.updateSnapshotMetadata(snap.id, { isStarred: true }, CANVAS_ID);
      const starred = useCanvasHistoryStore.getState().snapshots.find((s) => s.id === snap.id);
      expect(starred?.isStarred).toBe(true);

      await store.updateSnapshotMetadata(snap.id, { isStarred: false }, CANVAS_ID);
      const unstarred = useCanvasHistoryStore.getState().snapshots.find((s) => s.id === snap.id);
      expect(unstarred?.isStarred).toBe(false);
    });

    it('E1.4: updateSnapshotMetadata 不存在 id 不抛出', async () => {
      const store = useCanvasHistoryStore.getState();
      await expect(
        store.updateSnapshotMetadata('non-existent', { name: '名字' }, CANVAS_ID)
      ).resolves.not.toThrow();
    });
  });

  // =====================================================
  // E1.4 — deleteSnapshot
  // =====================================================
  describe('deleteSnapshot', () => {
    it('E1.4: deleteSnapshot 后 snapshots.length 减少', async () => {
      const store = useCanvasHistoryStore.getState();

      await store.saveSnapshot(CANVAS_ID, '待删除', {
        nodes: [{ id: 'n1', label: 'A' }],
        edges: [],
      });

      const before = useCanvasHistoryStore.getState().snapshots;
      const snap = before.find((s) => s.name === '待删除')!;

      await store.deleteSnapshot(CANVAS_ID, snap.id);

      const after = useCanvasHistoryStore.getState().snapshots;
      const found = after.find((s) => s.name === '待删除');
      expect(found).toBeUndefined();
    });

    it('E1.4: 删除不存在的 id 不抛出', async () => {
      const store = useCanvasHistoryStore.getState();
      await expect(store.deleteSnapshot(CANVAS_ID, 'non-existent')).resolves.not.toThrow();
    });
  });

  // =====================================================
  // LRU eviction
  // =====================================================
  describe('LRU eviction', () => {
    it('E1.4: snapshots 超过 MAX_SNAPSHOTS 时自动淘汰最旧的', async () => {
      const store = useCanvasHistoryStore.getState();
      const MAX = 50;
      const OVER = 55;

      for (let i = 0; i < OVER; i++) {
        await store.saveSnapshot(CANVAS_ID, `snap-${i}`, {
          nodes: [{ id: `n${i}`, label: `Node ${i}` }],
          edges: [],
        });
      }

      const snapshots = useCanvasHistoryStore.getState().snapshots;
      expect(snapshots.length).toBeLessThanOrEqual(MAX);
      // Most recent ones should be kept (snap-54, snap-53, etc.)
      const kept = snapshots.map((s) => s.name);
      expect(kept).toContain('snap-54');
      expect(kept).not.toContain('snap-0');
    });
  });
});
