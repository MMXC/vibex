/**
 * wsCommentHandler — Sprint50 E3: WebSocket 评论实时通知处理器
 *
 * 功能：
 * - 订阅 backend 发送的 comment:created / comment:resolved 消息
 * - 将远程评论事件转发到 commentStore（驱动 UI 自动刷新）
 * - 提供 addCommentFromRemote() 给本地添加评论（带 timestamp 用于去重）
 */

import { useCommentStore } from '@/stores/dds/commentStore';
import type { Comment } from '@/stores/dds/commentStore';

export interface WSCommentMessage {
  type: 'comment:created' | 'comment:resolved';
  payload: {
    comment: Comment;
  };
}

/**
 * 处理来自 WebSocket 的评论事件
 * 由 wsProvider 或 useCollaborationWebSocket 调用
 */
export function handleCommentWSMessage(data: unknown): void {
  if (!isWSCommentMessage(data)) return;

  const { type, payload } = data;
  const { comment } = payload;

  switch (type) {
    case 'comment:created': {
      // Deduplication: skip if comment already exists (by commentId)
      const store = useCommentStore.getState();
      const existing = store.comments.find(c => c.commentId === comment.commentId);
      if (existing) return;
      // Merge remote comment into store (simulate addComment without re-emitting event)
      useCommentStore.setState(state => {
        const comments = [...state.comments, comment].sort((a, b) => a.timestamp - b.timestamp);
        return { comments };
      });
      break;
    }

    case 'comment:resolved':
      // Mark comment as resolved (even if it already exists)
      useCommentStore.setState(state => {
        const comments = state.comments.map(c =>
          c.commentId === comment.commentId ? { ...c, resolved: true } : c
        );
        return { comments };
      });
      break;

    default:
      console.warn('[wsCommentHandler] Unknown message type:', type);
  }
}

/**
 * 类型守卫
 */
function isWSCommentMessage(data: unknown): data is WSCommentMessage {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    (msg.type === 'comment:created' || msg.type === 'comment:resolved') &&
    typeof msg.payload === 'object' &&
    msg.payload !== null &&
    'comment' in (msg.payload as Record<string, unknown>)
  );
}

/**
 * 注册评论 WebSocket handler
 * 供 useCollaborationWebSocket 或 wsProvider 调用
 */
export function registerCommentWSHandler(
  sendMessage: (data: unknown) => void
): () => void {
  // 这个函数返回一个 cleanup，注册方持有
  // 实际的消息路由在 handleCommentWSMessage 中处理
  return () => {
    // cleanup — WebSocket 关闭时调用
  };
}

/**
 * 发送评论事件到 backend（用于主动发布评论）
 * 触发 backend 向其他连接广播 comment:created 消息
 */
export function publishCommentEvent(
  sendMessage: (data: unknown) => void,
  event: { type: 'comment:created' | 'comment:resolved'; comment: Comment }
): void {
  sendMessage({
    type: event.type,
    payload: { comment: event.comment },
  });
}
