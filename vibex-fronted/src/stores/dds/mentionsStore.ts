/**
 * mentionsStore — Sprint51 E5: @提及通知状态管理
 *
 * 职责：
 * - 追踪当前用户收到的 @mention 通知
 * - 记录已读/未读状态
 * - 提供 mentions[] 列表供 UI 渲染
 * - S57-E5: 新增 sourceType 字段（'comment' | 'chat'），支持按来源类型分类展示
 *
 * 设计决策：
 * - 模块级 listeners，与 commentStore 事件订阅模式一致
 * - 未读计数：mentions.filter(m => !m.read).length
 * - WebSocket comment:mention 消息触发 addMention
 */
import { create } from 'zustand';

/** S57-E5: 通知来源类型 */
export type MentionSourceType = 'comment' | 'chat';

export interface Mention {
  mentionId: string;
  commentId: string;
  fromUser: string;       // 发送评论的用户
  toUser: string;         // 被 @ 的用户
  commentText: string;    // 评论文本（含 @ 标记）
  projectId: string;
  nodeId?: string;
  timestamp: number;
  read: boolean;
  // S57-E5: 来源类型 — comment (评论) 或 chat (对话)
  sourceType: MentionSourceType;
}

export interface MentionEvent {
  type: 'mention:received' | 'mention:read';
  mention: Mention;
}

export interface MentionsStoreState {
  mentions: Mention[];
  unreadCount: number;

  // Actions
  addMention: (mention: Omit<Mention, 'mentionId' | 'read'>) => void;
  markAsRead: (mentionId: string) => void;
  markAllAsRead: () => void;
  clearMentions: () => void;

  // Queries
  getMentionsByProject: (projectId: string) => Mention[];
  getUnreadCount: () => number;

  // Event subscription (module-level for cross-component use)
  addListener: (listener: (event: MentionEvent) => void) => () => void;
  removeListener: (listener: (event: MentionEvent) => void) => void;
}

// Module-level listeners
const _mentionListeners: Set<(event: MentionEvent) => void> = new Set();

function emitMentionEvent(event: MentionEvent): void {
  _mentionListeners.forEach(listener => {
    try {
      listener(event);
    } catch (err) {
      console.error('[mentionsStore] Listener error:', err);
    }
  });
}

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `mention-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useMentionsStore = create<MentionsStoreState>((set, get) => ({
  mentions: [],
  unreadCount: 0,

  addMention: (mentionData) => {
    const mention: Mention = {
      ...mentionData,
      mentionId: generateId(),
      read: false,
    };
    set(state => ({
      mentions: [mention, ...state.mentions],
      unreadCount: state.unreadCount + 1,
    }));
    emitMentionEvent({ type: 'mention:received', mention });
  },

  markAsRead: (mentionId) => {
    set(state => {
      const mentions = state.mentions.map(m =>
        m.mentionId === mentionId ? { ...m, read: true } : m
      );
      const unreadCount = mentions.filter(m => !m.read).length;
      return { mentions, unreadCount };
    });
  },

  markAllAsRead: () => {
    set(state => ({
      mentions: state.mentions.map(m => ({ ...m, read: true })),
      unreadCount: 0,
    }));
  },

  clearMentions: () => {
    set({ mentions: [], unreadCount: 0 });
  },

  getMentionsByProject: (projectId) => {
    return get().mentions.filter(m => m.projectId === projectId);
  },

  getUnreadCount: () => {
    return get().mentions.filter(m => !m.read).length;
  },

  addListener: (listener) => {
    _mentionListeners.add(listener);
    return () => _mentionListeners.delete(listener);
  },

  removeListener: (listener) => {
    _mentionListeners.delete(listener);
  },
}));
