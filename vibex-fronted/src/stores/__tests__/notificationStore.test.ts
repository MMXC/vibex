/**
 * notificationStore Tests
 * S68-E2: @提及通知系统
 * 测试: addNotification/markAsRead/markAllAsRead/clearNotification/clearAll + queries
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore } from '../notificationStore';

const mockStorage: Record<string, string> = {};
const mockGetItem = vi.fn((key: string) => mockStorage[key] ?? null);
const mockSetItem = vi.fn((key: string, value: string) => { mockStorage[key] = value; });
const mockRemoveItem = vi.fn((key: string) => { delete mockStorage[key]; });

vi.mock('zustand/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('zustand/middleware')>();
  return {
    ...actual,
    persist: (fn: Function) => {
      return (set: Function, get: Function, store: any) => {
        const api = fn(set, get, store);
        // Attach storage mock directly to api so store uses it
        Object.defineProperty(api, 'getStorage', {
          value: () => ({
            getItem: mockGetItem,
            setItem: mockSetItem,
            removeItem: mockRemoveItem,
          }),
          writable: true,
        });
        return api;
      };
    },
  };
});

const BASE_NOTIFICATION = {
  type: 'mention' as const,
  title: 'New Mention',
  message: '@you in canvas X',
  senderId: 'user-2',
  senderName: 'Alice',
  targetUserId: 'user-1',
  nodeId: 'node-1',
  canvasId: 'canvas-1',
  timestamp: Date.now(),
};

describe('useNotificationStore — S68-E2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage['vibex-notifications'] = JSON.stringify({ state: { notifications: [] }, version: 0 });
    useNotificationStore.getState().clearAll();
  });

  describe('E2.1: addNotification', () => {
    it('should add a notification and return it with id', () => {
      const result = useNotificationStore.getState().addNotification(BASE_NOTIFICATION);
      expect(result.id).toBeTruthy();
      expect(result.isRead).toBe(false);
      expect(result.title).toBe('New Mention');
      const state = useNotificationStore.getState();
      expect(state.notifications.length).toBe(1);
    });

    it('should prepend new notifications (newest first)', () => {
      const n1 = useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, title: 'First' });
      const n2 = useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, title: 'Second' });
      const state = useNotificationStore.getState();
      expect(state.notifications[0].title).toBe('Second');
      expect(state.notifications[1].title).toBe('First');
    });

    it('should handle optional nodeId and canvasId', () => {
      const result = useNotificationStore.getState().addNotification({
        type: 'system',
        title: 'System',
        message: 'System message',
        senderId: 'system',
        senderName: 'System',
        targetUserId: 'user-1',
        timestamp: Date.now(),
      });
      expect(result.id).toBeTruthy();
    });
  });

  describe('E2.2: markAsRead', () => {
    it('should mark a notification as read', () => {
      const n = useNotificationStore.getState().addNotification(BASE_NOTIFICATION);
      expect(n.isRead).toBe(false);
      useNotificationStore.getState().markAsRead(n.id);
      const updated = useNotificationStore.getState().notifications.find(nt => nt.id === n.id);
      expect(updated?.isRead).toBe(true);
    });

    it('should not affect other notifications', () => {
      const n1 = useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, title: 'N1' });
      const n2 = useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, title: 'N2' });
      useNotificationStore.getState().markAsRead(n1.id);
      const state = useNotificationStore.getState();
      expect(state.notifications.find(nt => nt.id === n1.id)?.isRead).toBe(true);
      expect(state.notifications.find(nt => nt.id === n2.id)?.isRead).toBe(false);
    });
  });

  describe('E2.3: markAllAsRead', () => {
    it('should mark all notifications as read', () => {
      useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, title: 'N1' });
      useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, title: 'N2' });
      useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, title: 'N3' });
      useNotificationStore.getState().markAllAsRead();
      const state = useNotificationStore.getState();
      expect(state.notifications.every(n => n.isRead)).toBe(true);
    });
  });

  describe('E2.4: clearNotification', () => {
    it('should remove a single notification by id', () => {
      const n = useNotificationStore.getState().addNotification(BASE_NOTIFICATION);
      expect(useNotificationStore.getState().notifications.length).toBe(1);
      useNotificationStore.getState().clearNotification(n.id);
      expect(useNotificationStore.getState().notifications.length).toBe(0);
    });
  });

  describe('E2.5: clearAll', () => {
    it('should clear all notifications', () => {
      useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, title: 'N1' });
      useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, title: 'N2' });
      useNotificationStore.getState().clearAll();
      expect(useNotificationStore.getState().notifications.length).toBe(0);
    });
  });

  describe('E2.6: getUnreadCount', () => {
    it('should return correct unread count', () => {
      const n1 = useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, title: 'N1' });
      const n2 = useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, title: 'N2' });
      expect(useNotificationStore.getState().getUnreadCount()).toBe(2);
      useNotificationStore.getState().markAsRead(n1.id);
      expect(useNotificationStore.getState().getUnreadCount()).toBe(1);
      useNotificationStore.getState().markAsRead(n2.id);
      expect(useNotificationStore.getState().getUnreadCount()).toBe(0);
    });
  });

  describe('E2.7: getByCanvas / getByType', () => {
    it('should filter notifications by canvasId', () => {
      useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, canvasId: 'canvas-1', title: 'C1' });
      useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, canvasId: 'canvas-2', title: 'C2' });
      useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, canvasId: 'canvas-1', title: 'C1-2' });
      const byCanvas = useNotificationStore.getState().getByCanvas('canvas-1');
      expect(byCanvas.length).toBe(2);
    });

    it('should filter notifications by type', () => {
      useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, type: 'mention', title: 'M' });
      useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, type: 'system', title: 'S' });
      useNotificationStore.getState().addNotification({ ...BASE_NOTIFICATION, type: 'mention', title: 'M2' });
      const byType = useNotificationStore.getState().getByType('mention');
      expect(byType.length).toBe(2);
    });
  });


  // =========================================================
  // S73-E3: 通知偏好设置测试
  // =========================================================
  describe('E3.1: setChannelEnabled / setTypeEnabled', () => {
    it('should toggle channel to disabled', () => {
      useNotificationStore.getState().setChannelEnabled('browser', false);
      expect(useNotificationStore.getState().preferences.channels.browser).toBe(false);
    });

    it('should toggle channel back to enabled', () => {
      useNotificationStore.getState().setChannelEnabled('browser', true);
      expect(useNotificationStore.getState().preferences.channels.browser).toBe(true);
    });

    it('should toggle type to disabled', () => {
      useNotificationStore.getState().setTypeEnabled('mention', false);
      expect(useNotificationStore.getState().preferences.types.mention).toBe(false);
    });

    it('should toggle type back to enabled', () => {
      useNotificationStore.getState().setTypeEnabled('mention', true);
      expect(useNotificationStore.getState().preferences.types.mention).toBe(true);
    });

    it('should not store notification when its type is disabled', () => {
      // Disable mention type
      useNotificationStore.getState().setTypeEnabled('mention', false);
      // Add a mention notification — should return dummy (isRead: true)
      const result = useNotificationStore.getState().addNotification({
        ...BASE_NOTIFICATION,
        type: 'mention',
        title: 'Should Not Store',
      });
      // Should return as already-read dummy
      expect(result.isRead).toBe(true);
      // And it should NOT appear in the list
      const all = useNotificationStore.getState().notifications;
      expect(all.find(n => n.title === 'Should Not Store')).toBeUndefined();
      // Restore
      useNotificationStore.getState().setTypeEnabled('mention', true);
    });

    it('should still store notification when its type is enabled', () => {
      useNotificationStore.getState().setTypeEnabled('mention', true);
      const result = useNotificationStore.getState().addNotification({
        ...BASE_NOTIFICATION,
        type: 'mention',
        title: 'Should Store',
      });
      expect(result.isRead).toBe(false);
      const all = useNotificationStore.getState().notifications;
      expect(all.find(n => n.title === 'Should Store')).toBeDefined();
    });
  });

  describe('E3.2: resetPreferences', () => {
    it('should reset all preferences to defaults', () => {
      // Change some preferences
      useNotificationStore.getState().setChannelEnabled('browser', false);
      useNotificationStore.getState().setTypeEnabled('mention', false);
      useNotificationStore.getState().setTypeEnabled('system', false);

      // Reset
      useNotificationStore.getState().resetPreferences();

      const prefs = useNotificationStore.getState().preferences;
      expect(prefs.channels.inApp).toBe(true);
      expect(prefs.channels.browser).toBe(true);
      expect(prefs.types.mention).toBe(true);
      expect(prefs.types.reply).toBe(true);
      expect(prefs.types.system).toBe(true);
      expect(prefs.types.info).toBe(true);
    });
  });

  describe('E3.3: getUnreadCount after preference filtering', () => {
    it('should not count disabled-type notifications as unread', () => {
      // Start fresh
      useNotificationStore.getState().clearAll();
      // Disable info type
      useNotificationStore.getState().setTypeEnabled('info', false);
      // Add two notifications: one mention (enabled), one info (disabled)
      useNotificationStore.getState().addNotification({
        ...BASE_NOTIFICATION,
        type: 'mention',
        title: 'Real Mention',
      });
      useNotificationStore.getState().addNotification({
        ...BASE_NOTIFICATION,
        type: 'info',
        title: 'Disabled Info',
      });
      // Should only count the mention as unread
      expect(useNotificationStore.getState().getUnreadCount()).toBe(1);
      // Restore
      useNotificationStore.getState().setTypeEnabled('info', true);
    });
  });

});
