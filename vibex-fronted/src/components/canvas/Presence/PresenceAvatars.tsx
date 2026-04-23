/**
 * PresenceAvatars — Display online users on canvas
 * E2-U2: Presence UI 层实现
 *
 * Shows avatar bubbles for each online user on the current canvas.
 * Uses hardcoded data to verify UI first (MVP approach).
 */

'use client';

import React from 'react';
import styles from './PresenceAvatars.module.css';

export interface PresenceAvatarUser {
  userId: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

/**
 * PresenceAvatars — Renders avatar bubbles for online users
 */
export function PresenceAvatars({
  users,
  maxDisplay = 5,
  size = 32,
}: {
  users: PresenceAvatarUser[];
  maxDisplay?: number;
  size?: number;
}) {
  const displayUsers = users.slice(0, maxDisplay);
  const overflow = users.length - maxDisplay;

  if (users.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} aria-label={`${users.length} users online`}>
      {displayUsers.map((user) => (
        <div
          key={user.userId}
          className={styles.avatar}
          style={{
            backgroundColor: user.color,
            width: size,
            height: size,
            fontSize: size * 0.4,
          }}
          title={user.name}
          aria-label={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={styles.overflow}
          style={{ width: size, height: size }}
          title={`+${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

/**
 * PresenceCursor — Shows other users' cursor positions on canvas
 */
export function PresenceCursor({
  user,
  size = 16,
}: {
  user: PresenceAvatarUser;
  size?: number;
}) {
  if (!user.cursor) return null;

  return (
    <div
      className={styles.cursor}
      style={{
        left: user.cursor.x,
        top: user.cursor.y,
        borderColor: user.color,
      }}
      title={user.name}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill={user.color}
        className={styles.cursorIcon}
      >
        <path d="M0 0 L16 12 L8 12 L4 16 Z" />
      </svg>
      <span className={styles.cursorLabel} style={{ backgroundColor: user.color }}>
        {user.name}
      </span>
    </div>
  );
}

/**
 * PresenceCursors — Renders all other users' cursors
 */
export function PresenceCursors({ users }: { users: PresenceAvatarUser[] }) {
  return (
    <div className={styles.cursorsLayer} aria-hidden="true">
      {users
        .filter((u) => u.cursor)
        .map((user) => (
          <PresenceCursor key={user.userId} user={user} />
        ))}
    </div>
  );
}
