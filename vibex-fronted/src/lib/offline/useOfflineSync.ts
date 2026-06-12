/**
 * useOfflineSync.ts — S93-E3: Offline-First PWA Enhancement
 *
 * React hook for integrating the sync queue with React state.
 * Manages online/offline detection, triggers replay on reconnect,
 * and exposes queue status to UI components.
 *
 * @module lib/offline/useOfflineSync
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  enqueue,
  getAll,
  pendingCount,
  replay,
  isSyncing,
  registerBackgroundSync,
  isSyncQueueEnabled,
  type SyncOp,
  type SyncResult,
} from './syncQueue';

// ==================== Types ====================

export type SyncState = 'idle' | 'syncing' | 'error';

export interface UseOfflineSyncReturn {
  /** Whether the browser is currently offline */
  isOffline: boolean;
  /** Number of pending operations in the queue */
  pendingOps: number;
  /** Current sync state */
  syncState: SyncState;
  /** Enqueue an operation for sync */
  queueOp: (type: string, payload: unknown) => Promise<void>;
  /** Manually trigger sync replay */
  triggerSync: () => Promise<SyncResult>;
  /** Clear all queued operations */
  clearQueue: () => Promise<void>;
}

// ==================== Hook ====================

/**
 * useOfflineSync — integrates the sync queue with React state.
 *
 * Usage:
 * ```ts
 * const { isOffline, pendingOps, syncState, queueOp } = useOfflineSync();
 * ```
 *
 * The hook:
 * - Listens to navigator.onLine changes
 * - Listens to 'online' window events for background sync
 * - Triggers replay when coming back online
 * - Dispatches progress events via the syncQueue module
 */
export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingOps, setPendingOps] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [queue, setQueue] = useState<SyncOp[]>([]);
  const syncInProgressRef = useRef(false);

  // ==================== Sync State Refresh ====================

  const refreshPending = useCallback(async () => {
    try {
      const [count, all] = await Promise.all([pendingCount(), getAll()]);
      setPendingOps(count);
      setQueue(all);
    } catch {
      // IndexedDB not available (SSR or private browsing)
      setPendingOps(0);
      setQueue([]);
    }
  }, []);

  // ==================== Sync Trigger ====================

  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    if (!isSyncQueueEnabled()) return { completed: 0, failed: 0 };
    if (syncInProgressRef.current) return { completed: 0, failed: 0 };

    syncInProgressRef.current = true;
    setSyncState('syncing');

    try {
      const result = await replay();
      setSyncState('idle');
      await refreshPending();
      return result;
    } catch {
      setSyncState('error');
      return { completed: 0, failed: 1 };
    } finally {
      syncInProgressRef.current = false;
    }
  }, [refreshPending]);

  // ==================== Queue Op ====================

  const queueOp = useCallback(
    async (type: string, payload: unknown) => {
      if (!isSyncQueueEnabled()) return;
      try {
        await enqueue(type, payload);
        await refreshPending();
      } catch (err) {
        console.warn('[useOfflineSync] Failed to enqueue operation:', err);
      }
    },
    [refreshPending]
  );

  // ==================== Clear Queue ====================

  const clearQueue = useCallback(async () => {
    const { clearAll } = await import('./syncQueue');
    await clearAll();
    await refreshPending();
  }, [refreshPending]);

  // ==================== Online/Offline Detection ====================

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial state
    setIsOffline(!navigator.onLine);

    const handleOnline = async () => {
      setIsOffline(false);
      // Give the browser a moment to establish a stable connection
      await new Promise((r) => setTimeout(r, 500));
      if (isSyncQueueEnabled()) {
        await triggerSync();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    // Broadcast channel listener (from sw.js online event)
    const channel = new BroadcastChannel('vibex-offline-status');
    channel.onmessage = (event) => {
      if (event.data?.type === 'ONLINE') {
        handleOnline();
      }
    };

    // SW message listener (REPLAY_COMPLETE)
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'REPLAY_COMPLETE') {
        refreshPending();
        setSyncState('idle');
      }
    };

    // Sync queue progress events
    const handleProgress = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail.type === 'complete') {
        refreshPending();
        setSyncState('idle');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sync-queue-progress', handleProgress);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    // Register background sync with service worker
    registerBackgroundSync('vibex-sync').catch(() => {});

    // Initial pending count
    refreshPending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-queue-progress', handleProgress);
      channel.close();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [triggerSync, refreshPending]);

  return {
    isOffline,
    pendingOps,
    syncState,
    queueOp,
    triggerSync,
    clearQueue,
  };
}
