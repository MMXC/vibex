/**
 * LockIndicator — Shows the CURRENT USER's lock status on a node
 * S95-E3: Node Edit Locking — subtle indicator when current user holds the lock
 *
 * Shows a small lock/unlock icon when the current user holds the lock on this node.
 * This is a subtle indicator (not a big badge) — just a small icon.
 */

'use client';

import React, { memo } from 'react';
import { useNodeLockStore } from '@/stores/nodeLockStore';
import { useAuthStore } from '@/stores/authStore';
import styles from './LockIndicator.module.css';

interface LockIndicatorProps {
  /** Node ID to check lock status for */
  nodeId: string;
}

/**
 * Shows a subtle lock indicator when the current user holds the lock on this node.
 * Returns null when the current user does NOT hold the lock (or no lock exists).
 */
export const LockIndicator = memo(function LockIndicator({ nodeId }: LockIndicatorProps) {
  const lock = useNodeLockStore((s) => s.getLock(nodeId));
  const currentUserId = useAuthStore((s) => s.user?.id);

  // Only show when current user holds the lock
  if (!lock || lock.locked_by !== currentUserId) return null;

  // Lock has expired
  if (lock.expires_at < Date.now()) return null;

  return (
    <span
      className={styles.indicator}
      role="img"
      aria-label="你正在编辑此节点"
      title="你正在编辑此节点"
      data-testid="lock-indicator"
    >
      🔓
    </span>
  );
});
