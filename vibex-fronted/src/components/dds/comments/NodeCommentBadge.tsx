'use client';

/**
 * NodeCommentBadge — S69-E4: 节点评论系统
 *
 * 右键节点上下文菜单 → "查看评论" → 显示节点未读评论数红色徽章
 * 区别于 S49-E5 的 CommentBadge:
 * - 使用红色 (#ef4444) 而非蓝色 (#3b82f6) 区分
 * - 专用于 Canvas 节点上的评论徽章
 */

import React from 'react';
import { useCommentStore } from '@/stores/dds/commentStore';
import styles from './NodeCommentBadge.module.css';

interface NodeCommentBadgeProps {
  nodeId: string;
  /** 附加 class */
  className?: string;
}

/**
 * 节点级评论徽章 — 红色醒目设计，用于 Canvas 节点
 * 显示该节点的未读评论数，点击可打开评论浮层
 */
export function NodeCommentBadge({ nodeId, className }: NodeCommentBadgeProps) {
  const unreadCount = useCommentStore((s) => s.getUnreadCount(nodeId));

  if (unreadCount === 0) return null;

  return (
    <div
      className={`${styles.badge} ${className ?? ''}`}
      title={`${unreadCount} 条未读评论`}
      aria-label={`${unreadCount} 条未读评论`}
      data-node-id={nodeId}
    >
      <span className={styles.count}>{unreadCount > 99 ? '99+' : unreadCount}</span>
    </div>
  );
}
