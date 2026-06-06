'use client';

/**
 * NotificationPanel — S68-E2: @提及通知系统
 *
 * 通知中心抽屉面板，支持：
 * - 未读红点 + 角标数字
 * - 通知列表（mention / reply / system / info）
 * - 标记已读、全部已读
 * - 分页加载
 *
 * 设计决策（来自 PRD E2 架构决策 3）：
 * - 独立 Panel（抽屉式），与 CollabActivityPanel 并列
 * - DDSToolbar 铃铛按钮触发开关
 */
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification } from '@/stores/notificationStore';
import styles from './NotificationPanel.module.css';

export interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  currentUserId?: string;
}

const PAGE_SIZE = 20;

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  mention: '@提及',
  reply: '回复',
  system: '系统',
  info: '通知',
};

const NOTIFICATION_TYPE_ICONS: Record<string, string> = {
  mention: '@',
  reply: '↩',
  system: '⚙',
  info: 'ℹ',
};

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

function getRelativeLink(n: Notification): string {
  if (n.canvasId) return `/canvas/${n.canvasId}${n.nodeId ? `#node-${n.nodeId}` : ''}`;
  return '#';
}

const NotificationItem = memo(function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  return (
    <li
      className={`${styles.item} ${notification.isRead ? styles.read : styles.unread}`}
      role="listitem"
    >
      <div className={styles.iconWrap} aria-hidden="true">
        <span className={styles.typeIcon}>
          {NOTIFICATION_TYPE_ICONS[notification.type] ?? 'ℹ'}
        </span>
        {!notification.isRead && <span className={styles.unreadDot} aria-label="未读" />}
      </div>

      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.typeLabel}>
            {NOTIFICATION_TYPE_LABELS[notification.type] ?? '通知'}
          </span>
          <time className={styles.time}>{formatTime(notification.timestamp)}</time>
        </div>
        <p className={styles.message}>{notification.message}</p>
        <span className={styles.sender}>来自 {notification.senderName}</span>
      </div>

      <div className={styles.actions}>
        {!notification.isRead && (
          <button
            type="button"
            className={styles.markReadBtn}
            onClick={() => onRead(notification.id)}
            aria-label="标记已读"
            title="标记已读"
          >
            ✓
          </button>
        )}
      </div>
    </li>
  );
});

const NotificationPanel = memo(function NotificationPanel({
  open,
  onClose,
  currentUserId,
}: NotificationPanelProps) {
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());

  const [page, setPage] = React.useState(1);
  const listRef = useRef<HTMLUListElement>(null);

  const paginated = notifications.slice(0, page * PAGE_SIZE);
  const hasMore = notifications.length > paginated.length;

  // Reset page when panel opens
  useEffect(() => {
    if (open) setPage(1);
  }, [open]);

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleMarkRead = useCallback(
    (id: string) => {
      markAsRead(id);
    },
    [markAsRead]
  );

  if (!open) return null;

  return (
    <aside
      className={styles.panel}
      role="complementary"
      aria-label="通知中心"
    >
      <header className={styles.header}>
        <h3 className={styles.title}>
          通知中心
          {unreadCount > 0 && (
            <span className={styles.badge} aria-label={`${unreadCount} 条未读`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </h3>
        <div className={styles.headerActions}>
          {unreadCount > 0 && (
            <button
              type="button"
              className={styles.markAllBtn}
              onClick={handleMarkAllRead}
              aria-label="全部标为已读"
            >
              全部已读
            </button>
          )}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭通知面板"
          >
            →
          </button>
        </div>
      </header>

      <div className={styles.content}>
        {notifications.length === 0 ? (
          <p className={styles.empty}>暂无通知</p>
        ) : (
          <>
            <ul
              ref={listRef}
              className={styles.list}
              role="list"
              aria-label="通知列表"
            >
              {paginated.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={handleMarkRead}
                />
              ))}
            </ul>
            {hasMore && (
              <button
                type="button"
                className={styles.loadMore}
                onClick={() => setPage(p => p + 1)}
              >
                加载更多
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
});

export default NotificationPanel;
