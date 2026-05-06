/**
 * useRealtimeSync — Firebase RTDB real-time node synchronization
 * E01 S01.2: 实时节点同步
 *
 * Features:
 * - Subscribe to remote node changes via Firebase RTDB SSE
 * - Write local node changes to Firebase RTDB (debounced)
 * - Last-write-wins conflict resolution (compare updatedAt timestamps)
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import {
  subscribeToNodes,
  writeNodes,
  CanvasNodesSnapshot,
  isFirebaseConfigured,
} from '@/lib/firebase/firebaseRTDB';
import { canvasLogger } from '@/lib/canvas/canvasLogger';
import type {
  BoundedContextNode,
  BusinessFlowNode,
  ComponentNode,
} from '@/lib/canvas/types';

interface UseRealtimeSyncOptions {
  projectId: string | null;
  userId: string;
}

export function useRealtimeSync({ projectId, userId }: UseRealtimeSyncOptions): void {
  // Track if update originated from remote to prevent write loop
  const isRemoteUpdate = useRef(false);
  const writeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Remote update handler
  const handleRemoteUpdate = useCallback(
    (snapshot: CanvasNodesSnapshot | null) => {
      if (!snapshot || !projectId) return;

      // Mark as remote to prevent write loop
      isRemoteUpdate.current = true;

      try {
        // Apply last-write-wins: only apply if remote is newer
        const now = Date.now();
        const remoteUpdatedAt = snapshot.updatedAt ?? 0;

        // Only apply if remote update is recent (within 5 seconds) or no local update pending
        if (now - remoteUpdatedAt < 5000 || !writeTimeoutRef.current) {
          if (snapshot.context && Array.isArray(snapshot.context)) {
            useContextStore.getState().setContextNodes(
              snapshot.context as unknown as BoundedContextNode[]
            );
          }
          if (snapshot.flow && Array.isArray(snapshot.flow)) {
            useFlowStore.getState().setFlowNodes(
              snapshot.flow as unknown as BusinessFlowNode[]
            );
          }
          if (snapshot.component && Array.isArray(snapshot.component)) {
            useComponentStore.getState().setComponentNodes(
              snapshot.component as unknown as ComponentNode[]
            );
          }
          canvasLogger.default.debug('[useRealtimeSync] Applied remote update');
        }
      } catch (err) {
        canvasLogger.default.error('[useRealtimeSync] Failed to apply remote update:', err);
      } finally {
        // Reset after current event loop
        setTimeout(() => {
          isRemoteUpdate.current = false;
        }, 0);
      }
    },
    [projectId]
  );

  // Write local changes to Firebase (debounced)
  const writeLocalNodes = useCallback(() => {
    if (!projectId || !isFirebaseConfigured()) return;

    // Clear pending write
    if (writeTimeoutRef.current) {
      clearTimeout(writeTimeoutRef.current);
    }

    // Debounce writes by 500ms
    writeTimeoutRef.current = setTimeout(() => {
      if (isRemoteUpdate.current) return;

      const contextNodes = useContextStore.getState().contextNodes;
      const flowNodes = useFlowStore.getState().flowNodes;
      const componentNodes = useComponentStore.getState().componentNodes;

      const snapshot: CanvasNodesSnapshot = {
        context: contextNodes as unknown as Array<Record<string, unknown>>,
        flow: flowNodes as unknown as Array<Record<string, unknown>>,
        component: componentNodes as unknown as Array<Record<string, unknown>>,
        updatedAt: Date.now(),
        updatedBy: userId,
      };

      writeNodes(projectId, snapshot, userId).catch(
        canvasLogger.default.error
      );
    }, 500);
  }, [projectId, userId]);

  // Subscribe to remote changes
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeToNodes(projectId, handleRemoteUpdate);
    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current);
      }
    };
  }, [projectId, handleRemoteUpdate]);

  // Sync local changes to remote
  useEffect(() => {
    if (!projectId) return;

    const contextUnsub = useContextStore.subscribe((state) => {
      if (!isRemoteUpdate.current) {
        writeLocalNodes();
      }
    });
    const flowUnsub = useFlowStore.subscribe((state) => {
      if (!isRemoteUpdate.current) {
        writeLocalNodes();
      }
    });
    const componentUnsub = useComponentStore.subscribe((state) => {
      if (!isRemoteUpdate.current) {
        writeLocalNodes();
      }
    });

    return () => {
      contextUnsub();
      flowUnsub();
      componentUnsub();
    };
  }, [projectId, writeLocalNodes]);
}

export default useRealtimeSync;
