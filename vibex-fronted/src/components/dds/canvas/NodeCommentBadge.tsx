'use client';

/**
 * NodeCommentBadge — S78-E3: 内联评论 Badge
 *
 * Shows a badge with comment count on a node card.
 * Only renders when count > 0.
 * Positioned as an absolute overlay in the corner of the node card.
 */
import React, { memo } from 'react';
import styles from './NodeCommentBadge.module.css';

interface NodeCommentBadgeProps {
  /** Number of comments (threads + replies) on the node */
  count: number;
  /** Callback when badge is clicked — opens the comment panel */
  onClick: (e: React.MouseEvent) => void;
}

export const NodeCommentBadge = memo(function NodeCommentBadge({
  count,
  onClick,
}: NodeCommentBadgeProps) {
  if (count <= 0) return null;

  const label = count >= 100 ? '99+' : String(count);

  return (
    <button
      className={styles.badge}
      onClick={onClick}
      aria-label={`查看 ${count} 条评论`}
      title={`${count} 条评论`}
      type="button"
    >
      💬 {label}
    </button>
  );
});
