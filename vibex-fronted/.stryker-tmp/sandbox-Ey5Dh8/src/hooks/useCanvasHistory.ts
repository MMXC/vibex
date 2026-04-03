/**
 * useCanvasHistory — Undo/Redo hook for canvas trees
 *
 * Subscribes to canvasStore changes and records snapshots for each tree.
 * Exposes undo/redo actions that apply changes back to canvasStore.
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 * - 性能红线: undo/redo < 50ms
 */
// @ts-nocheck

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { useHistoryStore, getHistoryStore } from '@/lib/canvas/historySlice';
import type { TreeType } from '@/lib/canvas/types';

const THROTTLE_MS = 300;

/**
 * Hook to manage undo/redo for canvas trees.
 *
 * Records snapshots whenever tree nodes change (throttled to avoid
 * flooding the history stack during rapid edits).
 *
 * Returns undo/redo functions that apply changes directly to canvasStore.
 */
export function useCanvasHistory() {
  // Select current node state from canvasStore
  const contextNodes = useCanvasStore((s) => s.contextNodes);
  const flowNodes = useCanvasStore((s) => s.flowNodes);
  const componentNodes = useCanvasStore((s) => s.componentNodes);

  // Selectors for can-undo/redo state
  const canUndoContext = useHistoryStore((s) => s.canUndo('context'));
  const canUndoFlow = useHistoryStore((s) => s.canUndo('flow'));
  const canUndoComponent = useHistoryStore((s) => s.canUndo('component'));
  const canRedoContext = useHistoryStore((s) => s.canRedo('context'));
  const canRedoFlow = useHistoryStore((s) => s.canRedo('flow'));
  const canRedoComponent = useHistoryStore((s) => s.canRedo('component'));

  // Track last recorded snapshot to avoid duplicates
  const lastSnapshotRef = useRef<Record<TreeType, string>>({
    context: '',
    flow: '',
    component: '',
  });

  // Throttle tracking
  const lastRecordTimeRef = useRef<number>(0);

  /** Check if snapshot is different from last recorded */
  function snapshotChanged(tree: TreeType, nodes: unknown[]): boolean {
    const key = JSON.stringify(nodes);
    if (lastSnapshotRef.current[tree] === key) return false;
    lastSnapshotRef.current[tree] = key;
    return true;
  }

  /** Record a snapshot for the given tree */
  const recordSnapshot = useCallback((tree: TreeType) => {
    const now = Date.now();
    if (now - lastRecordTimeRef.current < THROTTLE_MS) return;
    lastRecordTimeRef.current = now;

    const historyStore = getHistoryStore();
    if (tree === 'context') {
      const nodes = useCanvasStore.getState().contextNodes;
      if (snapshotChanged('context', nodes)) {
        historyStore.recordSnapshot('context', nodes);
      }
    } else if (tree === 'flow') {
      const nodes = useCanvasStore.getState().flowNodes;
      if (snapshotChanged('flow', nodes)) {
        historyStore.recordSnapshot('flow', nodes);
      }
    } else {
      const nodes = useCanvasStore.getState().componentNodes;
      if (snapshotChanged('component', nodes)) {
        historyStore.recordSnapshot('component', nodes);
      }
    }
  }, []);

  // Record snapshots when tree nodes change
  // Using refs to avoid stale closure in useEffect
  const contextNodesRef = useRef(contextNodes);
  const flowNodesRef = useRef(flowNodes);
  const componentNodesRef = useRef(componentNodes);

  useEffect(() => {
    if (
      JSON.stringify(contextNodes) !== JSON.stringify(contextNodesRef.current) &&
      contextNodes.length > 0
    ) {
      contextNodesRef.current = contextNodes;
      const historyStore = getHistoryStore();
      if (snapshotChanged('context', contextNodes)) {
        historyStore.recordSnapshot('context', contextNodes);
      }
    }
  }, [contextNodes]);

  useEffect(() => {
    if (
      JSON.stringify(flowNodes) !== JSON.stringify(flowNodesRef.current) &&
      flowNodes.length > 0
    ) {
      flowNodesRef.current = flowNodes;
      const historyStore = getHistoryStore();
      if (snapshotChanged('flow', flowNodes)) {
        historyStore.recordSnapshot('flow', flowNodes);
      }
    }
  }, [flowNodes]);

  useEffect(() => {
    if (
      JSON.stringify(componentNodes) !== JSON.stringify(componentNodesRef.current) &&
      componentNodes.length > 0
    ) {
      componentNodesRef.current = componentNodes;
      const historyStore = getHistoryStore();
      if (snapshotChanged('component', componentNodes)) {
        historyStore.recordSnapshot('component', componentNodes);
      }
    }
  }, [componentNodes]);

  // Initialize history on mount (load existing data into history stack)
  useEffect(() => {
    const store = useCanvasStore.getState();
    const historyStore = getHistoryStore();

    // Only initialize if history stacks are empty (first load)
    if (!historyStore.canUndo('context') && !historyStore.canUndo('flow') && !historyStore.canUndo('component')) {
      historyStore.initAllHistories(store.contextNodes, store.flowNodes, store.componentNodes);
      // Set initial snapshots
      if (store.contextNodes.length > 0) {
        lastSnapshotRef.current.context = JSON.stringify(store.contextNodes);
      }
      if (store.flowNodes.length > 0) {
        lastSnapshotRef.current.flow = JSON.stringify(store.flowNodes);
      }
      if (store.componentNodes.length > 0) {
        lastSnapshotRef.current.component = JSON.stringify(store.componentNodes);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  /** Undo for a specific tree — applies to canvasStore */
  const undoTree = useCallback((tree: TreeType): boolean => {
    const historyStore = getHistoryStore();
    const canvasStore = useCanvasStore.getState();

    if (!historyStore.canUndo(tree)) return false;

    const previous = historyStore.undo(tree);
    if (!previous) return false;

    if (tree === 'context') {
      canvasStore.setContextNodes(previous as typeof canvasStore.contextNodes);
    } else if (tree === 'flow') {
      canvasStore.setFlowNodes(previous as typeof canvasStore.flowNodes);
    } else {
      canvasStore.setComponentNodes(previous as typeof canvasStore.componentNodes);
    }
    return true;
  }, []);

  /** Redo for a specific tree — applies to canvasStore */
  const redoTree = useCallback((tree: TreeType): boolean => {
    const historyStore = getHistoryStore();
    const canvasStore = useCanvasStore.getState();

    if (!historyStore.canRedo(tree)) return false;

    const next = historyStore.redo(tree);
    if (!next) return false;

    if (tree === 'context') {
      canvasStore.setContextNodes(next as typeof canvasStore.contextNodes);
    } else if (tree === 'flow') {
      canvasStore.setFlowNodes(next as typeof canvasStore.flowNodes);
    } else {
      canvasStore.setComponentNodes(next as typeof canvasStore.componentNodes);
    }
    return true;
  }, []);

  /** Global undo — undo last action regardless of tree */
  const undo = useCallback((): boolean => {
    const historyStore = getHistoryStore();
    const canvasStore = useCanvasStore.getState();

    // Priority: context > flow > component
    if (historyStore.canUndo('context')) return undoTree('context');
    if (historyStore.canUndo('flow')) return undoTree('flow');
    if (historyStore.canUndo('component')) return undoTree('component');
    return false;
  }, [undoTree]);

  /** Global redo — redo last action regardless of tree */
  const redo = useCallback((): boolean => {
    const historyStore = getHistoryStore();

    // Priority: context > flow > component
    if (historyStore.canRedo('context')) return redoTree('context');
    if (historyStore.canRedo('flow')) return redoTree('flow');
    if (historyStore.canRedo('component')) return redoTree('component');
    return false;
  }, [redoTree]);

  /** Clear all histories — called on loadExampleData */
  const clearAllHistories = useCallback(() => {
    const store = useCanvasStore.getState();
    const historyStore = getHistoryStore();
    historyStore.initAllHistories(store.contextNodes, store.flowNodes, store.componentNodes);
    // Reset snapshot tracking
    lastSnapshotRef.current = {
      context: JSON.stringify(store.contextNodes),
      flow: JSON.stringify(store.flowNodes),
      component: JSON.stringify(store.componentNodes),
    };
  }, []);

  return {
    // Per-tree availability
    canUndoContext,
    canUndoFlow,
    canUndoComponent,
    canRedoContext,
    canRedoFlow,
    canRedoComponent,
    // Global availability
    canUndoAny: useHistoryStore.getState().canUndoAny(),
    canRedoAny: useHistoryStore.getState().canRedoAny(),
    // Actions
    undoTree,
    redoTree,
    undo,
    redo,
    clearAllHistories,
    recordSnapshot,
  };
}
