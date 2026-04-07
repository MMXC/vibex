/**
 * loadExampleData — loads example canvas data into all split stores
 *
 * E1: Extracted from canvasStore.ts loadExampleData function.
 * Uses .getState() instead of hooks, per AGENTS.md §1.1.
 *
 * Epic: canvas-canvasstore-migration / E1-canvasStore清理
 * AGENTS.md: §2.1 loadExampleData Template
 */

import { useContextStore } from './stores/contextStore';
import { useFlowStore } from './stores/flowStore';
import { useComponentStore } from './stores/componentStore';
import { getHistoryStore } from './historySlice';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from './types';

/**
 * Load example canvas data into all stores.
 * Sets context/flow/component nodes and advances phase to 'context'.
 */
export function loadExampleData(): void {
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

  getHistoryStore().initAllHistories(
    exampleData.contextNodes,
    exampleData.flowNodes,
    exampleData.componentNodes
  );
}
