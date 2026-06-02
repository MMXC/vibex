/**
 * BatchExportProgress — Batch canvas list export progress UI component
 *
 * S57-E1: CanvasList 批量导出
 *
 * Extends the base ExportProgress with canvas-level progress display
 * showing "画布 N/M" when exporting multiple canvases.
 *
 * Usage:
 * <BatchExportProgress
 *   status={status}
 *   progress={progress}
 *   error={error}
 *   total={totalCanvases}
 *   onCancel={cancelExport}
 *   onDismiss={() => setVisible(false)}
 * />
 */
'use client';

import React from 'react';
import type { BatchListExportStatus, BatchListExportProgress } from '@/hooks/canvas/useBatchExportList';
import styles from './ExportProgress.module.css';

interface BatchExportProgressProps {
  status: BatchListExportStatus;
  progress: BatchListExportProgress | null;
  error: string | null;
  /** Total number of canvases being exported */
  total?: number;
  onCancel: () => void;
  onDismiss: () => void;
}

export function BatchExportProgress({
  status,
  progress,
  error,
  total,
  onCancel,
  onDismiss,
}: BatchExportProgressProps) {
  if (status === 'idle') return null;

  const percent =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <div className={styles.container} role="status" aria-live="polite">
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>
          {status === 'loading' && '准备导出…'}
          {status === 'exporting' && `批量导出${total != null && total > 0 ? ` · 画布 ${progress?.current ?? 0}/${total}` : ''}`}
          {status === 'done' && '导出完成'}
          {status === 'cancelled' && '已取消'}
          {status === 'error' && '导出失败'}
        </span>
        <button
          className={styles.closeBtn}
          onClick={onDismiss}
          aria-label="关闭"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {(status === 'loading' || status === 'exporting') && (
        <>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className={styles.statusRow}>
            <span className={styles.nodeName} title={progress?.canvasName ?? ''}>
              {progress?.canvasName ?? '准备中…'}
            </span>
            <span className={styles.count}>
              {progress?.current ?? 0} / {progress?.total ?? '?'}
            </span>
          </div>
        </>
      )}

      {/* Done state */}
      {status === 'done' && (
        <div className={styles.doneRow}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7l3.5 3.5 6.5-7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          ZIP 文件已开始下载
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className={styles.errorRow}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <path
              d="M7 1l6 12H1L7 1z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path d="M7 5v3M7 10h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className={styles.errorText}>{error ?? '未知错误'}</span>
        </div>
      )}

      {/* Cancelled */}
      {status === 'cancelled' && (
        <div className={styles.errorRow}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          导出已取消
        </div>
      )}

      {/* Cancel button */}
      {(status === 'loading' || status === 'exporting') && (
        <button className={styles.cancelBtn} onClick={onCancel}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          取消导出
        </button>
      )}
    </div>
  );
}
