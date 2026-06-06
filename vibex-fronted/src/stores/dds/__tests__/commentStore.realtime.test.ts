/**
 * commentStore.realtime.test.ts — S71-E2: 实时协作评论系统
 *
 * 测试覆盖：
 * - subscribeToCanvas / unsubscribeFromCanvas
 * - broadcastComment (sets _broadcastFn)
 * - Reaction system: addReaction / removeReaction / getReactionCounts / getReactionsByComment
 * - Remote reaction from wsCommentHandler (comment:reaction message)
 * - Remote delete from wsCommentHandler (comment:delete message)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useCommentStore, setCommentBroadcastFn } from '../commentStore';

// ── IndexedDB mock (jsdom has no indexedDB) ───────────────────────────────
vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve({
    transaction: vi.fn(() => ({
      store: { clear: vi.fn(), put: vi.fn() },
      done: Promise.resolve(),
    })),
    getAll: vi.fn(() => Promise.resolve([])),
    put: vi.fn(),
    delete: vi.fn(),
  })),
}));

// ── notificationStore mock ────────────────────────────────────────────────
vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: {
    getState: () => ({
      addNotification: vi.fn(),
    }),
  },
}));

beforeEach(() => {
  // Reset store state between tests
  useCommentStore.setState({
    comments: [],
    initialized: true,
    unreadCount: 0,
    subscribedCanvasId: null,
    reactions: {},
  });
  // Reset broadcast function
  setCommentBroadcastFn(() => {});
});

afterEach(() => {
  setCommentBroadcastFn(() => {});
});

// ── Tests ───────────────────────────────────────────────────────────────

describe('S71-E2: subscribeToCanvas / broadcastComment', () => {
  it('subscribeToCanvas sets subscribedCanvasId', () => {
    const { result } = renderHook(() => useCommentStore());
    act(() => {
      result.current.subscribeToCanvas('canvas-123');
    });
    expect(result.current.subscribedCanvasId).toBe('canvas-123');
  });

  it('unsubscribeFromCanvas clears subscribedCanvasId', () => {
    const { result } = renderHook(() => useCommentStore());
    act(() => {
      result.current.subscribeToCanvas('canvas-123');
      result.current.unsubscribeFromCanvas();
    });
    expect(result.current.subscribedCanvasId).toBeNull();
  });

  it('broadcastComment calls registered broadcast function', () => {
    const { result } = renderHook(() => useCommentStore());
    let called = false;
    let capturedComment: unknown = null;
    setCommentBroadcastFn((c: unknown) => {
      called = true;
      capturedComment = c;
    });

    act(() => {
      result.current.broadcastComment({
        commentId: 'c1',
        nodeId: 'node-1',
        text: 'test',
        author: 'User',
        timestamp: Date.now(),
        resolved: false,
        version: 1,
      });
    });
    expect(called).toBe(true);
    expect((capturedComment as { commentId: string }).commentId).toBe('c1');
  });
});

describe('S71-E2: Reaction system', () => {
  it('addReaction creates a reaction for a comment', () => {
    const { result } = renderHook(() => useCommentStore());
    act(() => {
      result.current.addReaction('comment-1', 'thumbsup', 'user-1');
    });
    const reactions = result.current.getReactionsByComment('comment-1');
    expect(reactions).toHaveLength(1);
    expect(reactions[0].type).toBe('thumbsup');
    expect(reactions[0].userId).toBe('user-1');
    expect(reactions[0].commentId).toBe('comment-1');
  });

  it('addReaction prevents duplicate same-type same-user reaction', () => {
    const { result } = renderHook(() => useCommentStore());
    act(() => {
      result.current.addReaction('comment-1', 'thumbsup', 'user-1');
      result.current.addReaction('comment-1', 'thumbsup', 'user-1');
    });
    const reactions = result.current.getReactionsByComment('comment-1');
    const thumbsupCount = reactions.filter(
      r => r.type === 'thumbsup' && r.userId === 'user-1'
    ).length;
    expect(thumbsupCount).toBe(1);
  });

  it('addReaction allows different types on same comment', () => {
    const { result } = renderHook(() => useCommentStore());
    act(() => {
      result.current.addReaction('comment-1', 'thumbsup', 'user-1');
      result.current.addReaction('comment-1', 'heart', 'user-1');
      result.current.addReaction('comment-1', 'laugh', 'user-1');
    });
    const reactions = result.current.getReactionsByComment('comment-1');
    expect(reactions).toHaveLength(3);
    const types = reactions.map(r => r.type);
    expect(types).toContain('thumbsup');
    expect(types).toContain('heart');
    expect(types).toContain('laugh');
  });

  it('removeReaction removes a specific reaction', () => {
    const { result } = renderHook(() => useCommentStore());
    act(() => {
      result.current.addReaction('comment-1', 'thumbsup', 'user-1');
    });
    expect(result.current.getReactionsByComment('comment-1')).toHaveLength(1);

    act(() => {
      result.current.removeReaction('comment-1', 'thumbsup', 'user-1');
    });
    expect(result.current.getReactionsByComment('comment-1')).toHaveLength(0);
  });

  it('getReactionCounts returns correct counts per type', () => {
    const { result } = renderHook(() => useCommentStore());
    act(() => {
      result.current.addReaction('comment-1', 'thumbsup', 'user-1');
      result.current.addReaction('comment-1', 'thumbsup', 'user-2');
      result.current.addReaction('comment-1', 'heart', 'user-1');
    });
    const counts = result.current.getReactionCounts('comment-1');
    expect(counts.thumbsup).toBe(2);
    expect(counts.heart).toBe(1);
    expect(counts.laugh).toBe(0);
  });

  it('reactions persist in store state', () => {
    const { result } = renderHook(() => useCommentStore());
    act(() => {
      result.current.addReaction('comment-2', 'heart', 'user-3');
    });
    expect(result.current.reactions['comment-2']).toBeDefined();
    expect(result.current.reactions['comment-2']).toHaveLength(1);
  });
});

describe('S71-E2: wsCommentHandler integration (comment:reaction / comment:delete)', () => {
  it('handleCommentWSMessage processes comment:reaction and adds to store', async () => {
    const { handleCommentWSMessage } = await import('@/lib/canvas/wsCommentHandler');
    const { result } = renderHook(() => useCommentStore());

    await act(async () => {
      handleCommentWSMessage({
        type: 'comment:reaction',
        payload: {
          commentId: 'remote-comment-1',
          reactionType: 'thumbsup',
          userId: 'remote-user',
        },
      });
    });

    const reactions = result.current.getReactionsByComment('remote-comment-1');
    expect(reactions).toHaveLength(1);
    expect(reactions[0].type).toBe('thumbsup');
    expect(reactions[0].userId).toBe('remote-user');
  });

  it('handleCommentWSMessage processes comment:delete and removes from store', async () => {
    const { handleCommentWSMessage } = await import('@/lib/canvas/wsCommentHandler');
    const { result } = renderHook(() => useCommentStore());

    // Pre-add a comment to the store
    await act(async () => {
      result.current.addComment('node-1', 'local comment', 'user-1');
    });

    const commentId = result.current.comments[0]?.commentId;
    expect(commentId).toBeDefined();

    // Now simulate a remote delete
    await act(async () => {
      handleCommentWSMessage({
        type: 'comment:delete',
        payload: { commentId },
      });
    });

    expect(result.current.comments.find(c => c.commentId === commentId)).toBeUndefined();
  });

  it('handleCommentWSMessage processes comment:created (remote add)', async () => {
    const { handleCommentWSMessage } = await import('@/lib/canvas/wsCommentHandler');
    const { result } = renderHook(() => useCommentStore());

    await act(async () => {
      handleCommentWSMessage({
        type: 'comment:created',
        payload: {
          comment: {
            commentId: 'remote-c1',
            nodeId: 'node-x',
            text: 'remote comment',
            author: 'RemoteUser',
            timestamp: Date.now(),
            resolved: false,
            version: 1,
          },
        },
      });
    });

    const found = result.current.comments.find(c => c.commentId === 'remote-c1');
    expect(found).toBeDefined();
    expect(found?.text).toBe('remote comment');
  });

  it('handleCommentWSMessage deduplicates comment:created by commentId', async () => {
    const { handleCommentWSMessage } = await import('@/lib/canvas/wsCommentHandler');
    const { result } = renderHook(() => useCommentStore());

    await act(async () => {
      handleCommentWSMessage({
        type: 'comment:created',
        payload: {
          comment: {
            commentId: 'dedup-c1',
            nodeId: 'node-1',
            text: 'first',
            author: 'A',
            timestamp: 1000,
            resolved: false,
            version: 1,
          },
        },
      });
      handleCommentWSMessage({
        type: 'comment:created',
        payload: {
          comment: {
            commentId: 'dedup-c1',
            nodeId: 'node-1',
            text: 'second',
            author: 'B',
            timestamp: 2000,
            resolved: false,
            version: 1,
          },
        },
      });
    });

    const found = result.current.comments.filter(c => c.commentId === 'dedup-c1');
    expect(found).toHaveLength(1);
    expect(found[0].text).toBe('first');
  });
});
