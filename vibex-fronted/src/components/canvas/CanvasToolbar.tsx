/**
 * CanvasToolbar — 画布工具栏（Undo/Redo 按钮）
 *
 * Epic1 F1.3 实现: 工具栏按钮 + history slice 联动
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 */
'use client';

import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { useHistoryStore } from '@/lib/canvas/historySlice';
import styles from './canvas.module.css';

interface UndoRedoButtonsProps {
  /** Callback when undo is triggered */
  onUndo: () => void;
  /** Callback when redo is triggered */
  onRedo: () => void;
}

export function UndoRedoButtons({ onUndo, onRedo }: UndoRedoButtonsProps) {
  // Get can-undo/redo from history store
  const canUndoContext = useHistoryStore((s) => s.canUndo('context'));
  const canUndoFlow = useHistoryStore((s) => s.canUndo('flow'));
  const canUndoComponent = useHistoryStore((s) => s.canUndo('component'));
  const canRedoContext = useHistoryStore((s) => s.canRedo('context'));
  const canRedoFlow = useHistoryStore((s) => s.canRedo('flow'));
  const canRedoComponent = useHistoryStore((s) => s.canRedo('component'));

  // Global availability: any tree can undo/redo
  const canUndo = canUndoContext || canUndoFlow || canUndoComponent;
  const canRedo = canRedoContext || canRedoFlow || canRedoComponent;

  return (
    <div className={styles.undoRedoGroup} role="group" aria-label="撤销/重做">
      <button
        type="button"
        className={styles.toolbarButton}
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="撤销 (Ctrl+Z)"
        title="撤销 (Ctrl+Z)"
        data-testid="undo-btn"
      >
        <Undo2 size={16} aria-hidden="true" />
        <span className={styles.toolbarButtonLabel}>撤销</span>
      </button>

      <button
        type="button"
        className={styles.toolbarButton}
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="重做 (Ctrl+Shift+Z)"
        title="重做 (Ctrl+Shift+Z)"
        data-testid="redo-btn"
      >
        <Redo2 size={16} aria-hidden="true" />
        <span className={styles.toolbarButtonLabel}>重做</span>
      </button>
    </div>
  );
}

/**
 * Full canvas toolbar with Undo/Redo and future tools
 */
export function CanvasToolbar({
  onUndo,
  onRedo,
}: {
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div className={styles.canvasToolbar} role="toolbar" aria-label="画布工具栏">
      <UndoRedoButtons onUndo={onUndo} onRedo={onRedo} />
    </div>
  );
}
