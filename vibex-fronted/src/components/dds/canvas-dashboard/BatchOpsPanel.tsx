'use client';

import React from 'react';
import { useCanvasListStore } from '@/stores/canvasListStore';
import styles from './BatchOpsPanel.module.css';

interface BatchOpsPanelProps {
  onDelete: () => void;
  onRename: () => void;
}

export function BatchOpsPanel({ onDelete, onRename }: BatchOpsPanelProps) {
  const selectedCanvasIds = useCanvasListStore((s) => s.selectedCanvasIds);
  const clearSelection = useCanvasListStore((s) => s.clearSelection);
  const count = selectedCanvasIds.size;

  if (count === 0) return null;

  return (
    <div className={styles.batchOpsPanel} role="toolbar" aria-label="批量操作工具栏">
      <span className={styles.selectedCount}>
        已选 <strong>{count}</strong> 个画布
      </span>

      <button
        type="button"
        className={`${styles.batchBtn} ${styles.renameBtn}`}
        onClick={onRename}
        aria-label={`重命名 ${count} 个画布`}
        data-testid="batch-rename-btn"
      >
        ✏️ 重命名
      </button>

      <button
        type="button"
        className={`${styles.batchBtn} ${styles.deleteBtn}`}
        onClick={onDelete}
        aria-label={`删除 ${count} 个画布`}
        data-testid="batch-delete-btn"
      >
        🗑️ 删除
      </button>

      <button
        type="button"
        className={styles.clearBtn}
        onClick={clearSelection}
        aria-label="取消选择"
        data-testid="batch-clear-btn"
      >
        ✕ 取消
      </button>
    </div>
  );
}
