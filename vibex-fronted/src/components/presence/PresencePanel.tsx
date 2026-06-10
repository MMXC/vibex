'use client';

import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import type { OnlineUser } from '@/lib/collaboration/presenceStore';
import styles from './PresencePanel.module.css';

/** Get initials from a name */
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('') || '?';
}

/** Status display configuration */
const STATUS_CONFIG = {
  online: { label: '在线', dotClass: styles.statusOnline, labelClass: styles.statusLabelOnline },
  idle: { label: '闲置', dotClass: styles.statusIdle, labelClass: styles.statusLabelIdle },
  offline: { label: '离线', dotClass: styles.statusOffline, labelClass: styles.statusLabelIdle },
} as const;

/** Single user row */
const PresenceUserRow = memo(function PresenceUserRow({ user }: { user: OnlineUser }) {
  const config = STATUS_CONFIG[user.status] ?? STATUS_CONFIG.offline;
  return (
    <li className={styles.userItem}>
      <div className={styles.userAvatar}>
        <div className={styles.avatarCircle} aria-hidden="true">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
          ) : (
            getInitials(user.name)
          )}
        </div>
        <span
          className={`${styles.statusDot} ${config.dotClass}`}
          role="img"
          aria-label={`${user.name} 状态: ${config.label}`}
        />
      </div>
      <div className={styles.userInfo}>
        <span className={styles.userName}>{user.name}</span>
        <span className={`${styles.statusLabel} ${config.labelClass}`}>
          {config.label}
        </span>
      </div>
    </li>
  );
});

/**
 * PresencePanel — S64-E1
 *
 * Toolbar panel showing online collaborators with avatar + name + status badge.
 * Triggered by a button; shows a dropdown with the full user list.
 *
 * Reads from usePresenceStore().onlineUsers.
 */
export const PresencePanel = memo(function PresencePanel() {
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleToggle = useCallback(() => setOpen((v) => !v), []);

  const visibleUsers = onlineUsers.filter((u) => u.status !== 'offline');
  const count = visibleUsers.length;

  return (
    <div className={styles.panel} ref={panelRef} data-testid="presence-panel">
      <button
        className={styles.trigger}
        onClick={handleToggle}
        aria-label="协作者在线状态"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={styles.triggerIcon} aria-hidden="true">
          {open ? '👥' : '👤'}
        </span>
        <span>在线</span>
        {count > 0 && (
          <span className={styles.badge} aria-label={`${count} 人在线`}>
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          className={styles.dropdown}
          role="listbox"
          aria-label="在线协作者列表"
        >
          <div className={styles.dropdownHeader}>
            在线协作者 ({count})
          </div>

          {visibleUsers.length === 0 ? (
            <div className={styles.emptyState}>暂无其他协作者</div>
          ) : (
            <ul className={styles.userList}>
              {visibleUsers.map((user) => (
                <PresenceUserRow key={user.userId} user={user} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
});
