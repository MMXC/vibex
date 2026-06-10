/**
 * sessionHistoryStore.test.ts — vitest for S85-E2 sessionHistoryStore
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSessionHistoryStore, type SessionRecord, type OperationType } from '../sessionHistoryStore';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function mockFetchJson<T>(data: T, ok = true, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(status = 500, errorMsg = 'Internal server error') {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error: errorMsg }),
  });
}

const SAMPLE_SESSION: SessionRecord = {
  id: 'sess_abc',
  canvasId: 'canvas-1',
  userId: 'user-1',
  userName: 'Alice',
  userAvatar: null,
  operationType: 'edit',
  operationTarget: 'node-1',
  operationDetail: 'Edited node content',
  createdAt: 1718000000000,
};

const SAMPLE_PAGE = (overrides: Partial<SessionRecord> = {}) => ({
  sessions: [{ ...SAMPLE_SESSION, ...overrides }] as SessionRecord[],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
});

describe('sessionHistoryStore — S85-E2', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    useSessionHistoryStore.setState({
      canvasId: null,
      sessions: [],
      loading: false,
      loadingMore: false,
      error: null,
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      filterType: null,
      filterUserId: null,
      searchKeyword: '',
    });
  });

  describe('initCanvas', () => {
    it('sets canvasId and fetches first page', async () => {
      mockFetchJson(SAMPLE_PAGE());
      await useSessionHistoryStore.getState().initCanvas('canvas-1');
      const s = useSessionHistoryStore.getState();
      expect(s.canvasId).toBe('canvas-1');
      expect(s.loading).toBe(false);
      expect(s.sessions).toHaveLength(1);
    });

    it('sets error on fetch failure', async () => {
      mockFetchError(500, 'DB error');
      await useSessionHistoryStore.getState().initCanvas('canvas-1');
      const s = useSessionHistoryStore.getState();
      expect(s.error).toBe('DB error');
      expect(s.loading).toBe(false);
    });

    it('maps server fields to SessionRecord shape', async () => {
      mockFetchJson(SAMPLE_PAGE({ id: 'sess_xyz', userName: 'Bob', operationType: 'merge' }));
      await useSessionHistoryStore.getState().initCanvas('canvas-1');
      const s = useSessionHistoryStore.getState();
      expect(s.sessions[0].id).toBe('sess_xyz');
      expect(s.sessions[0].userName).toBe('Bob');
      expect(s.sessions[0].operationType).toBe('merge');
    });
  });

  describe('loadMore', () => {
    it('appends second page to existing sessions', async () => {
      mockFetchJson(SAMPLE_PAGE({ id: 'sess_pg1' }));
      await useSessionHistoryStore.getState().initCanvas('canvas-1');

      mockFetchJson({
        sessions: [{ ...SAMPLE_SESSION, id: 'sess_pg2' }] as SessionRecord[],
        total: 2,
        page: 2,
        limit: 20,
        totalPages: 1,
      });
      await useSessionHistoryStore.getState().loadMore();

      const s = useSessionHistoryStore.getState();
      expect(s.sessions).toHaveLength(2);
      expect(s.sessions[1].id).toBe('sess_pg2');
      expect(s.page).toBe(2);
    });

    it('sets loadingMore flag while fetching', async () => {
      mockFetchJson(SAMPLE_PAGE({ id: 'sess_pg1' }));
      await useSessionHistoryStore.getState().initCanvas('canvas-1');

      let resolve: (v: unknown) => void;
      mockFetch.mockImplementationOnce(() => new Promise(r => (resolve = r)));

      const loadMorePromise = useSessionHistoryStore.getState().loadMore();
      expect(useSessionHistoryStore.getState().loadingMore).toBe(true);
      resolve!({ ok: true, status: 200, json: () => Promise.resolve({ sessions: [], total: 1, page: 2, limit: 20, totalPages: 1 }) });
      await loadMorePromise;
      expect(useSessionHistoryStore.getState().loadingMore).toBe(false);
    });

    it('does nothing if already on last page', async () => {
      mockFetchJson(SAMPLE_PAGE());
      await useSessionHistoryStore.getState().initCanvas('canvas-1');
      // totalPages = 1, page = 1, so loadMore should be a no-op
      mockFetch.mockReset();
      await useSessionHistoryStore.getState().loadMore();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('setFilter', () => {
    it('applies operationType filter and re-fetches', async () => {
      mockFetchJson(SAMPLE_PAGE({ operationType: 'merge' }));
      await useSessionHistoryStore.getState().setFilter({ operationType: 'merge' });
      const s = useSessionHistoryStore.getState();
      expect(s.filterType).toBe('merge');
      expect(s.sessions[0].operationType).toBe('merge');
      // Verify the filter param was sent
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('operationType=merge'),
        undefined
      );
    });

    it('applies userId filter', async () => {
      mockFetchJson(SAMPLE_PAGE({ userId: 'user-bob' }));
      await useSessionHistoryStore.getState().setFilter({ userId: 'user-bob' });
      expect(useSessionHistoryStore.getState().filterUserId).toBe('user-bob');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('userId=user-bob'),
        undefined
      );
    });

    it('applies search keyword filter', async () => {
      mockFetchJson(SAMPLE_PAGE({ operationDetail: 'edited chapter 2' }));
      await useSessionHistoryStore.getState().setFilter({ search: 'chapter 2' });
      expect(useSessionHistoryStore.getState().searchKeyword).toBe('chapter 2');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=chapter%202'),
        undefined
      );
    });

    it('clears sessions and resets to page 1 when applying new filter', async () => {
      mockFetchJson(SAMPLE_PAGE());
      await useSessionHistoryStore.getState().initCanvas('canvas-1');
      expect(useSessionHistoryStore.getState().sessions).toHaveLength(1);

      mockFetchJson(SAMPLE_PAGE({ operationType: 'comment' }));
      await useSessionHistoryStore.getState().setFilter({ operationType: 'comment' });
      const s = useSessionHistoryStore.getState();
      expect(s.page).toBe(1);
      expect(s.total).toBe(1);
    });
  });

  describe('appendSession', () => {
    it('prepends new session to the list', async () => {
      mockFetchJson(SAMPLE_PAGE({ id: 'sess_existing' }));
      await useSessionHistoryStore.getState().initCanvas('canvas-1');

      useSessionHistoryStore.getState().appendSession({
        ...SAMPLE_SESSION,
        id: 'sess_new',
        operationType: 'comment',
      });

      const s = useSessionHistoryStore.getState();
      expect(s.sessions[0].id).toBe('sess_new');
      expect(s.sessions).toHaveLength(2);
    });

    it('ignores duplicate session IDs', async () => {
      mockFetchJson(SAMPLE_PAGE());
      await useSessionHistoryStore.getState().initCanvas('canvas-1');
      useSessionHistoryStore.getState().appendSession(SAMPLE_SESSION);
      expect(useSessionHistoryStore.getState().sessions).toHaveLength(1);
    });

    it('ignores sessions for a different canvas', async () => {
      mockFetchJson(SAMPLE_PAGE());
      await useSessionHistoryStore.getState().initCanvas('canvas-1');
      useSessionHistoryStore.getState().appendSession({ ...SAMPLE_SESSION, canvasId: 'canvas-2' });
      expect(useSessionHistoryStore.getState().sessions).toHaveLength(1);
    });

    it('increments total when appending', async () => {
      mockFetchJson(SAMPLE_PAGE());
      await useSessionHistoryStore.getState().initCanvas('canvas-1');
      useSessionHistoryStore.getState().appendSession({ ...SAMPLE_SESSION, id: 'sess_new2' });
      expect(useSessionHistoryStore.getState().total).toBe(2);
    });
  });

  describe('reset', () => {
    it('clears all state', async () => {
      mockFetchJson(SAMPLE_PAGE());
      await useSessionHistoryStore.getState().initCanvas('canvas-1');
      useSessionHistoryStore.getState().reset();
      const s = useSessionHistoryStore.getState();
      expect(s.canvasId).toBeNull();
      expect(s.sessions).toHaveLength(0);
      expect(s.page).toBe(1);
      expect(s.total).toBe(0);
      expect(s.filterType).toBeNull();
      expect(s.filterUserId).toBeNull();
      expect(s.searchKeyword).toBe('');
    });
  });
});
