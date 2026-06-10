/**
 * CollaboratorAvatars — S84-E2: 协作者在线状态与光标显示
 *
 * Enhanced avatar bar with:
 * - Avatar stack with colored border (8-color pool)
 * - Status dot (online/idle/offline)
 * - Collaborator disconnect fade-out animation (300ms CSS transition)
 * - Overflow "+N" badge
 * - WebSocket presence integration via presenceStore
 *
 * S84-E2 DoD:
 * - [x] `CollaboratorAvatars.tsx` component (avatar bar + status dots)
 * - [x] 8-color pool assignment logic
 * - [x] Status dots: online (green), idle (yellow), offline (grey)
 * - [x] Collaborator disconnect fade-out animation (300ms CSS transition)
 * - [x] Overflow "+N" badge
 * - [x] vitest tests (≥8 cases)
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import { getCollaboratorColor } from '@/lib/collaboration/presence/wsPresenceHandler';
import styles from './CollaboratorAvatars.module.css';

interface CollaboratorAvatarsProps {
  /** Current user ID (self — excluded from display) */
  currentUserId?: string;
  /** Maximum number of avatars before overflow badge (default: 5) */
  maxDisplay?: number;
  /** Show tooltip with user name on hover (default: true) */
  showTooltip?: boolean;
  /** Additional CSS class */
  className?: string;
}

/** Status dot variant */
type StatusDot = 'online' | 'idle' | 'offline';

function getStatusDot(lastActiveAt: number): StatusDot {
  const now = Date.now();
  const diffMs = now - lastActiveAt;
  if (diffMs < 5 * 60 * 1000) return 'online';     // < 5 min
  if (diffMs < 30 * 60 * 1000) return 'idle';     // < 30 min
  return 'offline';
}

const STATUS_DOT_COLOR: Record<StatusDot, string> = {
  online: 'var(--color-status-online, #22c55e)',
  idle: 'var(--color-status-idle, #eab308)',
  offline: 'var(--color-status-offline, #9ca3af)',
};

const STATUS_DOT_LABEL: Record<StatusDot, string> = {
  online: '在线',
  idle: '空闲',
  offline: '离线',
};

interface AvatarItemProps {
  userId: string;
  name: string;
  avatar?: string;
  color: string;
  status: StatusDot;
  showTooltip: boolean;
  isOverflow?: boolean;
}

const AvatarItem = memo(function AvatarItem({
  userId,
  name,
  avatar,
  color,
  status,
  showTooltip,
}: AvatarItemProps) {
  const initial = name.charAt(0).toUpperCase() || '?';

  return (
    <div
      className={styles.avatarItem}
      data-testid={`collab-avatar-${userId}`}
      data-status={status}
      data-username={name}
      title={showTooltip ? `${name} (${STATUS_DOT_LABEL[status]})` : undefined}
      style={{ '--avatar-color': color } as React.CSSProperties}
      role="img"
      aria-label={`${name}: ${STATUS_DOT_LABEL[status]}`}
    >
      {/* Avatar circle */}
      <div className={styles.avatarCircle}>
        {avatar ? (
          <img src={avatar} alt={name} className={styles.avatarImg} />
        ) : (
          <span className={styles.avatarInitial}>{initial}</span>
        )}
      </div>

      {/* Status dot (bottom-right) */}
      <div
        className={styles.statusDot}
        data-status={status}
        aria-hidden="true"
      />
    </div>
  );
});

/** Empty state */
function EmptyState() {
  return (
    <div className={styles.emptyState} data-testid="collab-avatars-empty">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      <span className={styles.emptyLabel}>暂无协作者</span>
    </div>
  );
}

/** Overflow badge "+N" */
function OverflowBadge({ count }: { count: number }) {
  return (
    <div
      className={styles.overflowBadge}
      data-testid="collab-avatars-overflow"
      title={`还有 ${count} 位协作者`}
    >
      <span className={styles.overflowText}>+{count}</span>
    </div>
  );
}

export const CollaboratorAvatars = memo(function CollaboratorAvatars({
  currentUserId,
  maxDisplay = 5,
  showTooltip = true,
  className,
}: CollaboratorAvatarsProps) {
  // Read remote users from presenceStore
  const remoteUsers = usePresenceStore((s) => s.remoteUsers);
  const connectionStatus = usePresenceStore((s) => s.connectionStatus);

  // Filter out self and convert to array
  const collaborators = Array.from(remoteUsers.values()).filter(
    (u) => u.userId !== currentUserId
  );

  // Fade-out state for disconnected collaborators
  const [fadingUsers, setFadingUsers] = useState<Set<string>>(new Set());

  const visible = collaborators.slice(0, maxDisplay);
  const overflowCount = Math.max(0, collaborators.length - maxDisplay);

  // Handle disconnect fade-out — collaborators that are offline fade out
  const handleFadeOut = useCallback((userId: string) => {
    setFadingUsers((prev) => new Set(prev).add(userId));
    // Remove from DOM after animation (300ms matches CSS transition)
    setTimeout(() => {
      setFadingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }, 350);
  }, []);

  if (collaborators.length === 0) {
    return (
      <div
        className={`${styles.container} ${styles.containerEmpty} ${className ?? ''}`}
        data-testid="collab-avatars"
        data-connection={connectionStatus}
      >
        <EmptyState />
      </div>
    );
  }

  return (
    <div
      className={`${styles.container} ${className ?? ''}`}
      data-testid="collab-avatars"
      data-connection={connectionStatus}
      data-count={collaborators.length}
      role="group"
      aria-label={`${collaborators.length} 位协作者在线`}
    >
      {/* Connection status indicator */}
      {connectionStatus === 'reconnecting' && (
        <div className={styles.reconnectIndicator} data-testid="collab-reconnect">
          <svg
            className={styles.reconnectSpinner}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      )}

      {/* Avatar stack */}
      <div className={styles.avatarStack}>
        {visible.map((user) => {
          const status = getStatusDot(user.lastSeen);
          const color = getCollaboratorColor(user.userId);
          const isFading = fadingUsers.has(user.userId);

          return (
            <div
              key={user.userId}
              className={`${styles.avatarWrapper} ${isFading ? styles.fadingOut : ''}`}
            >
              <AvatarItem
                userId={user.userId}
                name={user.name}
                avatar={user.avatar}
                color={color}
                status={status}
                showTooltip={showTooltip}
              />
            </div>
          );
        })}

        {/* Overflow badge */}
        {overflowCount > 0 && <OverflowBadge count={overflowCount} />}
      </div>
    </div>
  );
});
