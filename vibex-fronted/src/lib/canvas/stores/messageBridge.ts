/**
 * messageBridge — stub for canvas store message bridge
 *
 * E4: Required for contextStore.deleteSelectedNodes() to call
 * postContextActionMessage without throwing TypeError.
 * No-op in test environment; real implementation handles WebSocket/REST.
 */

export async function postContextActionMessage(payload: {
  type: string;
  nodeId?: string;
}): Promise<void> {
  // Stub: no-op in tests. Real implementation sends via WebSocket.
  return Promise.resolve();
}
