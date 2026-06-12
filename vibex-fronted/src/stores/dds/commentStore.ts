/**
 * commentStore — Sprint49 E5 + Sprint50 E3 + S69-E4 + S71-E2 + S88-E2
 *
 * S49-E5: commentStore + IndexedDB 持久化 + CommentBadge + CommentPanel
 * S50-E3: addListener/removeListener 事件订阅 + unreadCount 追踪 + WebSocket 集成
 * S69-E4: 评论后触发 notificationStore 通知 (addCommentNotification)
 * S71-E2: subscribeToCanvas(canvasId) + broadcastComment() + Reaction 系统
 * S88-E2: filterStatus 筛选状态 + collapsedThreadIds 折叠状态 + getFilteredComments()
 * S92-E3: canvasBubbles 画布评论气泡状态 + openBubbleId 选中气泡 + CommentBubbleAction
 *
 * 设计决策：
 * - commentId 使用 crypto.randomUUID() 生成，确保全局唯一
 * - IndexedDB 持久化：offline-first，评论不因刷新丢失
 * - 同一节点的评论按 timestamp 升序排列（最早在前）
 * - resolved 评论默认折叠，支持展开查看
 * - 事件订阅机制：listeners Set 在 store 外维护，通过 emit() 触发
 * - unreadCount：全局计数器，addComment++ / resolveComment-- / markAllAsRead=0
 * - S71-E2: canvasScope 用于 WS 消息路由；reactions map 存储评论 Reactions
 * - S88-E2: filterStatus 支持 all/unresolved/resolved/mentioned 筛选；collapsedThreadIds 支持线程折叠
 * - S92-E3: canvasBubbles 管理画布级别评论气泡（x, y, node_id, comment_count）
 */
import { create } from 'zustand';
import { openDB } from 'idb';
import { useNotificationStore } from '@/stores/notificationStore';
import { parseMentions } from '@/lib/canvas/parseMentions';

// ==================== Types ====================

export interface Comment {
  commentId: string;
  nodeId: string;
  text: string;
  author: string;
  timestamp: number;
  resolved: boolean;
  version: number;
}

export interface CommentEvent {
  type: 'comment:created' | 'comment:resolved' | 'comment:deleted';
  comment: Comment;
}

/** S71-E2: Reaction 类型 */
export type ReactionType = 'thumbsup' | 'heart' | 'laugh';

export interface Reaction {
  reactionId: string;
  commentId: string;
  type: ReactionType;
  userId: string;
  timestamp: number;
}

export type CommentFilter = 'all' | 'unresolved' | 'resolved' | 'mentioned';

export interface ReactionEvent {
  type: 'reaction:added' | 'reaction:removed';
  reaction: Reaction;
}

/** S92-E3: Canvas comment bubble */
export interface CanvasBubble {
  id: string;
  x: number;
  y: number;
  node_id: string | null;
  comment_count: number;
  unresolved_count: number;
  last_activity: number;
}

export interface CommentStoreState {
  comments: Comment[];
  initialized: boolean;
  // S50-E3: unread count (counter-based — addComment++, resolveComment--)
  unreadCount: number;
  // S71-E2: canvas subscription (active canvas ID for WS routing)
  subscribedCanvasId: string | null;
  // S71-E2: reactions map — keyed by commentId
  reactions: Record<string, Reaction[]>;
  // S88-E2: filter status for CommentPanel
  filterStatus: CommentFilter;
  // S88-E2: collapsed thread IDs (root comment IDs that are collapsed)
  collapsedThreadIds: Set<string>;
  // S92-E3: canvas comment bubbles (floating on canvas)
  // Record<canvasId, Record<bubbleId, CanvasBubble>>
  canvasBubbles: Record<string, Record<string, CanvasBubble>>;
  openBubbleId: string | null;
  openCanvasId: string | null;

  // CRUD
  addComment: (nodeId: string, text: string, author?: string) => Comment;
  editComment: (commentId: string, text: string) => void;
  deleteComment: (commentId: string) => void;
  resolveComment: (commentId: string) => void;
  unresolveComment: (commentId: string) => void;

  // Queries
  getCommentsByNode: (nodeId: string) => Comment[];
  getUnreadCount: (nodeId: string) => number;
  getUnresolvedCount: () => number;
  getTotalCount: () => number;

  // S50-E3: Event subscription
  addListener: (listener: (event: CommentEvent) => void) => () => void;
  removeListener: (listener: (event: CommentEvent) => void) => void;
  // S50-E3: Mark all as read
  markAllAsRead: () => void;

