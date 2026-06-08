/**
 * mentionStore.mention-notification.test.ts — S79-E3: 评论提及通知系统
 *
 * Tests that mentionsStore.addMention() triggers a 'mention' notification
 * in notificationStore for the mentioned user.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMentionsStore } from '../mentionsStore';

// Use vi.hoisted so mockRef is available when vi.mock factory runs
const mockRef = vi.hoisted(() => {
  const addNotification = vi.fn();
  const getState = vi.fn(() => ({ addNotification }));
  return { addNotification, getState };
});

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: { getState: mockRef.getState },
}));

describe('mentionsStore — S79-E3 @Mention → Notification', () => {
  beforeEach(() => {
    useMentionsStore.setState({ mentions: [], unreadCount: 0 });
    mockRef.addNotification.mockClear();
  });

  it('addMention creates a mention notification in notificationStore', () => {
    // Get state fresh — do NOT cache store reference beforeEach runs
    const store = useMentionsStore.getState();

    store.addMention({
      commentId: 'comment-1',
      fromUser: 'user-1',
      toUser: 'user-2',
      commentText: '@user-2 请看一下这个节点',
      projectId: 'proj-1',
      nodeId: 'node-1',
      timestamp: Date.now(),
    });

    expect(mockRef.addNotification).toHaveBeenCalledTimes(1);
    const call = mockRef.addNotification.mock.calls[0];
    const notif = call[0] as { type: string; targetUserId: string; commentId: string; title: string };
    expect(notif.type).toBe('mention');
    expect(notif.targetUserId).toBe('user-2');
    expect(notif.commentId).toBe('comment-1');
    expect(notif.title).toContain('user-1');
  });

  it('addMention does not notify the sender (fromUser === toUser)', () => {
    const store = useMentionsStore.getState();

    store.addMention({
      commentId: 'comment-1',
      fromUser: 'user-1',
      toUser: 'user-1', // self-mention
      commentText: '自言自语 @user-1',
      projectId: 'proj-1',
      timestamp: Date.now(),
    });

    // No notification for self-mention
    expect(mockRef.addNotification).not.toHaveBeenCalled();
  });

  it('addMention increments unreadCount in mentionsStore', () => {
    // Get state fresh after beforeEach reset
    const store = useMentionsStore.getState();

    store.addMention({
      commentId: 'c1', fromUser: 'u1', toUser: 'u2',
      commentText: 'hi', projectId: 'p1', timestamp: Date.now(),
    });

    // Re-fetch state to see the update
    expect(useMentionsStore.getState().unreadCount).toBe(1);
  });

  it('addMention adds to mentions array', () => {
    // Get state fresh after beforeEach reset
    const store = useMentionsStore.getState();

    store.addMention({
      commentId: 'c1', fromUser: 'u1', toUser: 'u2',
      commentText: 'hi', projectId: 'p1', timestamp: Date.now(),
    });

    // Re-fetch state to see the update
    const mentions = useMentionsStore.getState().mentions;
    expect(mentions).toHaveLength(1);
    expect(mentions[0].commentId).toBe('c1');
    expect(mentions[0].read).toBe(false);
  });
});
