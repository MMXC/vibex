/**
 * VibeX Canvas Store — Re-export Layer
 *
 * E1: Reduced from 170 lines to this pure re-export layer.
 * All business logic moved to:
 *   - crossStoreSync.ts     — cross-store subscriptions
 *   - loadExampleData.ts   — example data loader
 *   - deprecated.ts        — backward-compat helpers
 *
 * Epic: canvas-canvasstore-migration / E1-canvasStore清理
 * AGENTS.md: §2.2 canvasStore re-export Template
 */

// Re-export all split stores
export {
  useContextStore,
  useUIStore,
  useFlowStore,
  useComponentStore,
  useSessionStore,
} from './stores';
export { useContextStore as useCanvasStore } from './stores/contextStore';

// Cross-store sync + loadExampleData
import { initCrossStoreSync } from './crossStoreSync';
export { initCrossStoreSync };
export { loadExampleData } from './loadExampleData';

// Deprecated backward-compat helpers (use split stores directly)
export {
  getCanvasPhase, getCanvasActiveTree, getContextNodes, getFlowNodes,
  getComponentNodes, getMessages, setCanvasCenterExpand, setContextNodes,
  setFlowNodes, setComponentNodes, markAllPending,
} from './deprecated';

// Re-export types
export type { ClarificationRound } from '@/stores/confirmationTypes';
export type { SSEStatus, MessageType, MessageItem } from './stores/sessionStore';
export type { PanelExpandState, CanvasExpandMode } from './stores/uiStore';
export type { Phase, TreeType } from './types';

// Initialize cross-store subscriptions at module load time.
initCrossStoreSync();
