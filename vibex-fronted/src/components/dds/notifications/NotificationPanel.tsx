/**
 * NotificationPanel — @提及通知下拉面板
 * Sprint53 E3: @提及通知面板
 * Sprint57 E5: 新增「评论提及」tab，独立 Badge 计数
 *
 * 显示 mentions 列表（按时间倒序），包含：
 * - mention 内容预览 (commentText)
 * - mentioned by (fromUser)
 * - timestamp
 * - 已读/未读状态
 * - S57-E5: sourceType 分类（comment / chat），tab 切换
 *
 * D3.2: Dropdown 显示 mentions 列表（按时间倒序）
 * D3.3: 点击铃铛展开面板，点击外部关闭
 * D3.4: mentionsStore.markAsRead(mentionId) 调用
 * S57-E5: 新增 Tab 过滤 — 全部 / 评论提及，独立计数
 */

'use client';

import React, { memo, useCallback, useState } from 'react';
import { useMentionsStore, type Mention, type MentionSourceType } from '@/stores/dds/mentionsStore';
import styles from './NotificationPanel.module.css';

export interface NotificationPanelProps {
  onClose: () => void;
  /** 点击单条通知后的回调 */
  onMentionClick?: (mentionId: string, projectId?: string) => void;
}

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function MentionItem({
  mention,
  onClick,
  onMarkRead,
}: {
  mention: Mention;
  onClick: () => void;
  onMarkRead: () => void;
}) {
  const handleClick = () => {
    if (!mention.read) {
      onMarkRead();
    }
    onClick();
  };

  return (
    <div
      className={`${styles.mentionItem} ${mention.read ? styles.read : styles.unread}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={styles.mentionHeader}>
        <span className={styles.fromUser}>@{mention.fromUser}</span>
        <span className={styles.timestamp}>{formatTimestamp(mention.timestamp)}</span>
      </div>
      <div className={styles.mentionBody}>
        <span className={styles.commentText}>
          {mention.commentText.length > 80
            ? mention.commentText.slice(0, 80) + '…'
            : mention.commentText}
        </span>
      </div>
      {!mention.read && <div className={styles.unreadDot} aria-label="未读" />}
    </div>
  );
}

/**
 * NotificationPanel — mentions 列表，按时间倒序，支持 Tab 过滤（S57-E5）。
 *
 * Tab "全部" — 显示所有 mentions
 * Tab "评论提及" — 仅显示 sourceType === 'comment' 的 mentions
 */
export const NotificationPanel = memo(function NotificationPanel({
  onClose,
  onMentionClick,
}: NotificationPanelProps) {
  const allMentions = useMentionsStore((s) => s.mentions);
  const markAsRead = useMentionsStore((s) => s.markAsRead);
  const markAllAsRead = useMentionsStore((s) => s.markAllAsRead);
  const unreadCount = useMentionsStore((s) => s.unreadCount);

  // S57-E5: Tab state — 'all' | 'comment'
  const [activeTab, setActiveTab] = useState<'all' | 'comment'>('all');

  // Filter mentions by tab
  const filteredMentions: Mention[] =
    activeTab === 'comment'
      ? allMentions.filter((m) => m.sourceType === 'comment')
      : allMentions;

  // Per-tab unread counts
  const commentMentions = allMentions.filter((m) => m.sourceType === 'comment');
  const totalUnread = allMentions.filter((m) => !m.read).length;
  const commentUnread = commentMentions.filter((m) => !m.read).length;

  // Sort by timestamp descending (newest first)
  const sortedMentions = [...filteredMentions].sort((a, b) => b.timestamp - a.timestamp);

  const handleMentionClick = useCallback(
    (mentionId: string, projectId?: string) => {
      onMentionClick?.(mentionId, projectId);
    },
    [onMentionClick]
  );

  const handleMarkRead = useCallback(
    (mentionId: string) => {
      markAsRead(mentionId);
    },
    [markAsRead]
  );

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  return (
    <div
      className={styles.panel}
      role="dialog"
      aria-label="通知列表"
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>通知</span>
        {totalUnread > 0 && (
          <button
            className={styles.markAllBtn}
            onClick={handleMarkAllRead}
            aria-label="全部标为已读"
          >
            全部已读
          </button>
        )}
      </div>

      {/* S57-E5: Tab bar */}
      <div className={styles.tabBar} role="tablist" aria-label="通知类型">
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('all')}
          role="tab"
          aria-selected={activeTab === 'all'}
          aria-controls="notification-list"
        >
          全部
          {totalUnread > 0 && (
            <span className={styles.tabBadge}>{totalUnread > 99 ? '99+' : totalUnread}</span>
          )}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'comment' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('comment')}
          role="tab"
          aria-selected={activeTab === 'comment'}
          aria-controls="notification-list"
        >
          评论提及
          {commentUnread > 0 && (
            <span className={styles.tabBadge}>{commentUnread > 99 ? '99+' : commentUnread}</span>
          )}
        </button>
      </div>

      <div id="notification-list" className={styles.mentionList} role="tabpanel">
        {sortedMentions.length === 0 ? (
          <div className={styles.emptyState}>
            <span>暂无{activeTab === 'comment' ? '评论提及' : '通知'}</span>
          </div>
        ) : (
          sortedMentions.map((mention) => (
            <MentionItem
              key={mention.mentionId}
              mention={mention}
              onClick={() => handleMentionClick(mention.mentionId, mention.projectId)}
              onMarkRead={() => handleMarkRead(mention.mentionId)}
            />
          ))
        )}
      </div>
    </div>
  );
});
