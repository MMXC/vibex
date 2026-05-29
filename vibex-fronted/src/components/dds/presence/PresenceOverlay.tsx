'use client';

/**
 * PresenceOverlay — WebSocket-backed collaborative cursor overlay
 * S42-P002-E2: Presence 光标同步 — WebSocket 升级
 *
 * Reads remote users from presenceStore (updated by useWebSocketPresence via
 * useCollaboration's onPresence callback) and renders cursor indicators.
 * Replaces the Firebase-wired RemoteCursor usage in DDSCanvasPage.
 */

import React, { useMemo } from 'react';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';

// Predefined cursor colors — consistent with Firebase hashUserColor
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
      data-testid="ws-remote-cursor"
      data-user-id={userId}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translate(${x}px, ${y}px)`,
        pointerEvents: 'none',
        zIndex: 1000,
        willChange: 'transform',
        transition: 'transform 50ms linear',
      }}
    >
      <svg
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
        aria-hidden="true"
        style={{ display: 'block', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.4))' }}
      >
        <path
          d="M1 1L15 10L8 12L5 19L1 1Z"
          fill={color}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1"
        />
      </svg>
      <span
        style={{
          display: 'inline-block',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(0,0,0,0.85)',
          whiteSpace: 'nowrap',
          marginTop: '2px',
          backgroundColor: color,
        }}
        data-testid="ws-remote-cursor-label"
      >
        {userName}
      </span>
    </div>
  );
}

interface PresenceOverlayProps {
  /** Exclude current user's cursor (if they appear in the list) */
  excludeUserId?: string | null;
}

/**
 * PresenceOverlay — renders all remote user cursors from presenceStore.
 * Mount inside the canvas viewport div in DDSCanvasPage.
 */
export function PresenceOverlay({ excludeUserId }: PresenceOverlayProps) {
  const remoteUsers = usePresenceStore((s) => s.remoteUsers);

  const cursors = useMemo(() => {
    const result: CursorInstanceProps[] = [];
    remoteUsers.forEach((user, uid) => {
      if (excludeUserId && uid === excludeUserId) return;
      if (user.cursorX == null || user.cursorY == null) return;
      result.push({
        userId: uid,
        userName: user.name,
        x: user.cursorX,
        y: user.cursorY,
        color: hashUserColor(uid),
      });
    });
    return result;
  }, [remoteUsers, excludeUserId]);

  if (cursors.length === 0) return null;

  return (
    <>
      {cursors.map((cursor) => (
        <CursorInstance key={cursor.userId} {...cursor} />
      ))}
    </>
  );
}
