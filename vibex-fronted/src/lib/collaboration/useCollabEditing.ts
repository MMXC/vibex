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
 */
export function useCollabEditing() {
  const { sendRaw } = useCollaboration();
  // Track self userId — read from auth store lazily
  const selfUserIdRef = useRef<string>('anonymous');

  const startEditing = useCallback(
    (nodeId: string, userId: string, userName: string, avatar: string) => {
      selfUserIdRef.current = userId;
      // Update local store
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

  return { startEditing, endEditing };
}
