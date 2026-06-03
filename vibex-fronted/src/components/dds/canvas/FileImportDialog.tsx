/**
 * FileImportDialog — Preview and confirm file import dialog
 * S58-E2: 桌面文件拖拽导入
 *
 * Shows a dialog listing all pending files to import,
 * with card count per file and error messages for failed files.
 * User can remove individual files or cancel the import.
 *
 * @module components/dds/canvas/FileImportDialog
 */

'use client';

import React from 'react';
import type { ImportedFile } from '@/hooks/dds/canvas/useFileDrop';
import styles from './FileImportDialog.module.css';

export interface FileImportDialogProps {
  files: ImportedFile[];
  onConfirm: () => void;
  onCancel: () => void;
  onRemoveFile: (index: number) => void;
}

export function FileImportDialog({ files, onConfirm, onCancel, onRemoveFile }: FileImportDialogProps) {
  const totalCards = files.reduce((sum, f) => sum + (f.error ? 0 : f.cards.length), 0);
  const errorCount = files.filter((f) => f.error).length;
  const validCount = files.filter((f) => !f.error).length;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="导入文件预览">
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={styles.headerIcon}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <h2 className={styles.title}>导入文件预览</h2>
          </div>
          <button className={styles.closeBtn} onClick={onCancel} aria-label="关闭">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <span className={styles.summaryBadge}>
            {validCount} 个文件
          </span>
          <span className={styles.summaryCardCount}>
            共 {totalCards} 张卡片
          </span>
          {errorCount > 0 && (
            <span className={styles.summaryError}>
              {errorCount} 个文件解析失败
            </span>
          )}
        </div>

        {/* File list */}
        <ul className={styles.fileList}>
          {files.map((file, index) => (
            <li key={index} className={`${styles.fileItem} ${file.error ? styles.fileItemError : ''}`}>
              <div className={styles.fileItemLeft}>
                <div className={styles.fileIcon} aria-hidden="true">
                  {file.error ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  )}
                </div>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{file.file.name}</span>
                  {file.error ? (
                    <span className={styles.fileError}>{file.error}</span>
                  ) : (
                    <span className={styles.fileMeta}>
                      {file.cards.length} 张卡片 · {file.edges.length} 条连线
                    </span>
                  )}
                </div>
              </div>
              {!file.error && (
                <button
                  className={styles.removeBtn}
                  onClick={() => onRemoveFile(index)}
                  aria-label={`移除 ${file.file.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            取消
          </button>
          <button
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={validCount === 0}
          >
            导入 {validCount > 0 && `(${totalCards} 张卡片)`}
          </button>
        </div>
      </div>
    </div>
  );
}
