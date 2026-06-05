/**
 * NodeFocusOverlay — Overlay showing who is focusing on a node
 * S65-E2: 协作者编辑指示器 — 节点聚焦感知 UI
 *
 * Renders as a pill badge at the top-left of a card when a remote user
 * is focusing on this node. Uses blue color (vs amber for NodeEditorLock).
 */

import React, { memo } from 'react';
import { usePresenceStore, type FocusedNodeInfo } from '@/lib/collaboration/presenceStore';
import styles from './NodeFocusOverlay.module.css';

interface NodeFocusOverlayProps {
  /** Node ID being focused */
  nodeId: string;
  /** Optional CSS top value offset (for stacking with NodeEditorLock at top-right) */
  topOffset?: string;
}

function getInitials(avatar: string, name: string): string {
  if (avatar) return avatar.slice(0, 2).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/**
 * Reads from presenceStore.focusedNodeInfos.
 * Shows a blue pill badge when a remote user is focusing on this node.
 */
export const NodeFocusOverlay = memo(function NodeFocusOverlay({
  nodeId,
  topOffset = '-12px',
}: NodeFocusOverlayProps) {
  const focusInfo: FocusedNodeInfo | undefined = usePresenceStore(
    (s) => s.focusedNodeInfos.get(nodeId)
  );

  if (!focusInfo) return null;

  const initials = getInitials(focusInfo.avatar, focusInfo.userName);

  return (
    <div
      className={styles.nodeFocusOverlay}
      style={{ top: topOffset }}
      role="img"
      aria-label={`${focusInfo.userName} 正在查看此节点`}
    >
      <span className={styles.avatar}>{initials}</span>
      <span className={styles.userName}>{focusInfo.userName}</span>
    </div>
  );
});
