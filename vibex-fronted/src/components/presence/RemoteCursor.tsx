'use client';

/**
 * RemoteCursor — Collaborative cursor overlay (WebSocket version)
 *
 * S45-P002-E2: Migrated from Firebase Presence to WebSocket Zustand store.
 * S60-E3: Added online/idle status indicator (pulse animation) via activityStore.
 *
 * Subscribes to `usePresenceStore` for cursor positions and `useActivityStore`
 * for online/idle status. Renders all remote users' cursors with smooth SVG
 * cursor icon + username label + status indicator.
 */

import React, { useMemo } from 'react';
import { IntentionBubble } from './IntentionBubble';
import type { IntentionType } from './IntentionBubble';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import { useActivityStore, type UserStatus } from '@/lib/collaboration/activityStore';
import styles from './RemoteCursor.module.css';

interface RemoteCursorData {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  color: string;
  nodeId?: string | null;
  intention?: IntentionType;
  status: UserStatus;
}

// Predefined cursor colors — consistent with PresenceOverlay hashUserColor
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

/** Status dot CSS class map */
const STATUS_CLASS: Record<UserStatus, string> = {
  online: styles.statusOnline,
  idle: styles.statusIdle,
  offline: styles.statusOffline,
};

/** Single remote cursor for one user — S60-E3: adds status indicator pulse */
function CursorInstance({
  userId,
  userName,
  position,
  color,
  nodeId,
  intention,
  status,
}: RemoteCursorData) {
  const borderColor = color ?? 'var(--color-primary, #00ffff)';

  return (
    <div
      className={styles.remoteCursor}
      data-testid="remote-cursor"
      data-user-id={userId}
      data-status={status}
      data-node-id={nodeId ?? undefined}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        '--cursor-color': borderColor,
      } as React.CSSProperties}
    >
      {intention && intention !== 'idle' && (
        <IntentionBubble intention={intention} />
      )}

      {/* Status indicator dot — pulse animation for online/idle */}
      <span
        className={`${styles.statusDot} ${STATUS_CLASS[status] ?? ''}`}
        data-testid="remote-cursor-status"
        aria-label={`状态: ${status === 'online' ? '在线' : status === 'idle' ? '空闲' : '离线'}`}
        title={status === 'online' ? '在线' : status === 'idle' ? '空闲' : '离线'}
      />

      <svg
        className={styles.cursorIcon}
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1 1L15 10L8 12L5 19L1 1Z"
          fill={borderColor}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1"
        />
      </svg>
      <span
        className={styles.label}
        style={{ backgroundColor: borderColor }}
        data-testid="remote-cursor-label"
      >
        {userName}
      </span>
    </div>
  );
}

/**
 * RemoteCursor — renders all remote user cursors from usePresenceStore (WebSocket-backed).
 *
 * Reads `remoteUsers` Map from presenceStore and `userStatuses` from activityStore
 * to render cursors with online/idle status indicators.
 *
 * Note: For DDS canvas (DDSCanvasPage), `PresenceOverlay` is used instead.
 * This `RemoteCursor` component is used for the non-DDS canvas views.
 */
export function RemoteCursor({ userId: selfUserId }: { userId: string }) {
  const remoteUsers = usePresenceStore((s) => s.remoteUsers);
  const userStatuses = useActivityStore((s) => s.userStatuses);

  const cursors = useMemo(() => {
    const result: RemoteCursorData[] = [];
    for (const [uid, user] of remoteUsers) {
      if (uid === selfUserId) continue;

      const statusRecord = userStatuses[uid];
      // Derive status from lastSeen timestamp to avoid stale reads
      const status: UserStatus =
        statusRecord?.status ??
        (Date.now() - user.lastSeen < 60_000 ? 'online' : 'idle');

      result.push({
        userId: uid,
        userName: user.name || uid,
        position: { x: user.cursorX ?? 0, y: user.cursorY ?? 0 },
        color: hashUserColor(uid),
        nodeId: null,
        intention: undefined,
        status,
      });
    }
    return result;
  }, [remoteUsers, userStatuses, selfUserId]);

  if (cursors.length === 0) {
    return null;
  }

  return (
    <>
      {cursors.map((cursor) => (
        <CursorInstance key={cursor.userId} {...cursor} />
      ))}
    </>
  );
}
