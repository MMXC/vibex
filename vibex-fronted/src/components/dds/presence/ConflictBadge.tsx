/**
 * ConflictBadge — S91-E3-F2: Selection 冲突警告
 *
 * Red border + tooltip on nodes that are being edited by another user.
 * Renders a small warning indicator overlay on conflicting nodes.
 */

'use client';

import React, { memo } from 'react';
import styles from './ConflictBadge.module.css';

interface ConflictBadgeProps {
  /** Username of the user who has the node locked */
  userName: string;
  /** Additional CSS class */
  className?: string;
}

export const ConflictBadge = memo(function ConflictBadge({
  userName,
  className,
}: ConflictBadgeProps) {
  return (
    <div
      className={`${styles.badge} ${className ?? ''}`}
      data-testid="conflict-badge"
      title={`由 ${userName} 编辑中`}
      role="alert"
      aria-label={`冲突：由 ${userName} 编辑中`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={styles.icon}
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span className={styles.label}>由 {userName} 编辑中</span>
    </div>
  );
});
