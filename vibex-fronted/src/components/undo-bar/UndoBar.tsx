'use client';

/**
 * UndoBar — Floating undo/redo toolbar for canvas
 *
 * E3-T3: Provides visible undo/redo buttons with step counts.
 * Uses the three-tree history stack from @/lib/canvas/historySlice.
 * Mirrors the keyboard shortcut logic from CanvasPage for consistency.
 *
 * 遵守约束:
 * - React.memo for performance
 * - 无 any 类型
 * - 无 console.log
 */

import React, { memo, useCallback } from 'react';
import { useHistoryStore } from '@/lib/canvas/historySlice';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';
import styles from './UndoBar.module.css';

export const UndoBar = memo(function UndoBar() {
  // === History state selectors ===
  const canUndoContext = useHistoryStore((s) => s.canUndo('context'));
  const canUndoFlow = useHistoryStore((s) => s.canUndo('flow'));
  const canUndoComponent = useHistoryStore((s) => s.canUndo('component'));
  const canRedoContext = useHistoryStore((s) => s.canRedo('context'));
  const canRedoFlow = useHistoryStore((s) => s.canRedo('flow'));
  const canRedoComponent = useHistoryStore((s) => s.canRedo('component'));

  // History counts
  const undoCount =
    useHistoryStore((s) => s.contextHistory.past.length) +
    useHistoryStore((s) => s.flowHistory.past.length) +
    useHistoryStore((s) => s.componentHistory.past.length);

  const redoCount =
    useHistoryStore((s) => s.contextHistory.future.length) +
    useHistoryStore((s) => s.flowHistory.future.length) +
    useHistoryStore((s) => s.componentHistory.future.length);

  const canUndo = canUndoContext || canUndoFlow || canUndoComponent;
  const canRedo = canRedoContext || canRedoFlow || canRedoComponent;

  // === Action: Undo ===
  const handleUndo = useCallback(() => {
    const historyStore = useHistoryStore.getState();

    if (historyStore.canUndo('context')) {
      const prev = historyStore.undo('context');
      if (prev) {
        useContextStore.getState().setContextNodes(prev as BoundedContextNode[]);
        return;
      }
    }
    if (historyStore.canUndo('flow')) {
      const prev = historyStore.undo('flow');
      if (prev) {
        useFlowStore.getState().setFlowNodes(prev as BusinessFlowNode[]);
        return;
      }
    }
    if (historyStore.canUndo('component')) {
      const prev = historyStore.undo('component');
      if (prev) {
        useComponentStore.getState().setComponentNodes(prev as ComponentNode[]);
      }
    }
  }, []);

  // === Action: Redo ===
  const handleRedo = useCallback(() => {
    const historyStore = useHistoryStore.getState();

    if (historyStore.canRedo('context')) {
      const next = historyStore.redo('context');
      if (next) {
        useContextStore.getState().setContextNodes(next as BoundedContextNode[]);
        return;
      }
    }
    if (historyStore.canRedo('flow')) {
      const next = historyStore.redo('flow');
      if (next) {
        useFlowStore.getState().setFlowNodes(next as BusinessFlowNode[]);
        return;
      }
    }
    if (historyStore.canRedo('component')) {
      const next = historyStore.redo('component');
      if (next) {
        useComponentStore.getState().setComponentNodes(next as ComponentNode[]);
      }
    }
  }, []);

  return (
    <div
      className={styles.undoBar}
      data-testid="undo-bar"
      role="toolbar"
      aria-label="撤销/重做"
    >
      <button
        type="button"
        className={styles.undoBtn}
        onClick={handleUndo}
        disabled={!canUndo}
        title={`撤销${undoCount > 0 ? ` (${undoCount} 步)` : ''}`}
        aria-label={`撤销${undoCount > 0 ? ` (${undoCount} 步可用)` : ''}`}
      >
        ↩
        <span>撤销</span>
        {undoCount > 0 && (
          <span className={styles.count}>({undoCount})</span>
        )}
      </button>

      <div className={styles.divider} aria-hidden="true" />

      <button
        type="button"
        className={styles.redoBtn}
        onClick={handleRedo}
        disabled={!canRedo}
        title={`重做${redoCount > 0 ? ` (${redoCount} 步)` : ''}`}
        aria-label={`重做${redoCount > 0 ? ` (${redoCount} 步可用)` : ''}`}
      >
        <span>重做</span>
        {redoCount > 0 && (
          <span className={styles.count}>({redoCount})</span>
        )}
        ↪
      </button>
    </div>
  );
});

export default UndoBar;
