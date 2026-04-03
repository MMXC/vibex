/**
 * deprecated — backward-compatibility helpers for the old canvasStore API
 *
 * E1: Moved from canvasStore.ts helper block.
 * All functions are marked @deprecated per AGENTS.md §1.1.
 *
 * Epic: canvas-canvasstore-migration / E1-canvasStore清理
 * AGENTS.md: §2.3 deprecated.ts Template
 */

import { useContextStore } from './stores/contextStore';
import { useFlowStore } from './stores/flowStore';
import { useComponentStore } from './stores/componentStore';
import { useUIStore } from './stores/uiStore';
import { useSessionStore } from './stores/sessionStore';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from './types';

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
export function setCanvasCenterExpand(state: string): void {
  useUIStore.getState().setCenterExpand(state as 'default' | 'expand-left' | 'expand-right');
}

/**
 * @deprecated Use useContextStore.getState().setContextNodes instead
 */
export function setContextNodes(nodes: BoundedContextNode[]): void {
  useContextStore.getState().setContextNodes(nodes);
}

/**
 * @deprecated Use useFlowStore.getState().setFlowNodes instead
 */
export function setFlowNodes(nodes: BusinessFlowNode[]): void {
  useFlowStore.getState().setFlowNodes(nodes);
}

/**
 * @deprecated Use useComponentStore.getState().setComponentNodes instead
 */
export function setComponentNodes(nodes: ComponentNode[]): void {
  useComponentStore.getState().setComponentNodes(nodes);
}

/**
 * markAllPending — marks all nodes of a given type as pending.
 * @deprecated Use split store actions directly
 */
export function markAllPending<T extends { status: string; isActive?: boolean }>(nodes: T[]): T[] {
  return nodes.map((n) => ({ ...n, status: 'pending' as const, isActive: false }));
}
