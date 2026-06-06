/**
 * wsCommentHandler — Sprint51 E5 + Sprint53-E2 + S71-E2
 *
 * 功能：
 * - 订阅 backend 发送的 comment:created / comment:resolved / comment:mention 消息
 * - 将远程评论事件转发到 commentStore（驱动 UI 自动刷新）
 * - S51-E5: comment:mention 消息转发到 mentionsStore 并更新未读计数
 * - S53-E2: revision:bump / revision:conflict 消息转发到 canvasHistoryStore
 * - S71-E2: comment:reaction / comment:delete 消息类型
 *
 * S51-E5: 新增 comment:mention 类型 — WebSocket 通知被 @ 的用户
 * S53-E2: 新增 revision:bump / revision:conflict — Undo/Redo 协作冲突处理
 * S71-E2: 新增 comment:reaction / comment:delete — Reactions + 远程删除
 */
import { useCommentStore } from '@/stores/dds/commentStore';
import type { Comment, ReactionType } from '@/stores/dds/commentStore';
import { useMentionsStore } from '@/stores/dds/mentionsStore';

/** Extended comment shape from WebSocket (backend augments Comment with extra fields) */
export interface WSCommentMessage {
  type: 'comment:created' | 'comment:resolved' | 'comment:mention' | 'comment:reaction' | 'comment:delete';
  payload: {
    comment?: Comment & {
      authorId?: string;
      projectId?: string;
    };
    commentId?: string;
    reactionType?: ReactionType;
    userId?: string;
    reactionId?: string;
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

  switch (type) {
    case 'comment:created': {
      const { comment } = payload;
      if (!comment) return;
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
      const { comment } = payload;
      if (!comment) return;
      // Mark comment as resolved (even if it already exists)
      useCommentStore.setState(state => {
        const comments = state.comments.map(c =>
          c.commentId === comment.commentId ? { ...c, resolved: true } : c
        );
        return { comments };
      });
      break;
    }

    case 'comment:reaction': {
      // S71-E2: Remote reaction added by another user
      const { commentId, reactionType, userId } = payload;
      if (!commentId || !reactionType || !userId) return;
      useCommentStore.getState().addReaction(commentId, reactionType, userId);
      break;
    }

    case 'comment:delete': {
      // S71-E2: Remote comment deleted by another user
      const { commentId } = payload;
      if (!commentId) return;
      // Only delete if exists locally (don't throw)
      const existing = useCommentStore.getState().comments.find(c => c.commentId === commentId);
      if (existing) {
        useCommentStore.getState().deleteComment(commentId);
      }
      break;
    }

    // ── S51-E5: @mention 通知 ───────────────────────────────────────────────
    case 'comment:mention': {
      const { comment } = payload;
      if (!comment) return;
      import('@/stores/dds/mentionsStore').then(({ useMentionsStore: useMentionStore }) => {
        import('@/lib/canvas/parseMentions').then(({ parseMentions }) => {
          const mentionedUsers = parseMentions(comment.text);
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
 * 类型守卫 — 支持 S51-E5 comment:mention + S71-E2 comment:reaction / comment:delete
 */
function isWSCommentMessage(data: unknown): data is WSCommentMessage {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  const validTypes = [
    'comment:created',
    'comment:resolved',
    'comment:mention',
    'comment:reaction',
    'comment:delete',
    'revision:bump',
    'revision:conflict',
  ];
  return (
    validTypes.includes(msg.type as string) &&
    typeof msg.payload === 'object' &&
    msg.payload !== null
  );
}

/**
 * 注册评论 WebSocket handler
 * 供 useCollaborationWebSocket 或 wsProvider 调用
 */
export function registerCommentWSHandler(
  _sendMessage: (data: unknown) => void
): () => void {
  return () => {
    // cleanup — WebSocket 关闭时调用
  };
}

/**
 * 发送评论事件到 backend（用于主动发布评论）
 * 触发 backend 向其他连接广播 comment:created 消息
 *
 * S51-E5: 支持 comment:mention 类型
 * S71-E2: 支持 comment:reaction / comment:delete 类型
 */
export function publishCommentEvent(
  sendMessage: (data: unknown) => void,
  event: {
    type: 'comment:created' | 'comment:resolved' | 'comment:mention' | 'comment:reaction' | 'comment:delete';
    comment?: Comment;
    commentId?: string;
    reactionType?: ReactionType;
    userId?: string;
    reactionId?: string;
  }
): void {
  sendMessage({ type: event.type, payload: { comment: event.comment, commentId: event.commentId, reactionType: event.reactionType, userId: event.userId, reactionId: event.reactionId } });
}
