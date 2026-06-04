'use client';

/**
 * BatchOpsToolbar.tsx — Sprint60 E2: Batch Operations Floating Toolbar
 * S61-E3 i18n: All hardcoded Chinese strings replaced with useTranslations('batchOps').
 * S63-E5: Add "移动到文件夹" button + FolderPickerDialog.
 *
 * Displays at the top of CanvasListPanel when multiple canvases are selected.
 * Provides batch delete, batch rename, and batch move-to-folder entry points.
 */

import { useCallback, useState } from 'react';
import { useCanvasListStore } from '@/stores/canvasListStore';
import { useBatchOpsStore } from '@/stores/dds/batchOpsStore';
import { useCanvasFolderStore } from '@/stores/dds/canvasFolderStore';
import { useTranslations } from '@/hooks/useTranslations';
import { FolderPickerDialog } from './FolderPickerDialog';
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

  // S61-E3 i18n: batchOps namespace
  const t = useTranslations('batchOps')();

  // S63-E5: folder picker state
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const { batchMoveToFolder } = useCanvasFolderStore();
  const { selectedCanvasIds } = useCanvasListStore();

  const handleMoveToFolder = useCallback(() => {
    setShowFolderPicker(true);
  }, []);

  const handleFolderPicked = useCallback(async (folderId: string | null) => {
    setShowFolderPicker(false);
    if (selectedCanvasIds.size === 0) return;
    setIsOperating(true);
    try {
      await batchMoveToFolder(Array.from(selectedCanvasIds), folderId);
      clearSelection();
    } finally {
      setIsOperating(false);
    }
  }, [selectedCanvasIds, batchMoveToFolder, clearSelection, setIsOperating]);

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
      <div className={styles['batch-ops-toolbar']} role="toolbar" aria-label={t('toolbar')}>
        <span className={styles['batch-ops-toolbar__count']}>
          {t('selected')} <strong>{selectedCount}</strong> {t('canvases')}
        </span>

        <button
          className={styles['batch-ops-toolbar__btn']}
          onClick={openRenameDialog}
          disabled={isOperating}
          aria-label={t('rename')}
        >
          ✏️ {t('rename')}
        </button>

        <button
          className={`${styles['batch-ops-toolbar__btn']} ${styles['batch-ops-toolbar__btn--danger']}`}
          onClick={openDeleteDialog}
          disabled={isOperating}
          aria-label={t('delete')}
        >
          🗑️ {t('delete')}
        </button>

        <button
          className={styles['batch-ops-toolbar__btn']}
          onClick={handleMoveToFolder}
          disabled={isOperating}
          aria-label={t('moveToFolder')}
        >
          📁 {t('moveToFolder')}
        </button>

        <button
          className={styles['batch-ops-toolbar__clear']}
          onClick={clearSelection}
          disabled={isOperating}
          aria-label={t('clearSelection')}
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
              {t('confirmDelete')}
            </h3>
            <p className={styles['dialog__body']}>
              {t('deleteWarning', { count: selectedCount })}
            </p>
            <div className={styles['dialog__actions']}>
              <button
                className={styles['dialog__cancel']}
                onClick={closeDeleteDialog}
                disabled={isOperating}
              >
                {t('cancel')}
              </button>
              <button
                className={styles['dialog__confirm']}
                onClick={handleBatchDelete}
                disabled={isOperating}
              >
                {isOperating ? t('deleting') : t('confirmDeleteBtn')}
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
              {t('batchRename')}
            </h3>
            <p className={styles['dialog__body']}>{t('renameDesc', { count: selectedCount })}</p>

            <div className={styles['dialog__field']}>
              <label className={styles['dialog__label']} htmlFor="rename-mode">
                {t('renameMode')}
              </label>
              <select
                id="rename-mode"
                className={styles['dialog__select']}
                value={renameMode}
                onChange={(e) => setRenameMode(e.target.value as 'prefix' | 'suffix')}
              >
                <option value="prefix">{t('prefixReplace')}</option>
                <option value="suffix">{t('suffixReplace')}</option>
              </select>
            </div>

            {renameMode === 'prefix' && (
              <div className={styles['dialog__field']}>
                <label className={styles['dialog__label']} htmlFor="rename-prefix">
                  {t('newPrefix')}
                </label>
                <input
                  id="rename-prefix"
                  type="text"
                  className={styles['dialog__input']}
                  value={renamePrefix}
                  onChange={(e) => setRenamePrefix(e.target.value)}
                  placeholder={t('enterNewPrefix')}
                  aria-label={t('newPrefix')}
                />
              </div>
            )}

            {renameMode === 'suffix' && (
              <div className={styles['dialog__field']}>
                <label className={styles['dialog__label']} htmlFor="rename-suffix">
                  {t('newSuffix')}
                </label>
                <input
                  id="rename-suffix"
                  type="text"
                  className={styles['dialog__input']}
                  value={renameSuffix}
                  onChange={(e) => setRenameSuffix(e.target.value)}
                  placeholder={t('enterNewSuffix')}
                  aria-label={t('newSuffix')}
                />
              </div>
            )}

            <div className={styles['dialog__actions']}>
              <button
                className={styles['dialog__cancel']}
                onClick={closeRenameDialog}
                disabled={isOperating}
              >
                {t('cancel')}
              </button>
              <button
                className={styles['dialog__confirm']}
                onClick={handleBatchRename}
                disabled={isOperating}
              >
                {isOperating ? t('renaming') : t('confirmRename')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* S63-E5: Move to Folder dialog */}
      {showFolderPicker && (
        <FolderPickerDialog
          open={showFolderPicker}
          onConfirm={handleFolderPicked}
          onCancel={() => setShowFolderPicker(false)}
        />
      )}
    </>
  );
}
