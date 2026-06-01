'use client';

/**
 * CommentBadge — Sprint49 E5: 协作评论系统
 *
 * 节点右上角评论徽章。
 * 显示未读评论数量气泡。
 */

import React from 'react';
import { useCommentStore } from '@/stores/dds/commentStore';
import styles from './CommentBadge.module.css';

interface CommentBadgeProps {
  nodeId: string;
  /** 是否显示（默认：只要有评论就显示） */
  visible?: boolean;
  /** 附加 class */
  className?: string;
}

export function CommentBadge({ nodeId, visible = true, className }: CommentBadgeProps) {
  const unreadCount = useCommentStore(s => s.getUnreadCount(nodeId));

  if (!visible || unreadCount === 0) return null;

  return (
    <div
      className={`${styles.badge} ${unreadCount > 0 ? styles.active : ''} ${className ?? ''}`}
      title={`${unreadCount} 条未读评论`}
      data-node-id={nodeId}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M14 2H2C1.45 2 1 2.45 1 3v7c0 .55.45 1 1 1h2v2.5L6.5 15H14c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1z"
          fill="currentColor"
        />
        <circle cx="5.5" cy="6.5" r="1.5" fill="white" />
        <circle cx="8" cy="6.5" r="1.5" fill="white" />
        <circle cx="10.5" cy="6.5" r="1.5" fill="white" />
      </svg>
      <span className={styles.count}>{unreadCount > 99 ? '99+' : unreadCount}</span>
    </div>
  );
}
