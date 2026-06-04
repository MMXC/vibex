/**
 * NodeEditorLock — Overlay showing who is editing a node
 * S62-E1: 协作者实时同步 — 编辑锁定感知 UI
 *
 * Renders as an overlay badge on the locked node edge.
 * Shows: dashed border + user name label.
 */

import React, { memo } from 'react';
import { usePresenceStore, type EditingNodeInfo } from '@/lib/collaboration/presenceStore';
import styles from './NodeEditorLock.module.css';

interface NodeEditorLockProps {
  /** Node ID being edited */
  nodeId: string;
}

/**
 * Reads from presenceStore.editingNodeIds.
 * Shows a pill badge when a remote user is editing this node.
 */
export const NodeEditorLock = memo(function NodeEditorLock({ nodeId }: NodeEditorLockProps) {
  const editor: EditingNodeInfo | undefined = usePresenceStore((s) => s.editingNodeIds.get(nodeId));

  if (!editor) return null;

  // Initials from avatar or name
  const initials = editor.avatar || editor.userName.slice(0, 2).toUpperCase();

  return (
    <div className={styles.nodeEditorLock} role="img" aria-label={`${editor.userName} 正在编辑`}>
      <span className={styles.avatar}>{initials}</span>
      <span className={styles.userName}>{editor.userName}</span>
    </div>
  );
});
