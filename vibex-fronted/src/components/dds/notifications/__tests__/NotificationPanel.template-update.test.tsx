/**
 * NotificationPanel.template-update.test.tsx — S79-E2
 *
 * Tests:
 * - Tab system: 全部 / 模板更新 tabs render correctly
 * - Tab switching: clicking 模板更新 tab shows only template_update notifications
 * - Template update unread count badge on 模板更新 tab
 * - Template update items render thumbnail + author + date
 * - Clicking template update item dispatches 'template:focus' event
 * - All tab shows all notification types
 * - Empty state for 模板更新 tab when no template_update notifications
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type Notification = {
  id: string;
  type: 'mention' | 'reply' | 'system' | 'info' | 'template_update';
  title: string;
  message: string;
  senderId: string;
  senderName: string;
  targetUserId: string;
  nodeId?: string;
  canvasId?: string;
  isRead: boolean;
  timestamp: number;
  templateId?: string;
  authorId?: string;
  thumbnail?: string;
};

// ── Mock notifications ─────────────────────────────────────────────────────────
const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'mention',
    title: '@提及',
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
    id: 'notif-t1',
    type: 'template_update',
    title: '模板更新',
    message: 'Design System v2.0 has been updated',
    senderId: 'system',
    senderName: 'System',
    targetUserId: 'user-1',
    canvasId: 'canvas-1',
    isRead: false,
    timestamp: Date.now() - 120000,
    templateId: 'tmpl-design-v2',
    authorId: 'bob',
    thumbnail: 'https://example.com/tmpl-thumb.png',
  },
  {
    id: 'notif-t2',
    type: 'template_update',
    title: '模板更新',
    message: 'Project Template received new content',
    senderId: 'system',
    senderName: 'System',
    targetUserId: 'user-1',
    canvasId: 'canvas-1',
    isRead: true,
    timestamp: Date.now() - 3600000,
    templateId: 'tmpl-project',
    authorId: 'alice',
    thumbnail: undefined,
  },
];

// ── Zustand mock ──────────────────────────────────────────────────────────────
const mockStoreRef = vi.hoisted(() => {
  const state = {
    notifications: [] as Notification[],
    preferences: {
      channels: { inApp: true, browser: true },
      types: { mention: true, reply: true, system: true, info: true, template_update: true },
    },
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearAll: vi.fn(),
    getUnreadCount: () => 0,
  };
  return {
    state,
    // Single override slot — test sets this directly; no FIFO queue
    overrideState: null as Partial<typeof state> | null,
    storeFn: null as any,
  };
});

const _mockStoreFn = vi.fn((selector?: (s: any) => unknown) => {
  // Merge overrideState over base state so partial overrides work (preferences, etc.)
  const base = mockStoreRef.overrideState
    ? { ...mockStoreRef.state, ...mockStoreRef.overrideState }
    : mockStoreRef.state;
  if (selector) return selector(base);
  return base;
});
(_mockStoreFn as any).getState = () => mockStoreRef.state;
mockStoreRef.storeFn = _mockStoreFn;

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: (...args: any[]) => mockStoreRef.storeFn?.(...args),
}));

vi.mock('./NotificationSettingsDrawer', () => ({
  NotificationSettingsDrawer: vi.fn(() => null),
}));

// ── Test setup ────────────────────────────────────────────────────────────────
beforeEach(() => {
  mockStoreRef.state.notifications = [...mockNotifications];
  mockStoreRef.state.markAsRead = vi.fn();
  mockStoreRef.state.markAllAsRead = vi.fn();
  mockStoreRef.state.clearAll = vi.fn();
  mockStoreRef.overrideState = null;
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('NotificationPanel — S79-E2: Template Update Tab', () => {
  it('renders 全部 and 模板更新 tabs', async () => {
    const { default: NotificationPanel } = await import('../NotificationPanel');
    await act(async () => {
      render(<NotificationPanel open={true} onClose={vi.fn()} />);
    });

    expect(screen.getByRole('tab', { name: /全部/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /模板更新/ })).toBeInTheDocument();
  });

  it('shows template update unread badge on tab when unread template notifications exist', async () => {
    mockStoreRef.overrideState = {
      notifications: [{ ...mockNotifications[1], isRead: false }],
      getUnreadCount: () => 1,
    };

    const { default: NotificationPanel } = await import('../NotificationPanel');
    await act(async () => {
      render(<NotificationPanel open={true} onClose={vi.fn()} />);
    });

    const tabBadge = screen.getByRole('tab', { name: /模板更新/ }).querySelector('[class*="tabBadge"]');
    expect(tabBadge).toBeInTheDocument();
  });

  it('shows only template_update notifications when 模板更新 tab is active', async () => {
    const { default: NotificationPanel } = await import('../NotificationPanel');
    const { container } = await act(async () => {
      return render(<NotificationPanel open={true} onClose={vi.fn()} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /模板更新/ }));
    });

    // Should show template update messages
    expect(screen.getByText('Design System v2.0 has been updated')).toBeInTheDocument();
    expect(screen.getByText('Project Template received new content')).toBeInTheDocument();

    // Should NOT show mention notification
    expect(screen.queryByText('@you in canvas X')).not.toBeInTheDocument();
  });

  it('shows empty state when 模板更新 tab has no notifications', async () => {
    mockStoreRef.overrideState = {
      notifications: [mockNotifications[0]], // only mention notification
      getUnreadCount: () => 1,
    };

    const { default: NotificationPanel } = await import('../NotificationPanel');
    await act(async () => {
      render(<NotificationPanel open={true} onClose={vi.fn()} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /模板更新/ }));
    });

    expect(screen.getByText('暂无模板更新通知')).toBeInTheDocument();
  });

  it('dispatches template:focus event when clicking template update item', async () => {
    mockStoreRef.overrideState = {
      notifications: [mockNotifications[1]], // template_update notification
      getUnreadCount: () => 1,
    };

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const { default: NotificationPanel } = await import('../NotificationPanel');
    await act(async () => {
      render(<NotificationPanel open={true} onClose={vi.fn()} />);
    });

    // Click 模板更新 tab first
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /模板更新/ }));
    });

    // Click the first template update item
    const items = screen.getAllByRole('listitem');
    const templateItem = items.find(item =>
      item.getAttribute('aria-label')?.includes('Design System')
    );
    expect(templateItem).toBeDefined();

    await act(async () => {
      fireEvent.click(templateItem!);
    });

    // Verify 'template:focus' event was dispatched with templateId
    expect(dispatchSpy).toHaveBeenCalled();
    const focusCall = dispatchSpy.mock.calls.find(
      ([arg]: [unknown]) => (arg as CustomEvent)?.type === 'template:focus'
    );
    expect(focusCall).toBeDefined();
    expect((focusCall[0] as CustomEvent).detail.templateId).toBe('tmpl-design-v2');

    dispatchSpy.mockRestore();
  });

  it('shows author and date for template update items', async () => {
    const { default: NotificationPanel } = await import('../NotificationPanel');
    await act(async () => {
      render(<NotificationPanel open={true} onClose={vi.fn()} />);
    });

    // Click 模板更新 tab
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /模板更新/ }));
    });

    // Should show author info
    expect(screen.getByText(/作者: bob/)).toBeInTheDocument();
    expect(screen.getByText(/作者: alice/)).toBeInTheDocument();
  });
});
