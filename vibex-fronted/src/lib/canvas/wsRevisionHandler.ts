/**
 * wsRevisionHandler.ts — Sprint52 E3: Undo/Redo 协作冲突处理
 * Sprint53 E2: revision:bump / revision:conflict cases added to wsCommentHandler.ts
 *
 * WebSocket handler for revision:bump and revision:conflict messages.
 * Mirrors the wsCommentHandler.ts pattern:
 *   - type switch on message type
 *   - dynamic import for Zustand stores
 *   - idempotent handling
 *
 * E3 DoD:
 * 1. revision:bump → canvasHistoryStore.setBaseRevision()
 * 2. revision:conflict → canvasHistoryStore.triggerConflictToast()
 * 3. 协作感知测试: WebSocket 重连后 history store 状态正确恢复
 *
 * S53-E2: Integrated into wsCommentHandler.ts for unified WebSocket routing.
 *         This module can be used standalone or imported for type definitions.
 */

// ===========================================
// Message Types
// ===========================================

export type WSRevisionMessage =
  | { type: 'revision:bump'; payload: { canvasId: string; revision: number } }
  | { type: 'revision:conflict'; payload: { canvasId: string; remoteRevision: number; localRevision: number } };

// ===========================================
// Store API Interface (for testability)
// ===========================================

export interface HistoryStoreAPI {
  setBaseRevision(revision: number): void;
  triggerConflictToast(canvasId: string, remoteRevision: number, localRevision: number): void;
}

// ===========================================
// Handler
// ===========================================

/**
 * Handle revision WebSocket messages.
 *
 * @param msg - The revision message to handle
 * @param store - Optional store API for testing (avoids dynamic import in tests).
 *                If omitted, uses dynamic import to resolve useCanvasHistoryStore.
 */
export function handleRevisionWSMessage(
  msg: WSRevisionMessage,
  store?: HistoryStoreAPI
): void {
  switch (msg.type) {
    case 'revision:bump': {
      const { canvasId: _canvasId, revision } = msg.payload;
      if (store) {
        store.setBaseRevision(revision);
      } else {
        import('@/stores/dds/canvasHistoryStore')
          .then(({ useCanvasHistoryStore }) => {
            useCanvasHistoryStore.getState().setBaseRevision(revision);
          })
          .catch((err) => {
            console.error('[wsRevisionHandler] Failed to import canvasHistoryStore:', err);
          });
      }
      break;
    }
    case 'revision:conflict': {
      const { canvasId, remoteRevision = 0, localRevision = 0 } = msg.payload;
      if (store) {
        store.triggerConflictToast(canvasId, remoteRevision, localRevision);
      } else {
        import('@/stores/dds/canvasHistoryStore')
          .then(({ useCanvasHistoryStore }) => {
            useCanvasHistoryStore.getState().triggerConflictToast(canvasId, remoteRevision, localRevision);
          })
          .catch((err) => {
            console.error('[wsRevisionHandler] Failed to import canvasHistoryStore:', err);
          });
      }
      break;
    }
    default: {
      console.warn('[wsRevisionHandler] Unknown message type:', (msg as WSRevisionMessage).type);
    }
  }
}
