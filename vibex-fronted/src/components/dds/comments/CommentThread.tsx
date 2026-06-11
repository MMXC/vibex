'use client';

/**
 * CommentThread — S69-E4 + S71-E2 + S88-E2: 节点评论系统
 *
 * 右键节点 → 上下文菜单"查看评论" → 浮层显示评论列表
 * 区别于 S49-E5 CommentPanel:
 * - 浮层模式（跟随节点位置），非侧边栏模式
 * - 显示特定节点的评论，而非整个画布
 * - 支持 @提及回复 (MentionInput)
 *
 * S71-E2: 实时协作评论系统
 * - WS 事件监听：comment:created / comment:resolved / comment:deleted 实时刷新
 * - Emoji 反应按钮 (👍❤️😂)：addReaction / removeReaction
 * - addListener 订阅 commentStore 事件
 *
 * S88-E2: 评论线程折叠/展开功能
 * - 每条根评论支持折叠/展开
 * - 折叠时显示回复数量
 * - @提及高亮显示为可点击链接
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCommentStore } from '@/stores/dds/commentStore';
import type { Comment, ReactionType } from '@/stores/dds/commentStore';
import { MentionInput } from '@/components/dds/collaboration/MentionInput';
import { parseMentions } from '@/lib/canvas/parseMentions';
import styles from './CommentThread.module.css';

interface CommentThreadProps {
  /** 当前打开评论浮层的节点 ID */
  nodeId: string;
  /** 浮层关闭回调 */
  onClose: () => void;
  /** 浮层位置（屏幕坐标） */
  position: { x: number; y: number };
  /** 当前用户 ID */
  currentUserId?: string;
}

/** 时间格式化 */
function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 从文本中提取 @提及的用户名列表 (S88-E2: 使用 parseMentions) */
function extractMentions(text: string): string[] {
  return parseMentions(text);
}

