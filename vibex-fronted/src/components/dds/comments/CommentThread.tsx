'use client';

/**
 * CommentThread — S69-E4: 节点评论系统
 *
 * 右键节点 → 上下文菜单"查看评论" → 浮层显示评论列表
 * 区别于 S49-E5 CommentPanel:
 * - 浮层模式（跟随节点位置），非侧边栏模式
 * - 显示特定节点的评论，而非整个画布
 * - 支持 @提及回复 (MentionInput)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCommentStore } from '@/stores/dds/commentStore';
import type { Comment } from '@/stores/dds/commentStore';
import { MentionInput } from '@/components/dds/collaboration/MentionInput';
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

/** 从文本中提取 @提及的用户名列表 */
function extractMentions(text: string): string[] {
  const matches = text.match(/@(\S+)/g);
  return matches ? matches.map(m => m.slice(1)) : [];
}

export function CommentThread({
  nodeId,
  onClose,
  position,
  currentUserId = 'User',
}: CommentThreadProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const comments = useCommentStore(s => s.getCommentsByNode(nodeId));
  const addComment = useCommentStore(s => s.addComment);
  const resolveComment = useCommentStore(s => s.resolveComment);
  const unresolveComment = useCommentStore(s => s.unresolveComment);
  const deleteComment = useCommentStore(s => s.deleteComment);

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
          comments.map(comment => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
              onResolve={() => resolveComment(comment.commentId)}
              onUnresolve={() => unresolveComment(comment.commentId)}
              onDelete={() => deleteComment(comment.commentId)}
            />
          ))
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
  onResolve,
  onUnresolve,
  onDelete,
}: {
  comment: Comment;
  onResolve: () => void;
  onUnresolve: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`${styles.commentItem} ${comment.resolved ? styles.resolved : ''}`}>
      <div className={styles.commentHeader}>
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
      <div className={styles.commentText}>{comment.text}</div>
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
    </div>
  );
}
