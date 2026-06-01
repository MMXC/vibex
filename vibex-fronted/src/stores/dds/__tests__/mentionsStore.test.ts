import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useMentionsStore } from '../mentionsStore';

describe('mentionsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useMentionsStore.setState({ mentions: [], unreadCount: 0 });
    });
  });

  it('should start with empty mentions', () => {
    const { mentions, unreadCount } = useMentionsStore.getState();
    expect(mentions).toEqual([]);
    expect(unreadCount).toBe(0);
  });

  it('should add a mention and increment unreadCount', () => {
    act(() => {
      useMentionsStore.getState().addMention({
        commentId: 'c1',
        fromUser: 'alice',
        toUser: 'bob',
        commentText: 'Hey @bob check this out',
        projectId: 'proj1',
        timestamp: 1234567890,
      });
    });

    const { mentions, unreadCount } = useMentionsStore.getState();
    expect(mentions).toHaveLength(1);
    expect(mentions[0].mentionId).toBeTruthy();
    expect(mentions[0].fromUser).toBe('alice');
    expect(mentions[0].toUser).toBe('bob');
    expect(mentions[0].read).toBe(false);
    expect(unreadCount).toBe(1);
  });

  it('should add multiple mentions', () => {
    act(() => {
      useMentionsStore.getState().addMention({
        commentId: 'c1', fromUser: 'alice', toUser: 'bob',
        commentText: '@bob', projectId: 'proj1', timestamp: 1,
      });
      useMentionsStore.getState().addMention({
        commentId: 'c2', fromUser: 'bob', toUser: 'carol',
        commentText: '@carol', projectId: 'proj1', timestamp: 2,
      });
    });

    const { mentions } = useMentionsStore.getState();
    expect(mentions).toHaveLength(2);
  });

  it('should mark a mention as read', () => {
    act(() => {
      useMentionsStore.getState().addMention({
        commentId: 'c1', fromUser: 'alice', toUser: 'bob',
        commentText: '@bob hi', projectId: 'proj1', timestamp: 1,
      });
    });

    const mentionId = useMentionsStore.getState().mentions[0].mentionId;

    act(() => {
      useMentionsStore.getState().markAsRead(mentionId);
    });

    const { mentions, unreadCount } = useMentionsStore.getState();
    expect(mentions[0].read).toBe(true);
    expect(unreadCount).toBe(0);
  });

  it('should mark all mentions as read', () => {
    act(() => {
      useMentionsStore.getState().addMention({
        commentId: 'c1', fromUser: 'a', toUser: 'b',
        commentText: '@b', projectId: 'p1', timestamp: 1,
      });
      useMentionsStore.getState().addMention({
        commentId: 'c2', fromUser: 'c', toUser: 'b',
        commentText: '@b', projectId: 'p1', timestamp: 2,
      });
    });

    act(() => {
      useMentionsStore.getState().markAllAsRead();
    });

    const { mentions, unreadCount } = useMentionsStore.getState();
    expect(mentions.every(m => m.read)).toBe(true);
    expect(unreadCount).toBe(0);
  });

  it('should filter mentions by project', () => {
    act(() => {
      useMentionsStore.getState().addMention({
        commentId: 'c1', fromUser: 'a', toUser: 'b',
        commentText: '@b', projectId: 'proj1', timestamp: 1,
      });
      useMentionsStore.getState().addMention({
        commentId: 'c2', fromUser: 'c', toUser: 'b',
        commentText: '@b', projectId: 'proj2', timestamp: 2,
      });
    });

    const proj1Mentions = useMentionsStore.getState().getMentionsByProject('proj1');
    expect(proj1Mentions).toHaveLength(1);
    expect(proj1Mentions[0].commentId).toBe('c1');
  });

  it('should clear all mentions', () => {
    act(() => {
      useMentionsStore.getState().addMention({
        commentId: 'c1', fromUser: 'a', toUser: 'b',
        commentText: '@b', projectId: 'p1', timestamp: 1,
      });
    });

    act(() => {
      useMentionsStore.getState().clearMentions();
    });

    const { mentions, unreadCount } = useMentionsStore.getState();
    expect(mentions).toEqual([]);
    expect(unreadCount).toBe(0);
  });
});
