/**
 * CanvasToolbar — 画布工具栏（Undo/Redo 按钮）
 *
 * Epic1 F1.3 实现: 工具栏按钮 + history slice 联动
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 */
// @ts-nocheck

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
 * E2-F14: Zoom controls — Zoom In / Zoom Out / Fit View
 */
interface ZoomControlsProps {
  /** Current zoom level (e.g. 1 = 100%) */
  zoomLevel: number;
  /** Callback when Zoom In is triggered */
  onZoomIn: () => void;
  /** Callback when Zoom Out is triggered */
  onZoomOut: () => void;
  /** Callback when Fit View / Reset is triggered */
  onZoomReset: () => void;
}

export function ZoomControls({ zoomLevel, onZoomIn, onZoomOut, onZoomReset }: ZoomControlsProps) {
  const zoomPercent = Math.round(zoomLevel * 100);

  return (
    <div className={styles.zoomControls} role="group" aria-label="缩放控制">
      <button
        type="button"
        className={styles.zoomBtn}
        onClick={onZoomOut}
        aria-label="缩小"
        title="缩小 (Ctrl+-)"
        data-testid="zoom-out-btn"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <button
        type="button"
        className={styles.zoomBtn}
        onClick={onZoomReset}
        aria-label={`重置缩放至 ${zoomPercent}%`}
        title="适应屏幕 (Ctrl+0)"
        data-testid="zoom-reset-btn"
      >
        <span className={styles.zoomLabel} aria-live="polite">
          {zoomPercent}%
        </span>
      </button>

      <button
        type="button"
        className={styles.zoomBtn}
        onClick={onZoomIn}
        aria-label="放大"
        title="放大 (Ctrl++)"
        data-testid="zoom-in-btn"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
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
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: {
  onUndo: () => void;
  onRedo: () => void;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
}) {
  return (
    <div className={styles.canvasToolbar} role="toolbar" aria-label="画布工具栏">
      <UndoRedoButtons onUndo={onUndo} onRedo={onRedo} />
      {zoomLevel !== undefined && onZoomIn && onZoomOut && onZoomReset && (
        <ZoomControls
          zoomLevel={zoomLevel}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
        />
      )}
    </div>
  );
}
