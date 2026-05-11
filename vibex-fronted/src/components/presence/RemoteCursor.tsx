'use client';

/**
 * RemoteCursor — Collaborative cursor overlay
 *
 * Subscribes to Firebase Presence (usePresence) and renders all remote users' cursors.
 * Falls back to null in mock mode.
 */

import React from 'react';
import { IntentionBubble } from './IntentionBubble';
import type { IntentionType } from '@/lib/firebase/presence';
import { usePresence, isFirebaseConfigured } from '@/lib/firebase/presence';
import styles from './RemoteCursor.module.css';

interface RemoteCursorData {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  color: string;
  nodeId?: string | null;
  intention?: IntentionType;
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
 * RemoteCursor — renders all remote user cursors by subscribing to usePresence.
 * Returns null when Firebase is not configured (mock mode).
 *
 * @param canvasId  - Canvas/project ID to subscribe to presence for
 * @param userId    - Current user ID (used to filter out own cursor)
 * @param userName  - Current user name
 */
export function RemoteCursor({ canvasId, userId, userName }: {
  canvasId: string;
  userId: string;
  userName: string;
}) {
  const { others } = usePresence(canvasId, userId, userName);

  if (!isFirebaseConfigured()) {
    return null;
  }

  return (
    <>
      {others.map((remote) => (
        <CursorInstance
          key={remote.userId}
          userId={remote.userId}
          userName={remote.name}
          position={remote.cursor ?? { x: 0, y: 0 }}
          color={remote.color}
          nodeId={remote.cursor?.nodeId ?? null}
          intention={remote.intention}
        />
      ))}
    </>
  );
}