/**
 * commentStore.e2.test.ts — S88-E2: 协作评论增强测试
 *
 * 测试范围：
 * - filterStatus 筛选状态 (all/unresolved/resolved/mentioned)
 * - collapsedThreadIds 折叠状态
 * - getFilteredComments() 筛选逻辑
 * - toggleCollapse / isCollapsed
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCommentStore } from '../commentStore';

// Mock parseMentions for 'mentioned' filter tests
vi.mock('@/lib/canvas/parseMentions', () => ({
  parseMentions: vi.fn((text: string) => {
    const mentions: string[] = [];
    const regex = /@([a-zA-Z0-9_-]+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  }),
}));

describe('commentStore — S88-E2 filter & collapse', () => {
  beforeEach(() => {
    // Reset store state — no act() needed, Zustand updates are synchronous
    useCommentStore.setState({
      comments: [],
      initialized: true,
      unreadCount: 0,
      subscribedCanvasId: null,
      reactions: {},
      filterStatus: 'all',
      collapsedThreadIds: new Set<string>(),
    });
  });

  function addComment(text: string, author = 'Alice', resolved = false) {
    const store = useCommentStore.getState();
    const comment = store.addComment('node-1', text, author);
    if (resolved) {
      store.resolveComment(comment.commentId);
    }
    return comment;
  }

  describe('filterStatus', () => {
    it('defaults to all', () => {
      expect(useCommentStore.getState().filterStatus).toBe('all');
    });

    it('setFilterStatus changes filterStatus', () => {
      useCommentStore.getState().setFilterStatus('unresolved');
      expect(useCommentStore.getState().filterStatus).toBe('unresolved');

      useCommentStore.getState().setFilterStatus('resolved');
      expect(useCommentStore.getState().filterStatus).toBe('resolved');

      useCommentStore.getState().setFilterStatus('mentioned');
      expect(useCommentStore.getState().filterStatus).toBe('mentioned');
    });
  });

  describe('getFilteredComments', () => {
    beforeEach(() => {
      useCommentStore.setState({ filterStatus: 'all' });
    });

    it('returns all comments when filterStatus is all', () => {
      addComment('Hello world');
      addComment('Another comment');

      const filtered = useCommentStore.getState().getFilteredComments();
      expect(filtered).toHaveLength(2);
    });

    it('returns only unresolved comments when filter is unresolved', () => {
      addComment('Unresolved 1', 'Alice', false);
      addComment('Unresolved 2', 'Bob', false);
      addComment('Resolved comment', 'Charlie', true);

      useCommentStore.getState().setFilterStatus('unresolved');

      const filtered = useCommentStore.getState().getFilteredComments();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => !c.resolved)).toBe(true);
    });

    it('returns only resolved comments when filter is resolved', () => {
      addComment('Unresolved 1', 'Alice', false);
      addComment('Resolved comment', 'Bob', true);

      useCommentStore.getState().setFilterStatus('resolved');

      const filtered = useCommentStore.getState().getFilteredComments();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].resolved).toBe(true);
    });

    it('returns comments mentioning current user when filter is mentioned', () => {
      addComment('Hello @alice how are you', 'Bob', false);
      addComment('Hello @charlie how are you', 'Bob', false);
      addComment('No mentions here', 'Charlie', false);

      useCommentStore.getState().setFilterStatus('mentioned');

      const filtered = useCommentStore.getState().getFilteredComments('alice');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].text).toContain('@alice');

      // Filter by @charlie
      const filtered2 = useCommentStore.getState().getFilteredComments('charlie');
      expect(filtered2).toHaveLength(1);
      expect(filtered2[0].text).toContain('@charlie');

      // Case insensitive
      const filtered3 = useCommentStore.getState().getFilteredComments('ALICE');
      expect(filtered3).toHaveLength(1);
    });

    it('returns all when filter is mentioned but no currentUser provided', () => {
      addComment('Hello @alice', 'Bob', false);
      addComment('Hello @bob', 'Alice', false);

      useCommentStore.getState().setFilterStatus('mentioned');

      // Without currentUser, 'mentioned' returns all (no user to filter by)
      const filtered = useCommentStore.getState().getFilteredComments();
      expect(filtered).toHaveLength(2);
    });
  });

  describe('toggleCollapse / isCollapsed', () => {
    it('isCollapsed returns false for non-collapsed comment', () => {
      const id = 'comment-1';
      expect(useCommentStore.getState().isCollapsed(id)).toBe(false);
    });

    it('toggleCollapse adds comment to collapsed set', () => {
      const id = 'comment-1';
      useCommentStore.getState().toggleCollapse(id);

      expect(useCommentStore.getState().isCollapsed(id)).toBe(true);
    });

    it('toggleCollapse removes comment from collapsed set (toggle off)', () => {
      const id = 'comment-1';

      // Toggle on
      useCommentStore.getState().toggleCollapse(id);
      expect(useCommentStore.getState().isCollapsed(id)).toBe(true);

      // Toggle off
      useCommentStore.getState().toggleCollapse(id);
      expect(useCommentStore.getState().isCollapsed(id)).toBe(false);
    });

    it('multiple comments can be collapsed independently', () => {
      useCommentStore.getState().toggleCollapse('comment-1');
      useCommentStore.getState().toggleCollapse('comment-2');

      expect(useCommentStore.getState().isCollapsed('comment-1')).toBe(true);
      expect(useCommentStore.getState().isCollapsed('comment-2')).toBe(true);
      expect(useCommentStore.getState().isCollapsed('comment-3')).toBe(false);

      // Uncollapse only comment-1
      useCommentStore.getState().toggleCollapse('comment-1');

      expect(useCommentStore.getState().isCollapsed('comment-1')).toBe(false);
      expect(useCommentStore.getState().isCollapsed('comment-2')).toBe(true);
    });
  });
});
