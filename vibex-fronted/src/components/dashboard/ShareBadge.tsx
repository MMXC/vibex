/**
 * ShareBadge — 站内通知 Badge
 * E02: 项目分享通知系统
 * 无 Slack 用户显示"新项目" badge
 */
'use client';

import React, { memo } from 'react';
import styles from './ShareBadge.module.css';

interface ShareBadgeProps {
  count: number;
  onClick?: () => void;
}

export const ShareBadge = memo(function ShareBadge({ count, onClick }: ShareBadgeProps) {
  if (count <= 0) return null;

  return (
    <button
      type="button"
      className={styles.badge}
      onClick={onClick}
      aria-label={`${count} 个新分享通知`}
    >
      <span className={styles.dot} />
      {count > 0 && <span className={styles.count}>{count > 99 ? '99+' : count}</span>}
    </button>
  );
});
