'use client';

/**
 * OnlinePresenceIndicator — S80-E5: 协作者在线状态与活动流
 *
 * Shows green/grey dot indicator for each collaborator based on last activity:
 * - Green dot: user active within last 5 minutes (isOnline = true)
 * - Grey dot: user inactive for 5+ minutes
 *
 * Integrates with presenceStore (S80-E5: lastActiveAt + isOnline).
 */
import React, { memo } from 'react';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import styles from './OnlinePresenceIndicator.module.css';

interface OnlinePresenceIndicatorProps {
  /** userId to display status for */
  userId: string;
  /** User display name */
  userName: string;
  /** Avatar URL */
  avatar?: string;
  /** Show name label next to indicator */
  showLabel?: boolean;
  /** Additional CSS class */
  className?: string;
}

const OnlinePresenceIndicator = memo(function OnlinePresenceIndicator({
  userId,
  userName,
  avatar,
  showLabel = false,
  className,
}: OnlinePresenceIndicatorProps) {
  const isOnline = usePresenceStore((s) => s.isOnline(userId));

  return (
    <div
      className={`${styles.wrapper} ${className ?? ''}`}
      data-testid="online-presence-indicator"
      data-userid={userId}
      role="img"
      aria-label={`${userName}: ${isOnline ? '在线' : '离线'}`}
    >
      <div className={styles.avatarWrap}>
        {avatar ? (
          <img
            src={avatar}
            alt={userName}
            className={styles.avatar}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={styles.avatarFallback} aria-hidden="true">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Status dot — green = online, grey = offline/idle */}
        <span
          className={`${styles.dot} ${isOnline ? styles.dotOnline : styles.dotOffline}`}
          aria-hidden="true"
          data-testid="status-dot"
        />
      </div>
      {showLabel && (
        <span className={styles.label} data-testid="user-label">
          {userName}
        </span>
      )}
    </div>
  );
});

export default OnlinePresenceIndicator;
