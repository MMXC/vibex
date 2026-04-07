/**
 * useCanvasStore — unified store selectors for CanvasPage
 *
 * Consolidates all Zustand store subscriptions used in CanvasPage.tsx
 * into a single hook to reduce boilerplate and enable easy mocking.
 *
 * Epic: canvas-split-hooks / E2-useCanvasStore
 */

import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useUIStore } from '@/lib/canvas/stores/uiStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';

export interface UseCanvasStoreReturn {
  // === Context store ===
  phase: 'input' | 'context' | 'flow' | 'component' | 'prototype';
  activeTree: 'context' | 'flow' | 'component' | null;
  contextNodes: import('@/lib/canvas/types').BoundedContextNode[];
  selectedNodeIds: { context: string[]; flow: string[] };
  setPhase: (phase: UseCanvasStoreReturn['phase']) => void;
  setActiveTree: (tree: UseCanvasStoreReturn['activeTree']) => void;
  deleteSelectedNodes: (tree: 'context' | 'flow') => void;
  // === Flow store ===
  flowNodes: import('@/lib/canvas/types').BusinessFlowNode[];
  autoGenerateFlows: (contextNodes: import('@/lib/canvas/types').BoundedContextNode[]) => void;
  // === Component store ===
  componentNodes: import('@/lib/canvas/types').ComponentNode[];
  setComponentNodes: (nodes: import('@/lib/canvas/types').ComponentNode[]) => void;
  // === UI store ===
  contextPanelCollapsed: boolean;
  flowPanelCollapsed: boolean;
  componentPanelCollapsed: boolean;
  leftExpand: import('@/lib/canvas/types').PanelExpandState;
  centerExpand: import('@/lib/canvas/types').PanelExpandState;
  rightExpand: import('@/lib/canvas/types').PanelExpandState;
  toggleContextPanel: () => void;
  toggleFlowPanel: () => void;
  toggleComponentPanel: () => void;
  setLeftExpand: (state: import('@/lib/canvas/types').PanelExpandState) => void;
  setCenterExpand: (state: import('@/lib/canvas/types').PanelExpandState) => void;
  setRightExpand: (state: import('@/lib/canvas/types').PanelExpandState) => void;
  // === Session store ===
  flowGenerating: boolean;
  flowGeneratingMessage: string | null;
}

export function useCanvasStore(): UseCanvasStoreReturn {
  return {
    // === Context store ===
    phase: useContextStore((s) => s.phase),
    activeTree: useContextStore((s) => s.activeTree),
    contextNodes: useContextStore((s) => s.contextNodes),
    selectedNodeIds: useContextStore((s) => s.selectedNodeIds),
    setPhase: useContextStore((s) => s.setPhase),
    setActiveTree: useContextStore((s) => s.setActiveTree),
    deleteSelectedNodes: useContextStore((s) => s.deleteSelectedNodes),
    // === Flow store ===
    flowNodes: useFlowStore((s) => s.flowNodes),
    autoGenerateFlows: useFlowStore((s) => s.autoGenerateFlows),
    // === Component store ===
    componentNodes: useComponentStore((s) => s.componentNodes),
    setComponentNodes: useComponentStore((s) => s.setComponentNodes),
    // === UI store ===
    contextPanelCollapsed: useUIStore((s) => s.contextPanelCollapsed),
    flowPanelCollapsed: useUIStore((s) => s.flowPanelCollapsed),
    componentPanelCollapsed: useUIStore((s) => s.componentPanelCollapsed),
    leftExpand: useUIStore((s) => s.leftExpand),
    centerExpand: useUIStore((s) => s.centerExpand),
    rightExpand: useUIStore((s) => s.rightExpand),
    toggleContextPanel: useUIStore((s) => s.toggleContextPanel),
    toggleFlowPanel: useUIStore((s) => s.toggleFlowPanel),
    toggleComponentPanel: useUIStore((s) => s.toggleComponentPanel),
    setLeftExpand: useUIStore((s) => s.setLeftExpand),
    setCenterExpand: useUIStore((s) => s.setCenterExpand),
    setRightExpand: useUIStore((s) => s.setRightExpand),
    // === Session store ===
    flowGenerating: useSessionStore((s) => s.flowGenerating),
    flowGeneratingMessage: useSessionStore((s) => s.flowGeneratingMessage),
  };
}