  // S71-E2: Canvas subscription (for WS routing)
  subscribeToCanvas: (canvasId: string) => void;
  unsubscribeFromCanvas: () => void;
  broadcastComment: (comment: Comment) => void;

  // S71-E2: Reaction system
  addReaction: (commentId: string, type: ReactionType, userId: string) => Reaction;
  removeReaction: (commentId: string, type: ReactionType, userId: string) => void;
  getReactionsByComment: (commentId: string) => Reaction[];
  getReactionCounts: (commentId: string) => Record<ReactionType, number>;

  // S88-E2: Filter & collapse
  setFilterStatus: (status: CommentFilter) => void;
  toggleCollapse: (commentId: string) => void;
  isCollapsed: (commentId: string) => boolean;
  getFilteredComments: (currentUser?: string) => Comment[];

  // S92-E3: Canvas bubbles
  openBubble: (canvasId: string, bubbleId: string) => void;
  closeBubble: () => void;
  setCanvasBubbles: (canvasId: string, bubbles: CanvasBubble[]) => void;
  getCanvasBubbles: (canvasId: string) => CanvasBubble[];
}

// ==================== Event System (S50-E3) ====================

// Module-level listeners set — persists across Zustand re-renders
const _commentListeners: Set<(event: CommentEvent) => void> = new Set();
const _reactionListeners: Set<(event: ReactionEvent) => void> = new Set();

function emitCommentEvent(event: CommentEvent): void {
  _commentListeners.forEach(listener => {
    try {
      listener(event);
    } catch (err) {
      console.error('[commentStore] Listener error:', err);
    }
  });
}

function emitReactionEvent(event: ReactionEvent): void {
  _reactionListeners.forEach(listener => {
    try {
      listener(event);
    } catch (err) {
      console.error('[commentStore] Reaction listener error:', err);
    }
  });
}

// ==================== IndexedDB ====================

const DB_NAME = 'vibex-comments';
const DB_VERSION = 3; // Bump version for S71-E2 reactions schema
const STORE = 'comments';
const REACTIONS_STORE = 'reactions';

let _db: Awaited<ReturnType<typeof openDB>> | null = null;

async function initDB() {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'commentId' });
        store.createIndex('by-node', 'nodeId');
        store.createIndex('by-timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains(REACTIONS_STORE) && oldVersion < 3) {
        const rStore = db.createObjectStore(REACTIONS_STORE, { keyPath: 'reactionId' });
        rStore.createIndex('by-comment', 'commentId');
      }
    },
  });
  return _db;
}

