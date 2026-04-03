/**
 * messageBridge — stub for canvas store message bridge
 *
 * E4: Required for contextStore.deleteSelectedNodes() to call
 * postContextActionMessage without throwing TypeError.
 * No-op in test environment; real implementation handles WebSocket/REST.
 */

export function postContextActionMessage(content: string, meta?: string): void {
  // Stub: no-op in tests. Real implementation sends via WebSocket.
}
