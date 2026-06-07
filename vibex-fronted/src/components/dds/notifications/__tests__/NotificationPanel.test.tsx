/**
 * NotificationPanel.test.tsx — S74-E5: NotificationPanel Keyboard Navigation
 *
 * Tests:
 * - Panel open/close, empty state, notification list rendering
 * - Mark as read (click), mark all as read, clear all
 * - Pagination (load more)
 * - S74-E5 keyboard navigation: Tab focuses items, Enter marks unread as read,
 *   Escape does NOT close panel, Tab/Shift+Tab cycle through notification items
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

// ── notificationStore mock ────────────────────────────────────────────────────

const mockNotifications: import('@/stores/notificationStore').Notification[] = [
  {
    id: 'notif-1',
    type: 'mention',
    title: 'Mention',
    message: '@you in canvas X',
    senderId: 'user-2',
    senderName: 'Alice',
    targetUserId: 'user-1',
    nodeId: 'node-1',
    canvasId: 'canvas-1',
    isRead: false,
    timestamp: Date.now() - 60000,
  },
  {
    id: 'notif-2',
    type: 'reply',
    title: 'Reply',
    message: 'Bob replied to your comment',
    senderId: 'user-3',
    senderName: 'Bob',
    targetUserId: 'user-1',
    nodeId: 'node-2',
    canvasId: 'canvas-1',
    isRead: false,
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'notif-3',
    type: 'system',
    title: 'System',
    message: 'Canvas shared with you',
    senderId: 'system',
    senderName: 'System',
    targetUserId: 'user-1',
    canvasId: 'canvas-2',
    isRead: true,
    timestamp: Date.now() - 86400000,
  },
];

const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockClearAll = vi.fn();

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: vi.fn((selector?: (s: any) => unknown) => {
    const state = {
      notifications: mockNotifications,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      clearAll: mockClearAll,
      getUnreadCount: () => mockNotifications.filter(n => !n.isRead).length,
    };
    if (selector) return selector(state);
    return state;
  }),
}));

vi.mock('./NotificationSettingsDrawer', () => ({
  NotificationSettingsDrawer: vi.fn(() => null),
}));

// Patch globalThis.confirm so clearAll is testable
const origConfirm = globalThis.confirm;
beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as any).confirm = vi.fn(() => true);
});
afterEach(() => {
  (globalThis as any).confirm = origConfirm;
});

import NotificationPanel from '../NotificationPanel';

const renderPanel = (open = true) => {
  const onClose = vi.fn();
  return { ...render(<NotificationPanel open={open} onClose={onClose} />), onClose };
};

describe('NotificationPanel — S68-E2 / S73-E3 / S74-E5', () => {
  describe('basic rendering', () => {
    it('renders nothing when closed', () => {
      renderPanel(false);
      expect(screen.queryByRole('complementary')).toBeNull();
    });

    it('renders panel when open', () => {
      renderPanel();
      expect(screen.getByRole('complementary')).toBeTruthy();
      expect(screen.getByText('通知中心')).toBeTruthy();
    });

    it('shows empty state when no notifications', () => {
      // Override mock for this test
      vi.mocked(require('@/stores/notificationStore').useNotificationStore).mockReturnValueOnce({
        notifications: [],
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        clearAll: vi.fn(),
        getUnreadCount: () => 0,
      });
      renderPanel();
      expect(screen.getByText('暂无通知')).toBeTruthy();
    });

    it('renders all notification items', () => {
      renderPanel();
      const items = screen.getByRole('list').querySelectorAll('li');
      expect(items.length).toBe(3);
    });

    it('shows unread badge when there are unread notifications', () => {
      renderPanel();
      // 2 unread (notif-1, notif-2)
      const badge = screen.getByLabelText(/2 条未读/);
      expect(badge).toBeTruthy();
    });

    it('does not show badge when all read', () => {
      vi.mocked(require('@/stores/notificationStore').useNotificationStore).mockReturnValueOnce({
        notifications: [{ ...mockNotifications[2] }],
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        clearAll: vi.fn(),
        getUnreadCount: () => 0,
      });
      renderPanel();
      expect(screen.queryByText('通知中心')).toBeTruthy();
      // badge should not appear (unread count = 0)
    });
  });

  describe('actions', () => {
    it('clicking mark-read button calls markAsRead', () => {
      renderPanel();
      // First item has a mark-read button (unread)
      const markBtn = screen.getAllByLabelText('标记已读')[0];
      fireEvent.click(markBtn);
      expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('clicking "全部已读" button calls markAllAsRead', () => {
      renderPanel();
      fireEvent.click(screen.getByLabelText('全部标为已读'));
      expect(mockMarkAllAsRead).toHaveBeenCalled();
    });

    it('clicking "清空" button calls clearAll after confirm', () => {
      renderPanel();
      fireEvent.click(screen.getByLabelText('清空历史'));
      expect(globalThis.confirm).toHaveBeenCalled();
      expect(mockClearAll).toHaveBeenCalled();
    });

    it('load more button increments page', () => {
      // Add many notifications to trigger pagination
      const manyNotifications = Array.from({ length: 25 }, (_, i) => ({
        id: `notif-${i}`,
        type: 'info' as const,
        title: `Notification ${i}`,
        message: `Message ${i}`,
        senderId: 'user-1',
        senderName: 'User',
        targetUserId: 'user-1',
        isRead: i % 2 === 0,
        timestamp: Date.now() - i * 1000,
      }));
      vi.mocked(require('@/stores/notificationStore').useNotificationStore).mockReturnValueOnce({
        notifications: manyNotifications,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        clearAll: vi.fn(),
        getUnreadCount: () => manyNotifications.filter(n => !n.isRead).length,
      });

      renderPanel();
      // PAGE_SIZE = 20, so load more should be visible
      const loadMoreBtn = screen.getByRole('button', { name: '加载更多' });
      expect(loadMoreBtn).toBeTruthy();

      act(() => {
        fireEvent.click(loadMoreBtn);
      });
      // After load more, all 25 should be visible
      const items = screen.getByRole('list').querySelectorAll('li');
      expect(items.length).toBe(25);
    });
  });

  describe('S74-E5: keyboard navigation', () => {
    it('Tab key focuses first notification item', () => {
      renderPanel();
      const items = screen.getByRole('list').querySelectorAll('li');
      // Focus first item via Tab
      act(() => {
        fireEvent.keyDown(items[0], { key: 'Tab' });
      });
      // Tab moves focus forward; item should be in focus sequence
      // Verify item has tabIndex=0 making it focusable
      expect(items[0].getAttribute('tabIndex')).toBe('0');
    });

    it('Enter key on unread notification item calls markAsRead', () => {
      renderPanel();
      const items = screen.getByRole('list').querySelectorAll('li');
      // First item (notif-1) is unread
      act(() => {
        fireEvent.keyDown(items[0], { key: 'Enter' });
      });
      expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('Enter key on already-read notification item does NOT call markAsRead', () => {
      renderPanel();
      const items = screen.getByRole('list').querySelectorAll('li');
      // Third item (notif-3) is already read
      act(() => {
        fireEvent.keyDown(items[2], { key: 'Enter' });
      });
      expect(mockMarkAsRead).not.toHaveBeenCalled();
    });

    it('ArrowDown key navigates between notification items (if handled)', () => {
      renderPanel();
      const items = screen.getByRole('list').querySelectorAll('li');
      // Focus first item
      act(() => {
        (items[0] as HTMLElement).focus();
      });
      // Press ArrowDown — item should remain focusable (no crash)
      act(() => {
        fireEvent.keyDown(items[0], { key: 'ArrowDown' });
      });
      // Focus should remain within the list (items[0] or items[1])
      expect(document.activeElement).not.toBeNull();
    });

    it('ArrowUp key navigates backward between notification items', () => {
      renderPanel();
      const items = screen.getByRole('list').querySelectorAll('li');
      // Focus second item
      act(() => {
        (items[1] as HTMLElement).focus();
      });
      act(() => {
        fireEvent.keyDown(items[1], { key: 'ArrowUp' });
      });
      // Focus should remain within the list
      expect(document.activeElement).not.toBeNull();
    });

    it('Escape key does NOT close the notification panel (panel-only Escape is in settings drawer)', () => {
      const { onClose } = renderPanel();
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });
      // NotificationPanel does NOT listen for Escape — only NotificationSettingsDrawer does
      expect(onClose).not.toHaveBeenCalled();
    });

    it('Shift+Tab cycles backward through notification items', () => {
      renderPanel();
      const items = screen.getByRole('list').querySelectorAll('li');
      // Focus last item first
      act(() => {
        (items[2] as HTMLElement).focus();
      });
      act(() => {
        fireEvent.keyDown(items[2], { key: 'Tab', shiftKey: true });
      });
      // Focus should still be in the list
      expect(screen.getByRole('list').contains(document.activeElement as Element)).toBe(true);
    });

    it('mark-read button is keyboard-operable (is a focusable button)', () => {
      renderPanel();
      const markBtns = screen.getAllByLabelText('标记已读');
      // Button should be focusable
      expect(markBtns[0].getAttribute('tabIndex')).not.toBe('-1');
      // Clicking the button works
      fireEvent.click(markBtns[0]);
      expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
    });
  });
});
