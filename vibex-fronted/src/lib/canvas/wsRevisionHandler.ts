/**
 * wsRevisionHandler.ts — Sprint52 E3: Undo/Redo 协作冲突处理
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
 */

// ============================================
// Message Types
// ============================================

export type WSRevisionMessage =
  | { type: 'revision:bump'; payload: { canvasId: string; revision: number } }
  | { type: 'revision:conflict'; payload: { canvasId: string; remoteRevision: number; localRevision: number } };

// ============================================
// Handler
// ============================================

export function handleRevisionWSMessage(msg: WSRevisionMessage): void {
  switch (msg.type) {
    case 'revision:bump': {
      const { canvasId, revision } = msg.payload;
      import('@/stores/dds/canvasHistoryStore')
        .then(({ useCanvasHistoryStore }) => {
          useCanvasHistoryStore.getState().setBaseRevision(revision);
        })
        .catch((err) => {
          console.error('[wsRevisionHandler] Failed to import canvasHistoryStore:', err);
        });
      break;
    }
    case 'revision:conflict': {
      const { canvasId, remoteRevision, localRevision } = msg.payload;
      import('@/stores/dds/canvasHistoryStore')
        .then(({ useCanvasHistoryStore }) => {
          useCanvasHistoryStore.getState().triggerConflictToast(canvasId, remoteRevision, localRevision);
        })
        .catch((err) => {
          console.error('[wsRevisionHandler] Failed to import canvasHistoryStore:', err);
        });
      break;
    }
    default: {
      console.warn('[wsRevisionHandler] Unknown message type:', (msg as WSRevisionMessage).type);
    }
  }
}
