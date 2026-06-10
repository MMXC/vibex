/**
 * canvasPermissionsStore.test.ts — vitest for S85-E1 canvasPermissionsStore
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasPermissionsStore, selectCanEdit, selectCanManage, selectIsViewerMode } from '../canvasPermissionsStore';

// Mock globalThis.fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function mockFetchJson<T>(data: T, ok = true, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(data),
  });
}

describe('canvasPermissionsStore — S85-E1', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    useCanvasPermissionsStore.setState({
      canvasId: null,
      myRole: null,
      myUserId: null,
      collaborators: [],
      shareLink: null,
      loading: false,
      error: null,
    });
  });

  describe('initCanvas', () => {
    it('sets canvasId and myUserId', async () => {
      mockFetchJson({ collaborators: [] });
      await useCanvasPermissionsStore.getState().initCanvas('canvas-1', 'user-1');
      const s = useCanvasPermissionsStore.getState();
      expect(s.canvasId).toBe('canvas-1');
      expect(s.myUserId).toBe('user-1');
    });
  });

  describe('fetchCollaborators', () => {
    it('parses collaborators and sets myRole from matching userId', async () => {
      mockFetchJson({
        collaborators: [
          {
            id: 'collab-1', permissionId: 'perm-1', userId: 'user-1',
            email: 'alice@example.com', display_name: 'Alice',
            role: 'owner', joined_at: '2026-01-01', last_active_at: null,
          },
          {
            id: 'collab-2', permissionId: 'perm-2', userId: 'user-2',
            email: 'bob@example.com', display_name: 'Bob',
            role: 'editor', joined_at: '2026-01-02', last_active_at: null,
          },
        ],
      });
      await useCanvasPermissionsStore.getState().initCanvas('canvas-1', 'user-1');
      await useCanvasPermissionsStore.getState().fetchCollaborators();
      const s = useCanvasPermissionsStore.getState();
      expect(s.collaborators).toHaveLength(2);
      expect(s.myRole).toBe('owner');
    });

    it('sets myRole to null when user is not in collaborators', async () => {
      mockFetchJson({ collaborators: [] });
      await useCanvasPermissionsStore.getState().initCanvas('canvas-1', 'user-1');
      await useCanvasPermissionsStore.getState().fetchCollaborators();
      expect(useCanvasPermissionsStore.getState().myRole).toBeNull();
    });

    it('sets error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      try {
        await useCanvasPermissionsStore.getState().fetchCollaborators();
      } catch { /* expected */ }
      expect(useCanvasPermissionsStore.getState().error).toBe('Network error');
    });
  });

  describe('selectors', () => {
    it('selectCanEdit — returns true for owner/admin/editor, false for viewer', () => {
      const base = { canvasId: 'c1', myUserId: 'u1', collaborators: [], shareLink: null, loading: false, error: null };
      expect(selectCanEdit({ ...base, myRole: 'owner' })).toBe(true);
      expect(selectCanEdit({ ...base, myRole: 'admin' })).toBe(true);
      expect(selectCanEdit({ ...base, myRole: 'editor' })).toBe(true);
      expect(selectCanEdit({ ...base, myRole: 'viewer' })).toBe(false);
      expect(selectCanEdit({ ...base, myRole: null })).toBe(false);
    });

    it('selectCanManage — returns true for owner/admin only', () => {
      const base = { canvasId: 'c1', myUserId: 'u1', collaborators: [], shareLink: null, loading: false, error: null };
      expect(selectCanManage({ ...base, myRole: 'owner' })).toBe(true);
      expect(selectCanManage({ ...base, myRole: 'admin' })).toBe(true);
      expect(selectCanManage({ ...base, myRole: 'editor' })).toBe(false);
      expect(selectCanManage({ ...base, myRole: 'viewer' })).toBe(false);
      expect(selectCanManage({ ...base, myRole: null })).toBe(false);
    });

    it('selectIsViewerMode — true for viewer or null', () => {
      const base = { canvasId: 'c1', myUserId: 'u1', collaborators: [], shareLink: null, loading: false, error: null };
      expect(selectIsViewerMode({ ...base, myRole: 'viewer' })).toBe(true);
      expect(selectIsViewerMode({ ...base, myRole: null })).toBe(true);
      expect(selectIsViewerMode({ ...base, myRole: 'editor' })).toBe(false);
      expect(selectIsViewerMode({ ...base, myRole: 'owner' })).toBe(false);
    });
  });

  describe('addCollaborator', () => {
    it('sets error when user is not owner/admin', async () => {
      useCanvasPermissionsStore.setState({ myRole: 'viewer' });
      await useCanvasPermissionsStore.getState().addCollaborator('user-2', 'editor');
      expect(useCanvasPermissionsStore.getState().error).toBe(
        'Permission denied: only owner or admin can add collaborators'
      );
    });

    it('calls POST and re-fetches collaborators on success', async () => {
      useCanvasPermissionsStore.setState({ myRole: 'owner', canvasId: 'canvas-1' });
      mockFetchJson({ permissionId: 'perm-new', canvasId: 'canvas-1', userId: 'user-2', role: 'editor' });
      mockFetchJson({ collaborators: [] }); // fetchCollaborators call
      await useCanvasPermissionsStore.getState().addCollaborator('user-2', 'editor', 'bob@example.com');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1,
        '/api/canvas/canvas-1/permissions',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('removeCollaborator', () => {
    it('sets error when user is not owner/admin', async () => {
      useCanvasPermissionsStore.setState({ myRole: 'editor' });
      await useCanvasPermissionsStore.getState().removeCollaborator('user-2');
      expect(useCanvasPermissionsStore.getState().error).toBe(
        'Permission denied: only owner or admin can remove collaborators'
      );
    });
  });

  describe('createShareLink', () => {
    it('sets error when user is not owner/admin', async () => {
      useCanvasPermissionsStore.setState({ myRole: 'viewer', canvasId: 'canvas-1' });
      await useCanvasPermissionsStore.getState().createShareLink('viewer');
      expect(useCanvasPermissionsStore.getState().error).toBe(
        'Permission denied: only owner or admin can create share links'
      );
    });

    it('stores shareLink on success', async () => {
      useCanvasPermissionsStore.setState({ myRole: 'owner', canvasId: 'canvas-1' });
      mockFetchJson({
        id: 'share-1', token: 'abc123', shareUrl: '/canvas/share?token=abc123',
        role: 'viewer', expiresAt: '2026-07-01T00:00:00Z',
      });
      await useCanvasPermissionsStore.getState().createShareLink('viewer');
      const s = useCanvasPermissionsStore.getState();
      expect(s.shareLink).toEqual(expect.objectContaining({ token: 'abc123', role: 'viewer' }));
    });
  });

  describe('clearError / clearShareLink', () => {
    it('clearError sets error to null', () => {
      useCanvasPermissionsStore.setState({ error: 'some error' });
      useCanvasPermissionsStore.getState().clearError();
      expect(useCanvasPermissionsStore.getState().error).toBeNull();
    });

    it('clearShareLink sets shareLink to null', () => {
      useCanvasPermissionsStore.setState({ shareLink: { id: 's1', token: 'x', shareUrl: '/x', role: 'viewer', expiresAt: '2026-07-01' } });
      useCanvasPermissionsStore.getState().clearShareLink();
      expect(useCanvasPermissionsStore.getState().shareLink).toBeNull();
    });
  });
});
