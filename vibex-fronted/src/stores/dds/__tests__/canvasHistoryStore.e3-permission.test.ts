/**
 * canvasHistoryStore.e3-permission.test.ts — E3 (Sprint77)
 *
 * 画布分支权限控制测试：
 * - BranchPermission 类型：owner / admin / write / read
 * - getBranchPermission: owner→owner, admin→admin, other→write/read
 * - deleteBranch: owner OK, admin OK, write DENIED, read DENIED
 * - mergeBranch: owner OK, admin OK, write DENIED, read DENIED
 * - setBranchOwner: owner/admin can transfer, others DENIED
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock IndexedDB before vi.hoisted
const mockIndexedDB = {
  open: vi.fn(() => ({
    result: {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(() => ({
            result: { name: 'main', isProtected: false, createdAt: Date.now(), branchOwner: '' },
            onsuccess: null,
            onerror: null,
          })),
          put: vi.fn(() => ({ onsuccess: null, onerror: null })),
          delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
          clear: vi.fn(() => ({ onsuccess: null, onerror: null })),
        })),
      })),
    },
    onsuccess: null,
    onerror: null,
  })),
};
Object.defineProperty(globalThis, 'indexedDB', { value: mockIndexedDB, writable: true });

// Mock canvasHistoryStore module
const mockSetBranchMeta = vi.fn();
const mockGetBranchMeta = vi.fn();
const mockDeleteBranchFromDB = vi.fn();
const mockListSnapshotsFromDB = vi.fn();
const mockMergeBranchInDB = vi.fn();

vi.mock('@/lib/canvas/historyDB', () => ({
  getBranchMeta: mockGetBranchMeta,
  setBranchMeta: mockSetBranchMeta,
  deleteBranchFromDB: mockDeleteBranchFromDB,
  listSnapshotsFromDB: mockListSnapshotsFromDB,
  mergeBranchInDB: mockMergeBranchInDB,
}));

// Import store after mocks
const { useCanvasHistoryStore } = await import('@/stores/dds/canvasHistoryStore');

describe('E3 (Sprint77): Branch Permission Control', () => {
  // Always call methods through the store proxy to preserve Zustand v5 Proxy wrapping
  const getStore = () => useCanvasHistoryStore.getState();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset currentUserId to a known state
    getStore().setCurrentUserId(null);
  });

  // ─── getBranchPermission ───────────────────────────────────────────────

  describe('getBranchPermission', () => {
    it('returns "owner" when user matches branchOwner', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'feature-x',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: 'user-alice',
      });
      const result = await getStore().getBranchPermission('canvas-1', 'feature-x', 'user-alice');
      expect(result).toBe('owner');
    });

    it('returns "admin" when userId starts with "admin-"', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'feature-x',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: 'user-alice',
      });
      const result = await getStore().getBranchPermission('canvas-1', 'feature-x', 'admin-bob');
      expect(result).toBe('admin');
    });

    it('returns "write" for non-owner non-admin users', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'feature-x',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: 'user-alice',
      });
      const result = await getStore().getBranchPermission('canvas-1', 'feature-x', 'user-bob');
      expect(result).toBe('write');
    });

    it('returns "read" when no userId provided', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'feature-x',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: 'user-alice',
      });
      const result = await getStore().getBranchPermission('canvas-1', 'feature-x', '');
      expect(result).toBe('read');
    });

    it('returns "read" when branch meta not found', async () => {
      mockGetBranchMeta.mockResolvedValue(null);
      const result = await getStore().getBranchPermission('canvas-1', 'nonexistent', 'user-alice');
      expect(result).toBe('read');
    });
  });

  // ─── deleteBranch ────────────────────────────────────────────────────

  describe('deleteBranch', () => {
    it('allows owner to delete branch', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'feature-x',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: 'user-alice',
      });
      mockDeleteBranchFromDB.mockResolvedValue(undefined);
      mockListSnapshotsFromDB.mockResolvedValue([]);

      const result = await getStore().deleteBranch('canvas-1', 'feature-x', 'user-alice');

      expect(result).toEqual({ ok: true });
      expect(mockDeleteBranchFromDB).toHaveBeenCalledWith('canvas-1', 'feature-x');
    });

    it('allows admin to delete branch', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'feature-x',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: 'user-alice',
      });
      mockDeleteBranchFromDB.mockResolvedValue(undefined);
      mockListSnapshotsFromDB.mockResolvedValue([]);

      const result = await getStore().deleteBranch('canvas-1', 'feature-x', 'admin-bob');

      expect(result).toEqual({ ok: true });
      expect(mockDeleteBranchFromDB).toHaveBeenCalledWith('canvas-1', 'feature-x');
    });

    it('denies write user from deleting branch', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'feature-x',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: 'user-alice',
      });

      const result = await getStore().deleteBranch('canvas-1', 'feature-x', 'user-bob');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Permission denied');
      expect(mockDeleteBranchFromDB).not.toHaveBeenCalled();
    });

    it('denies read user from deleting branch', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'feature-x',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: 'user-alice',
      });

      const result = await getStore().deleteBranch('canvas-1', 'feature-x', '');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Permission denied');
      expect(mockDeleteBranchFromDB).not.toHaveBeenCalled();
    });

    it('cannot delete main branch', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'main',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: '',
      });

      const result = await getStore().deleteBranch('canvas-1', 'main', 'user-alice');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('main branch');
      expect(mockDeleteBranchFromDB).not.toHaveBeenCalled();
    });
  });

  // ─── mergeBranch ──────────────────────────────────────────────────────

  describe('mergeBranch', () => {
    it('allows owner to merge branch', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'feature-x',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: 'user-alice',
      });
      mockMergeBranchInDB.mockResolvedValue(undefined);
      mockListSnapshotsFromDB.mockResolvedValue([{ id: 'snap-1', timestamp: Date.now() }]);

      const result = await getStore().mergeBranch('canvas-1', 'feature-x', 'main', 'user-alice');

      expect(result).toEqual({ ok: true });
      expect(mockMergeBranchInDB).toHaveBeenCalledWith('canvas-1', 'feature-x', 'main', 'snap-1');
    });

    it('denies write user from merging branch', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'feature-x',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: 'user-alice',
      });

      const result = await getStore().mergeBranch('canvas-1', 'feature-x', 'main', 'user-bob');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Permission denied');
      expect(mockMergeBranchInDB).not.toHaveBeenCalled();
    });

    it('denies when source and target are the same', async () => {
      const result = await getStore().mergeBranch('canvas-1', 'feature-x', 'feature-x', 'user-alice');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('same');
      expect(mockMergeBranchInDB).not.toHaveBeenCalled();
    });
  });

  // ─── setBranchOwner ───────────────────────────────────────────────────

  describe('setBranchOwner', () => {
    it('allows owner to transfer ownership', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'feature-x',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: 'user-alice',
      });
      mockSetBranchMeta.mockResolvedValue(undefined);

      const result = await getStore().setBranchOwner('canvas-1', 'feature-x', 'user-bob', 'user-alice');

      expect(result).toEqual({ ok: true });
      expect(mockSetBranchMeta).toHaveBeenCalledWith('canvas-1', 'feature-x', expect.objectContaining({
        branchOwner: 'user-bob',
      }));
    });

    it('allows admin to transfer ownership', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'feature-x',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: 'user-alice',
      });
      mockSetBranchMeta.mockResolvedValue(undefined);

      const result = await getStore().setBranchOwner('canvas-1', 'feature-x', 'user-bob', 'admin-carol');

      expect(result).toEqual({ ok: true });
      expect(mockSetBranchMeta).toHaveBeenCalledWith('canvas-1', 'feature-x', expect.objectContaining({
        branchOwner: 'user-bob',
      }));
    });

    it('denies write user from transferring ownership', async () => {
      mockGetBranchMeta.mockResolvedValue({
        name: 'feature-x',
        isProtected: false,
        createdAt: Date.now(),
        branchOwner: 'user-alice',
      });

      const result = await getStore().setBranchOwner('canvas-1', 'feature-x', 'user-bob', 'user-bob');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Permission denied');
      expect(mockSetBranchMeta).not.toHaveBeenCalled();
    });

    it('creates branch owner on new branch with first caller as owner', async () => {
      mockGetBranchMeta.mockResolvedValue(null); // branch doesn't exist
      mockSetBranchMeta.mockResolvedValue(undefined);

      const result = await getStore().setBranchOwner('canvas-1', 'new-branch', 'user-alice', 'user-alice');

      expect(result).toEqual({ ok: true });
      expect(mockSetBranchMeta).toHaveBeenCalledWith('canvas-1', 'new-branch', expect.objectContaining({
        branchOwner: 'user-alice',
      }));
    });
  });

  // ─── setCurrentUserId ─────────────────────────────────────────────────

  describe('setCurrentUserId', () => {
    it('stores current user ID in state', () => {
      getStore().setCurrentUserId('user-123');
      expect(getStore().currentUserId).toBe('user-123');

      getStore().setCurrentUserId(null);
      expect(getStore().currentUserId).toBe(null);
    });
  });
});
