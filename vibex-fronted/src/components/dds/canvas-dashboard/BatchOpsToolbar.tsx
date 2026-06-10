'use client';

/**
 * BatchOpsToolbar.tsx — Sprint60 E2: Batch Operations Floating Toolbar
 * S61-E3 i18n: All hardcoded Chinese strings replaced with useTranslations('batchOps').
 * S63-E5: Add "移动到文件夹" button + FolderPickerDialog.
 * S64-E4: Advanced BatchRenameDialog (sequence + regex mode) + batchArchive/batchUnarchive.
 * S68-E4: Add "复制到画布" button + CrossCanvasCopyDialog, "批量模板化" button + BatchDeleteConfirmDialog.
 * S76-E2: Add "批量导出 PNG" button + BatchExportDialog (Esc/click-outside dismiss, progress).
 * S83-E5: Replace inline export dialog with BatchExportPanel (per-canvas progress, abort support).
 *
 * Displays at the top of CanvasListPanel when multiple canvases are selected.
 * Provides batch delete, batch rename, batch archive, and batch move-to-folder entry points.
 */

import { useCallback, useState } from 'react';
import { useCanvasListStore } from '@/stores/canvasListStore';
import { useBatchOpsStore } from '@/stores/dds/batchOpsStore';
import { useCanvasFolderStore } from '@/stores/dds/canvasFolderStore';
import { useTranslations } from '@/hooks/useTranslations';
import { FolderPickerDialog } from './FolderPickerDialog';
import { BatchRenameDialog } from './BatchRenameDialog';
import { CrossCanvasCopyDialog } from './CrossCanvasCopyDialog';
import { BatchDeleteConfirmDialog } from './BatchDeleteConfirmDialog';
// S83-E5: Batch canvas export ZIP — replaces inline export dialog
import { BatchExportPanel } from './BatchExportPanel';
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
    isOperating,
    openDeleteDialog,
    closeDeleteDialog,
    openRenameDialog,
    closeRenameDialog,
    setIsOperating,
  } = useBatchOpsStore();

  // S61-E3 i18n: batchOps namespace
  const t = useTranslations('batchOps')();

  // S63-E5: folder picker state
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const { batchMoveToFolder } = useCanvasFolderStore();
  const { selectedCanvasIds, batchArchive, batchUnarchive } = useCanvasListStore();

  // S64-E4: advanced rename dialog state
  const [showAdvancedRename, setShowAdvancedRename] = useState(false);

  // S68-E4: copy-to-canvas dialog state
  const [showCrossCanvasCopy, setShowCrossCanvasCopy] = useState(false);
  const { activeCanvasId, copyNodesBetweenCanvases } = useCanvasListStore();

  // S68-E4: batch delete confirm dialog state
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // S83-E5: batch canvas export panel
  const [showExportPanel, setShowExportPanel] = useState(false);

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
    const { batchDeleteCanvas } = useCanvasListStore.getState();
    if (selectedCanvasIds.size === 0) return;
    setIsOperating(true);
    try {
      await batchDeleteCanvas();
      clearSelection();
    } finally {
      setIsOperating(false);
      closeDeleteDialog();
    }
  }, [selectedCanvasIds, clearSelection, closeDeleteDialog, setIsOperating]);

  // S64-E4: advanced rename via BatchRenameDialog
  const handleAdvancedRename = useCallback(
    async (canvasIds: string[], renameFn: (name: string, idx: number) => string) => {
      setShowAdvancedRename(false);
      if (canvasIds.length === 0) return;
      setIsOperating(true);
      try {
        const { batchRename } = useCanvasListStore.getState();
        await batchRename(canvasIds, renameFn);
        clearSelection();
      } finally {
        setIsOperating(false);
      }
    },
    [clearSelection, setIsOperating]
  );

  // S64-E4: batch archive
  const handleBatchArchive = useCallback(async () => {
    if (selectedCanvasIds.size === 0) return;
    setIsOperating(true);
    try {
      await batchArchive(Array.from(selectedCanvasIds));
      clearSelection();
    } finally {
      setIsOperating(false);
    }
  }, [selectedCanvasIds, batchArchive, clearSelection, setIsOperating]);

  // S64-E4: batch unarchive
  const handleBatchUnarchive = useCallback(async () => {
    if (selectedCanvasIds.size === 0) return;
    setIsOperating(true);
    try {
      await batchUnarchive(Array.from(selectedCanvasIds));
      clearSelection();
    } finally {
      setIsOperating(false);
    }
  }, [selectedCanvasIds, batchUnarchive, clearSelection, setIsOperating]);

  // S68-E4: copy-to-canvas handler
  const handleCopyToCanvas = useCallback(() => {
    setShowCrossCanvasCopy(true);
  }, []);

  const handleCrossCanvasCopyConfirm = useCallback(
    async (destCanvasId: string) => {
      setShowCrossCanvasCopy(false);
      if (selectedCanvasIds.size === 0) return;
      setIsOperating(true);
      try {
        await copyNodesBetweenCanvases(
          activeCanvasId ?? '',
          Array.from(selectedCanvasIds),
          destCanvasId
        );
        clearSelection();
      } finally {
        setIsOperating(false);
      }
    },
    [selectedCanvasIds, copyNodesBetweenCanvases, activeCanvasId, clearSelection, setIsOperating]
  );

  // S68-E4: batch template export handler
  const handleBatchTemplateExport = useCallback(async () => {
    if (selectedCanvasIds.size === 0) return;
    setIsOperating(true);
    try {
      const { batchTemplateExport } = useCanvasListStore.getState();
      await batchTemplateExport(Array.from(selectedCanvasIds));
      clearSelection();
    } finally {
      setIsOperating(false);
    }
  }, [selectedCanvasIds, clearSelection, setIsOperating]);

  // S68-E4: batch delete with dedicated confirm dialog
  const handleBatchDeleteConfirm = useCallback(async () => {
    if (selectedCanvasIds.size === 0) return;
    setIsOperating(true);
    try {
      const { batchDeleteCanvas } = useCanvasListStore.getState();
      await batchDeleteCanvas();
      clearSelection();
    } finally {
      setIsOperating(false);
      setShowBatchDeleteConfirm(false);
    }
  }, [selectedCanvasIds, clearSelection, setIsOperating]);

  // S83-E5: batch export — opens the BatchExportPanel
  const handleBatchExport = useCallback(() => {
    setShowExportPanel(true);
  }, []);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className={styles['batch-ops-toolbar']} role="toolbar" aria-label={t('toolbar')}>
        <span className={styles['batch-ops-toolbar__count']}>
          {t('selected')} <strong>{selectedCount}</strong> {t('canvases')}
        </span>

        <button
          className={styles['batch-ops-toolbar__btn']}
          onClick={() => setShowAdvancedRename(true)}
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

        {/* S64-E4: Archive / Unarchive */}
        <button
          className={styles['batch-ops-toolbar__btn']}
          onClick={handleBatchArchive}
          disabled={isOperating}
          aria-label={t('archive')}
        >
          📦 {t('archive')}
        </button>

        <button
          className={styles['batch-ops-toolbar__btn']}
          onClick={handleBatchUnarchive}
          disabled={isOperating}
          aria-label={t('unarchive')}
        >
          📤 {t('unarchive')}
        </button>

        {/* S68-E4: Copy to canvas */}
        <button
          className={styles['batch-ops-toolbar__btn']}
          onClick={handleCopyToCanvas}
          disabled={isOperating}
          aria-label={t('copyToCanvas')}
        >
          📋 {t('copyToCanvas')}
        </button>

        {/* S68-E4: Batch template export */}
        <button
          className={styles['batch-ops-toolbar__btn']}
          onClick={handleBatchTemplateExport}
          disabled={isOperating}
          aria-label={t('batchTemplateExport')}
        >
          📥 {t('batchTemplateExport')}
        </button>

        {/* S76-E2: Batch PNG export */}
        <button
          className={styles['batch-ops-toolbar__btn']}
          onClick={handleBatchExport}
          disabled={isOperating}
          aria-label={t('batchExport') ?? '批量导出 PNG'}
        >
          📤 {t('batchExport') ?? '批量导出 PNG'}
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

      {/* S64-E4: Advanced BatchRenameDialog */}
      <BatchRenameDialog
        open={showAdvancedRename}
        onConfirm={handleAdvancedRename}
        onCancel={() => setShowAdvancedRename(false)}
      />

      {/* S63-E5: Move to Folder dialog */}
      {showFolderPicker && (
        <FolderPickerDialog
          open={showFolderPicker}
          onConfirm={handleFolderPicked}
          onCancel={() => setShowFolderPicker(false)}
        />
      )}

      {/* S68-E4: Cross-canvas copy dialog */}
      <CrossCanvasCopyDialog
        currentCanvasId={activeCanvasId}
        sourceCanvasIds={Array.from(selectedCanvasIds)}
        onConfirm={handleCrossCanvasCopyConfirm}
        onCancel={() => setShowCrossCanvasCopy(false)}
      />

      {/* S68-E4: Dedicated batch delete confirm dialog */}
      <BatchDeleteConfirmDialog
        onConfirm={handleBatchDeleteConfirm}
        onCancel={() => setShowBatchDeleteConfirm(false)}
      />

      {/* S83-E5: Batch Canvas Export ZIP panel */}
      <BatchExportPanel
        open={showExportPanel}
        canvasIds={Array.from(selectedCanvasIds)}
        onClose={() => setShowExportPanel(false)}
      />
    </>
  );
}
