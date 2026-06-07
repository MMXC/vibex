/**
 * notificationStore E1 Tests — S77-E1: 通知持久化与跨设备同步
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNotificationStore } from '../notificationStore';

// vi.hoisted — stable mock refs before vi.mock hoisting
const {
  mockSaveNotificationToDB,
  mockGetNotificationsFromDB,
  mockMarkAsReadInDB,
  mockGetUnreadCountFromDB,
  mockSaveNotificationsFromServer,
  mockClearNotificationsFromDB,
} = vi.hoisted(() => ({
  mockSaveNotificationToDB:     vi.fn<any>().mockResolvedValue(undefined),
  mockGetNotificationsFromDB:  vi.fn<any>().mockResolvedValue([]),
  mockMarkAsReadInDB:          vi.fn<any>().mockResolvedValue(null),
  mockGetUnreadCountFromDB:    vi.fn<any>().mockResolvedValue(0),
  mockSaveNotificationsFromServer: vi.fn<any>().mockResolvedValue(undefined),
  mockClearNotificationsFromDB: vi.fn<any>().mockResolvedValue(undefined),
}));

// mockFetch returns a Promise by default (required: fetch().catch())
const mockFetch = vi.fn<any>().mockResolvedValue({ ok: true, json: async () => ({}) });

const _store: Record<string, string> = {};

vi.mock('zustand/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('zustand/middleware')>();
  return {
    ...actual,
    persist: (fn: Function) => {
      return (set: Function, get: Function, store: any) => {
        const api = fn(set, get, store);
        Object.defineProperty(api, 'getStorage', {
          value: () => ({
            getItem:  (k: string) => _store[k] ?? null,
            setItem:  (k: string, v: string) => { _store[k] = v; },
            removeItem: (k: string) => { delete _store[k]; },
          }),
          writable: true,
        });
        return api;
      };
    },
  };
});

vi.mock('@/lib/canvas/historyDB', () => ({
  saveNotificationToDB:     mockSaveNotificationToDB,
  getNotificationsFromDB: mockGetNotificationsFromDB,
  markAsReadInDB:         mockMarkAsReadInDB,
  getUnreadCountFromDB:   mockGetUnreadCountFromDB,
  saveNotificationsFromServer: mockSaveNotificationsFromServer,
  clearNotificationsFromDB:  mockClearNotificationsFromDB,
}));

vi.stubGlobal('indexedDB', {
  open: vi.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          getAll: vi.fn(() => ({ result: [] })),
          get: vi.fn(() => ({ result: undefined })),
          put: vi.fn(() => ({ result: undefined })),
          clear: vi.fn(() => ({ result: undefined })),
          delete: vi.fn(() => ({ result: undefined })),
          index: () => ({ getAll: vi.fn(() => ({ result: [] })) }),
        })),
      })),
      objectStoreNames: { contains: () => true },
    },
  })),
});

// ============================================================
let _counter = 0;
function makeNotif(overrides = {}) {
  return {
    type: 'mention' as const,
    title: `Notif ${++_counter}`,
    message: '@you in canvas',
    senderId: 'user-2',
    senderName: 'Alice',
    targetUserId: 'user-1',
    nodeId: 'node-1',
    canvasId: 'canvas-1',
    timestamp: Date.now(),
    ...overrides,
  };
}

function seedEmptyState() {
  _store['vibex-notifications'] = JSON.stringify({
    state: {
      notifications: [],
      preferences: {
        channels: { inApp: true, browser: true },
        types: { mention: true, reply: true, system: true, info: true },
      },
      _serverUnreadCount: 0,
    },
    version: 0,
  });
}

// ============================================================
describe('useNotificationStore — S77-E1 IndexedDB + REST API', () => {

  beforeEach(async () => {
    _counter = 0;
    mockSaveNotificationToDB.mockClear();
    mockGetNotificationsFromDB.mockClear();
    mockMarkAsReadInDB.mockClear();
    mockGetUnreadCountFromDB.mockClear();
    mockSaveNotificationsFromServer.mockClear();
    mockClearNotificationsFromDB.mockClear();
    mockFetch.mockClear();
    // Reset mockFetch to default resolved value (returns Promise by default)
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    Object.keys(_store).forEach(k => delete _store[k]);
    seedEmptyState();

    vi.resetModules();

    // Stub globalThis.fetch with mock — vi.spyOn replaces the property value
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: mockFetch,
    });

    // Re-import store
    await import('../notificationStore');

    // Safety reset
    try {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.setState({ notifications: [], _serverUnreadCount: 0 });
    } catch (_) { /* noop */ }
  });

  afterEach(() => {
    // Restore real fetch
    vi.restoreAllMocks();
  });

  // ---- E1.1 ----
  describe('E1.1 addNotification → IndexedDB', () => {
    it('adds with id and isRead=false', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      const n = S.getState().addNotification(makeNotif());
      expect(n.id).toBeTruthy();
      expect(n.isRead).toBe(false);
    });

    it('prepends (newest first)', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().addNotification(makeNotif({ title: 'First' }));
      S.getState().addNotification(makeNotif({ title: 'Second' }));
      expect(S.getState().notifications.map(n => n.title)[0]).toBe('Second');
    });

    it('calls saveNotificationToDB', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().addNotification(makeNotif());
      expect(mockSaveNotificationToDB).toHaveBeenCalledTimes(1);
    });

    it('skips disabled type without IndexedDB call', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().setTypeEnabled('mention', false);
      const n = S.getState().addNotification(makeNotif({ type: 'mention' }));
      expect(n.isRead).toBe(true);
      expect(mockSaveNotificationToDB).not.toHaveBeenCalled();
    });
  });

  // ---- E1.2 ----
  describe('E1.2 markAsRead → IndexedDB + PATCH API', () => {
    it('sets isRead=true locally', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      const n = S.getState().addNotification(makeNotif());
      expect(n.isRead).toBe(false);
      await S.getState().markAsRead(n.id);
      const updated = S.getState().notifications.find(nt => nt.id === n.id);
      expect(updated?.isRead).toBe(true);
    });

    it('calls markAsReadInDB', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      const n = S.getState().addNotification(makeNotif());
      await S.getState().markAsRead(n.id);
      expect(mockMarkAsReadInDB).toHaveBeenCalledWith(n.id);
    });

    it('calls PATCH /api/notifications/:id', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      const n = S.getState().addNotification(makeNotif());
      await S.getState().markAsRead(n.id);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/notifications/${n.id}`),
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('preserves optimistic update on PATCH failure', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      const n = S.getState().addNotification(makeNotif());
      mockFetch.mockRejectedValueOnce(new Error('network error'));
      await S.getState().markAsRead(n.id);
      const updated = S.getState().notifications.find(nt => nt.id === n.id);
      expect(updated?.isRead).toBe(true);
    });
  });

  // ---- E1.3 ----
  describe('E1.3 fetchUnreadFromServer → REST + IndexedDB merge', () => {
    it('calls GET /api/notifications?unread=true', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      await S.getState().fetchUnreadFromServer('user-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notifications?unread=true&userId=user-1')
      );
    });

    it('merges server notifications into local list', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      const server = [{ ...makeNotif({ id: 'srv-1', title: 'Server Notif' }) }];
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => server });
      await S.getState().fetchUnreadFromServer('user-1');
      expect(S.getState().notifications.map(n => n.title)).toContain('Server Notif');
    });

    it('saves server notifications to IndexedDB', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      const server = [{ ...makeNotif({ id: 'srv-2' }) }];
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => server });
      await S.getState().fetchUnreadFromServer('user-1');
      expect(mockSaveNotificationsFromServer).toHaveBeenCalledWith(server);
    });

    it('returns empty array on API failure', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      mockFetch.mockRejectedValueOnce(new Error('network error'));
      const result = await S.getState().fetchUnreadFromServer('user-1');
      expect(result).toEqual([]);
    });
  });

  // ---- E1.4 ----
  describe('E1.4 loadFromIndexedDB', () => {
    it('loads notifications from IndexedDB', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      const idb = [{ ...makeNotif({ id: 'idb-1', title: 'From IDB' }) }];
      mockGetNotificationsFromDB.mockResolvedValueOnce(idb);
      await S.getState().loadFromIndexedDB();
      expect(S.getState().notifications.map(n => n.title)).toContain('From IDB');
    });

    it('does not duplicate existing ids', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      const first = S.getState().addNotification(makeNotif());
      const firstId = first.id;
      const firstTs = S.getState().notifications[0]?.timestamp ?? Date.now();
      mockGetNotificationsFromDB.mockResolvedValueOnce([{
        ...makeNotif(), id: firstId, title: 'Dup', timestamp: firstTs,
      }]);
      await S.getState().loadFromIndexedDB();
      const count = S.getState().notifications.filter(n => n.id === firstId).length;
      expect(count).toBe(1);
    });

    it('handles IndexedDB failure gracefully', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      mockGetNotificationsFromDB.mockRejectedValueOnce(new Error('idb error'));
      await expect(S.getState().loadFromIndexedDB()).resolves.not.toThrow();
    });
  });

  // ---- E1.5 ----
  describe('E1.5 getUnreadCountWithServer aggregation', () => {
    it('aggregates local + server unread counts', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().addNotification(makeNotif());
      S.getState().addNotification(makeNotif());
      mockFetch.mockResolvedValueOnce({
        ok: true, json: async () => [
          { ...makeNotif({ id: 's1' }), isRead: false },
          { ...makeNotif({ id: 's2' }), isRead: false },
        ],
      });
      await S.getState().fetchUnreadFromServer('user-1');
      expect(S.getState().getUnreadCountWithServer()).toBeGreaterThanOrEqual(4);
    });

    it('returns local count when no server call', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().addNotification(makeNotif());
      expect(S.getState().getUnreadCountWithServer()).toBe(1);
    });
  });

  // ---- E1.6 ----
  describe('E1.6 clearAll → IndexedDB', () => {
    it('calls clearNotificationsFromDB', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().addNotification(makeNotif());
      const before = mockClearNotificationsFromDB.mock.calls.length;
      S.getState().clearAll();
      expect(mockClearNotificationsFromDB.mock.calls.length - before).toBe(1);
    });

    it('empties notifications list', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().addNotification(makeNotif());
      S.getState().clearAll();
      expect(S.getState().notifications).toHaveLength(0);
    });

    it('resets _serverUnreadCount to 0', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().clearAll();
      expect(S.getState()._serverUnreadCount).toBe(0);
    });
  });

  // ---- E1.7 ----
  describe('E1.7 NotificationEntry DoD field coverage', () => {
    it('has all required DoD fields', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      const n = S.getState().addNotification(makeNotif());
      expect(n.id).toBeTruthy();
      expect(n.isRead).toBe(false);
      expect(n.timestamp).toBeGreaterThan(0);
      expect(n.type).toBe('mention');
      expect(typeof n.title).toBe('string');
      expect(typeof n.message).toBe('string');
    });

    it('getUnreadCount returns 0 for empty store', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      expect(S.getState().getUnreadCount()).toBe(0);
    });
  });

  // ---- E1.8 ----
  describe('E1.8 markAllAsRead', () => {
    it('marks all notifications as read', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().addNotification(makeNotif());
      S.getState().addNotification(makeNotif());
      S.getState().markAllAsRead();
      const all = S.getState().notifications;
      expect(all.length).toBe(2);
      expect(all.every(n => n.isRead)).toBe(true);
    });

    it('resets _serverUnreadCount', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().markAllAsRead();
      expect(S.getState()._serverUnreadCount).toBe(0);
    });
  });
});
