'use client';

/**
 * RemoteCursorsLayer — Collaborative cursor overlay for DDS Canvas
 * S63-E1: 协作者实时游标追踪
 * S68-E5: 协作光标同步 — 升级为独立 cursors 字段
 *
 * Mounted inside <ReactFlow> in DDSFlow. Renders all remote users' cursors with
 * smooth SVG cursor icons + username labels.
 *
 * Reads from usePresenceStore.cursors (S68-E5 dedicated field, flow-space coords).
 * Cursor positions in presenceStore are in flow-space coordinates.
 */

import React, { useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import styles from './RemoteCursorsLayer.module.css';

// Predefined cursor colors — consistent with hashUserColor
const PRESENCE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

function hashUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length]!;
}

interface CursorInstanceProps {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

function CursorInstance({ userId, userName, x, y, color }: CursorInstanceProps) {
  return (
    <div
      className={styles.cursor}
      data-testid="ws-remote-cursor"
      data-user-id={userId}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        '--cursor-color': color,
      } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* SVG cursor arrow */}
      <svg
        className={styles.cursorIcon}
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
      >
        <path
          d="M1 1L15 10L8 12L5 19L1 1Z"
          fill={color}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1"
        />
      </svg>
      {/* Username label */}
      <span
        className={styles.label}
        style={{ backgroundColor: color }}
        data-testid="ws-remote-cursor-label"
      >
        {userName}
      </span>
    </div>
  );
}

interface RemoteCursorsLayerProps {
  /** Current user's ID — excluded from remote cursors list */
  currentUserId?: string | null;
}

/**
 * RemoteCursorsLayer — renders all remote user cursors from presenceStore.
 *
 * Cursor positions stored in presenceStore are in flow-space (absolute canvas coords).
 * This component is inside <ReactFlow>, so it renders as an absolute overlay
 * on the ReactFlow pane. Positions from presenceStore are already in flow-space,
 * matching the canvas coordinate system — no screenToFlowPosition conversion needed.
 */
export function RemoteCursorsLayer({ currentUserId }: RemoteCursorsLayerProps) {
  // S68-E5: Read from dedicated cursors field (separate from remoteUsers)
  const cursorsMap = usePresenceStore((s) => s.cursors);

  const cursors = useMemo(() => {
    const result: CursorInstanceProps[] = [];
    for (const [uid, cursor] of Object.entries(cursorsMap)) {
      if (uid === currentUserId) continue;
      if (cursor.x === 0 && cursor.y === 0) continue; // no position yet
      result.push({
        userId: uid,
        userName: cursor.userName || uid,
        x: cursor.x,
        y: cursor.y,
        color: hashUserColor(uid),
      });
    }
    return result;
  }, [cursorsMap, currentUserId]);

  if (cursors.length === 0) return null;

  return (
    <>
      {cursors.map((cursor) => (
        <CursorInstance key={cursor.userId} {...cursor} />
      ))}
    </>
  );
}
