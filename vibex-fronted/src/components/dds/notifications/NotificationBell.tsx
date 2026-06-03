/**
 * NotificationBell — @提及通知铃铛组件
 * Sprint53 E3: @提及通知面板
 *
 * 铃铛图标 + unreadCount 红点角标。
 * 点击展开 NotificationPanel Dropdown。
 * 读取 useMentionsStore.unreadCount 驱动红点显示。
 */

'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { useMentionsStore } from '@/stores/dds/mentionsStore';
import { NotificationPanel } from './NotificationPanel';
import styles from './NotificationBell.module.css';

export interface NotificationBellProps {
  /** 触发点击通知后跳转的回调，参数为 mention */
  onMentionClick?: (mentionId: string, projectId?: string) => void;
}

function BellIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

/**
 * NotificationBell — 通知铃铛 + 红点角标 + 展开面板。
 *
 * D3.1: 铃铛图标 + unreadCount 红点
 * D3.3: 点击铃铛展开面板，点击外部关闭
 */
export const NotificationBell = memo(function NotificationBell({
  onMentionClick,
}: NotificationBellProps) {
  const allMentions = useMentionsStore((s) => s.mentions);
  // S57-E5: badge shows comment mention count (独立计数)
  const commentUnread = allMentions.filter((m) => !m.read && m.sourceType === 'comment').length;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleBellClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleMentionClick = (mentionId: string, projectId?: string) => {
    setIsOpen(false);
    onMentionClick?.(mentionId, projectId);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.bellButton}
        onClick={handleBellClick}
        aria-label={commentUnread > 0 ? `评论提及 (${commentUnread} 条未读)` : '通知'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <BellIcon />
        {commentUnread > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {commentUnread > 99 ? '99+' : commentUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          onClose={handleClose}
          onMentionClick={handleMentionClick}
        />
      )}
    </div>
  );
});
