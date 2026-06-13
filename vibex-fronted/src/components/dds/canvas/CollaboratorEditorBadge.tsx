/**
 * CollaboratorEditorBadge — Shows when a REMOTE user has locked a node
 * S95-E3: Node Edit Locking — badge for remote lock holder
 *
 * Renders a pill with avatar + user name when a remote user holds the lock.
 * Does NOT render when the current user holds the lock (use LockIndicator for that).
 * Returns null if the node is unlocked or the lock has expired.
 */

'use client';

import React, { memo } from 'react';
import { useNodeLockStore } from '@/stores/nodeLockStore';
import { useAuthStore } from '@/stores/authStore';
import styles from './CollaboratorEditorBadge.module.css';

interface CollaboratorEditorBadgeProps {
  /** Node ID to display the badge for */
  nodeId: string;
}

/**
 * Reads from nodeLockStore — shows a pill when a REMOTE user holds the lock.
 * Returns null if:
 * - no lock exists
 * - lock is held by the current user
 * - lock has expired
 */
export const CollaboratorEditorBadge = memo(function CollaboratorEditorBadge({
  nodeId,
}: CollaboratorEditorBadgeProps) {
  const lock = useNodeLockStore((s) => s.getLock(nodeId));
  const currentUserId = useAuthStore((s) => s.user?.id);

  // No lock
  if (!lock) return null;

  // Don't show badge for the current user — they see LockIndicator instead
  if (lock.locked_by === currentUserId) return null;

  // Lock has expired (getLock already filters this, but double-check)
  if (lock.expires_at < Date.now()) return null;

  const initials = lock.avatar
    ? undefined
    : lock.user_name.slice(0, 2).toUpperCase();

  return (
    <div
      className={styles.badge}
      role="img"
      aria-label={`${lock.user_name} 正在编辑此节点`}
      data-testid="collaborator-editor-badge"
    >
      {lock.avatar ? (
        <img
          src={lock.avatar}
          alt={lock.user_name}
          className={styles.avatar}
          data-testid="badge-avatar"
        />
      ) : (
        <span className={styles.avatarFallback} data-testid="badge-avatar-fallback">
          {initials}
        </span>
      )}
      <span className={styles.userName} data-testid="badge-username">
        {lock.user_name}
      </span>
    </div>
  );
});
