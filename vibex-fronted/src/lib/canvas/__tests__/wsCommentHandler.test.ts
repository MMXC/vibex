/**
 * wsCommentHandler — Unit Tests
 * Sprint50 E3: WebSocket 评论实时通知处理器
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCommentWSMessage } from '../wsCommentHandler';
import { useCommentStore } from '@/stores/dds/commentStore';

vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve({
    transaction: vi.fn(() => ({
      store: { clear: vi.fn(), put: vi.fn(), delete: vi.fn() },
      done: Promise.resolve(),
    })),
    getAll: vi.fn(() => Promise.resolve([])),
    put: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe('wsCommentHandler', () => {
  beforeEach(() => {
    useCommentStore.setState({
      comments: [],
      initialized: true,
      unreadCount: 0,
    });
  });

  // ---- handleCommentWSMessage ----

  it('handles comment:created — adds remote comment to store', () => {
    const msg = {
      type: 'comment:created' as const,
      payload: {
        comment: {
          commentId: 'remote-c1',
          nodeId: 'node-remote',
          text: 'Remote comment',
          author: 'Alice',
          timestamp: Date.now(),
          resolved: false,
          version: 1,
        },
      },
    };

    handleCommentWSMessage(msg);

    const comments = useCommentStore.getState().comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].commentId).toBe('remote-c1');
    expect(comments[0].text).toBe('Remote comment');
  });

  it('handles comment:resolved — marks existing comment as resolved', () => {
    // First add a comment via the store
    const comment = useCommentStore.getState().addComment('node-1', 'Local comment');

    // Then resolve it via WS message
    const msg = {
      type: 'comment:resolved' as const,
      payload: {
        comment: {
          commentId: comment.commentId,
          nodeId: 'node-1',
          text: 'Local comment',
          author: 'User',
          timestamp: comment.timestamp,
          resolved: true,
          version: 2,
        },
      },
    };

    handleCommentWSMessage(msg);

    const resolved = useCommentStore.getState().comments.find(c => c.commentId === comment.commentId);
    expect(resolved?.resolved).toBe(true);
  });

  it('deduplicates — does not add comment if already exists', () => {
    const existingComment = useCommentStore.getState().addComment('node-1', 'Existing');

    const msg = {
      type: 'comment:created' as const,
      payload: {
        comment: {
          commentId: existingComment.commentId,
          nodeId: 'node-1',
          text: 'Duplicate remote',
          author: 'Bob',
          timestamp: Date.now(),
          resolved: false,
          version: 1,
        },
      },
    };

    handleCommentWSMessage(msg);

    const comments = useCommentStore.getState().comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].text).toBe('Existing'); // original text preserved
  });

  it('ignores unknown message types silently', () => {
    const msg = {
      type: 'unknown:event' as any,
      payload: { anything: true },
    };

    // Should not throw
    expect(() => handleCommentWSMessage(msg)).not.toThrow();
  });

  it('ignores null/undefined input', () => {
    expect(() => handleCommentWSMessage(null)).not.toThrow();
    expect(() => handleCommentWSMessage(undefined)).not.toThrow();
    expect(() => handleCommentWSMessage({})).not.toThrow();
    expect(() => handleCommentWSMessage({ type: 'not-a-comment' })).not.toThrow();
  });
});
