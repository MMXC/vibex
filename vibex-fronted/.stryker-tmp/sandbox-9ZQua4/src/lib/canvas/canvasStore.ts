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
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
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
useContextStore.subscribe(stryMutAct_9fa48("0") ? () => undefined : (stryCov_9fa48("0"), state => state.activeTree), activeTree => {
  if (stryMutAct_9fa48("1")) {
    {}
  } else {
    stryCov_9fa48("1");
    if (stryMutAct_9fa48("4") ? activeTree === _prevActiveTree : stryMutAct_9fa48("3") ? false : stryMutAct_9fa48("2") ? true : (stryCov_9fa48("2", "3", "4"), activeTree !== _prevActiveTree)) {
      if (stryMutAct_9fa48("5")) {
        {}
      } else {
        stryCov_9fa48("5");
        _prevActiveTree = activeTree;
        if (stryMutAct_9fa48("8") ? activeTree === 'flow' && activeTree === 'component' : stryMutAct_9fa48("7") ? false : stryMutAct_9fa48("6") ? true : (stryCov_9fa48("6", "7", "8"), (stryMutAct_9fa48("10") ? activeTree !== 'flow' : stryMutAct_9fa48("9") ? false : (stryCov_9fa48("9", "10"), activeTree === (stryMutAct_9fa48("11") ? "" : (stryCov_9fa48("11"), 'flow')))) || (stryMutAct_9fa48("13") ? activeTree !== 'component' : stryMutAct_9fa48("12") ? false : (stryCov_9fa48("12", "13"), activeTree === (stryMutAct_9fa48("14") ? "" : (stryCov_9fa48("14"), 'component')))))) {
          if (stryMutAct_9fa48("15")) {
            {}
          } else {
            stryCov_9fa48("15");
            useUIStore.getState().setCenterExpand(stryMutAct_9fa48("16") ? "" : (stryCov_9fa48("16"), 'expand-left'));
          }
        } else if (stryMutAct_9fa48("19") ? activeTree !== null : stryMutAct_9fa48("18") ? false : stryMutAct_9fa48("17") ? true : (stryCov_9fa48("17", "18", "19"), activeTree === null)) {
          if (stryMutAct_9fa48("20")) {
            {}
          } else {
            stryCov_9fa48("20");
            useUIStore.getState().setCenterExpand(stryMutAct_9fa48("21") ? "" : (stryCov_9fa48("21"), 'default'));
          }
        }
      }
    }
  }
});

// Sync contextStore contextNodes → flowStore (so recomputeActiveTree sees latest)
useContextStore.subscribe(stryMutAct_9fa48("22") ? () => undefined : (stryCov_9fa48("22"), state => state.contextNodes), () => {
  // Trigger recomputeActiveTree whenever context nodes change
  // This is handled by the individual store actions calling recomputeActiveTree directly
});

// Sync flowStore flowNodes → contextStore recomputeActiveTree reads from flowStore
useFlowStore.subscribe(stryMutAct_9fa48("23") ? () => undefined : (stryCov_9fa48("23"), state => state.flowNodes), () => {
  if (stryMutAct_9fa48("24")) {
    {}
  } else {
    stryCov_9fa48("24");
    // Trigger recomputeActiveTree when flow nodes change
    stryMutAct_9fa48("25") ? useContextStore.getState().recomputeActiveTree() : (stryCov_9fa48("25"), useContextStore.getState().recomputeActiveTree?.());
  }
});

// Sync componentStore deleteSelectedNodes → history
// (handled via getHistoryStore in contextStore.deleteSelectedNodes)

// Sync message bridge
import { registerMessageBridge } from './stores/messageBridge';
import { useSessionStore as _sessionStore } from './stores/sessionStore';
registerMessageBridge(_sessionStore.getState().addMessage as (msg: {
  type: string;
  content: string;
  meta?: string;
}) => void);

// =============================================================================
// Helper re-exports for backward compatibility
// These allow components to continue using canvasStore while migrating to split stores
// =============================================================================

/**
 * @deprecated Use useContextStore.getState().phase instead
 */
export function getCanvasPhase(): string {
  if (stryMutAct_9fa48("26")) {
    {}
  } else {
    stryCov_9fa48("26");
    return useContextStore.getState().phase;
  }
}

/**
 * @deprecated Use useContextStore.getState().activeTree instead
 */
export function getCanvasActiveTree(): string | null {
  if (stryMutAct_9fa48("27")) {
    {}
  } else {
    stryCov_9fa48("27");
    return useContextStore.getState().activeTree;
  }
}

