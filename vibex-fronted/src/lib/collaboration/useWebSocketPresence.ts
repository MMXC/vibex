/**
 * useWebSocketPresence — WebSocket-backed presence hook
 * S42-P002-E2: Presence 光标同步
 *
 * Integrates with useCollaboration's onPresence callback to keep presenceStore updated.
 * Replaces Firebase usePresence in DDSCanvasPage.
 *
 * Usage:
 *   const { remoteUsers, updateCursor, isConnected } = useWebSocketPresence({
 *     projectId, userId, userName
 *   });
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCollaboration } from '@/lib/collaboration/useCollaboration';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import type { CollabUser } from '@/lib/collaboration/types';

interface UseWebSocketPresenceOptions {
  projectId: string | null;
  userId: string | null;
  userName?: string;
  /** Throttle cursor broadcast interval in ms (default: 100) */
  throttleMs?: number;
}

/** Throttle helper */
function throttle<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let last = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  }) as T;
}

export function useWebSocketPresence({
  projectId,
  userId,
  userName = 'Anonymous',
  throttleMs = 100,
}: UseWebSocketPresenceOptions) {
  const { setRemoteUsers, removeUser, clearAll, updateCursor: updateCursorInStore } =
    usePresenceStore();

  // Track local cursor for throttled broadcast
  const localCursorRef = useRef<{ x: number; y: number } | null>(null);

  // useCollaboration handles WebSocket lifecycle
  const { isConnected } = useCollaboration({
    onPresence: useCallback(
      (users: CollabUser[]) => {
        // Filter out self
        const others = users.filter((u) => u.userId !== userId);
        setRemoteUsers(others);
      },
      [userId, setRemoteUsers]
    ),
  });

  /** Broadcast local cursor position to WebSocket */
  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      // TODO: send presence cursor via WebSocket relay
      // The backend presence-broadcast.ts will handle fan-out.
      // Currently a no-op — WS relay not yet deployed.
      void x;
      void y;
    },
    []
  );

  const throttledBroadcast = useRef(throttle(broadcastCursor, throttleMs));

  /** Called by DDSCanvasPage on mousemove */
  const onCursorMove = useCallback(
    (x: number, y: number) => {
      localCursorRef.current = { x, y };
      throttledBroadcast.current(x, y);
    },
    []
  );

  // Cleanup on unmount / project change
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [projectId, clearAll]);

  const remoteUsers = usePresenceStore((s) => s.remoteUsers);

  return {
    remoteUsers,
    isConnected,
    onCursorMove,
    updateCursor: updateCursorInStore,
  };
}
