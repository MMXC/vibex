/**
 * canvasCollabBridge — Bridge DDSCanvasStore actions → collaboration broadcast
 * P002-E1: businessFlowStore bridge — broadcasts canvas mutations to other users
 * P002-E2: Remote-action conflict detection — checks oplog before applying remote update
 *
 * Usage:
 *   // In a component or layout that mounts with the canvas:
 *   useCanvasCollabBridge();
 */

'use client';

import { useEffect } from 'react';
import { useCollaboration } from './useCollaboration';
import type { RemoteActionMessage, ConflictMessage } from './types';
import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { useOplogStore } from '@/stores/oplogStore';
import { conflictToastEmitter } from '@/stores/oplogStore';

export interface CanvasCollabBridgeOptions {
  /** Enable/disable bridging (default: true when WS is connected) */
  enabled?: boolean;
  /** Called when a remote action is received */
  onRemoteAction?: (msg: RemoteActionMessage) => void;
  /** Called when a conflict is detected */
  onConflict?: (msg: ConflictMessage) => void;
}

export function useCanvasCollabBridge(options: CanvasCollabBridgeOptions = {}) {
  const { onRemoteAction, onConflict } = options;

  const { connect, disconnect, broadcast, isConnected, onlineUsers } = useCollaboration({
    onRemoteAction: (msg) => {
      // ── P002-E2: Check oplog for conflict before applying remote action ──
      checkRemoteConflict(msg);
      // Apply remote action to local store
      applyRemoteAction(msg);
      onRemoteAction?.(msg);
    },
    onConflict: (msg) => {
      // ── P002-E2: Conflict from server — mark node as conflicted ──
      useConfirmationStore.getState().addConflictSnapshot(msg.nodeId, []);
      conflictToastEmitter.emit(msg.nodeId, msg.conflictingUserId);
      onConflict?.(msg);
    },
  });

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // ==================== Broadcast wrappers ====================

  /**
   * Broadcast a card/node update to other users
   */
  function broadcastUpdate(nodeId: string, data: unknown): void {
    if (!isConnected) return;
    broadcast('update', { nodeId, data });
  }

  /**
   * Broadcast a card/node addition
   */
  function broadcastAdd(nodeId: string, data: unknown): void {
    if (!isConnected) return;
    broadcast('add', { nodeId, data });
  }

  /**
   * Broadcast a card/node deletion
   */
  function broadcastDelete(nodeId: string, data?: unknown): void {
    if (!isConnected) return;
    broadcast('delete', { nodeId, data: data ?? {} });
  }

  return {
    broadcastUpdate,
    broadcastAdd,
    broadcastDelete,
    isConnected,
    onlineUsers,
  };
}

// ==================== P002-E2: Remote conflict detection ====================

/**
 * Checks the local oplog for recent edits to the same nodeId within 1 second.
 * If found, triggers conflict warning + toast. Always applies the remote action
 * after checking.
 */
function checkRemoteConflict(msg: RemoteActionMessage): void {
  const { nodeId, userId } = msg.payload;
  const WINDOW_MS = 1_000;

  // Get recent local entries for this nodeId
  const recent = useOplogStore.getState().getOplogForNode(nodeId);
  const now = Date.now();
  const conflicting = recent.filter((e) => now - e.timestamp < WINDOW_MS);

  if (conflicting.length > 0) {
    // ── Conflict detected: local edit within 1s of remote edit ──
    const { useConfirmationStore } = require('@/stores/confirmationStore');
    useConfirmationStore.getState().addConflictSnapshot(nodeId, conflicting);
    conflictToastEmitter.emit(nodeId, userId);
    console.warn(`[CollabBridge] Remote conflict: node=${nodeId} from=${userId}, ${conflicting.length} local ops within 1s`);
  }
}

// ==================== Helpers ====================

function applyRemoteAction(msg: RemoteActionMessage): void {
  const { userId, nodeId, action, data } = msg.payload;
  const store = useDDSCanvasStore.getState();

  switch (action) {
    case 'update': {
      // Update the card in the store
      const chapter = store.activeChapter;
      const cards = store.chapters[chapter].cards;
      const cardIdx = cards.findIndex((c) => c.id === nodeId);
      if (cardIdx >= 0) {
        const updatedCard = { ...cards[cardIdx], ...(data as Record<string, unknown>), _lastModifiedBy: userId };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newCards: typeof cards = [...cards];
        newCards[cardIdx] = updatedCard as any;
        useDDSCanvasStore.setState({
          chapters: {
            ...store.chapters,
            [chapter]: { ...store.chapters[chapter], cards: newCards },
          },
        });
      }
      break;
    }
    case 'add': {
      // Add the card to the active chapter
      const chapter = store.activeChapter;
      useDDSCanvasStore.setState({
        chapters: {
          ...store.chapters,
          [chapter]: {
            ...store.chapters[chapter],
            cards: [...store.chapters[chapter].cards, { id: nodeId, ...(data as object) } as never],
          },
        },
      });
      break;
    }
    case 'delete': {
      const chapter = store.activeChapter;
      useDDSCanvasStore.setState({
        chapters: {
          ...store.chapters,
          [chapter]: {
            ...store.chapters[chapter],
            cards: store.chapters[chapter].cards.filter((c) => c.id !== nodeId),
          },
        },
      });
      break;
    }
  }
}
