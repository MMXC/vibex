/**
 * wsCommentHandler — Sprint51 E5: WebSocket 评论实时通知处理器
 *
 * 功能：
 * - 订阅 backend 发送的 comment:created / comment:resolved / comment:mention 消息
 * - 将远程评论事件转发到 commentStore（驱动 UI 自动刷新）
 * - S51-E5: comment:mention 消息转发到 mentionsStore 并更新未读计数
 * - S53-E2: revision:bump / revision:conflict 消息转发到 canvasHistoryStore
 * - 提供 addCommentFromRemote() 给本地添加评论（带 timestamp 用于去重）
 *
 * S51-E5: 新增 comment:mention 类型 — WebSocket 通知被 @ 的用户
 * S53-E2: 新增 revision:bump / revision:conflict — Undo/Redo 协作冲突处理
 */
import { useCommentStore } from '@/stores/dds/commentStore';
import type { Comment } from '@/stores/dds/commentStore';
import { useMentionsStore } from '@/stores/dds/mentionsStore';

/** Extended comment shape from WebSocket (backend augments Comment with extra fields) */
export interface WSCommentMessage {
  type: 'comment:created' | 'comment:resolved' | 'comment:mention';
  payload: {
    comment: Comment & {
      authorId?: string;
      projectId?: string;
    };
  };
}

/** Revision message types — S53-E2 Undo/Redo conflict handling */
export interface WSSrevisionMessage {
  type: 'revision:bump' | 'revision:conflict';
  payload: {
    canvasId: string;
    revision?: number;       // for bump
    remoteRevision?: number; // for conflict
    localRevision?: number;  // for conflict
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

    case 'comment:resolved': {
      // Mark comment as resolved (even if it already exists)
      useCommentStore.setState(state => {
        const comments = state.comments.map(c =>
          c.commentId === comment.commentId ? { ...c, resolved: true } : c
        );
        return { comments };
      });
      break;
    }

    // ── S51-E5: @mention 通知 ───────────────────────────────────────────────
    // Backend 发送某用户被 @ 的通知，前端写入 mentionsStore 并触发未读计数
    // Map Comment → Mention shape expected by mentionsStore.addMention
    case 'comment:mention': {
      import('@/stores/dds/mentionsStore').then(({ useMentionsStore: useMentionStore }) => {
        // Dynamic import parseMentions within the promise chain
        import('@/lib/canvas/parseMentions').then(({ parseMentions }) => {
          const mentionedUsers = parseMentions(comment.text);
          // toUser is the second mention (the notified user), fallback to first
          const toUser = mentionedUsers[1] ?? mentionedUsers[0] ?? 'unknown';

          useMentionStore.getState().addMention({
            commentId: comment.commentId,
            fromUser: comment.authorId ?? 'unknown',
            toUser,
            commentText: comment.text,
            projectId: comment.projectId ?? 'current-project',
            nodeId: comment.nodeId,
            timestamp: comment.timestamp ?? Date.now(),
          });
        }).catch(err => {
          console.error('[wsCommentHandler] Failed to import parseMentions:', err);
        });
      }).catch(err => {
        console.error('[wsCommentHandler] Failed to import mentionsStore:', err);
      });
      break;
    }

    // ── S53-E2: revision:bump — 远程 base revision 更新 ───────────────────
    case 'revision:bump': {
      import('@/stores/dds/canvasHistoryStore')
        .then(({ useCanvasHistoryStore }) => {
          const revision = (data as WSSrevisionMessage).payload.revision ?? 0;
          useCanvasHistoryStore.getState().setBaseRevision(revision);
        })
        .catch((err) => {
          console.error('[wsCommentHandler] Failed to import canvasHistoryStore for bump:', err);
        });
      break;
    }

    // ── S53-E2: revision:conflict — 协作 Undo/Redo 冲突触发 ───────────────
    case 'revision:conflict': {
      import('@/stores/dds/canvasHistoryStore')
        .then(({ useCanvasHistoryStore }) => {
          const { canvasId, remoteRevision = 0, localRevision = 0 } = (data as WSSrevisionMessage).payload;
          useCanvasHistoryStore.getState().triggerConflictToast(canvasId, remoteRevision, localRevision);
        })
        .catch((err) => {
          console.error('[wsCommentHandler] Failed to import canvasHistoryStore for conflict:', err);
        });
      break;
    }

    default:
      console.warn('[wsCommentHandler] Unknown message type:', type);
  }
}

/**
 * 类型守卫 — 支持 S51-E5 comment:mention 类型
 */
function isWSCommentMessage(data: unknown): data is WSCommentMessage {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    (msg.type === 'comment:created' ||
      msg.type === 'comment:resolved' ||
      msg.type === 'comment:mention') &&
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
  _sendMessage: (data: unknown) => void
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
 *
 * S51-E5: 支持 comment:mention 类型
 */
export function publishCommentEvent(
  sendMessage: (data: unknown) => void,
  event: { type: 'comment:created' | 'comment:resolved' | 'comment:mention'; comment: Comment }
): void {
  sendMessage({
    type: event.type,
    payload: { comment: event.comment },
  });
}
