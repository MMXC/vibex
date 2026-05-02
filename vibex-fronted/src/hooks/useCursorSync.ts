'use client';

/**
 * useCursorSync — E3-Firebase-Cursor S3.3
 *
 * Hook that syncs remote cursors from Firebase Presence.
 * Writes cursor with 100ms debounce to avoid flooding Firebase.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  subscribeToOthers,
  removePresence,
  updateCursor as updateCursorApi,
  type PresenceUser,
} from '@/lib/firebase/presence';

export interface RemoteCursorData {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  nodeId: string | null;
  color: string;
}

// Simple debounce — avoids lodash dependency
function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delayMs: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  }) as T;
}

interface UseCursorSyncOptions {
  canvasId: string | null;
  userId: string | null;
  userName: string;
  /** Default: false (mock mode) */
  isMockMode?: boolean;
}

export function useCursorSync({
  canvasId,
  userId,
  userName,
  isMockMode = false,
}: UseCursorSyncOptions) {
  const [cursors, setCursors] = useState<RemoteCursorData[]>([]);
  const pendingCursorRef = useRef<{ x: number; y: number; nodeId: string | null } | null>(null);
  const debouncedWriteRef = useRef<((x: number, y: number, nodeId: string | null) => void) | null>(null);

  // Debounced cursor write — AGENTS.md §4.1: 100ms throttle
  useEffect(() => {
    if (!canvasId || !userId) return;

    const writeCursor = debounce((x: number, y: number, nodeId: string | null) => {
      updateCursorApi(canvasId, userId, x, y, nodeId).catch(() => {/* swallow */});
      pendingCursorRef.current = null;
    }, 100);

    debouncedWriteRef.current = writeCursor;
  }, [canvasId, userId]);

  // Subscribe to remote cursors
  useEffect(() => {
    if (!canvasId) return;

    const unsubscribe = subscribeToOthers(canvasId, (users: PresenceUser[]) => {
      const remoteCursors: RemoteCursorData[] = users
        .filter((u) => Boolean(u.cursor))
        .map((u) => ({
          userId: u.userId,
          userName: u.name,
          position: { x: u.cursor!.x, y: u.cursor!.y },
          nodeId: u.cursor!.nodeId,
          color: u.color,
        }));
      setCursors(remoteCursors);
    });

    return () => {
      unsubscribe();
      if (canvasId && userId) {
        removePresence(canvasId, userId).catch(() => {/* swallow */});
      }
    };
  }, [canvasId]);

  const moveCursor = useCallback((x: number, y: number, nodeId: string | null = null) => {
    if (isMockMode) return;
    pendingCursorRef.current = { x, y, nodeId };
    debouncedWriteRef.current?.(x, y, nodeId);
  }, [isMockMode]);

  return { cursors, moveCursor, isMockMode };
}
