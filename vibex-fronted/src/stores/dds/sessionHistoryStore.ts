/**
 * sessionHistoryStore — Zustand store for collaboration session history list
 *
 * S85-E2: 协作会话历史记录
 *
 * Manages:
 * - Fetching paginated session history for a canvas
 * - Filtering by operation type, user, and search keyword
 * - Appending new sessions pushed via WebSocket
 */

import { create } from 'zustand';

export type OperationType = 'edit' | 'merge' | 'comment' | 'permission' | 'create' | 'delete';

export interface SessionRecord {
  id: string;
  canvasId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  operationType: OperationType;
  operationTarget: string | null;
  operationDetail: string | null;
  createdAt: number; // Unix ms timestamp
}

interface SessionHistoryState {
  canvasId: string | null;
  sessions: SessionRecord[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  /** Current page (1-based) */
  page: number;
  /** Items per page */
  limit: number;
  total: number;
  totalPages: number;
  /** Filter: operation type */
  filterType: OperationType | null;
  /** Filter: user ID */
  filterUserId: string | null;
  /** Search keyword */
  searchKeyword: string;
}

interface SessionHistoryActions {
  /** Initialise store for a canvas and fetch first page */
  initCanvas(canvasId: string): Promise<void>;
  /** Fetch next page of sessions (append) */
  loadMore(): Promise<void>;
  /** Apply filters and re-fetch from page 1 */
  setFilter(options: {
    operationType?: OperationType | null;
    userId?: string | null;
    search?: string;
  }): Promise<void>;
  /** Append a new session record (from WebSocket push) */
  appendSession(session: SessionRecord): void;
  /** Clear all state */
  reset(): void;
}

const PAGE_LIMIT = 20;

export const useSessionHistoryStore = create<
  SessionHistoryState & SessionHistoryActions
>((set, get) => ({
  // ==================== State ====================
  canvasId: null,
  sessions: [],
  loading: false,
  loadingMore: false,
  error: null,
  page: 1,
  limit: PAGE_LIMIT,
  total: 0,
  totalPages: 0,
  filterType: null,
  filterUserId: null,
  searchKeyword: '',

  // ==================== Actions ====================

  initCanvas: async (canvasId: string) => {
    const { filterType, filterUserId, searchKeyword, limit } = get();
    set({ canvasId, loading: true, error: null, sessions: [], page: 1, total: 0, totalPages: 0 });

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: String(limit),
      });
      if (filterType) params.set('operationType', filterType);
      if (filterUserId) params.set('userId', filterUserId);
      if (searchKeyword.trim()) params.set('search', searchKeyword.trim());

      const res = await fetch(`/api/canvas/${canvasId}/sessions?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      set({
        sessions: data.sessions,
        page: data.page,
        total: data.total,
        totalPages: data.totalPages,
        loading: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load session history';
      set({ error: msg, loading: false });
    }
  },

  loadMore: async () => {
    const { canvasId, page, loadingMore, totalPages, filterType, filterUserId, searchKeyword, limit } = get();
    if (!canvasId || loadingMore || page >= totalPages) return;

    const nextPage = page + 1;
    set({ loadingMore: true });

    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(limit),
      });
      if (filterType) params.set('operationType', filterType);
      if (filterUserId) params.set('userId', filterUserId);
      if (searchKeyword.trim()) params.set('search', searchKeyword.trim());

      const res = await fetch(`/api/canvas/${canvasId}/sessions?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      set(state => ({
        sessions: [...state.sessions, ...data.sessions],
        page: data.page,
        total: data.total,
        totalPages: data.totalPages,
        loadingMore: false,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load more sessions';
      set(state => ({ error: msg, loadingMore: false }));
    }
  },

  setFilter: async (options) => {
    const { canvasId, limit } = get();
    if (!canvasId) return;

    const operationType = options.operationType !== undefined ? options.operationType : get().filterType;
    const userId = options.userId !== undefined ? options.userId : get().filterUserId;
    const search = options.search !== undefined ? options.search : get().searchKeyword;

    set({
      filterType: operationType,
      filterUserId: userId,
      searchKeyword: search,
      loading: true,
      error: null,
      sessions: [],
      page: 1,
      total: 0,
      totalPages: 0,
    });

    try {
      const params = new URLSearchParams({ page: '1', limit: String(limit) });
      if (operationType) params.set('operationType', operationType);
      if (userId) params.set('userId', userId);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/canvas/${canvasId}/sessions?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      set({
        sessions: data.sessions,
        page: data.page,
        total: data.total,
        totalPages: data.totalPages,
        loading: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to filter session history';
      set({ error: msg, loading: false });
    }
  },

  appendSession: (session: SessionRecord) => {
    set(state => {
      if (state.canvasId !== session.canvasId) return state;
      // Avoid duplicates
      if (state.sessions.some(s => s.id === session.id)) return state;
      return {
        sessions: [session, ...state.sessions],
        total: state.total + 1,
      };
    });
  },

  reset: () => {
    set({
      canvasId: null,
      sessions: [],
      loading: false,
      loadingMore: false,
      error: null,
      page: 1,
      limit: PAGE_LIMIT,
      total: 0,
      totalPages: 0,
      filterType: null,
      filterUserId: null,
      searchKeyword: '',
    });
  },
}));
