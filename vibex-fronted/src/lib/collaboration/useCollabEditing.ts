/**
 * useCollabEditing — Hook for broadcasting node editing start/end
 * S62-E1: 协作者实时同步 — collab:editing:start / collab:editing:end
 *
 * Integrates with usePresenceStore and useCollaboration.
 * Usage:
 *   const { startEditing, endEditing } = useCollabEditing();
 */

'use client';

import { useCallback, useRef } from 'react';
import { useCollaboration } from '@/lib/collaboration/useCollaboration';
import { usePresenceStore } from './presenceStore';

/** S70-E4: Double-write window in milliseconds (5s) */
const CONFLICT_WINDOW_MS = 5_000;

interface CollabEditingStartPayload {
  type: 'collab:editing:start';
  nodeId: string;
  userId: string;
  userName: string;
  avatar: string;
}

interface CollabEditingEndPayload {
  type: 'collab:editing:end';
  nodeId: string;
  userId: string;
}

/**
 * Thin hook that bridges node selection events → WebSocket broadcast.
 * Returns startEditing(nodeId) and endEditing(nodeId) functions.
 *
 * S70-E4: Also provides detectConflict() for the 5-second double-write window.
 * When a remote user starts editing a node that the local user has been editing
 * within the last 5 seconds, a collaboration conflict is detected.
 */
export function useCollabEditing() {
  const { sendRaw } = useCollaboration();
  // Track self userId — read from auth store lazily
  const selfUserIdRef = useRef<string>('anonymous');
  // S70-E4: Track when local edits started per node (for 5s double-write window)
  const localEditTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const startEditing = useCallback(
    (nodeId: string, userId: string, userName: string, avatar: string) => {
      selfUserIdRef.current = userId;
      // Update local store — this triggers conflict detection if remote user is already editing
      usePresenceStore.getState().startEditing(nodeId, userId, userName, avatar);
      // Broadcast to collaborators
      const msg: CollabEditingStartPayload = {
        type: 'collab:editing:start',
        nodeId,
        userId,
        userName,
        avatar,
      };
      sendRaw(msg);
    },
    [sendRaw]
  );

  const endEditing = useCallback(
    (nodeId: string) => {
      const userId = selfUserIdRef.current;
      // Clear local edit timer
      if (localEditTimers.current[nodeId]) {
        clearTimeout(localEditTimers.current[nodeId]);
        delete localEditTimers.current[nodeId];
      }
      // Update local store
      usePresenceStore.getState().endEditing(nodeId);
      // Broadcast to collaborators
      const msg: CollabEditingEndPayload = {
        type: 'collab:editing:end',
        nodeId,
        userId,
      };
      sendRaw(msg);
    },
    [sendRaw]
  );

  /**
   * S70-E4: detectConflict — called when a remote collab:editing:start message arrives.
   * Checks if the local user started editing the same node within the last 5 seconds.
   * If so, records the conflict in presenceStore.
   */
  const detectConflict = useCallback(
    (nodeId: string, remoteUserId: string, remoteUserName: string, remoteAvatar: string) => {
      // If a local edit timer exists for this node, a conflict occurred
      if (localEditTimers.current[nodeId]) {
        // Clear the timer — conflict is now recorded
        clearTimeout(localEditTimers.current[nodeId]);
        delete localEditTimers.current[nodeId];

        // Record the conflict
        usePresenceStore.getState().addConflict({
          nodeId,
          nodeName: nodeId,
          localVersion: '(编辑中)',
          remoteVersion: '(编辑中)',
          localUserId: selfUserIdRef.current,
          localUserName: '我',
          remoteUserId,
          remoteUserName,
          detectedAt: Date.now(),
          resolution: 'pending',
        });
      }
      // Set a 5s timer — if no remote conflict arrives within this window,
      // the edit is considered safe (no double-write)
      if (localEditTimers.current[nodeId]) {
        clearTimeout(localEditTimers.current[nodeId]);
      }
      localEditTimers.current[nodeId] = setTimeout(() => {
        delete localEditTimers.current[nodeId];
      }, CONFLICT_WINDOW_MS);
    },
    []
  );

  return { startEditing, endEditing, detectConflict };
}
