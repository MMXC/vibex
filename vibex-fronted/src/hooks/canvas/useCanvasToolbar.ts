/**
 * useCanvasToolbar — toolbar actions, expand toggles, conflict resolution
 *
 * Extracted from CanvasPage.tsx:
 *  - toggleLeft, toggleCenter, toggleRight (expand toggles)
 *  - handleConflictKeepLocal, handleConflictUseServer, handleConflictMerge
 *  - handleDeleteSelected
 *  - handleKeyboardUndo, handleKeyboardRedo
 *  - handleMinimapNodeClick
 *  - handleContinueToComponents
 *
 * Part of: vibex-dev-security-20260410 / dev-e5-canvaspage拆分
 */

import { useCallback } from 'react';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { canvasApi } from '@/lib/canvas/api/canvasApi';
import { canvasLogger } from '@/lib/canvas/canvasLogger';
import { getHistoryStore } from '@/lib/canvas/historySlice';
import { isValidContextNodes, isValidFlowNodes, isValidComponentNodes } from '@/lib/canvas/type-guards';
import type {
  BoundedContextNode,
  BusinessFlowNode,
  ComponentNode,
  TreeType,
} from '@/lib/canvas/types';
import { useToast } from '@/components/ui/Toast';

/** Conflict data shape from useAutoSave */
export type ConflictData = NonNullable<ReturnType<typeof useToast> extends never ? never : {
  serverSnapshot: {
    snapshotId: string
    version: number
    createdAt: string
    data: { contexts?: unknown[]; flows?: unknown[]; components?: unknown[]; [key: string]: unknown }
  }
} | null>

export interface UseCanvasToolbarOptions {
  // Panel expand state
  leftExpand: 'default' | 'expand-left' | 'expand-right';
  centerExpand: 'default' | 'expand-left' | 'expand-right';
  rightExpand: 'default' | 'expand-left' | 'expand-right';
  setLeftExpand: (v: 'default' | 'expand-left' | 'expand-right') => void;
  setCenterExpand: (v: 'default' | 'expand-left' | 'expand-right') => void;
  setRightExpand: (v: 'default' | 'expand-left' | 'expand-right') => void;
  // Tree data
  contextNodes: BoundedContextNode[];
  flowNodes: BusinessFlowNode[];
  componentNodes: ComponentNode[];
  activeTree: TreeType | null;
  selectedNodeIds: { context: string[]; flow: string[] };
  // Actions
  setComponentNodes: (nodes: ComponentNode[]) => void;
  setPhase: (phase: 'input' | 'context' | 'flow' | 'component' | 'prototype') => void;
  deleteSelectedNodes: (tree: 'context' | 'flow') => void;
  autoGenerateFlows: (contexts: BoundedContextNode[]) => void;
  // Conflict
  conflictData: {
    serverSnapshot: {
      snapshotId: string
      version: number
      createdAt: string
      data: { contexts?: unknown[]; flows?: unknown[]; components?: unknown[]; [key: string]: unknown }
    }
  } | null;
  clearConflict: () => void;
  toast: ReturnType<typeof useToast>;
  // Session
  projectId: string | null;
  // AI
  quickGenerate: () => Promise<void>;
  // Search events
  searchEvents: {
    onSearchSelect: (item: { id: string; treeType: TreeType }) => void;
  };
}

export interface UseCanvasToolbarReturn {
  // Expand toggles
  toggleLeft: () => void;
  toggleCenter: () => void;
  toggleRight: () => void;
  // Conflict handlers
  handleConflictKeepLocal: () => void;
  handleConflictUseServer: () => void;
  handleConflictMerge: () => void;
  // Delete
  handleDeleteSelected: () => void;
  // Keyboard
  handleKeyboardUndo: () => boolean;
  handleKeyboardRedo: () => boolean;
  // Minimap
  handleMinimapNodeClick: (nodeId: string) => void;
  // Continue to components
  handleContinueToComponents: () => Promise<void>;
}

