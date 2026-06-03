'use client';

/**
 * BatchOpsToolbar.tsx — Sprint60 E2: Batch Operations Floating Toolbar
 *
 * 显示在 CanvasListPanel 顶部，当画布被多选时出现。
 * 提供「批量删除」和「批量重命名」两个操作入口。
 */

import { useCallback } from 'react';
import { useCanvasListStore } from '@/stores/canvasListStore';
import { useBatchOpsStore } from '@/stores/dds/batchOpsStore';
import styles from './BatchOpsToolbar.module.css';

interface BatchOpsToolbarProps {
  /** Number of selected canvases — parent passes this to avoid circular store deps */
  selectedCount: number;
}

export function BatchOpsToolbar({ selectedCount }: BatchOpsToolbarProps) {
  const { clearSelection } = useCanvasListStore();
  const {
    isDeleteDialogOpen,
    isRenameDialogOpen,
    renameMode,
    renamePrefix,
    renameSuffix,
    isOperating,
    openDeleteDialog,
    closeDeleteDialog,
    openRenameDialog,
    closeRenameDialog,
    setRenameMode,
    setRenamePrefix,
    setRenameSuffix,
    setIsOperating,
  } = useBatchOpsStore();

  const handleBatchDelete = useCallback(async () => {
    const { selectedCanvasIds, batchDeleteCanvas } = useCanvasListStore.getState();
    if (selectedCanvasIds.size === 0) return;
    setIsOperating(true);
    try {
      await batchDeleteCanvas();
      clearSelection();
    } finally {
      setIsOperating(false);
      closeDeleteDialog();
    }
  }, [clearSelection, closeDeleteDialog, setIsOperating]);

  const handleBatchRename = useCallback(async () => {
    const { selectedCanvasIds, batchRenameCanvas } = useCanvasListStore.getState();
    if (selectedCanvasIds.size === 0) return;
    setIsOperating(true);
    try {
      await batchRenameCanvas(renameMode, renamePrefix, renameSuffix);
      clearSelection();
    } finally {
      setIsOperating(false);
      closeRenameDialog();
    }
  }, [renameMode, renamePrefix, renameSuffix, clearSelection, closeRenameDialog, setIsOperating]);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className={styles['batch-ops-toolbar']} role="toolbar" aria-label="批量操作">
        <span className={styles['batch-ops-toolbar__count']}>
          已选中 <strong>{selectedCount}</strong> 个画布
        </span>

        <button
          className={styles['batch-ops-toolbar__btn']}
          onClick={openRenameDialog}
          disabled={isOperating}
          aria-label="批量重命名"
        >
          ✏️ 重命名
        </button>

        <button
          className={`${styles['batch-ops-toolbar__btn']} ${styles['batch-ops-toolbar__btn--danger']}`}
          onClick={openDeleteDialog}
          disabled={isOperating}
          aria-label="批量删除"
        >
          🗑️ 删除
        </button>

        <button
          className={styles['batch-ops-toolbar__clear']}
          onClick={clearSelection}
          disabled={isOperating}
          aria-label="清除选择"
        >
          ✕
        </button>
      </div>

      {/* Delete confirmation dialog */}
      {isDeleteDialogOpen && (
        <div
          className={styles['dialog-overlay']}
          role="dialog"
          aria-modal="true"
          aria-labelledby="batch-delete-title"
        >
          <div className={styles['dialog']}>
            <h3 id="batch-delete-title" className={styles['dialog__title']}>
              确认批量删除
            </h3>
            <p className={styles['dialog__body']}>
              即将删除 <strong>{selectedCount}</strong> 个画布。此操作不可撤销。
            </p>
            <div className={styles['dialog__actions']}>
              <button
                className={styles['dialog__cancel']}
                onClick={closeDeleteDialog}
                disabled={isOperating}
              >
                取消
              </button>
              <button
                className={styles['dialog__confirm']}
                onClick={handleBatchDelete}
                disabled={isOperating}
              >
                {isOperating ? '删除中…' : `确认删除`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename dialog */}
      {isRenameDialogOpen && (
        <div
          className={styles['dialog-overlay']}
          role="dialog"
          aria-modal="true"
          aria-labelledby="batch-rename-title"
        >
          <div className={styles['dialog']}>
            <h3 id="batch-rename-title" className={styles['dialog__title']}>
              批量重命名
            </h3>
            <p className={styles['dialog__body']}>为选中的 {selectedCount} 个画布进行批量重命名。</p>

            <div className={styles['dialog__field']}>
              <label className={styles['dialog__label']} htmlFor="rename-mode">
                重命名模式
              </label>
              <select
                id="rename-mode"
                className={styles['dialog__select']}
                value={renameMode}
                onChange={(e) => setRenameMode(e.target.value as 'prefix' | 'suffix')}
              >
                <option value="prefix">前缀替换</option>
                <option value="suffix">后缀替换</option>
              </select>
            </div>

            {renameMode === 'prefix' && (
              <div className={styles['dialog__field']}>
                <label className={styles['dialog__label']} htmlFor="rename-prefix">
                  前缀替换为
                </label>
                <input
                  id="rename-prefix"
                  type="text"
                  className={styles['dialog__input']}
                  value={renamePrefix}
                  onChange={(e) => setRenamePrefix(e.target.value)}
                  placeholder="输入新的前缀"
                  aria-label="前缀替换为"
                />
              </div>
            )}

            {renameMode === 'suffix' && (
              <div className={styles['dialog__field']}>
                <label className={styles['dialog__label']} htmlFor="rename-suffix">
                  后缀替换为
                </label>
                <input
                  id="rename-suffix"
                  type="text"
                  className={styles['dialog__input']}
                  value={renameSuffix}
                  onChange={(e) => setRenameSuffix(e.target.value)}
                  placeholder="输入新的后缀"
                  aria-label="后缀替换为"
                />
              </div>
            )}

            <div className={styles['dialog__actions']}>
              <button
                className={styles['dialog__cancel']}
                onClick={closeRenameDialog}
                disabled={isOperating}
              >
                取消
              </button>
              <button
                className={styles['dialog__confirm']}
                onClick={handleBatchRename}
                disabled={isOperating}
              >
                {isOperating ? '重命名中…' : '确认重命名'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
