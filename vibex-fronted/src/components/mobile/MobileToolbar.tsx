/**
 * MobileToolbar.tsx — S92-E4: Mobile-First Preview
 *
 * E4-F3: Simplified mobile toolbar.
 * Provides add/delete/drag controls for mobile editing.
 * Touch gestures: long-press to select → drag to move → swipe to delete.
 */

'use client';

import React, { memo, useState, useCallback, useRef } from 'react';
import styles from './MobileToolbar.module.css';

interface MobileToolbarProps {
  /** Canvas ID */
  canvasId: string;
  /** Whether toolbar is visible (mobile edit mode) */
  isVisible?: boolean;
  /** Called when user wants to add a component */
  onAddComponent?: () => void;
  /** Called when user wants to delete selected component */
  onDeleteComponent?: (nodeId: string) => void;
  /** Currently selected node ID */
  selectedNodeId?: string | null;
  /** Called when selection changes */
  onSelectionChange?: (nodeId: string | null) => void;
  /** Class name for toolbar container */
  className?: string;
}

type ToolbarMode = 'idle' | 'selecting' | 'deleting';

export const MobileToolbar = memo(function MobileToolbar({
  canvasId,
  isVisible = true,
  onAddComponent,
  onDeleteComponent,
  selectedNodeId,
  onSelectionChange,
  className,
}: MobileToolbarProps) {
  const [mode, setMode] = useState<ToolbarMode>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [swipedNodeId, setSwipedNodeId] = useState<string | null>(null);

  // Long press detection
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const handleNodeLongPress = useCallback((nodeId: string) => {
    isLongPress.current = true;
    onSelectionChange?.(nodeId);
    setMode('selecting');
  }, [onSelectionChange]);

  const handleNodeTouchStart = useCallback((nodeId: string) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      handleNodeLongPress(nodeId);
    }, 500);
  }, [handleNodeLongPress]);

  const handleNodeTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // If it was a short tap (not long press), clear selection
    if (!isLongPress.current) {
      // handled by the canvas component
    }
  }, []);

  const handleAdd = useCallback(() => {
    onAddComponent?.();
  }, [onAddComponent]);

  const handleDeleteClick = useCallback(() => {
    if (selectedNodeId) {
      setShowDeleteConfirm(true);
    }
  }, [selectedNodeId]);

  const handleConfirmDelete = useCallback(() => {
    if (selectedNodeId) {
      onDeleteComponent?.(selectedNodeId);
      onSelectionChange?.(null);
    }
    setShowDeleteConfirm(false);
    setMode('idle');
  }, [selectedNodeId, onDeleteComponent, onSelectionChange]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const handleClearSelection = useCallback(() => {
    onSelectionChange?.(null);
    setMode('idle');
  }, [onSelectionChange]);

  if (!isVisible) return null;

  return (
    <>
      <div
        className={`${styles.toolbar} ${mode === 'selecting' ? styles.modeSelecting : ''} ${className ?? ''}`}
        data-testid="mobile-toolbar"
      >
        {/* Mode indicator */}
        {mode === 'selecting' && selectedNodeId && (
          <div className={styles.modeBar}>
            <span className={styles.modeLabel}>已选中组件</span>
            <button
              className={styles.clearBtn}
              onClick={handleClearSelection}
              data-testid="mobile-toolbar-clear-selection"
            >
              取消选择
            </button>
          </div>
        )}

        {/* Main toolbar buttons */}
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={handleAdd}
            aria-label="添加组件"
            data-testid="mobile-toolbar-add"
          >
            <span className={styles.btnIcon}>+</span>
            <span className={styles.btnLabel}>添加</span>
          </button>

          <button
            className={`${styles.actionBtn} ${!selectedNodeId ? styles.disabled : ''}`}
            onClick={handleDeleteClick}
            disabled={!selectedNodeId}
            aria-label="删除组件"
            data-testid="mobile-toolbar-delete"
          >
            <span className={styles.btnIcon}>🗑</span>
            <span className={styles.btnLabel}>删除</span>
          </button>
        </div>

        {/* Hint text */}
        <div className={styles.hint}>
          长按组件以选中 · 拖拽以移动
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div
          className={styles.confirmOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) handleCancelDelete(); }}
          role="dialog"
          aria-modal="true"
          data-testid="mobile-delete-confirm"
        >
          <div className={styles.confirmDialog}>
            <div className={styles.confirmTitle}>确认删除</div>
            <div className={styles.confirmMessage}>
              确定要删除此组件吗？此操作无法撤销。
            </div>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancel}
                onClick={handleCancelDelete}
                data-testid="mobile-delete-cancel"
              >
                取消
              </button>
              <button
                className={styles.confirmDelete}
                onClick={handleConfirmDelete}
                data-testid="mobile-delete-confirm-btn"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