export function useCanvasToolbar(options: UseCanvasToolbarOptions): UseCanvasToolbarReturn {
  const {
    leftExpand, centerExpand, rightExpand,
    setLeftExpand, setCenterExpand, setRightExpand,
    contextNodes, flowNodes, componentNodes,
    activeTree, selectedNodeIds,
    setComponentNodes, setPhase, deleteSelectedNodes, autoGenerateFlows,
    conflictData, clearConflict, toast,
    projectId, quickGenerate, searchEvents,
  } = options;

  // Expand toggles
  const toggleLeft = useCallback(() => {
    const next = leftExpand === 'default' ? 'expand-right' : 'default';
    setLeftExpand(next as typeof leftExpand);
  }, [leftExpand, setLeftExpand]);

  const toggleCenter = useCallback(() => {
    const next = centerExpand === 'default' ? 'expand-left' : 'default';
    setCenterExpand(next as typeof centerExpand);
  }, [centerExpand, setCenterExpand]);

  const toggleRight = useCallback(() => {
    const next = rightExpand === 'default' ? 'expand-left' : 'default';
    setRightExpand(next as typeof rightExpand);
  }, [rightExpand, setRightExpand]);

  // Conflict resolution
  const handleConflictKeepLocal = useCallback(() => {
    if (!conflictData) return;
    clearConflict();
    toast.showToast('已保留本地数据，请继续编辑后自动保存', 'info');
  }, [conflictData, clearConflict, toast]);

  const handleConflictUseServer = useCallback(() => {
    if (!conflictData) return;
    const serverData = conflictData.serverSnapshot.data;
    if (serverData.contexts) {
      useContextStore.getState().setContextNodes(isValidContextNodes(serverData.contexts) ? serverData.contexts : []);
    }
    if (serverData.flows) {
      useFlowStore.getState().setFlowNodes(isValidFlowNodes(serverData.flows) ? serverData.flows : []);
    }
    if (serverData.components) {
      setComponentNodes(isValidComponentNodes(serverData.components) ? serverData.components : []);
    }
    clearConflict();
    toast.showToast('已使用服务端数据，当前画布已更新', 'success');
  }, [conflictData, clearConflict, toast, setComponentNodes]);

  const handleConflictMerge = useCallback(() => {
    if (!conflictData) return;
    const serverData = conflictData.serverSnapshot.data;
    const localContexts = useContextStore.getState().contextNodes;
    const localFlows = useFlowStore.getState().flowNodes;
    const localComponents = useComponentStore.getState().componentNodes;

    const serverContexts = (serverData.contexts ?? []) as typeof localContexts;
    const serverFlows = (serverData.flows ?? []) as typeof localFlows;
    const serverComponents = (serverData.components ?? []) as typeof localComponents;

    const localCtxIds = new Set(localContexts.map((n) => n.nodeId));
    const localFlowIds = new Set(localFlows.map((n) => n.nodeId));
    const localCompIds = new Set(localComponents.map((n) => n.nodeId));

    const mergedContexts = [...localContexts, ...serverContexts.filter((n) => !localCtxIds.has(n.nodeId))];
    const mergedFlows = [...localFlows, ...serverFlows.filter((n) => !localFlowIds.has(n.nodeId))];
    const mergedComponents = [...localComponents, ...serverComponents.filter((n) => !localCompIds.has(n.nodeId))];

    useContextStore.getState().setContextNodes(mergedContexts);
    useFlowStore.getState().setFlowNodes(mergedFlows);
    setComponentNodes(mergedComponents);
    clearConflict();
    toast.showToast(
      `已合并：+${serverContexts.length - localContexts.length} 上下文、+${serverFlows.length - localFlows.length} 流程、+${serverComponents.length - localComponents.length} 组件`,
      'success'
    );
  }, [conflictData, clearConflict, toast, setComponentNodes]);

  // Delete selected
  const handleDeleteSelected = useCallback(() => {
    const tree: 'context' | 'flow' = (activeTree ?? 'context') as 'context' | 'flow';
    deleteSelectedNodes(tree);
  }, [activeTree, deleteSelectedNodes]);

  // Keyboard undo/redo
  const handleKeyboardUndo = useCallback((): boolean => {
    const historyStore = getHistoryStore();
    if (historyStore.canUndo('context')) {
      const prev = historyStore.undo('context');
      if (prev) { useContextStore.getState().setContextNodes(isValidContextNodes(prev) ? prev : []); return true; }
    }
    if (historyStore.canUndo('flow')) {
      const prev = historyStore.undo('flow');
      if (prev) { useFlowStore.getState().setFlowNodes(isValidFlowNodes(prev) ? prev : []); return true; }
    }
    if (historyStore.canUndo('component')) {
      const prev = historyStore.undo('component');
      if (prev) { setComponentNodes(isValidComponentNodes(prev) ? prev : []); return true; }
    }
    return false;
  }, [setComponentNodes]);

  const handleKeyboardRedo = useCallback((): boolean => {
    const historyStore = getHistoryStore();
    if (historyStore.canRedo('context')) {
      const next = historyStore.redo('context');
      if (next) { useContextStore.getState().setContextNodes(isValidContextNodes(next) ? next : []); return true; }
    }
    if (historyStore.canRedo('flow')) {
      const next = historyStore.redo('flow');
      if (next) { useFlowStore.getState().setFlowNodes(isValidFlowNodes(next) ? next : []); return true; }
    }
    if (historyStore.canRedo('component')) {
      const next = historyStore.redo('component');
      if (next) { setComponentNodes(isValidComponentNodes(next) ? next : []); return true; }
    }
    return false;
  }, [setComponentNodes]);

  // Minimap node click
  const handleMinimapNodeClick = useCallback(
    (nodeId: string) => {
      const ctxNode = contextNodes.find((n) => n.nodeId === nodeId);
      if (ctxNode) { searchEvents.onSearchSelect({ id: nodeId, treeType: 'context' }); return; }
      const flowNode = flowNodes.find((n) => n.nodeId === nodeId);
      if (flowNode) { searchEvents.onSearchSelect({ id: nodeId, treeType: 'flow' }); return; }
      const compNode = componentNodes.find((n) => n.nodeId === nodeId);
      if (compNode) { searchEvents.onSearchSelect({ id: nodeId, treeType: 'component' }); return; }
    },
    [contextNodes, flowNodes, componentNodes, searchEvents]
  );

  // Continue to components
  const handleContinueToComponents = useCallback(async () => {
    if (flowNodes.length === 0) return;

    const sessionId = projectId ?? `session-${Date.now()}`;

    const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
    const selectedContextSet = new Set(selectedNodeIds.context);
    const contextsToSend = selectedContextSet.size > 0
      ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
      : activeContexts;
    const mappedContexts = contextsToSend.map((ctx) => ({
      id: ctx.nodeId, name: ctx.name, description: ctx.description ?? '', type: ctx.type,
    }));

    const activeFlows = flowNodes.filter((f) => f.isActive !== false);
    const selectedFlowSet = new Set(selectedNodeIds.flow);
    const flowsToSend = selectedFlowSet.size > 0
      ? activeFlows.filter((f) => selectedFlowSet.has(f.nodeId))
      : activeFlows;
    const mappedFlows = flowsToSend.map((f) => ({
      id: f.nodeId, name: f.name, contextId: f.contextId,
      steps: f.steps.map((step) => ({ name: step.name, actor: step.actor })),
    }));

    try {
      const result = await canvasApi.generateComponents({
        contexts: mappedContexts,
        flows: mappedFlows,
        sessionId,
      });

      if (result.success && result.components && result.components.length > 0) {
        const newNodes: ComponentNode[] = result.components.map((comp) => ({
          flowId: comp.flowId || '',
          name: comp.name,
          type: comp.type as 'page' | 'list' | 'form' | 'detail' | 'modal',
          props: {},
          api: comp.api ?? { method: 'GET' as const, path: '/api/' + comp.name.toLowerCase().replace(/\s+/g, '-'), params: [] },
          previewUrl: undefined,
          nodeId: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          confirmed: false,
          status: 'pending' as const,
          children: [],
        }));

        setComponentNodes(newNodes);
        setPhase('component');
      }
    } catch (err) {
      canvasLogger.CanvasPage.error('handleContinueToComponents error:', err);
    }
  }, [contextNodes, flowNodes, selectedNodeIds, projectId, setComponentNodes, setPhase]);

  return {
    toggleLeft,
    toggleCenter,
    toggleRight,
    handleConflictKeepLocal,
    handleConflictUseServer,
    handleConflictMerge,
    handleDeleteSelected,
    handleKeyboardUndo,
    handleKeyboardRedo,
    handleMinimapNodeClick,
    handleContinueToComponents,
  };
}
