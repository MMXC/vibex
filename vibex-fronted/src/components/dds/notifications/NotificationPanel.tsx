'use client';

/**
 * NotificationPanel — S68-E2: @提及通知系统
 * 扩展 S73-E3: 清空历史按钮 + 设置抽屉入口
 * 扩展 S74-E5: 键盘导航（Tab + Enter）
 * 扩展 S79-E2: 模板更新通知 Tab — template_update 类型独立 Tab 显示
 * 扩展 S79-E3: 评论回复通知 comment_reply 显示 + node jump 锚点
 *
 * 通知中心抽屉面板，支持：
 * - 未读红点 + 角标数字
 * - 通知列表（mention / reply / system / info）
 * - 模板更新独立 Tab（S79-E2）
 * - 标记已读、全部已读、清空历史
 * - 分页加载
 * - 通知偏好设置（S73-E3）
 * - 键盘导航：Tab 聚焦通知项，Enter 标记已读（S74-E5）
 *
 * 设计决策（来自 PRD E2 架构决策 3）：
 * - 独立 Panel（抽屉式），与 CollabActivityPanel 并列
 * - DDSToolbar 铃铛按钮触发开关
 */
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification } from '@/stores/notificationStore';
import { NotificationPreferencesPanel } from './NotificationPreferencesPanel';
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
  comment_reply: '评论回复',   // S79-E3
  system: '系统',
  info: '通知',
  template_update: '模板更新',
};

const NOTIFICATION_TYPE_ICONS: Record<string, string> = {
  mention: '@',
  reply: '↩',
  comment_reply: '💬',         // S79-E3
  system: '⚙',
  info: 'ℹ',
  template_update: '📋',
};

type TabType = 'all' | 'template_update';

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

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getRelativeLink(n: Notification): string {
  if (n.canvasId) return `/canvas/${n.canvasId}${n.nodeId ? `#node-${n.nodeId}` : ''}`;
  return '#';
}

/** S79-E2: Navigate to TemplateMarketplacePanel with template highlighted */
function handleTemplateUpdateClick(notification: Notification): void {
  if (notification.templateId) {
    window.dispatchEvent(
      new CustomEvent('template:focus', { detail: { templateId: notification.templateId } })
    );
  }
  window.dispatchEvent(new CustomEvent('panel:open', { detail: { panel: 'template-marketplace' } }));
}

/** S79-E3: Navigate to canvas + node when clicking mention or comment_reply notification */
function handleMentionOrReplyClick(notification: Notification): void {
  if (notification.canvasId) {
    const hash = notification.nodeId ? `#node-${notification.nodeId}` : '';
    window.location.href = `/canvas/${notification.canvasId}${hash}`;
  }
}

