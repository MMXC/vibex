/**
 * VibeX Canvas Store — Re-export Layer
 * 
 * E4 migration: This file has been reduced from 1451 lines to a re-export layer.
 * All state and logic have been migrated to split stores:
 *   - contextStore: contextNodes, phase, activeTree, boundedGroups, boundedEdges, multi-select
 *   - flowStore: flowNodes, steps, autoGenerateFlows
 *   - componentStore: componentNodes, generateComponentFromFlow
 *   - uiStore: panels, expand, drag, drawers
 *   - sessionStore: SSE, AI thinking, messages, queue
 * 
 * Backward compatibility: useCanvasStore is an alias for useContextStore.
 * Components should migrate to importing from the appropriate split store.
 */
// @ts-nocheck

export type { ClarificationRound } from '@/stores/confirmationTypes';

// Re-export all split stores
export { useContextStore } from './stores/contextStore';
export { useUIStore } from './stores/uiStore';
export { useFlowStore } from './stores/flowStore';
export { useComponentStore } from './stores/componentStore';
export { useSessionStore } from './stores/sessionStore';

// Backward compatibility alias — useCanvasStore = useContextStore
// Note: For full compatibility, components should import directly from split stores
import { useContextStore } from './stores/contextStore';
export { useContextStore as useCanvasStore };

// Re-export types from split stores for consumers that import types from canvasStore
export type { SSEStatus, MessageType, MessageItem } from './stores/sessionStore';
export type { PanelExpandState, CanvasExpandMode } from './stores/uiStore';
export type { Phase, TreeType } from './types';

// =============================================================================
// Cross-store subscriptions (run once at module load, after all stores exist)
// These keep split stores in sync with canvasStore state.
// =============================================================================
import { useFlowStore } from './stores/flowStore';
import { useComponentStore } from './stores/componentStore';
import { useUIStore } from './stores/uiStore';
import { useSessionStore } from './stores/sessionStore';
import { getHistoryStore } from './historySlice';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from './types';

// Sync contextStore contextNodes → flowStore autoGenerateFlows reads from it
// (handled via dynamic require in flowStore.autoGenerateFlows)

// Sync flowStore flowNodes → contextStore.recomputeActiveTree reads from it
// (handled via dynamic require in contextStore.recomputeActiveTree)

// Sync componentStore generation → contextStore phase changes
// (handled via useContextStore.getState().setPhase in componentStore.generateComponentFromFlow)

// Sync uiStore centerExpand when activeTree changes
let _prevActiveTree: string | null = null;
useContextStore.subscribe(
  (state) => state.activeTree,
  (activeTree) => {
    if (activeTree !== _prevActiveTree) {
      _prevActiveTree = activeTree;
      if (activeTree === 'flow' || activeTree === 'component') {
        useUIStore.getState().setCenterExpand('expand-left');
      } else if (activeTree === null) {
        useUIStore.getState().setCenterExpand('default');
      }
    }
  }
);

// Sync contextStore contextNodes → flowStore (so recomputeActiveTree sees latest)
useContextStore.subscribe(
  (state) => state.contextNodes,
  () => {
    // Trigger recomputeActiveTree whenever context nodes change
    // This is handled by the individual store actions calling recomputeActiveTree directly
  }
);

// Sync flowStore flowNodes → contextStore recomputeActiveTree reads from flowStore
useFlowStore.subscribe(
  (state) => state.flowNodes,
  () => {
    // Trigger recomputeActiveTree when flow nodes change
    useContextStore.getState().recomputeActiveTree?.();
  }
);

// Sync componentStore deleteSelectedNodes → history
// (handled via getHistoryStore in contextStore.deleteSelectedNodes)

// Sync message bridge
import { registerMessageBridge } from './stores/messageBridge';
import { useSessionStore as _sessionStore } from './stores/sessionStore';
registerMessageBridge(
  _sessionStore.getState().addMessage as (msg: { type: string; content: string; meta?: string }) => void
);

// =============================================================================
// Helper re-exports for backward compatibility
// These allow components to continue using canvasStore while migrating to split stores
// =============================================================================

/**
 * @deprecated Use useContextStore.getState().phase instead
 */
export function getCanvasPhase(): string {
  return useContextStore.getState().phase;
}

/**
 * @deprecated Use useContextStore.getState().activeTree instead
 */
export function getCanvasActiveTree(): string | null {
  return useContextStore.getState().activeTree;
}

/**
 * @deprecated Use useContextStore.getState().contextNodes instead
 */
export function getContextNodes(): BoundedContextNode[] {
  return useContextStore.getState().contextNodes;
}

/**
 * @deprecated Use useFlowStore.getState().flowNodes instead
 */
export function getFlowNodes(): BusinessFlowNode[] {
  return useFlowStore.getState().flowNodes;
}

/**
 * @deprecated Use useComponentStore.getState().componentNodes instead
 */
export function getComponentNodes(): ComponentNode[] {
  return useComponentStore.getState().componentNodes;
}

/**
 * @deprecated Use useSessionStore.getState().messages instead
 */
export function getMessages() {
  return useSessionStore.getState().messages;
}

/**
 * @deprecated Use useUIStore.getState().setCenterExpand instead
 */
export function setCanvasCenterExpand(state: string) {
  useUIStore.getState().setCenterExpand(state as any);
}

/**
 * Load example canvas data into all stores.
 * Sets context/flow/component nodes and advances phase to 'context'.
 */
export function loadExampleData(): void {
  // Dynamic import to avoid circular deps
  const exampleData = require('@/data/example-canvas.json') as {
    contextNodes: BoundedContextNode[];
    flowNodes: BusinessFlowNode[];
    componentNodes: ComponentNode[];
  };

  useContextStore.getState().setContextNodes(exampleData.contextNodes);
  useFlowStore.getState().setFlowNodes(exampleData.flowNodes);
  useComponentStore.getState().setComponentNodes(exampleData.componentNodes);
  useContextStore.getState().setPhase('context');
  useContextStore.getState().setActiveTree('flow');

  // Initialize history for all three trees
  getHistoryStore().initAllHistories(
    exampleData.contextNodes,
    exampleData.flowNodes,
    exampleData.componentNodes
  );
}

/**
 * Helper exports for backward compatibility.
 * These proxy to the appropriate split store.
 * Components should migrate to importing directly from the split store.
 */

/** @deprecated Import from useContextStore directly */
export function setContextNodes(nodes: BoundedContextNode[]): void {
  useContextStore.getState().setContextNodes(nodes);
}

/** @deprecated Import from useFlowStore directly */
export function setFlowNodes(nodes: BusinessFlowNode[]): void {
  useFlowStore.getState().setFlowNodes(nodes);
}

/** @deprecated Import from useComponentStore directly */
export function setComponentNodes(nodes: ComponentNode[]): void {
  useComponentStore.getState().setComponentNodes(nodes);
}

/**
 * markAllPending — marks all nodes of a given type as pending.
 * @deprecated Use split store actions directly
 */
export function markAllPending<T extends { status: string; isActive?: boolean }>(nodes: T[]): T[] {
  return nodes.map(n => ({ ...n, status: 'pending' as const, isActive: false }));
}
