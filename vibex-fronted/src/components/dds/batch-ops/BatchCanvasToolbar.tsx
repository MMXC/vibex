/**
 * BatchCanvasToolbar.tsx — Sprint87 E3: Canvas Node Batch Operations
 *
 * 浮动工具条，当 ReactFlow 画布上选中 2+ 节点时显示。
 * 提供批量删除、复制、移动、取消选中功能。
 *
 * E3 功能：
 * - 选中计数 badge
 * - 批量删除：调用 useReactFlow setNodes 过滤掉选中节点
 * - 批量复制：addNodes 复制选中节点并偏移 (+50, +50)
 * - 批量移动跟随（由 onNodeDrag 事件在父组件处理）
 * - 取消选中
 */

'use client';

import React, { memo, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useBatchCanvasStore } from '@/stores/dds/batchCanvasStore';
import styles from './BatchCanvasToolbar.module.css';

interface BatchCanvasToolbarProps {
  /** Callback when selection is cleared */
  onClearSelection?: () => void;
}

/** 删除图标 */
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

/** 复制图标 */
function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

/** 关闭图标 */
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export const BatchCanvasToolbar = memo(function BatchCanvasToolbar({
  onClearSelection,
}: BatchCanvasToolbarProps) {
  const reactFlow = useReactFlow();
  const { selectedNodeIds, clearSelection, getSelectedCount } = useBatchCanvasStore();
  const count = getSelectedCount();

  // ---- Batch Delete ----
  const handleDelete = useCallback(() => {
    const idsToDelete = new Set(selectedNodeIds);
    const remainingNodes = reactFlow.getNodes().map((node) => {
      if (idsToDelete.has(node.id)) {
        return null;
      }
      return node;
    }).filter((n) => n !== null);
    reactFlow.setNodes(remainingNodes as any[]);
    clearSelection();
    onClearSelection?.();
  }, [selectedNodeIds, reactFlow, clearSelection, onClearSelection]);

  // ---- Batch Duplicate ----
  const handleDuplicate = useCallback(() => {
    const idsToDuplicate = new Set(selectedNodeIds);
    const nodesToAdd = reactFlow.getNodes()
      .filter((node) => idsToDuplicate.has(node.id))
      .map((node) => ({
        ...node,
        id: `${node.id}-copy-${Date.now()}`,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        selected: false,
      }));
    if (nodesToAdd.length > 0) {
      reactFlow.addNodes(nodesToAdd as any[]);
    }
    clearSelection();
    onClearSelection?.();
  }, [selectedNodeIds, reactFlow, clearSelection, onClearSelection]);

  // ---- Cancel / Clear Selection ----
  const handleCancel = useCallback(() => {
    clearSelection();
    onClearSelection?.();
  }, [clearSelection, onClearSelection]);

  // Don't render if < 2 nodes selected
  if (count < 2) return null;

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="批量操作工具条">
      {/* Count badge */}
      <span className={styles.badge}>
        {count} 个节点已选中
      </span>

      <span className={styles.divider} />

      {/* Delete */}
      <button
        className={`${styles.btn} ${styles.btnDanger}`}
        onClick={handleDelete}
        title="批量删除"
        aria-label="批量删除"
      >
        <TrashIcon />
        <span>删除</span>
      </button>

      {/* Duplicate */}
      <button
        className={styles.btn}
        onClick={handleDuplicate}
        title="批量复制"
        aria-label="批量复制"
      >
        <CopyIcon />
        <span>复制</span>
      </button>

      <span className={styles.divider} />

      {/* Cancel */}
      <button
        className={styles.btn}
        onClick={handleCancel}
        title="取消选中"
        aria-label="取消选中"
      >
        <CloseIcon />
      </button>
    </div>
  );
});
