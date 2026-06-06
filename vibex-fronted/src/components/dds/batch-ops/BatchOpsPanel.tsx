'use client';

/**
 * BatchOpsPanel.tsx — S72-E2: Template Batch Operations Panel
 *
 * Drawer panel for batch operations on selected templates.
 * Shows selected template list with id/name/thumbnail and
 * batch delete/move/export action buttons.
 */

import React, { useMemo, useCallback } from 'react';
import { useBatchOpsStore } from '@/stores/dds/batchOpsStore';
import { useTemplateStore } from '@/stores/templateStore';
import styles from './BatchOpsPanel.module.css';

export function BatchOpsPanel() {
  const {
    isPanelOpen,
    selectedTemplateIds,
    closePanel,
    clearSelection,
    toggleTemplateSelection,
    deleteSelectedTemplates,
    moveSelectedToFolder,
    exportSelectedTemplates,
    isOperating,
  } = useBatchOpsStore();

  const templates = useTemplateStore((s) => s.templates);
  const allTemplateIds = useMemo(() => templates.map((t) => t.id), [templates]);

  const selectedTemplates = useMemo(
    () => templates.filter((t) => selectedTemplateIds.includes(t.id)),
    [templates, selectedTemplateIds]
  );

  const handleSelectAll = useCallback(() => {
    useBatchOpsStore.getState().selectAllTemplates(allTemplateIds);
  }, [allTemplateIds]);

  const handleClearAll = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleDelete = useCallback(() => {
    if (selectedTemplateIds.length === 0) return;
    deleteSelectedTemplates();
    closePanel();
  }, [selectedTemplateIds, deleteSelectedTemplates, closePanel]);

  const handleMoveToFolder = useCallback(
    (folderId: string) => {
      if (selectedTemplateIds.length === 0) return;
      moveSelectedToFolder(folderId);
      closePanel();
    },
    [selectedTemplateIds, moveSelectedToFolder, closePanel]
  );

  const handleExportCSV = useCallback(() => {
    exportSelectedTemplates('csv');
  }, [exportSelectedTemplates]);

  const handleExportJSON = useCallback(() => {
    exportSelectedTemplates('json');
  }, [exportSelectedTemplates]);

  if (!isPanelOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={closePanel} aria-hidden="true" />

      {/* Panel */}
      <div className={styles.panel} role="dialog" aria-label="批量操作面板">
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>批量操作 ({selectedTemplateIds.length})</h2>
          <button className={styles.closeBtn} onClick={closePanel} aria-label="关闭">
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <button
            className={styles.toolbarBtn}
            onClick={handleSelectAll}
            disabled={isOperating}
          >
            全选
          </button>
          <button
            className={styles.toolbarBtn}
            onClick={handleClearAll}
            disabled={isOperating}
          >
            取消选择
          </button>
          <span className={styles.selectionCount}>
            已选 {selectedTemplateIds.length} 个模板
          </span>
        </div>

        {/* Template list */}
        <div className={styles.list} role="listbox" aria-multiselectable="true">
          {selectedTemplates.length === 0 ? (
            <div className={styles.empty}>
              <p>未选择任何模板</p>
              <p className={styles.emptyHint}>从模板列表中选择模板后可进行批量操作</p>
            </div>
          ) : (
            selectedTemplates.map((template) => (
              <div
                key={template.id}
                className={styles.templateItem}
                role="option"
                aria-selected="true"
                onClick={() => toggleTemplateSelection(template.id)}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedTemplateIds.includes(template.id)}
                  onChange={() => toggleTemplateSelection(template.id)}
                  className={styles.checkbox}
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Thumbnail placeholder */}
                <div className={styles.thumbnail}>
                  {template.thumbnail ? (
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className={styles.thumbnailImg}
                    />
                  ) : (
                    <div className={styles.thumbnailPlaceholder}>
                      {template.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className={styles.info}>
                  <div className={styles.templateName}>{template.name}</div>
                  <div className={styles.templateMeta}>
                    <span className={styles.templateCategory}>{template.category}</span>
                    <span className={styles.templateId}>{template.id}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={handleDelete}
            disabled={isOperating || selectedTemplateIds.length === 0}
          >
            {isOperating ? '处理中…' : `批量删除 (${selectedTemplateIds.length})`}
          </button>

          <button
            className={`${styles.actionBtn} ${styles.moveBtn}`}
            onClick={() => {
              // Move to "Uncategorized" folder (folderId: '')
              handleMoveToFolder('');
            }}
            disabled={isOperating || selectedTemplateIds.length === 0}
          >
            移动到文件夹
          </button>

          <button
            className={`${styles.actionBtn} ${styles.exportBtn}`}
            onClick={handleExportCSV}
            disabled={isOperating || selectedTemplateIds.length === 0}
          >
            导出 CSV
          </button>

          <button
            className={`${styles.actionBtn} ${styles.exportBtn}`}
            onClick={handleExportJSON}
            disabled={isOperating || selectedTemplateIds.length === 0}
          >
            导出 JSON
          </button>
        </div>
      </div>
    </>
  );
}
