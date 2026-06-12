/**
 * CollaboratorCursors — S84-E2: 协作者光标显示
 *
 * Renders remote collaborators' cursor positions as SVG cursors with name labels.
 * Uses presenceStore.cursors (S68-E5) for cursor positions and
 * presenceStore.remoteUsers for user metadata.
 *
 * S84-E2 DoD:
 * - [x] `CollaboratorCursors.tsx` component (SVG cursor + nickname label)
 * - [x] Fade-out on cursor removal
 * - [x] Cursor SVG with user's color
 * - [x] Nickname label below cursor
 */

'use client';

import React, { memo, useMemo } from 'react';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import { getCollaboratorColor } from '@/lib/collaboration/presence/wsPresenceHandler';
import styles from './CollaboratorCursors.module.css';

interface CollaboratorCursorsProps {
  /** Current user ID (self — excluded from display) */
  currentUserId?: string;
  /** Viewport offset for absolute positioning */
  viewportOffsetX?: number;
  viewportOffsetY?: number;
  /** Additional CSS class for the container */
  className?: string;
}

/** SVG cursor shape — consistent, modern arrow design */
function CursorSVG({ color }: { color: string }) {
  return (
    <svg
      width="20"
      height="24"
      viewBox="0 0 20 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Shadow */}
      <path
        d="M2 2L18 12L10 14L6 22L2 2Z"
        fill="rgba(0,0,0,0.2)"
        transform="translate(1, 1)"
      />
      {/* Cursor body */}
      <path
        d="M2 2L18 12L10 14L6 22L2 2Z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface SingleCursorProps {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
  intent?: string;
}

const SingleCursor = memo(function SingleCursor({
  userId,
  userName,
  x,
  y,
  color,
  intent,
}: SingleCursorProps) {
  return (
    <div
      className={styles.cursorWrapper}
      data-testid={`collab-cursor-${userId}`}
      data-username={userName}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        '--cursor-color': color,
      } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* SVG cursor */}
      <div className={styles.cursorIcon}>
        <CursorSVG color={color} />
      </div>

      {/* Nickname label */}
      <div
        className={styles.cursorLabel}
        style={{ backgroundColor: color }}
      >
        {userName}
      </div>

      {/* S91-E3-F1: Intent label pill */}
      {intent && (
        <div className={styles.intentLabel}>
          {intent}
        </div>
      )}
    </div>
  );
});

export const CollaboratorCursors = memo(function CollaboratorCursors({
  currentUserId,
  viewportOffsetX = 0,
  viewportOffsetY = 0,
  className,
}: CollaboratorCursorsProps) {
  // Get cursors from presenceStore (S68-E5 dedicated cursors field)
  const cursors = usePresenceStore((s) => s.cursors);
  const remoteUsers = usePresenceStore((s) => s.remoteUsers);
  const connectionStatus = usePresenceStore((s) => s.connectionStatus);

  // Build cursor items with user metadata
  const cursorItems = useMemo(() => {
    return Array.from(Object.entries(cursors))
      .filter(([userId]) => userId !== currentUserId)
      .map(([userId, cursorState]) => {
        // Get user name from remoteUsers if not in cursor state
        const remoteUser = remoteUsers.get(userId);
        const name = cursorState.userName || remoteUser?.name || 'Unknown';
        const avatar = cursorState.avatar || remoteUser?.avatar;
        const color = getCollaboratorColor(userId);
        return {
          userId,
          userName: name,
          avatar,
          x: cursorState.x - viewportOffsetX,
          y: cursorState.y - viewportOffsetY,
          lastSeen: cursorState.lastSeen,
          color,
          // S91-E3-F1: Include intent from remoteUsers
          intent: remoteUser?.intent,
        };
      })
      .filter((item) => {
        // Only show cursors seen in the last 60 seconds
        return Date.now() - item.lastSeen < 60_000;
      });
  }, [cursors, remoteUsers, currentUserId, viewportOffsetX, viewportOffsetY]);

  if (cursorItems.length === 0) {
    return null;
  }

  return (
    <div
      className={`${styles.container} ${className ?? ''}`}
      data-testid="collab-cursors"
      data-connection={connectionStatus}
      data-count={cursorItems.length}
      aria-label={`${cursorItems.length} 位协作者光标`}
    >
      {cursorItems.map((item) => (
        <SingleCursor
          key={item.userId}
          userId={item.userId}
          userName={item.userName}
          x={item.x}
          y={item.y}
          color={item.color}
          intent={item.intent}
        />
      ))}
    </div>
  );
});