async function loadFromDB(): Promise<Comment[]> {
  const db = await initDB();
  const all = await db.getAll(STORE);
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

async function loadReactionsFromDB(): Promise<Record<string, Reaction[]>> {
  const db = await initDB();
  const all = await db.getAll(REACTIONS_STORE);
  const map: Record<string, Reaction[]> = {};
  for (const r of all) {
    if (!map[r.commentId]) map[r.commentId] = [];
    map[r.commentId].push(r);
  }
  return map;
}

async function saveComment(comment: Comment): Promise<void> {
  const db = await initDB();
  await db.put(STORE, comment);
}

async function deleteFromDB(commentId: string): Promise<void> {
  const db = await initDB();
  await db.delete(STORE, commentId);
}

async function saveAll(comments: Comment[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(STORE, 'readwrite');
  await Promise.all([
    tx.store.clear(),
    ...comments.map(c => tx.store.put(c)),
    tx.done,
  ]);
}

async function saveReaction(reaction: Reaction): Promise<void> {
  const db = await initDB();
  await db.put(REACTIONS_STORE, reaction);
}

async function deleteReaction(reactionId: string): Promise<void> {
  const db = await initDB();
  await db.delete(REACTIONS_STORE, reactionId);
}

// S71-E2: Broadcast function — called by wsCommentHandler when a comment is published
let _broadcastFn: ((comment: Comment) => void) | null = null;

export function setCommentBroadcastFn(fn: (comment: Comment) => void): void {
  _broadcastFn = fn;
}

export function getCommentBroadcastFn(): ((comment: Comment) => void) | null {
  return _broadcastFn;
}

// ==================== Store ====================

export const useCommentStore = create<CommentStoreState>((set, get) => ({
  comments: [],
  initialized: false,
  unreadCount: 0,
  subscribedCanvasId: null,
  reactions: {},
  filterStatus: 'all',
  collapsedThreadIds: new Set<string>(),
  // S92-E3
  canvasBubbles: {},
  openBubbleId: null,
  openCanvasId: null,

  addComment: (nodeId, text, author = 'User') => {
    const comment: Comment = {
      commentId: crypto.randomUUID(),
      nodeId,
      text,
      author,
      timestamp: Date.now(),
      resolved: false,
      version: 1,
    };
    set(state => {
      const comments = [...state.comments, comment];
      saveAll(comments).catch(console.error);
      return { comments, unreadCount: state.unreadCount + 1 };
    });
    emitCommentEvent({ type: 'comment:created', comment });

    // S71-E2: Broadcast to other collaborators via WS
    if (_broadcastFn) {
      try {
        _broadcastFn(comment);
      } catch (err) {
        console.error('[commentStore] Broadcast error:', err);
      }
    }

    // S69-E4: Trigger notification when a comment is added
    try {
      useNotificationStore.getState().addNotification({
        type: 'info',
        title: '新评论',
        message: `${author} 在节点 ${nodeId} 评论：${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`,
        senderId: 'system',
        senderName: author,
        targetUserId: 'current-user',
        nodeId,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('[commentStore] Failed to send notification:', err);
    }

    return comment;
  },

  editComment: (commentId, text) => {
    set(state => {
      const comments = state.comments.map(c =>
        c.commentId === commentId
          ? { ...c, text, version: c.version + 1 }
          : c
      );
      const updated = comments.find(c => c.commentId === commentId);
      if (updated) saveComment(updated).catch(console.error);
      return { comments };
    });
  },

  deleteComment: (commentId) => {
    const comment = get().comments.find(c => c.commentId === commentId);
    const wasUnread = comment && !comment.resolved;
    set(state => {
      const comments = state.comments.filter(c => c.commentId !== commentId);
      deleteFromDB(commentId).catch(console.error);
      return {
        comments,
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      };
    });
    if (comment) {
      emitCommentEvent({ type: 'comment:deleted', comment });
    }
  },

  resolveComment: (commentId) => {
    const comment = get().comments.find(c => c.commentId === commentId);
    const wasUnread = comment && !comment.resolved;
    set(state => {
      const comments = state.comments.map(c =>
        c.commentId === commentId ? { ...c, resolved: true } : c
      );
      const updated = comments.find(c => c.commentId === commentId);
      if (updated) saveComment(updated).catch(console.error);
      return {
        comments,
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      };
    });
    if (comment) {
      emitCommentEvent({ type: 'comment:resolved', comment: { ...comment, resolved: true } });
    }
  },

  unresolveComment: (commentId) => {
    const comment = get().comments.find(c => c.commentId === commentId);
    const wasRead = comment && comment.resolved;
    set(state => {
      const comments = state.comments.map(c =>
        c.commentId === commentId ? { ...c, resolved: false } : c
      );
      const updated = comments.find(c => c.commentId === commentId);
      if (updated) saveComment(updated).catch(console.error);
      return {
        comments,
        unreadCount: wasRead ? state.unreadCount + 1 : state.unreadCount,
      };
    });
  },

  getCommentsByNode: (nodeId) => {
    return get().comments
      .filter(c => c.nodeId === nodeId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  // S50-E3: Per-node unread count (filter unresolved comments for this node)
  getUnreadCount: (nodeId) => {
    return get().comments.filter(c => c.nodeId === nodeId && !c.resolved).length;
  },

  getUnresolvedCount: () => {
    return get().comments.filter(c => !c.resolved).length;
  },

  getTotalCount: () => get().comments.length,

  // S50-E3: Event subscription
  addListener: (listener) => {
    _commentListeners.add(listener);
    return () => {
      _commentListeners.delete(listener);
    };
  },

  removeListener: (listener) => {
    _commentListeners.delete(listener);
  },

  // S50-E3: Mark all as read — resets unreadCount to 0
  markAllAsRead: () => {
    set({ unreadCount: 0 });
  },

  // S71-E2: Canvas subscription
  subscribeToCanvas: (canvasId) => {
    set({ subscribedCanvasId: canvasId });
  },

  unsubscribeFromCanvas: () => {
    set({ subscribedCanvasId: null });
  },

  // S71-E2: Broadcast comment to other collaborators via WS
  broadcastComment: (comment) => {
    if (_broadcastFn) {
      try {
        _broadcastFn(comment);
      } catch (err) {
        console.error('[commentStore] Broadcast error:', err);
      }
    }
  },

  // S71-E2: Reaction — add a reaction to a comment
  addReaction: (commentId, type, userId) => {
    const reaction: Reaction = {
      reactionId: crypto.randomUUID(),
      commentId,
      type,
      userId,
      timestamp: Date.now(),
    };
    set(state => {
      const existing = state.reactions[commentId] ?? [];
      // Prevent duplicate: same user + same type on same comment
      if (existing.some(r => r.type === type && r.userId === userId)) {
        return state;
      }
      const reactions = {
        ...state.reactions,
        [commentId]: [...existing, reaction],
      };
      saveReaction(reaction).catch(console.error);
      return { reactions };
    });
    emitReactionEvent({ type: 'reaction:added', reaction });
    return reaction;
  },

  // S71-E2: Reaction — remove a reaction from a comment
  removeReaction: (commentId, type, userId) => {
    const state = get();
    const existing = state.reactions[commentId] ?? [];
    const target = existing.find(r => r.type === type && r.userId === userId);
    if (!target) return;
    set(state => {
      const reactions = {
        ...state.reactions,
        [commentId]: existing.filter(r => r.reactionId !== target.reactionId),
      };
      deleteReaction(target.reactionId).catch(console.error);
      return { reactions };
    });
    emitReactionEvent({ type: 'reaction:removed', reaction: target });
  },

  getReactionsByComment: (commentId) => {
    return get().reactions[commentId] ?? [];
  },

  getReactionCounts: (commentId) => {
    const reactions = get().reactions[commentId] ?? [];
    const counts: Record<ReactionType, number> = { thumbsup: 0, heart: 0, laugh: 0 };
    for (const r of reactions) {
      counts[r.type]++;
    }
    return counts;
  },

  // S88-E2: Set filter status for CommentPanel
  setFilterStatus: (status) => {
    set({ filterStatus: status });
  },

  // S88-E2: Toggle collapse state for a root comment thread
  toggleCollapse: (commentId) => {
    set(state => {
      const next = new Set(state.collapsedThreadIds);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return { collapsedThreadIds: next };
    });
  },

  // S88-E2: Check if a thread is collapsed
  isCollapsed: (commentId) => {
    return get().collapsedThreadIds.has(commentId);
  },

  // S88-E2: Get filtered comments based on filterStatus
  // If filter is 'mentioned', pass currentUser to filter by @mention of that user
  getFilteredComments: (currentUser?: string) => {
    const { comments, filterStatus } = get();

    let filtered = comments;

    if (filterStatus === 'unresolved') {
      filtered = comments.filter(c => !c.resolved);
    } else if (filterStatus === 'resolved') {
      filtered = comments.filter(c => c.resolved);
    } else if (filterStatus === 'mentioned' && currentUser) {
      filtered = comments.filter(c =>
        parseMentions(c.text).some(m => m.toLowerCase() === currentUser!.toLowerCase())
      );
    }

    return filtered;
  },

  // S92-E3: Open a canvas comment bubble
  openBubble: (canvasId, bubbleId) => {
    set({ openCanvasId: canvasId, openBubbleId: bubbleId });
  },

  // S92-E3: Close the currently open bubble
  closeBubble: () => {
    set({ openBubbleId: null, openCanvasId: null });
  },

  // S92-E3: Set bubbles for a specific canvas
  setCanvasBubbles: (canvasId, bubbles) => {
    set(state => {
      const map: Record<string, CanvasBubble> = {};
      for (const b of bubbles) {
        map[b.id] = b;
      }
      return {
        canvasBubbles: { ...state.canvasBubbles, [canvasId]: map },
      };
    });
  },

  // S92-E3: Get bubbles for a specific canvas
  getCanvasBubbles: (canvasId) => {
    const bubbles = get().canvasBubbles[canvasId];
    if (!bubbles) return [];
    return Object.values(bubbles);
  },
}));

// S71-E2: Add reaction listener
export function addReactionListener(listener: (event: ReactionEvent) => void): () => void {
  _reactionListeners.add(listener);
  return () => _reactionListeners.delete(listener);
}

// Initialize from IndexedDB
export async function initCommentStore(): Promise<void> {
  try {
    const comments = await loadFromDB();
    const reactions = await loadReactionsFromDB();
    useCommentStore.setState({
      comments,
      initialized: true,
      unreadCount: 0,
      reactions,
    });
  } catch (err) {
    console.error('[commentStore] Failed to load from IndexedDB:', err);
    useCommentStore.setState({ initialized: true });
  }
}
