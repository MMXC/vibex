'use client';

import React from 'react';
import { useCanvasListStore } from '@/stores/canvasListStore';
import styles from './BatchDeleteConfirmDialog.module.css';

interface BatchDeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BatchDeleteConfirmDialog({ isOpen, onClose }: BatchDeleteConfirmDialogProps) {
  const selectedCanvasIds = useCanvasListStore((s) => s.selectedCanvasIds);
  const canvases = useCanvasListStore((s) => s.canvases);
  const batchDelete = useCanvasListStore((s) => s.batchDelete);

  if (!isOpen) return null;

  const selectedIds = Array.from(selectedCanvasIds);
  const selectedCanvases = canvases.filter((c) => selectedIds.includes(c.id));

  const handleConfirm = async () => {
    await batchDelete(selectedIds);
    onClose();
  };

  return (
    <div
      className={styles.dialogOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-delete-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.dialog}>
        <h2 id="batch-delete-title" className={styles.dialogTitle}>
          确认删除 {selectedIds.length} 个画布
        </h2>

        <p className={styles.dialogBody}>
          以下画布将被永久删除，此操作不可撤销：
        </p>

        <ul className={styles.canvasList} aria-label="即将删除的画布列表">
          {selectedCanvases.map((canvas) => (
            <li key={canvas.id} className={styles.canvasListItem}>
              📄 {canvas.name}
            </li>
          ))}
        </ul>

        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.dialogCancel}
            onClick={onClose}
            data-testid="batch-delete-cancel"
          >
            取消
          </button>
          <button
            type="button"
            className={styles.dialogConfirm}
            onClick={handleConfirm}
            data-testid="batch-delete-confirm"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}