const NotificationItem = memo(function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLLIElement>) => {
      if (e.key === 'Enter' && !notification.isRead) {
        e.preventDefault();
        onRead(notification.id);
      }
    },
    [notification.id, notification.isRead, onRead]
  );

  // S79-E2: Template update items use dedicated layout
  if (notification.type === 'template_update') {
    return (
      <li
        className={`${styles.item} ${notification.isRead ? styles.read : styles.unread} ${styles.templateItem}`}
        role="listitem"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={() => handleTemplateUpdateClick(notification)}
        aria-label={`模板更新: ${notification.message}`}
        style={{ cursor: 'pointer' }}
      >
        {/* S79-E2: Template thumbnail */}
        {notification.thumbnail ? (
          <div className={styles.templateThumb} aria-hidden="true">
            <img
              src={notification.thumbnail}
              alt=""
              className={styles.thumbnailImg}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className={styles.iconWrap} aria-hidden="true">
            <span className={styles.typeIcon}>
              {NOTIFICATION_TYPE_ICONS[notification.type]}
            </span>
            {!notification.isRead && <span className={styles.unreadDot} aria-label="未读" />}
          </div>
        )}

        <div className={styles.body}>
          <div className={styles.itemHeader}>
            <span className={styles.typeLabel}>
              {NOTIFICATION_TYPE_LABELS[notification.type]}
            </span>
            <time className={styles.time} dateTime={new Date(notification.timestamp).toISOString()}>
              {formatTime(notification.timestamp)}
            </time>
          </div>
          <p className={styles.message}>{notification.message}</p>
          {/* S79-E2: Author + date for template update */}
          <span className={styles.sender}>
            {notification.authorId ? `作者: ${notification.authorId}` : `来自 ${notification.senderName}`}
            {' · '}
            {formatDate(notification.timestamp)}
          </span>
        </div>

        <div className={styles.actions}>
          {!notification.isRead && (
            <button
              type="button"
              className={styles.markReadBtn}
              onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}
              aria-label="标记已读"
              title="标记已读"
            >
              ✓
            </button>
          )}
        </div>
      </li>
    );
  }

  const isClickable = notification.type === 'mention' || notification.type === 'comment_reply';

  return (
    <li
      className={`${styles.item} ${notification.isRead ? styles.read : styles.unread}`}
      role="listitem"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={isClickable ? () => handleMentionOrReplyClick(notification) : undefined}
      style={isClickable ? { cursor: 'pointer' } : undefined}
    >
      <div className={styles.iconWrap} aria-hidden="true">
        <span className={styles.typeIcon}>
          {NOTIFICATION_TYPE_ICONS[notification.type] ?? 'ℹ'}
        </span>
        {!notification.isRead && <span className={styles.unreadDot} aria-label="未读" />}
      </div>

      <div className={styles.body}>
        <div className={styles.itemHeader}>
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
}: NotificationPanelProps) {
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());

  const [page, setPage] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const listRef = useRef<HTMLUListElement>(null);

  // Filter by tab
  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeTab);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > paginated.length;

  // Reset page when panel opens or tab changes
  useEffect(() => {
    if (open) setPage(1);
  }, [open, activeTab]);

  // S73-E3: ESC 关闭设置抽屉
  useEffect(() => {
    if (!isSettingsOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsSettingsOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen]);

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('确定要清空所有通知吗？此操作不可撤销。')) {
      clearAll();
    }
  }, [clearAll]);

  const handleMarkRead = useCallback(
    (id: string) => {
      markAsRead(id);
    },
    [markAsRead]
  );

  // S79-E2: Template update unread count
  const templateUnreadCount = notifications.filter(
    n => n.type === 'template_update' && !n.isRead
  ).length;

  if (!open) return null;

  return (
    <>
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
            <button
              type="button"
              className={styles.settingsBtn}
              onClick={() => setIsSettingsOpen(true)}
              aria-label="通知设置"
              title="通知设置"
            >
              ⚙
            </button>
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
            {notifications.length > 0 && (
              <button
                type="button"
                className={styles.clearAllBtn}
                onClick={handleClearAll}
                aria-label="清空历史"
                title="清空历史"
              >
                清空
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

        {/* S79-E2: Tab bar */}
        <div className={styles.tabBar} role="tablist" aria-label="通知类型">
          <button
            type="button"
            role="tab"
            className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
            aria-selected={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          >
            全部
          </button>
          <button
            type="button"
            role="tab"
            className={`${styles.tab} ${activeTab === 'template_update' ? styles.tabActive : ''}`}
            aria-selected={activeTab === 'template_update'}
            onClick={() => setActiveTab('template_update')}
          >
            模板更新
            {templateUnreadCount > 0 && (
              <span className={styles.tabBadge}>{templateUnreadCount}</span>
            )}
          </button>
        </div>

        <div className={styles.content}>
          {filtered.length === 0 ? (
            <p className={styles.empty}>
              {activeTab === 'template_update' ? '暂无模板更新通知' : '暂无通知'}
            </p>
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

      {/* E1 (Sprint80): 通知偏好设置面板 */}
      <NotificationPreferencesPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
});

export default NotificationPanel;
