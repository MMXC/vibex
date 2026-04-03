/**
 * VibeX Canvas Store — Re-export Layer
 *
 * E1: Reduced from 170 lines to this pure re-export layer.
 * All business logic moved to:
 *   - crossStoreSync.ts     — cross-store subscriptions
 *   - loadExampleData.ts    — example data loader
 *   - deprecated.ts         — backward-compat helpers
 *
 * Note: initCrossStoreSync() is called at module level to preserve
 * backward compatibility with existing tests and consumers that rely on
 * subscriptions being active after importing canvasStore.
 *
 * Epic: canvas-canvasstore-migration / E1-canvasStore清理
 * AGENTS.md: §2.2 canvasStore re-export Template
 */

// Re-export all split stores
export { useContextStore } from './stores/contextStore';
export { useUIStore } from './stores/uiStore';
export { useFlowStore } from './stores/flowStore';
export { useComponentStore } from './stores/componentStore';
export { useSessionStore } from './stores/sessionStore';

// Backward compatibility alias — useCanvasStore = useContextStore
export { useContextStore as useCanvasStore } from './stores/contextStore';

// Cross-store sync entry point (called at module level for backward compat)
export { initCrossStoreSync } from './crossStoreSync';

// Example data loader
export { loadExampleData } from './loadExampleData';

// Deprecated backward-compat helpers (use split stores directly)
export {
  getCanvasPhase,
  getCanvasActiveTree,
  getContextNodes,
  getFlowNodes,
  getComponentNodes,
  getMessages,
  setCanvasCenterExpand,
  setContextNodes,
  setFlowNodes,
  setComponentNodes,
  markAllPending,
} from './deprecated';

// Re-export types
export type { ClarificationRound } from '@/stores/confirmationTypes';
export type { SSEStatus, MessageType, MessageItem } from './stores/sessionStore';
export type { PanelExpandState, CanvasExpandMode } from './stores/uiStore';
export type { Phase, TreeType } from './types';

// Initialize cross-store subscriptions at module load time.
// This preserves the behavior of the old canvasStore.ts where subscriptions
// were set up when the module was first imported.
initCrossStoreSync();
