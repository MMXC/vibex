/**
 * wsCursorHandler — WebSocket cursor message handler for E5
 * S68-E5: 协作光标同步 — 独立 cursor 字段 + ws handler
 *
 * Handles cursor:move WebSocket messages and updates presenceStore.cursors.
 * Uses the dedicated 'cursors' field (separate from remoteUsers) for
 * multi-user cursor tracking.
 */

'use client';

import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import type { CursorMoveMessage } from '@/lib/collaboration/types';

/** Handle incoming cursor:move message from WebSocket */
export function handleCursorMoveMessage(msg: CursorMoveMessage): void {
  const { userId, x, y } = msg;
  usePresenceStore.getState().broadcastCursor(userId, x, y);
}

/** Handle cursor:clear message (user left) */
export function handleCursorClearMessage(userId: string): void {
  usePresenceStore.getState().clearCursor(userId);
}

/** Register cursor handlers on a WebSocket subscribe function */
export function registerCursorHandlers(
  subscribe: (handler: (msg: unknown) => void) => () => void
): () => void {
  return subscribe((msg) => {
    const m = msg as { type: string; [key: string]: unknown };
    if (m.type === 'cursor:move') {
      handleCursorMoveMessage(m as CursorMoveMessage);
    } else if (m.type === 'cursor:clear') {
      handleCursorClearMessage((m as { userId: string }).userId);
    }
  });
}
