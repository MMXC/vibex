/**
 * commentStore — Unit Tests
 * Sprint49 E5: 协作评论系统
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCommentStore } from '../commentStore';

// Mock idb — all DB operations are fire-and-forget in the store
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

describe('commentStore — E5', () => {
  beforeEach(() => {
    useCommentStore.setState({ comments: [], initialized: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- addComment ----

  it('addComment creates a new comment with required fields', () => {
    const comment = useCommentStore.getState().addComment('node-1', 'Please review this');

    expect(comment.commentId).toBeTruthy();
    expect(comment.nodeId).toBe('node-1');
    expect(comment.text).toBe('Please review this');
    expect(comment.author).toBe('User');
    expect(comment.resolved).toBe(false);
    expect(comment.version).toBe(1);
    expect(typeof comment.timestamp).toBe('number');
  });

  it('addComment uses provided author', () => {
    const comment = useCommentStore.getState().addComment('node-1', 'Test', 'Alice');
    expect(comment.author).toBe('Alice');
  });

  it('addComment appends to comments array', () => {
    useCommentStore.getState().addComment('node-1', 'First');
    useCommentStore.getState().addComment('node-2', 'Second');

    const state = useCommentStore.getState();
    expect(state.comments).toHaveLength(2);
    expect(state.comments[0].text).toBe('First');
    expect(state.comments[1].text).toBe('Second');
  });

  // ---- getCommentsByNode ----

  it('getCommentsByNode returns only matching node comments', () => {
    useCommentStore.getState().addComment('node-1', 'Comment A');
    useCommentStore.getState().addComment('node-2', 'Comment B');
    useCommentStore.getState().addComment('node-1', 'Comment C');

    const state = useCommentStore.getState();
    const node1Comments = state.getCommentsByNode('node-1');
    const node2Comments = state.getCommentsByNode('node-2');

    expect(node1Comments).toHaveLength(2);
    expect(node1Comments[0].text).toBe('Comment A');
    expect(node1Comments[1].text).toBe('Comment C');
    expect(node2Comments).toHaveLength(1);
    expect(node2Comments[0].text).toBe('Comment B');
  });

  it('getCommentsByNode returns empty array for unknown node', () => {
    const result = useCommentStore.getState().getCommentsByNode('nonexistent');
    expect(result).toHaveLength(0);
  });

  // ---- resolveComment / unresolveComment ----

  it('resolveComment sets resolved to true', () => {
    const comment = useCommentStore.getState().addComment('node-1', 'To be resolved');
    useCommentStore.getState().resolveComment(comment.commentId);

    const updated = useCommentStore.getState().comments.find(c => c.commentId === comment.commentId);
    expect(updated?.resolved).toBe(true);
  });

  it('unresolveComment sets resolved to false', () => {
    const comment = useCommentStore.getState().addComment('node-1', 'To be unresolved');
    useCommentStore.getState().resolveComment(comment.commentId);
    useCommentStore.getState().unresolveComment(comment.commentId);

    const updated = useCommentStore.getState().comments.find(c => c.commentId === comment.commentId);
    expect(updated?.resolved).toBe(false);
  });

  // ---- editComment ----

  it('editComment updates text and increments version', () => {
    const comment = useCommentStore.getState().addComment('node-1', 'Original text');
    useCommentStore.getState().editComment(comment.commentId, 'Updated text');

    const updated = useCommentStore.getState().comments.find(c => c.commentId === comment.commentId);
    expect(updated?.text).toBe('Updated text');
    expect(updated?.version).toBe(2);
  });

  // ---- deleteComment ----

  it('deleteComment removes comment from array', () => {
    const c1 = useCommentStore.getState().addComment('node-1', 'Keep me');
    const c2 = useCommentStore.getState().addComment('node-1', 'Delete me');
    useCommentStore.getState().deleteComment(c2.commentId);

    const state = useCommentStore.getState();
    expect(state.comments).toHaveLength(1);
    expect(state.comments[0].commentId).toBe(c1.commentId);
  });

  // ---- getUnreadCount ----

  it('getUnreadCount returns count of unresolved comments for node', () => {
    useCommentStore.getState().addComment('node-1', 'Comment 1');
    useCommentStore.getState().addComment('node-1', 'Comment 2');
    const resolved = useCommentStore.getState().addComment('node-1', 'Comment 3');
    useCommentStore.getState().resolveComment(resolved.commentId);

    expect(useCommentStore.getState().getUnreadCount('node-1')).toBe(2);
  });

  // ---- getUnresolvedCount ----

  it('getUnresolvedCount returns total unresolved comments', () => {
    const c1 = useCommentStore.getState().addComment('node-1', 'Comment A');
    useCommentStore.getState().addComment('node-2', 'Comment B');
    useCommentStore.getState().resolveComment(c1.commentId);

    expect(useCommentStore.getState().getUnresolvedCount()).toBe(1);
  });

  // ---- getTotalCount ----

  it('getTotalCount returns total comments', () => {
    useCommentStore.getState().addComment('node-1', 'Comment 1');
    useCommentStore.getState().addComment('node-2', 'Comment 2');

    expect(useCommentStore.getState().getTotalCount()).toBe(2);
  });
});
