/**
 * OnlineUsers — P002-E3: User online status UI
 *
 * Displays online users as an avatar stack in DDSToolbar.
 * Reads from useCollaboration().onlineUsers.
 *
 * Max visible: 3 avatars + "+N" overflow badge.
 */

'use client';

import React, { memo } from 'react';
import type { CollabUser } from '@/lib/collaboration/types';
import styles from './online-users.module.css';

export interface OnlineUsersProps {
  /** List of online users from useCollaboration().onlineUsers */
  users: CollabUser[];
  /** Max avatars to show before "+N" overflow (default: 3) */
  maxVisible?: number;
}

const MAX_VISIBLE_DEFAULT = 3;

/**
 * Renders an avatar with initials fallback if no avatar URL.
 */
const UserAvatar = memo(function UserAvatar({
  user,
  size = 24,
  index = 0,
}: {
  user: CollabUser;
  size?: number;
  index?: number;
}) {
  const initials = user.name
    ? user.name
        .split(/\s+/)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('')
    : '?';

  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        zIndex: MAX_VISIBLE_DEFAULT - index,
        marginLeft: index === 0 ? 0 : -(size * 0.3),
      }}
      title={user.name}
      aria-label={`Online: ${user.name}`}
    >
      {user.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
      ) : (
        <span className={styles.avatarInitials}>{initials}</span>
      )}
    </div>
  );
});

/**
 * Overflow badge for users beyond maxVisible.
 */
function OverflowBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className={styles.overflow} aria-label={`${count} more users online`}>
      +{count}
    </div>
  );
}

/**
 * OnlineUsers — displays online collaborators as an avatar stack.
 * Shows up to `maxVisible` avatars, then "+N" overflow.
 */
export const OnlineUsers = memo(function OnlineUsers({
  users,
  maxVisible = MAX_VISIBLE_DEFAULT,
}: OnlineUsersProps) {
  if (!users || users.length === 0) return null;

  const visible = users.slice(0, maxVisible);
  const overflow = users.length - maxVisible;

  return (
    <div className={styles.wrapper} role="status" aria-label={`${users.length} user(s) online`}>
      <div className={styles.stack}>
        {visible.map((user, i) => (
          <UserAvatar key={user.userId} user={user} size={28} index={i} />
        ))}
        <OverflowBadge count={overflow} />
      </div>
    </div>
  );
});
