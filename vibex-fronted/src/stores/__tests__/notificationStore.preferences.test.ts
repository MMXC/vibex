/**
 * notificationStore E1 Tests — S80-E1: 统一通知中心管理面板
 * Tests setPreference / getPreference / addNotification preference check
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore } from '../notificationStore';

// vi.hoisted — stable mock refs before vi.mock hoisting
const {
  mockSaveNotificationToDB,
  mockGetNotificationsFromDB,
  mockMarkAsReadInDB,
  mockGetUnreadCountFromDB,
  mockSaveNotificationsFromServer,
  mockClearNotificationsFromDB,
  mockSavePreferencesToDB,
  mockGetPreferencesFromDB,
} = vi.hoisted(() => ({
  mockSaveNotificationToDB:     vi.fn<any>().mockResolvedValue(undefined),
  mockGetNotificationsFromDB:  vi.fn<any>().mockResolvedValue([]),
  mockMarkAsReadInDB:         vi.fn<any>().mockResolvedValue(null),
  mockGetUnreadCountFromDB:    vi.fn<any>().mockResolvedValue(0),
  mockSaveNotificationsFromServer: vi.fn<any>().mockResolvedValue(undefined),
  mockClearNotificationsFromDB: vi.fn<any>().mockResolvedValue(undefined),
  mockSavePreferencesToDB:     vi.fn<any>().mockResolvedValue(undefined),
  mockGetPreferencesFromDB:    vi.fn<any>().mockResolvedValue(null),
}));

// mockFetch returns a Promise by default
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
  savePreferencesToDB:     mockSavePreferencesToDB,
  getPreferencesFromDB:    mockGetPreferencesFromDB,
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
        objectStoreNames: { contains: () => true },
      })),
      objectStoreNames: { contains: () => true },
    },
  })),
});

function seedDefaultState() {
  _store['vibex-notifications'] = JSON.stringify({
    state: {
      notifications: [],
      preferences: {
        channels: { inApp: true, browser: true },
        types: { mention: true, reply: true, system: true, info: true, template_update: true, comment_reply: true },
      },
      _serverUnreadCount: 0,
    },
    version: 0,
  });
}

describe('useNotificationStore — S80-E1 Unified Preferences Interface', () => {

  beforeEach(async () => {
    mockSaveNotificationToDB.mockClear();
    mockSavePreferencesToDB.mockClear();
    mockGetPreferencesFromDB.mockClear();
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    Object.keys(_store).forEach(k => delete _store[k]);
    seedDefaultState();

    vi.resetModules();

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: mockFetch,
    });

    await import('../notificationStore');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- E1.1: getPreference default values ----
  describe('E1.1 getPreference — default values', () => {
    it('returns { enabled: true } for all default channel keys', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      expect(S.getState().getPreference('inApp')).toEqual({ enabled: true });
      expect(S.getState().getPreference('browser')).toEqual({ enabled: true });
    });

    it('returns { enabled: true } for all default type keys', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      expect(S.getState().getPreference('mention')).toEqual({ enabled: true });
      expect(S.getState().getPreference('reply')).toEqual({ enabled: true });
      expect(S.getState().getPreference('system')).toEqual({ enabled: true });
      expect(S.getState().getPreference('info')).toEqual({ enabled: true });
      expect(S.getState().getPreference('template_update')).toEqual({ enabled: true });
      expect(S.getState().getPreference('comment_reply')).toEqual({ enabled: true });
    });

    it('returns undefined for unknown keys', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      expect(S.getState().getPreference('unknown-key')).toBeUndefined();
    });
  });

  // ---- E1.2: setPreference toggle ----
  describe('E1.2 setPreference — toggle enabled status', () => {
    it('setPreference type to false disables that type', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().setPreference('mention', false);
      expect(S.getState().getPreference('mention')).toEqual({ enabled: false });
    });

    it('setPreference type to true re-enables that type', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().setPreference('mention', false);
      S.getState().setPreference('mention', true);
      expect(S.getState().getPreference('mention')).toEqual({ enabled: true });
    });

    it('setPreference channel to false disables that channel', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().setPreference('browser', false);
      expect(S.getState().getPreference('browser')).toEqual({ enabled: false });
    });

    it('setPreference calls savePreferencesToDB', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().setPreference('mention', false);
      expect(mockSavePreferencesToDB).toHaveBeenCalledTimes(1);
    });

    it('setPreference no-ops for unknown keys', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      const stateBefore = S.getState().preferences;
      S.getState().setPreference('unknown-type' as any, false);
      expect(S.getState().preferences).toEqual(stateBefore);
    });
  });

  // ---- E1.3: addNotification respects preferences ----
  describe('E1.3 addNotification — respects preference toggle', () => {
    it('skips notification when type is disabled via setPreference', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      S.getState().setPreference('mention', false);
      const notif = S.getState().addNotification({
        type: 'mention',
        title: 'Test',
        message: '@you',
        senderId: 'user-2',
        senderName: 'Alice',
        targetUserId: 'user-1',
        timestamp: Date.now(),
      });
      // Returns dummy with isRead=true
      expect(notif.isRead).toBe(true);
      // Not added to notifications list
      expect(S.getState().notifications).toHaveLength(0);
    });

    it('adds notification when type is enabled', async () => {
      const { useNotificationStore: S } = await import('../notificationStore');
      const notif = S.getState().addNotification({
        type: 'mention',
        title: 'Test',
        message: '@you',
        senderId: 'user-2',
        senderName: 'Alice',
        targetUserId: 'user-1',
        timestamp: Date.now(),
      });
      expect(notif.isRead).toBe(false);
      expect(S.getState().notifications).toHaveLength(1);
    });
  });

  // ---- E1.4: loadPreferencesFromIndexedDB ----
  describe('E1.4 loadPreferencesFromIndexedDB — loads from IndexedDB', () => {
    it('loads preferences from IndexedDB on init', async () => {
      mockGetPreferencesFromDB.mockResolvedValueOnce({
        channels: { inApp: false, browser: true },
        types: { mention: true, reply: true, system: true, info: true, template_update: true, comment_reply: true },
      });
      const { useNotificationStore: S } = await import('../notificationStore');
      await S.getState().loadPreferencesFromIndexedDB();
      expect(S.getState().getPreference('inApp')).toEqual({ enabled: false });
    });

    it('does nothing if no IndexedDB preferences exist', async () => {
      mockGetPreferencesFromDB.mockResolvedValueOnce(null);
      const { useNotificationStore: S } = await import('../notificationStore');
      await S.getState().loadPreferencesFromIndexedDB();
      // Should retain defaults
      expect(S.getState().getPreference('inApp')).toEqual({ enabled: true });
    });
  });
});
