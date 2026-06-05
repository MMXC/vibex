/**
 * useNodeFocus — Hook for broadcasting node:focus / node:unfocus WebSocket messages
 * S65-E2: 协作者编辑指示器 — 节点聚焦感知
 *
 * Usage:
 *   const { onNodeFocus, onNodeBlur } = useNodeFocus();
 *   // In node rendering:
 *   <div onMouseEnter={() => onNodeFocus(nodeId)} onMouseLeave={() => onNodeBlur(nodeId)}>
 *
 * Auto-manages:
 * - Tracking the currently focused node (only one at a time)
 * - Broadcasting node:focused / node:unfocused messages
 * - 30s auto-release timer (presenceStore handles this)
 */

'use client';

import { useCallback, useRef } from 'react';
import { useCollaboration } from './useCollaboration';
import { usePresenceStore } from './presenceStore';
import { useAuthStore } from '@/stores/authStore';
import type { NodeFocusedMessage, NodeUnfocusedMessage } from './types';

export function useNodeFocus() {
  const { sendRaw } = useCollaboration();

  // Track the currently focused nodeId (one at a time)
  const focusedNodeRef = useRef<string | null>(null);

  const onNodeFocus = useCallback(
    (nodeId: string) => {
      // S65-E2: Get current user from authStore (like useCollabEditing does)
      const user = useAuthStore.getState().user;
      const userId = user?.id ?? 'anonymous';
      const userName = user?.name ?? 'Anonymous';
      const avatar = user?.name?.slice(0, 2).toUpperCase() ?? 'AN';

      const prevNode = focusedNodeRef.current;

      // If focusing the same node, do nothing
      if (prevNode === nodeId) return;

      // If previously focused on a different node, unfocus it first
      if (prevNode !== null) {
        focusedNodeRef.current = null;
        // Broadcast unfocus for the previous node
        const unfocusMsg: NodeUnfocusedMessage = {
          type: 'node:unfocused',
          nodeId: prevNode,
          userId,
        };
        sendRaw(unfocusMsg);
        // Clear from local store
        usePresenceStore.getState().clearNodeFocus(prevNode);
      }

      // Set focus on the new node
      focusedNodeRef.current = nodeId;

      // Update local store (starts 30s auto-release timer)
      usePresenceStore.getState().setNodeFocus(nodeId, userId, userName, avatar);

      // Broadcast focus
      const focusMsg: NodeFocusedMessage = {
        type: 'node:focused',
        nodeId,
        userId,
        userName,
        avatar,
      };
      sendRaw(focusMsg);
    },
    [sendRaw]
  );

  const onNodeBlur = useCallback(
    (nodeId: string) => {
      if (focusedNodeRef.current !== nodeId) return;

      const user = useAuthStore.getState().user;
      const userId = user?.id ?? 'anonymous';

      focusedNodeRef.current = null;

      // Clear from local store (cancels the auto-release timer)
      usePresenceStore.getState().clearNodeFocus(nodeId);

      // Broadcast unfocus
      const unfocusMsg: NodeUnfocusedMessage = {
        type: 'node:unfocused',
        nodeId,
        userId,
      };
      sendRaw(unfocusMsg);
    },
    [sendRaw]
  );

  return { onNodeFocus, onNodeBlur };
}