/**
 * @deprecated Use useContextStore.getState().contextNodes instead
 */
export function getContextNodes(): BoundedContextNode[] {
  if (stryMutAct_9fa48("28")) {
    {}
  } else {
    stryCov_9fa48("28");
    return useContextStore.getState().contextNodes;
  }
}

/**
 * @deprecated Use useFlowStore.getState().flowNodes instead
 */
export function getFlowNodes(): BusinessFlowNode[] {
  if (stryMutAct_9fa48("29")) {
    {}
  } else {
    stryCov_9fa48("29");
    return useFlowStore.getState().flowNodes;
  }
}

/**
 * @deprecated Use useComponentStore.getState().componentNodes instead
 */
export function getComponentNodes(): ComponentNode[] {
  if (stryMutAct_9fa48("30")) {
    {}
  } else {
    stryCov_9fa48("30");
    return useComponentStore.getState().componentNodes;
  }
}

/**
 * @deprecated Use useSessionStore.getState().messages instead
 */
export function getMessages() {
  if (stryMutAct_9fa48("31")) {
    {}
  } else {
    stryCov_9fa48("31");
    return useSessionStore.getState().messages;
  }
}

/**
 * @deprecated Use useUIStore.getState().setCenterExpand instead
 */
export function setCanvasCenterExpand(state: string) {
  if (stryMutAct_9fa48("32")) {
    {}
  } else {
    stryCov_9fa48("32");
    useUIStore.getState().setCenterExpand(state as any);
  }
}

/**
 * Load example canvas data into all stores.
 * Sets context/flow/component nodes and advances phase to 'context'.
 */
export function loadExampleData(): void {
  if (stryMutAct_9fa48("33")) {
    {}
  } else {
    stryCov_9fa48("33");
    // Dynamic import to avoid circular deps
    const exampleData = require('@/data/example-canvas.json') as {
      contextNodes: BoundedContextNode[];
      flowNodes: BusinessFlowNode[];
      componentNodes: ComponentNode[];
    };
    useContextStore.getState().setContextNodes(exampleData.contextNodes);
    useFlowStore.getState().setFlowNodes(exampleData.flowNodes);
    useComponentStore.getState().setComponentNodes(exampleData.componentNodes);
    useContextStore.getState().setPhase(stryMutAct_9fa48("34") ? "" : (stryCov_9fa48("34"), 'context'));
    useContextStore.getState().setActiveTree(stryMutAct_9fa48("35") ? "" : (stryCov_9fa48("35"), 'flow'));

    // Initialize history for all three trees
    getHistoryStore().initAllHistories(exampleData.contextNodes, exampleData.flowNodes, exampleData.componentNodes);
  }
}

/**
 * Helper exports for backward compatibility.
 * These proxy to the appropriate split store.
 * Components should migrate to importing directly from the split store.
 */

/** @deprecated Import from useContextStore directly */
export function setContextNodes(nodes: BoundedContextNode[]): void {
  if (stryMutAct_9fa48("36")) {
    {}
  } else {
    stryCov_9fa48("36");
    useContextStore.getState().setContextNodes(nodes);
  }
}

/** @deprecated Import from useFlowStore directly */
export function setFlowNodes(nodes: BusinessFlowNode[]): void {
  if (stryMutAct_9fa48("37")) {
    {}
  } else {
    stryCov_9fa48("37");
    useFlowStore.getState().setFlowNodes(nodes);
  }
}

/** @deprecated Import from useComponentStore directly */
export function setComponentNodes(nodes: ComponentNode[]): void {
  if (stryMutAct_9fa48("38")) {
    {}
  } else {
    stryCov_9fa48("38");
    useComponentStore.getState().setComponentNodes(nodes);
  }
}

/**
 * markAllPending — marks all nodes of a given type as pending.
 * @deprecated Use split store actions directly
 */
export function markAllPending<T extends {
  status: string;
  isActive?: boolean;
}>(nodes: T[]): T[] {
  if (stryMutAct_9fa48("39")) {
    {}
  } else {
    stryCov_9fa48("39");
    return nodes.map(stryMutAct_9fa48("40") ? () => undefined : (stryCov_9fa48("40"), n => stryMutAct_9fa48("41") ? {} : (stryCov_9fa48("41"), {
      ...n,
      status: 'pending' as const,
      isActive: stryMutAct_9fa48("42") ? true : (stryCov_9fa48("42"), false)
    })));
  }
}