/** S88-E2: 将 @mention 文本转换为高亮 JSX */
function HighlightMentions({ text }: { text: string }) {
  const mentions = parseMentions(text);
  if (mentions.length === 0) {
    return <>{text}</>;
  }

  // Split text by @mentions and render highlighted links
  const MENTION_REGEX = /@([\w\u4e00-\u9fa5]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const username = match[1];
    parts.push(
      <a
        key={`mention-${match.index}`}
        href={`/profile/${encodeURIComponent(username)}`}
        className={styles.mentionLink}
        onClick={e => e.stopPropagation()}
      >
        @{username}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

/** Emoji reaction type mapping */
const REACTION_EMOJI: Record<ReactionType, string> = {
  thumbsup: '👍',
  heart: '❤️',
  laugh: '😂',
};

export function CommentThread({
  nodeId,
  onClose,
  position,
  currentUserId = 'User',
}: CommentThreadProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);
  const comments = useCommentStore(s => s.getCommentsByNode(nodeId));
  const addComment = useCommentStore(s => s.addComment);
  const resolveComment = useCommentStore(s => s.resolveComment);
  const unresolveComment = useCommentStore(s => s.unresolveComment);
  const deleteComment = useCommentStore(s => s.deleteComment);
  const addReaction = useCommentStore(s => s.addReaction);
  const removeReaction = useCommentStore(s => s.removeReaction);
  const getReactionCounts = useCommentStore(s => s.getReactionCounts);
  const getReactionsByComment = useCommentStore(s => s.getReactionsByComment);
  const addListener = useCommentStore(s => s.addListener);
  // S88-E2: collapse support
  const toggleCollapse = useCommentStore(s => s.toggleCollapse);
  const isCollapsed = useCommentStore(s => s.isCollapsed);

  // S71-E2: Subscribe to commentStore events for real-time updates
  useEffect(() => {
    const forceRerender = () => forceUpdate(n => n + 1);
    const cleanup = addListener(forceRerender);
    return cleanup;
  }, [addListener]);

  // Close on click outside overlay
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSend = useCallback((text: string, _mentions: string[]) => {
    if (!text.trim()) return;
    addComment(nodeId, text.trim(), currentUserId);
  }, [nodeId, currentUserId, addComment]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  const handleReaction = useCallback((
    commentId: string,
    type: ReactionType
  ) => {
    const reactions = getReactionsByComment(commentId);
    const alreadyReacted = reactions.some(
      r => r.type === type && r.userId === currentUserId
    );
    if (alreadyReacted) {
      removeReaction(commentId, type, currentUserId);
    } else {
      addReaction(commentId, type, currentUserId);
    }
  }, [currentUserId, addReaction, removeReaction, getReactionsByComment]);

  // Auto-position: keep within viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 340),
    top: Math.min(position.y, window.innerHeight - 420),
    zIndex: 1000,
  };

  return (
    <div ref={overlayRef} className={styles.overlay} style={style}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M14 2H2C1.45 2 1 2.45 1 3v7c0 .55.45 1 1 1h2v2.5L6.5 15H14c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1z" />
          </svg>
          节点评论
        </span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
          ×
        </button>
      </div>

      {/* Comment list */}
      <div className={styles.commentList}>
        {comments.length === 0 ? (
          <div className={styles.empty}>暂无评论，点击下方输入框添加</div>
        ) : (
          comments.map(comment => {
            const counts = getReactionCounts(comment.commentId);
            const reactions = getReactionsByComment(comment.commentId);
            const myReaction = reactions.find(r => r.userId === currentUserId);
            const collapsed = isCollapsed(comment.commentId);
            return (
              <CommentItem
                key={comment.commentId}
                comment={comment}
                counts={counts}
                myReaction={myReaction}
                collapsed={collapsed}
                onResolve={() => resolveComment(comment.commentId)}
                onUnresolve={() => unresolveComment(comment.commentId)}
                onDelete={() => deleteComment(comment.commentId)}
                onReaction={(type) => handleReaction(comment.commentId, type)}
                onToggleCollapse={() => toggleCollapse(comment.commentId)}
              />
            );
          })
        )}
      </div>

      {/* Input area with @mention support */}
      <div className={styles.inputArea} onKeyDown={handleKeyDown}>
        <MentionInput
          currentUserId={currentUserId}
          placeholder="添加评论... (Ctrl+Enter 发送)"
          onSend={handleSend}
          disabled={false}
          defaultValue=""
        />
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  counts,
  myReaction,
  collapsed,
  onResolve,
  onUnresolve,
  onDelete,
  onReaction,
  onToggleCollapse,
}: {
  comment: Comment;
  counts: Record<ReactionType, number>;
  myReaction?: { type: ReactionType; userId: string };
  collapsed: boolean;
  onResolve: () => void;
  onUnresolve: () => void;
  onDelete: () => void;
  onReaction: (type: ReactionType) => void;
  onToggleCollapse: () => void;
}) {
  const REACTION_TYPES: ReactionType[] = ['thumbsup', 'heart', 'laugh'];
  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className={`${styles.commentItem} ${comment.resolved ? styles.resolved : ''} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.commentHeader}>
        {/* S88-E2: Collapse/expand button */}
        {totalReactions > 0 && (
          <button
            className={styles.collapseBtn}
            onClick={onToggleCollapse}
            aria-label={collapsed ? '展开评论' : '收起评论'}
            title={collapsed ? '展开评论' : '收起评论'}
          >
            {collapsed ? '▶' : '▼'}
          </button>
        )}
        <span className={styles.author}>{comment.author}</span>
        <span className={styles.timestamp}>{formatTime(comment.timestamp)}</span>
        <button
          className={styles.deleteBtn}
          onClick={onDelete}
          aria-label="删除评论"
        >
          ×
        </button>
      </div>
      {/* S88-E2: @mention highlighted text */}
      <div className={styles.commentText}>
        <HighlightMentions text={comment.text} />
      </div>

      {/* S88-E2: Show reply count summary when collapsed */}
      {collapsed && totalReactions > 0 && (
        <div className={styles.collapsedSummary}>
          {Object.entries(counts)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => (
              <span key={type} className={styles.collapsedReactionCount}>
                {REACTION_EMOJI[type as ReactionType]} {count}
              </span>
            ))}
        </div>
      )}

      {!collapsed && (
        <>
          {/* S71-E2: Emoji reaction bar */}
          <div className={styles.reactionBar}>
            {REACTION_TYPES.map(type => {
              const count = counts[type] ?? 0;
              const isActive = myReaction?.type === type;
              return (
                <button
                  key={type}
                  className={`${styles.reactionBtn} ${isActive ? styles.reactionActive : ''}`}
                  onClick={() => onReaction(type)}
                  aria-label={`${REACTION_EMOJI[type]} 反应 (${count})`}
                  aria-pressed={isActive}
                >
                  {REACTION_EMOJI[type]}
                  {count > 0 && <span className={styles.reactionCount}>{count}</span>}
                </button>
              );
            })}
          </div>

          <div className={styles.commentActions}>
            {comment.resolved ? (
              <button className={styles.actionBtn} onClick={onUnresolve}>
                重新打开
              </button>
            ) : (
              <button
                className={`${styles.actionBtn} ${styles.resolveBtn}`}
                onClick={onResolve}
              >
                标记已解决
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
