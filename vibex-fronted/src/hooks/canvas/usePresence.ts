/**
 * usePresence — Hook for real-time collaboration presence
 * Sprint 53 E1: 协作实时 Presence UI
 *
 * Responsibilities:
 * - Subscribe to WebSocket presence:join/leave/ping messages via globalPresenceRouter
 * - Handle 30s inactivity timeout auto-removal
 * - Expose onlineUsers from presenceStore
 *
 * Usage:
 * ```tsx
 * function CanvasPage() {
 *   usePresence();
 *   return <PresenceIndicator />;
 * }
 * ```
 */
'use client';

import { useEffect } from 'react';
import {
  initPresenceSync,
  registerPresenceHandlers,
  unregisterPresenceHandlers,
} from '@/lib/canvas/presenceSync';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import type { MessageRouter } from '@/lib/websocket/MessageRouter';

export interface UsePresenceOptions {
  /**
   * Explicitly pass the MessageRouter instance from useCollaboration.
   * When provided, this takes precedence over auto-registration.
   */
  router?: MessageRouter;
  /**
   * Team/room ID — required for routing presence to the correct room.
   * Included for API parity; actual routing is handled by MessageRouter.
   */
  teamId?: string;
  /** Canvas page ID — included for API parity */
  pageId?: string;
}

export interface UsePresenceReturn {
  /** Remote users currently on the same canvas */
  onlineUsers: Array<{
    userId: string;
    name: string;
    avatar: string;
    lastSeen: number;
  }>;
}

/**
 * usePresence subscribes to WebSocket presence messages and keeps the
 * presenceStore in sync with real-time online users.
 *
 * Handles:
 * - presence:join — adds user to presenceStore, starts 30s timeout
 * - presence:leave — removes user, cancels timeout
 * - presence:ping — resets 30s timeout for the user
 *
 * Returns the current list of online users from presenceStore.
 */
export function usePresence(options: UsePresenceOptions = {}): UsePresenceReturn {
  const { router } = options;

  // Register router if explicitly provided
  useEffect(() => {
    if (router) {
      initPresenceSync(router);
    }
  }, [router]);

  // Register presence handlers and initialize from useCollaboration's router
  useEffect(() => {
    // Register handlers (they will look up the global router set by useCollaboration)
    registerPresenceHandlers();

    return () => {
      unregisterPresenceHandlers();
    };
  }, []);

  // Subscribe to presenceStore for online users
  const remoteUsers = usePresenceStore((state) => state.remoteUsers);

  const onlineUsers = Array.from(remoteUsers.values()).filter(
    (u) => u.lastSeen > 0
  );

  return { onlineUsers };
}
