/**
 * useWebSocketPresence — WebSocket-backed presence hook
 * S42-P002-E2: Presence 光标同步
 * S63-E1: cursor:move broadcast via sendRaw
 *
 * Integrates with useCollaboration's onPresence callback to keep presenceStore updated.
 * S63-E1: registers cursor:move handler and sends cursor positions via sendRaw.
 *
 * Usage:
 *   const { remoteUsers, isConnected, onCursorMove } = useWebSocketPresence({
 *     projectId, userId, userName
 *   });
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCollaboration } from '@/lib/collaboration/useCollaboration';
import { usePresenceStore } from './presenceStore';
import type { CursorMoveMessage, CollabUser } from '@/lib/collaboration/types';

interface UseWebSocketPresenceOptions {
  projectId: string | null;
  userId: string | null;
  userName?: string;
  /** Throttle cursor broadcast interval in ms (default: 50ms per S63-E1 IMP) */
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
  throttleMs = 50,
}: UseWebSocketPresenceOptions) {
  const { setRemoteUsers, clearAll, updateCursor: updateCursorInStore } =
    usePresenceStore();

  // useCollaboration handles WebSocket lifecycle
  const { isConnected, subscribe, sendRaw } = useCollaboration({
    onPresence: useCallback(
      (users: CollabUser[]) => {
        // Filter out self
        const others = users.filter((u) => u.userId !== userId);
        setRemoteUsers(others);
      },
      [userId, setRemoteUsers]
    ),
  });

  // S63-E1: Register cursor:move handler when WS is ready
  useEffect(() => {
    if (!subscribe) return;
    const unsubscribe = subscribe((msg) => {
      if (msg.type === 'collab:editing:start') {
        const m = msg as { type: 'collab:editing:start'; nodeId: string; userId: string; userName: string; avatar: string };
        usePresenceStore.getState().handleEditingStartedMessage(m.nodeId, m.userId, m.userName, m.avatar);
      } else if (msg.type === 'collab:editing:end') {
        const m = msg as { type: 'collab:editing:end'; nodeId: string; userId: string };
        usePresenceStore.getState().handleEditingEndedMessage(m.nodeId);
      } else if (msg.type === 'cursor:move') {
        // S63-E1: cursor:move — update remoteUsers
        // S68-E5: also update dedicated cursors field
        const m = msg as CursorMoveMessage;
        usePresenceStore.getState().updateCursor(m.userId, m.x, m.y);
        usePresenceStore.getState().broadcastCursor(m.userId, m.x, m.y);
      }
    });
    return unsubscribe;
  }, [subscribe]);

  // S63-E1: Broadcast cursor position via sendRaw with throttle
  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      if (!userId) return;
      const msg: CursorMoveMessage = {
        type: 'cursor:move',
        userId,
        x,
        y,
      };
      sendRaw(msg);
    },
    [userId, sendRaw]
  );

  const throttledBroadcast = useRef(throttle(broadcastCursor, throttleMs));

  /** Called by DDSFlow on pane mouse move */
  const onCursorMove = useCallback(
    (x: number, y: number) => {
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

  // S68-E5: Expose broadcastCursor from presenceStore for DDSCanvasPage to call
  const { broadcastCursor: storeBroadcastCursor, clearCursor: storeClearCursor } =
    usePresenceStore();

  return {
    remoteUsers,
    isConnected,
    onCursorMove,
    updateCursor: updateCursorInStore,
    broadcastCursor: storeBroadcastCursor,
    clearCursor: storeClearCursor,
  };
}
