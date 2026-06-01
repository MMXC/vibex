/**
 * commentStore — Sprint49 E5: 协作评论系统
 *
 * P001: Epic5-CollabComments
 *
 * 设计决策：
 * - commentId 使用 nanoid() 生成，确保全局唯一
 * - IndexedDB 持久化：offline-first，评论不因刷新丢失
 * - 同一节点的评论按 timestamp 升序排列（最早在前）
 * - resolved 评论默认折叠，支持展开查看
 */

import { create } from 'zustand';
import { openDB } from 'idb';

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

export interface CommentStoreState {
  comments: Comment[];
  initialized: boolean;

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
}

// ==================== IndexedDB ====================

const DB_NAME = 'vibex-comments';
const DB_VERSION = 1;
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
      return { comments };
    });
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
    set(state => {
      const comments = state.comments.filter(c => c.commentId !== commentId);
      deleteFromDB(commentId).catch(console.error);
      return { comments };
    });
  },

  resolveComment: (commentId) => {
    set(state => {
      const comments = state.comments.map(c =>
        c.commentId === commentId ? { ...c, resolved: true } : c
      );
      const updated = comments.find(c => c.commentId === commentId);
      if (updated) saveComment(updated).catch(console.error);
      return { comments };
    });
  },

  unresolveComment: (commentId) => {
    set(state => {
      const comments = state.comments.map(c =>
        c.commentId === commentId ? { ...c, resolved: false } : c
      );
      const updated = comments.find(c => c.commentId === commentId);
      if (updated) saveComment(updated).catch(console.error);
      return { comments };
    });
  },

  getCommentsByNode: (nodeId) => {
    return get().comments
      .filter(c => c.nodeId === nodeId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  getUnreadCount: (nodeId) => {
    return get().comments.filter(c => c.nodeId === nodeId && !c.resolved).length;
  },

  getUnresolvedCount: () => {
    return get().comments.filter(c => !c.resolved).length;
  },

  getTotalCount: () => get().comments.length,
}));

// Initialize from IndexedDB
export async function initCommentStore(): Promise<void> {
  try {
    const comments = await loadFromDB();
    useCommentStore.setState({ comments, initialized: true });
  } catch (err) {
    console.error('[commentStore] Failed to load from IndexedDB:', err);
    useCommentStore.setState({ initialized: true });
  }
}
