'use client';

/**
 * CursorOverlay — Real-time collaborative cursor SVG overlay
 * Sprint 54 E3: 协作者 Cursor 实时同步
 *
 * Renders remote user cursors on the canvas.
 * Reads cursor positions from presenceStore (updated via WebSocket cursor:move messages).
 * Must be mounted inside the canvas viewport div (DDSCanvasPage).
 *
 * Accessibility: role="img" on SVG cursor elements for testing.
 */
import React, { useMemo } from 'react';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';

// Predefined cursor colors — consistent across sessions
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

interface CursorProps {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

function CursorInstance({ userId, userName, x, y, color }: CursorProps) {
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
      {/*
        SVG cursor arrow — role="img" for E3.1 DoD test:
        expect(within(cursorOverlay).getAllByRole('img').length).toBeGreaterThanOrEqual(1)
      */}
      <svg
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
        role="img"
        aria-label={`${userName}'s cursor`}
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

interface CursorOverlayProps {
  /** Exclude the current user's own cursor from rendering */
  excludeUserId?: string | null;
}

/**
 * CursorOverlay renders all remote user cursors from presenceStore.
 * E3.3 DoD: returns null when no cursors (no data-testid="cursor-overlay" in DOM).
 * Mount inside DDSCanvasPage canvas viewport div.
 */
export function CursorOverlay({ excludeUserId }: CursorOverlayProps) {
  const remoteUsers = usePresenceStore((s) => s.remoteUsers);
  const cursorVisible = useUserPreferencesStore((s) => s.cursorVisible);

  // Return null when cursor visibility is disabled (E3.3: no overlay in DOM)
  if (!cursorVisible) return null;

  const cursors = useMemo(() => {
    const result: CursorProps[] = [];
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

  // E3.3: no cursors → no overlay element rendered
  if (cursors.length === 0) return null;

  return (
    <div
      data-testid="cursor-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {cursors.map((cursor) => (
        <CursorInstance key={cursor.userId} {...cursor} />
      ))}
    </div>
  );
}
