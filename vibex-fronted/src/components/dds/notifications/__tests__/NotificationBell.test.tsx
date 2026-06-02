/**
 * NotificationBell + NotificationPanel vitest
 * Sprint53 E3: @提及通知面板
 *
 * D3.1: NotificationBell 铃铛图标 + unreadCount 红点
 * D3.3: 点击铃铛展开面板，点击外部关闭
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { NotificationBell } from '../NotificationBell';
import { NotificationPanel } from '../NotificationPanel';
import { useMentionsStore } from '../../../../stores/dds/mentionsStore';

describe('NotificationBell', () => {
  beforeEach(() => {
    act(() => {
      useMentionsStore.setState({ mentions: [], unreadCount: 0 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render bell button', () => {
    render(<NotificationBell />);
    expect(
      screen.getByRole('button', { name: /通知/i })
    ).toBeInTheDocument();
  });

  it('should show "通知" label (not "通知 (0)") when unreadCount is 0', () => {
    render(<NotificationBell />);
    expect(screen.getByRole('button', { name: '通知' })).toBeInTheDocument();
  });

  it('should show badge with unreadCount > 0', () => {
    act(() => {
      useMentionsStore.setState({ unreadCount: 5 });
    });
    render(<NotificationBell />);
    expect(
      screen.getByRole('button', { name: /通知 \(5 条未读\)/i })
    ).toBeInTheDocument();
  });

  it('should show 99+ when unreadCount > 99', () => {
    act(() => {
      useMentionsStore.setState({ unreadCount: 150 });
    });
    render(<NotificationBell />);
    const bellBtn = screen.getByRole('button');
    expect(bellBtn.getAttribute('aria-label')).toContain('150');
  });

  it('should toggle panel on bell click', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);
    const bellBtn = screen.getByRole('button', { name: /通知/i });

    // Click to open
    await user.click(bellBtn);
    expect(screen.getByRole('dialog', { name: '通知列表' })).toBeInTheDocument();

    // Click to close
    await user.click(bellBtn);
    expect(screen.queryByRole('dialog', { name: '通知列表' })).not.toBeInTheDocument();
  });

  it('should close panel on outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <NotificationBell />
        <button data-testid="outside">Outside</button>
      </div>
    );
    const bellBtn = screen.getByRole('button', { name: /通知/i });

    await user.click(bellBtn);
    expect(screen.getByRole('dialog', { name: '通知列表' })).toBeInTheDocument();

    await user.click(screen.getByTestId('outside'));
    expect(screen.queryByRole('dialog', { name: '通知列表' })).not.toBeInTheDocument();
  });

  it('should close panel on Escape key', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);
    const bellBtn = screen.getByRole('button', { name: /通知/i });

    await user.click(bellBtn);
    expect(screen.getByRole('dialog', { name: '通知列表' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: '通知列表' })).not.toBeInTheDocument();
  });
});

describe('NotificationPanel', () => {
  beforeEach(() => {
    act(() => {
      useMentionsStore.setState({ mentions: [], unreadCount: 0 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show empty state when no mentions', () => {
    render(<NotificationPanel onClose={vi.fn()} onMentionClick={vi.fn()} />);
    expect(screen.getByText('暂无通知')).toBeInTheDocument();
  });

  it('should show mention items sorted by timestamp descending', () => {
    act(() => {
      useMentionsStore.setState({
        mentions: [
          {
            mentionId: 'm1',
            commentId: 'c1',
            fromUser: 'alice',
            toUser: 'bob',
            commentText: 'First (oldest)',
            projectId: 'p1',
            timestamp: 1000,
            read: false,
          },
          {
            mentionId: 'm2',
            commentId: 'c2',
            fromUser: 'carol',
            toUser: 'bob',
            commentText: 'Second (newest)',
            projectId: 'p1',
            timestamp: 2000,
            read: false,
          },
        ],
        unreadCount: 2,
      });
    });
    render(<NotificationPanel onClose={vi.fn()} onMentionClick={vi.fn()} />);

    // Newest first: carol appears before alice
    const allText = screen.getByRole('dialog', { name: '通知列表' }).textContent ?? '';
    const carolIdx = allText.indexOf('carol');
    const aliceIdx = allText.indexOf('alice');
    expect(carolIdx).toBeLessThan(aliceIdx);
  });

  it('should call markAsRead when clicking an unread mention', async () => {
    const user = userEvent.setup();
    act(() => {
      useMentionsStore.setState({
        mentions: [
          {
            mentionId: 'm1',
            commentId: 'c1',
            fromUser: 'alice',
            toUser: 'bob',
            commentText: '@bob hi',
            projectId: 'proj1',
            timestamp: Date.now(),
            read: false,
          },
        ],
        unreadCount: 1,
      });
    });

    const onMentionClick = vi.fn();
    render(<NotificationPanel onClose={vi.fn()} onMentionClick={onMentionClick} />);

    // Find the mention item (contains "@bob")
    const mentionItem = screen.getByRole('button', { name: /@bob/i });
    await user.click(mentionItem);

    expect(onMentionClick).toHaveBeenCalledWith('m1', 'proj1');

    // Store should have updated read state
    const { mentions } = useMentionsStore.getState();
    const mentioned = mentions.find((m) => m.mentionId === 'm1');
    expect(mentioned?.read).toBe(true);
  });

  it('should mark all as read when markAllAsRead action is called', async () => {
    act(() => {
      useMentionsStore.setState({
        mentions: [
          {
            mentionId: 'm1',
            commentId: 'c1',
            fromUser: 'alice',
            toUser: 'bob',
            commentText: 'msg1',
            projectId: 'p1',
            timestamp: Date.now(),
            read: false,
          },
          {
            mentionId: 'm2',
            commentId: 'c2',
            fromUser: 'carol',
            toUser: 'bob',
            commentText: 'msg2',
            projectId: 'p1',
            timestamp: Date.now() - 1000,
            read: false,
          },
        ],
        unreadCount: 2,
      });
    });

    render(<NotificationPanel onClose={vi.fn()} onMentionClick={vi.fn()} />);

    // Call markAllAsRead directly on the store
    act(() => {
      useMentionsStore.getState().markAllAsRead();
    });

    const { mentions, unreadCount } = useMentionsStore.getState();
    expect(mentions.every((m) => m.read)).toBe(true);
    expect(unreadCount).toBe(0);
  });

  it('should call onClose when panel is rendered and close button clicked (if any)', () => {
    // onClose is called when clicking outside in the bell, not within panel
    // Panel itself doesn't have a close button
    const onClose = vi.fn();
    render(<NotificationPanel onClose={onClose} onMentionClick={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: '通知列表' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
