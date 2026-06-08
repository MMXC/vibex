/**
 * collabSessionStore.comments-notification.test.ts — S79-E3: 评论提及通知系统
 *
 * Tests notification triggering when:
 * - addComment has @mentions → creates 'mention' notification for each mentioned user
 * - addReply → creates 'comment_reply' notification for the parent comment author
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCollabSessionStore } from '../collabSessionStore';

// Use vi.hoisted so mockRef is available when vi.mock factory runs
const mockRef = vi.hoisted(() => {
  const addNotification = vi.fn();
  const getState = vi.fn(() => ({ addNotification }));
  return { addNotification, getState };
});

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: { getState: mockRef.getState },
}));

describe('collabSessionStore — S79-E3 Comments & Notifications', () => {
  beforeEach(() => {
    useCollabSessionStore.setState({ comments: {} });
    mockRef.addNotification.mockClear();
  });

  // ========== addComment — mention notifications ==========

  it('addComment with @mentions creates notification for each mentioned user', () => {
    const store = useCollabSessionStore.getState();

    const thread = store.addComment(
      'node-1',
      '@user-2 和 @user-3 请看一下',
      'user-1',
      '张三',
      ['user-2', 'user-3'],
      '👤',
    );

    expect(thread).toBeTruthy();
    expect(mockRef.addNotification).toHaveBeenCalledTimes(2);
    // Should notify user-2 and user-3, NOT the author
    const calls = mockRef.addNotification.mock.calls;
    const targetUserIds = calls.map(c => (c[0] as { targetUserId: string }).targetUserId);
    expect(targetUserIds).toContain('user-2');
    expect(targetUserIds).toContain('user-3');
    expect(targetUserIds).not.toContain('user-1');
  });

  it('addComment does NOT notify the author of their own mention', () => {
    const store = useCollabSessionStore.getState();

    store.addComment('node-1', '@user-1 自己夸自己', 'user-1', '张三', ['user-1']);

    // Should NOT create notification because author === mentioned user
    expect(mockRef.addNotification).not.toHaveBeenCalled();
  });

  it('addComment without mentions creates zero notifications', () => {
    const store = useCollabSessionStore.getState();

    store.addComment('node-1', '普通评论无提及', 'user-1', '张三', [], '👤');

    expect(mockRef.addNotification).not.toHaveBeenCalled();
  });

  it('addComment notification includes nodeId and commentId for navigation', () => {
    const store = useCollabSessionStore.getState();

    const thread = store.addComment('node-1', '@user-2 请看这里', 'user-1', '张三', ['user-2']);

    const call = mockRef.addNotification.mock.calls[0];
    const notif = call[0] as { type: string; targetUserId: string; nodeId: string; commentId: string };
    expect(notif.type).toBe('mention');
    expect(notif.targetUserId).toBe('user-2');
    expect(notif.nodeId).toBe('node-1');
    expect(notif.commentId).toBe(thread.commentId);
  });

  // ========== addReply — comment_reply notifications ==========

  it('addReply creates comment_reply notification for parent author', () => {
    const store = useCollabSessionStore.getState();

    const thread = store.addComment('node-1', '原评论', 'author-1', '张三', [], '👤');
    store.addReply('node-1', thread.commentId, '这是回复', 'replier-1', '李四', [], '👤');

    expect(mockRef.addNotification).toHaveBeenCalledTimes(1);
    const call = mockRef.addNotification.mock.calls[0];
    const notif = call[0] as { type: string; targetUserId: string; nodeId: string; replyId: string };
    expect(notif.type).toBe('comment_reply');
    expect(notif.targetUserId).toBe('author-1');
    expect(notif.nodeId).toBe('node-1');
    expect(notif.replyId).toBeTruthy();
  });

  it('addReply does NOT notify if author replies to own comment', () => {
    const store = useCollabSessionStore.getState();

    const thread = store.addComment('node-1', '原评论', 'user-1', '张三', [], '👤');
    store.addReply('node-1', thread.commentId, '自己回复自己', 'user-1', '张三', [], '👤');

    // No notification — author replying to own comment
    expect(mockRef.addNotification).not.toHaveBeenCalled();
  });

  it('addReply on non-existent thread creates no notification', () => {
    const store = useCollabSessionStore.getState();

    const result = store.addReply('node-1', 'non-existent-id', '回复', 'user-1', '张三', [], '👤');

    expect(result).toBeNull();
    expect(mockRef.addNotification).not.toHaveBeenCalled();
  });

  it('addReply with @mentions also creates mention notifications', () => {
    const store = useCollabSessionStore.getState();

    const thread = store.addComment('node-1', '原评论', 'author-1', '张三', [], '👤');
    store.addReply(
      'node-1',
      thread.commentId,
      '@user-2 看到没？',
      'replier-1',
      '李四',
      ['user-2'],
    );

    // 1 for comment_reply to author + 1 for mention to user-2 = 2
    expect(mockRef.addNotification).toHaveBeenCalledTimes(2);
    const calls = mockRef.addNotification.mock.calls;
    const types = calls.map(c => (c[0] as { type: string }).type);
    expect(types).toContain('comment_reply');
    expect(types).toContain('mention');
  });
});
