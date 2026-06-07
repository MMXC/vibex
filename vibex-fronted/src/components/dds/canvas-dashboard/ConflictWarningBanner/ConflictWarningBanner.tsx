/**
 * ConflictWarningBanner — S76-E5
 * Shows when a remote user is editing the same node as the current user.
 * Displayed at the top of the canvas, above the toolbar area.
 */
'use client';

import React from 'react';
import styles from './ConflictWarningBanner.module.css';

export interface ConflictWarningBannerProps {
  /** Node ID being edited by a remote user */
  nodeId: string;
  /** UserName of the remote user editing this node */
  userName: string;
  /** Callback when user dismisses the banner */
  onDismiss: () => void;
}

/**
 * ConflictWarningBanner
 *
 * Renders a warning banner when another collaborator is currently editing
 * the same node. Shows the remote user's name so the current user can
 * decide whether to continue editing or wait.
 *
 * @example
 * const remoteEditors = presenceStore.getState().getRemoteEditors(selectedNodeId);
 * {remoteEditors.length > 0 && (
 *   <ConflictWarningBanner
 *     nodeId={selectedNodeId}
 *     userName={remoteEditors[0].userName}
 *     onDismiss={() => presenceStore.getState().clearRemoteEditing(currentUserId)}
 *   />
 * )}
 */
export function ConflictWarningBanner({ nodeId, userName, onDismiss }: ConflictWarningBannerProps) {
  return (
    <div
      className={styles.banner}
      role="alert"
      aria-live="polite"
      data-testid="conflict-warning-banner"
    >
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden="true">⚠️</span>
        <span className={styles.message}>
          <strong>{userName}</strong> 正在编辑此节点
        </span>
      </div>
      <button
        className={styles.dismissBtn}
        onClick={onDismiss}
        aria-label="关闭冲突警告"
      >
        ✕
      </button>
    </div>
  );
}
