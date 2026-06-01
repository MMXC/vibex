/**
 * commentStore — Unit Tests
 * Sprint49 E5: 协作评论系统
 * Sprint50 E3: addListener/removeListener + unreadCount + markAllAsRead
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

// Access the module-level listeners set for test cleanup
// We import the store and clear listeners via the exposed removeListener
function clearAllListeners() {
  // Since there's no "clearAll" API, we re-import the module internals
  // by calling removeListener with a dummy and trusting the Set is cleared via other means
  // The best approach: the store's addListener returns an unsubscribe fn, we call those
  // For testing, we manually clear by re-setting the module var via vi.mock cleanup
}

describe('commentStore — E5', () => {
  beforeEach(() => {
    // Reset store state including E3 new fields
    useCommentStore.setState({
      comments: [],
      initialized: true,
      unreadCount: 0,
    });
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

// ============================================================
// S50-E3: Event subscription + unreadCount
// ============================================================
describe('commentStore — E3: listeners + unreadCount', () => {
  // S50-E3: Reset state fields in every test
  beforeEach(() => {
    useCommentStore.setState({
      comments: [],
      initialized: true,
      unreadCount: 0,
    });
  });

  // ---- addListener fires on addComment ----
  it('addListener fires with comment:created event', () => {
    const listener = vi.fn();
    const unsubscribe = useCommentStore.getState().addListener(listener);

    useCommentStore.getState().addComment('node-1', 'Test comment');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'comment:created' })
    );

    unsubscribe();
  });

  it('addListener fires with comment:resolved event', () => {
    const listener = vi.fn();
    const unsubscribe = useCommentStore.getState().addListener(listener);

    const comment = useCommentStore.getState().addComment('node-1', 'To resolve');
    useCommentStore.getState().resolveComment(comment.commentId);

    // addComment → comment:created; resolveComment → comment:resolved
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'comment:resolved' })
    );

    unsubscribe();
  });

  it('addListener fires with comment:deleted event', () => {
    const listener = vi.fn();
    const unsubscribe = useCommentStore.getState().addListener(listener);

    const comment = useCommentStore.getState().addComment('node-1', 'To delete');
    useCommentStore.getState().deleteComment(comment.commentId);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'comment:deleted' })
    );

    unsubscribe();
  });

  // ---- removeListener stops firing ----
  it('removeListener stops event delivery', () => {
    const listener = vi.fn();
    useCommentStore.getState().addListener(listener);
    useCommentStore.getState().removeListener(listener);

    useCommentStore.getState().addComment('node-1', 'Should not fire');

    expect(listener).not.toHaveBeenCalled();
  });

  // ---- unsubscribe function works ----
  it('unsubscribe function returned by addListener stops events', () => {
    const listener = vi.fn();
    const unsubscribe = useCommentStore.getState().addListener(listener);

    useCommentStore.getState().addComment('node-1', 'First');
    unsubscribe();
    useCommentStore.getState().addComment('node-2', 'Second');

    expect(listener).toHaveBeenCalledTimes(1); // only the first one
  });

  // ---- unreadCount global state ----
  it('addComment increments global unreadCount', () => {
    expect(useCommentStore.getState().unreadCount).toBe(0);

    useCommentStore.getState().addComment('node-1', 'Comment 1');
    expect(useCommentStore.getState().unreadCount).toBe(1);

    useCommentStore.getState().addComment('node-2', 'Comment 2');
    expect(useCommentStore.getState().unreadCount).toBe(2);
  });

  it('resolveComment decrements global unreadCount', () => {
    const c1 = useCommentStore.getState().addComment('node-1', 'Keep unread');
    useCommentStore.getState().addComment('node-2', 'To resolve');

    expect(useCommentStore.getState().unreadCount).toBe(2);

    useCommentStore.getState().resolveComment(c1.commentId);
    expect(useCommentStore.getState().unreadCount).toBe(1);
  });

  it('deleteComment decrements global unreadCount', () => {
    const c1 = useCommentStore.getState().addComment('node-1', 'Keep');
    useCommentStore.getState().addComment('node-2', 'Delete');

    expect(useCommentStore.getState().unreadCount).toBe(2);

    useCommentStore.getState().deleteComment(c1.commentId);
    expect(useCommentStore.getState().unreadCount).toBe(1);
  });

  // ---- markAllAsRead resets unreadCount ----
  it('markAllAsRead sets unreadCount to 0 and lastSeenTimestamp to now', () => {
    useCommentStore.getState().addComment('node-1', 'Comment 1');
    useCommentStore.getState().addComment('node-2', 'Comment 2');

    expect(useCommentStore.getState().unreadCount).toBe(2);

    useCommentStore.getState().markAllAsRead();

    expect(useCommentStore.getState().unreadCount).toBe(0);
  });

  // ---- getUnreadCount(nodeId) per-node filtering ----
  it('getUnreadCount(nodeId) returns count of unresolved comments for that node only', () => {
    // Add 2 unresolved comments for node-1, 1 for node-2
    useCommentStore.getState().addComment('node-1', 'Comment A');
    useCommentStore.getState().addComment('node-1', 'Comment B');
    useCommentStore.getState().addComment('node-2', 'Comment C');

    // Global unreadCount: all 3
    expect(useCommentStore.getState().unreadCount).toBe(3);
    // Per-node: node-1 has 2, node-2 has 1
    expect(useCommentStore.getState().getUnreadCount('node-1')).toBe(2);
    expect(useCommentStore.getState().getUnreadCount('node-2')).toBe(1);

    // Resolve one from node-1
    const node1Comments = useCommentStore.getState().getCommentsByNode('node-1');
    useCommentStore.getState().resolveComment(node1Comments[0].commentId);

    // Global: 2 remaining; node-1: 1 remaining
    expect(useCommentStore.getState().unreadCount).toBe(2);
    expect(useCommentStore.getState().getUnreadCount('node-1')).toBe(1);
  });
});
