/**
 * BatchExportPanel — Batch canvas export panel
 *
 * S83-E5: 批量导出 ZIP
 *
 * Floating panel at bottom of screen showing:
 * - Selection count + "导出 ZIP" button
 * - Progress bar during export
 * - Done/error state
 */

'use client';

import React, { useCallback } from 'react';
import type { UseBatchCanvasExportResult } from '@/hooks/useBatchCanvasExport';
import styles from './BatchExportPanel.module.css';

interface BatchExportPanelProps {
  hook: UseBatchCanvasExportResult;
  /** Callback when user dismisses the panel (after done/error) */
  onDismiss?: () => void;
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function BatchExportPanel({ hook, onDismiss }: BatchExportPanelProps) {
  const { selectedCanvasIds, toggleSelect, selectAll, clearSelection, startExport, cancelExport, status, progress, error, totalCanvases } = hook;

  const count = selectedCanvasIds.size;
  const isIdle = status === 'idle';
  const isWorking = status === 'loading' || status === 'packing';
  const isDone = status === 'done';
  const isError = status === 'error';
  const isCancelled = status === 'cancelled';

  const percent = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  const handleExport = useCallback(() => {
    startExport();
  }, [startExport]);

  const handleDismiss = useCallback(() => {
    clearSelection();
    onDismiss?.();
  }, [clearSelection, onDismiss]);

  if (isIdle && count === 0) return null;

  return (
    <div className={styles.container} role="status" aria-live="polite">
      {/* Header row */}
      <div className={styles.header}>
        <div className={styles.selectionInfo}>
          {!isIdle && !isDone && !isError && !isCancelled && (
            <span className={styles.selectionCount}>{progress?.current ?? count}/{progress?.total ?? count}</span>
          )}
          {isIdle && (
            <>
              <span className={styles.selectionCount}>{count}</span>
              <span>个画布已选择</span>
            </>
          )}
          {isDone && (
            <span className={styles.doneBadge}>
              <CheckIcon />
              导出完成 — {count} 个画布已打包
            </span>
          )}
          {isError && (
            <span className={styles.errorBadge}>
              <AlertIcon />
              {error ?? '导出失败'}
            </span>
          )}
          {isCancelled && (
            <span style={{ color: '#a0a0c0' }}>导出已取消</span>
          )}
        </div>

        <div className={styles.actions}>
          {!isWorking && !isDone && !isError && !isCancelled && (
            <>
              <button
                className={`${styles.btn} ${styles.btnClear}`}
                onClick={handleDismiss}
                title="清除选择"
              >
                取消
              </button>
              <button
                className={`${styles.btn} ${styles.btnExport}`}
                onClick={handleExport}
                disabled={count === 0}
              >
                导出 ZIP
              </button>
            </>
          )}
          {isWorking && (
            <button
              className={`${styles.btn} ${styles.btnCancel}`}
              onClick={cancelExport}
            >
              取消
            </button>
          )}
          {(isDone || isError || isCancelled) && (
            <button
              className={`${styles.btn} ${styles.btnClear}`}
              onClick={handleDismiss}
            >
              关闭
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isWorking && progress && (
        <div className={styles.progressSection}>
          <div className={styles.progressLabel}>
            <span>正在打包: {progress.canvasName}</span>
            <span>{percent}%</span>
          </div>
          <div className={styles.progressBarWrap}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
