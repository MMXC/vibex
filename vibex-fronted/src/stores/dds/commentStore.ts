/**
 * commentStore — Sprint49 E5 + Sprint50 E3: 协作评论系统
 *
 * S49-E5: commentStore + IndexedDB 持久化 + CommentBadge + CommentPanel
 * S50-E3: addListener/removeListener 事件订阅 + unreadCount 追踪 + WebSocket 集成
 * S69-E4: 评论后触发 notificationStore 通知 (addCommentNotification)
 *
 * 设计决策：
 * - commentId 使用 crypto.randomUUID() 生成，确保全局唯一
 * - IndexedDB 持久化：offline-first，评论不因刷新丢失
 * - 同一节点的评论按 timestamp 升序排列（最早在前）
 * - resolved 评论默认折叠，支持展开查看
 * - 事件订阅机制：listeners Set 在 store 外维护，通过 emit() 触发
 * - unreadCount：全局计数器，addComment++ / resolveComment-- / markAllAsRead=0
 */
import { create } from 'zustand';
import { openDB } from 'idb';
import { useNotificationStore } from '@/stores/notificationStore';

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

export interface CommentStoreState {
  comments: Comment[];
  initialized: boolean;
  // S50-E3: unread count (counter-based — addComment++, resolveComment--)
  unreadCount: number;

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
}

// ==================== Event System (S50-E3) ====================

// Module-level listeners set — persists across Zustand re-renders
const _commentListeners: Set<(event: CommentEvent) => void> = new Set();

function emitCommentEvent(event: CommentEvent): void {
  _commentListeners.forEach(listener => {
    try {
      listener(event);
    } catch (err) {
      console.error('[commentStore] Listener error:', err);
    }
  });
}

// ==================== IndexedDB ====================

const DB_NAME = 'vibex-comments';
const DB_VERSION = 2; // Bump version for S50-E3 schema
const STORE = 'comments';

let _db: Awaited<ReturnType<typeof openDB>> | null = null;

async function initDB() {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'commentId' });
        store.createIndex('by-node', 'nodeId');
        store.createIndex('by-timestamp', 'timestamp');
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

// ==================== Store ====================

export const useCommentStore = create<CommentStoreState>((set, get) => ({
  comments: [],
  initialized: false,
  unreadCount: 0,

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
}));

// Initialize from IndexedDB
export async function initCommentStore(): Promise<void> {
  try {
    const comments = await loadFromDB();
    useCommentStore.setState({
      comments,
      initialized: true,
      unreadCount: 0,
    });
  } catch (err) {
    console.error('[commentStore] Failed to load from IndexedDB:', err);
    useCommentStore.setState({ initialized: true });
  }
}
