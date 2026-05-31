'use client';

/**
 * RemoteCursor — Collaborative cursor overlay (WebSocket version)
 *
 * S45-P002-E2: Migrated from Firebase Presence to WebSocket Zustand store.
 * Subscribes to `usePresenceStore` and renders all remote users' cursors
 * with smooth SVG cursor icon + username label.
 *
 * Replaces the Firebase-wired RemoteCursor that used `usePresence` from
 * `@/lib/firebase/presence`.
 */

import React, { useMemo } from 'react';
import { IntentionBubble } from './IntentionBubble';
import type { IntentionType } from './IntentionBubble';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import styles from './RemoteCursor.module.css';

interface RemoteCursorData {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  color: string;
  nodeId?: string | null;
  intention?: IntentionType;
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

/** Single remote cursor for one user */
function CursorInstance({ userId, userName, position, color, nodeId, intention }: RemoteCursorData) {
  const borderColor = color ?? 'var(--color-primary, #00ffff)';

  return (
    <div
      className={styles.remoteCursor}
      data-testid="remote-cursor"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        '--cursor-color': borderColor,
      } as React.CSSProperties}
      data-user-id={userId}
      data-node-id={nodeId ?? undefined}
    >
      {intention && intention !== 'idle' && (
        <IntentionBubble intention={intention} />
      )}
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
 * Reads `remoteUsers` Map from presenceStore and renders a cursor for each remote user.
 * Returns null when there are no remote users (optimization).
 *
 * Note: For DDS canvas (DDSCanvasPage), `PresenceOverlay` is used instead.
 * This `RemoteCursor` component is used for the non-DDS canvas views.
 */
export function RemoteCursor({ userId: selfUserId }: { userId: string }) {
  const remoteUsers = usePresenceStore((s) => s.remoteUsers);

  const cursors = useMemo(() => {
    const result: RemoteCursorData[] = [];
    for (const [uid, user] of remoteUsers) {
      // Skip self
      if (uid === selfUserId) continue;
      result.push({
        userId: uid,
        userName: user.name || uid,
        position: { x: user.cursorX ?? 0, y: user.cursorY ?? 0 },
        color: hashUserColor(uid),
        nodeId: null,
        intention: undefined,
      });
    }
    return result;
  }, [remoteUsers, selfUserId]);

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
