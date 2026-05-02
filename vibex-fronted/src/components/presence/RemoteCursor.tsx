'use client';

/**
 * RemoteCursor — E3-Firebase-Cursor S3.2
 *
 * Renders another user's cursor position on the canvas.
 * Shows cursor icon (SVG arrow) + username label.
 * Falls back to null in mock mode.
 */

import React from 'react';
import styles from './RemoteCursor.module.css';

interface RemoteCursorProps {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  nodeId?: string | null;
  isMockMode?: boolean;
  color?: string;
}

export function RemoteCursor({
  userId,
  userName,
  position,
  nodeId,
  isMockMode = false,
  color,
}: RemoteCursorProps) {
  // AGENTS.md §4.2: mock 模式下不渲染
  if (isMockMode) {
    return null;
  }

  const label = color ? `${userName}` : userName;
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
      {/* Cursor arrow SVG */}
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

      {/* Username label */}
      <span
        className={styles.label}
        style={{ backgroundColor: borderColor }}
        data-testid="remote-cursor-label"
      >
        {label}
      </span>
    </div>
  );
}
