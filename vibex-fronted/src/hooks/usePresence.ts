/**
 * usePresence — Hook for managing real-time user presence
 * E2-U2: Presence UI 层实现
 *
 * MVP: hardcoded data to verify UI first.
 * Full implementation connects to Firebase Realtime Database.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { PresenceAvatarUser } from '@/components/canvas/Presence/PresenceAvatars';

// Default hardcoded users for MVP UI verification
const MOCK_USERS: PresenceAvatarUser[] = [
  { userId: 'user-1', name: 'Alice', color: '#4F46E5' },
  { userId: 'user-2', name: 'Bob', color: '#059669' },
  { userId: 'user-3', name: 'Carol', color: '#DC2626' },
];

export interface UsePresenceOptions {
  teamId: string;
  pageId: string;
  /** Use mock data for MVP verification */
  mockMode?: boolean;
}

export interface UsePresenceReturn {
  /** List of online users on the current page */
  onlineUsers: PresenceAvatarUser[];
  /** Set current user's presence (call on mount, update on activity) */
  setPresence: (userId: string, userName: string, color?: string) => void;
  /** Clear current user's presence (call on unmount) */
  clearPresence: () => void;
  /** Whether presence is loading */
  isLoading: boolean;
  /** Connection status */
  status: 'connected' | 'disconnected' | 'mock';
}

/**
 * usePresence — Hook for real-time presence tracking
 *
 * MVP behavior:
 * - Returns hardcoded mock users for UI verification
 * - setPresence/clearPresence are no-ops (mock mode)
 *
 * Full implementation:
 * - Connects to Firebase Realtime Database
 * - Reads/writes to /presence/{teamId}/{pageId}/{userId}
 * - 60s TTL heartbeat mechanism
 */
export function usePresence({
  teamId,
  pageId,
  mockMode = true,
}: UsePresenceOptions): UsePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<PresenceAvatarUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize with mock data in mock mode
  useEffect(() => {
    if (mockMode) {
      // Simulate loading
      const timer = setTimeout(() => {
        setOnlineUsers(MOCK_USERS);
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Full implementation: connect to Firebase
    // For now, fall back to mock
    setOnlineUsers(MOCK_USERS);
    setIsLoading(false);
  }, [mockMode, teamId, pageId]);

  const setPresence = useCallback(
    (_userId: string, _userName: string, _color?: string) => {
      // MVP: no-op. Full impl: write to Firebase /presence/{teamId}/{pageId}/{userId}
    },
    []
  );

  const clearPresence = useCallback(() => {
    // MVP: no-op. Full impl: delete from Firebase
  }, []);

  return {
    onlineUsers,
    setPresence,
    clearPresence,
    isLoading,
    status: mockMode ? 'mock' : 'disconnected',
  };
}
