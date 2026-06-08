/**
 * collabSessionStore.comments.test.ts — S78-E3: 内联评论
 *
 * Tests the comment CRUD operations added to collabSessionStore.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useCollabSessionStore } from '../collabSessionStore';

describe('collabSessionStore — S78-E3 Comments', () => {
  beforeEach(() => {
    // Reset store state between tests
    useCollabSessionStore.setState({ comments: {} });
  });

  // ========== addComment ==========

  it('addComment creates a new thread on a node', () => {
    const store = useCollabSessionStore.getState();

    const thread = store.addComment(
      'node-1',
      '这是一个测试评论',
      'user-1',
      '张三',
      [],
      '👤',
    );

    expect(thread).toMatchObject({
      nodeId: 'node-1',
      userId: 'user-1',
      userName: '张三',
      text: '这是一个测试评论',
      avatar: '👤',
      replies: [],
    });
    expect(thread.commentId).toBeTruthy();
    expect(thread.timestamp).toBeGreaterThan(0);
  });

  it('addComment adds to existing threads on the same node', () => {
    const store = useCollabSessionStore.getState();

    const t1 = store.addComment('node-1', '第1条', 'u1', 'A', []);
    const t2 = store.addComment('node-1', '第2条', 'u2', 'B', []);

    const threads = store.getComments('node-1');
    expect(threads).toHaveLength(2);
    expect(threads.map((t) => t.commentId)).toContain(t1.commentId);
    expect(threads.map((t) => t.commentId)).toContain(t2.commentId);
  });

  it('addComment supports @mentions', () => {
    const store = useCollabSessionStore.getState();

    const thread = store.addComment(
      'node-1',
      '@李四 请看一下',
      'user-1',
      '张三',
      ['user-2'],
    );

    expect(thread.mentions).toEqual(['user-2']);
  });

  // ========== getComments ==========

  it('getComments returns empty array for node with no comments', () => {
    const store = useCollabSessionStore.getState();
    expect(store.getComments('unknown-node')).toEqual([]);
  });

  it('getComments returns only threads for the specified node', () => {
    const store = useCollabSessionStore.getState();

    store.addComment('node-A', 'A 的评论', 'u1', '用户A', []);
    store.addComment('node-B', 'B 的评论', 'u2', '用户B', []);
    store.addComment('node-A', 'A 的第二条', 'u3', '用户C', []);

    const nodeAComments = store.getComments('node-A');
    const nodeBComments = store.getComments('node-B');

    expect(nodeAComments).toHaveLength(2);
    expect(nodeAComments.every((t) => t.nodeId === 'node-A')).toBe(true);
    expect(nodeBComments).toHaveLength(1);
    expect(nodeBComments[0].text).toBe('B 的评论');
  });

  // ========== getCommentCount ==========

  it('getCommentCount returns 0 for node with no comments', () => {
    const store = useCollabSessionStore.getState();
    expect(store.getCommentCount('unknown')).toBe(0);
  });

  it('getCommentCount counts threads + replies', () => {
    const store = useCollabSessionStore.getState();

    const t1 = store.addComment('node-1', '线程1', 'u1', 'A', []);
    store.addReply('node-1', t1.commentId, '回复1', 'u2', 'B', []);
    store.addReply('node-1', t1.commentId, '回复2', 'u3', 'C', []);
    const t2 = store.addComment('node-1', '线程2', 'u4', 'D', []);

    // 2 threads + 2 replies = 4 total
    expect(store.getCommentCount('node-1')).toBe(4);
  });

  // ========== addReply ==========

  it('addReply appends to an existing thread', () => {
    const store = useCollabSessionStore.getState();

    const thread = store.addComment('node-1', '原评论', 'u1', '张三', []);
    const reply = store.addReply(
      'node-1',
      thread.commentId,
      '这是回复',
      'u2',
      '李四',
      [],
    );

    expect(reply).not.toBeNull();
    expect(reply!.text).toBe('这是回复');
    expect(reply!.userId).toBe('u2');
    expect(reply!.replyId).toBeTruthy();
  });

  it('addReply returns null for non-existent thread', () => {
    const store = useCollabSessionStore.getState();
    store.addComment('node-1', '评论', 'u1', 'A', []);

    const result = store.addReply('node-1', 'non-existent-comment-id', 'reply', 'u2', 'B', []);

    expect(result).toBeNull();
  });

  it('addReply returns null for non-existent node', () => {
    const store = useCollabSessionStore.getState();

    const result = store.addReply('unknown-node', 'any-comment', 'reply', 'u1', 'A', []);

    expect(result).toBeNull();
  });

  // ========== deleteComment ==========

  it('deleteComment removes the thread from the node', () => {
    const store = useCollabSessionStore.getState();

    const t1 = store.addComment('node-1', '要删除', 'u1', 'A', []);
    const t2 = store.addComment('node-1', '保留', 'u2', 'B', []);

    store.deleteComment('node-1', t1.commentId);

    const remaining = store.getComments('node-1');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].text).toBe('保留');
  });

  it('deleteComment removes thread with all its replies', () => {
    const store = useCollabSessionStore.getState();

    const t1 = store.addComment('node-1', '要删除的线程', 'u1', 'A', []);
    store.addReply('node-1', t1.commentId, '回复1', 'u2', 'B', []);
    store.addReply('node-1', t1.commentId, '回复2', 'u3', 'C', []);

    store.deleteComment('node-1', t1.commentId);

    // All 3 items (1 thread + 2 replies) gone
    expect(store.getCommentCount('node-1')).toBe(0);
  });
});
