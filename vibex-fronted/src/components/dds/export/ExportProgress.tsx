/**
 * ExportProgress — Batch export progress UI component
 *
 * E2: PNG/SVG/PDF 批量导出
 *
 * Usage:
 * <ExportProgress
 *   status={status}
 *   progress={progress}
 *   error={error}
 *   onCancel={cancelExport}
 *   onDismiss={() => setVisible(false)}
 *   onFormatChange={setFormat}
 *   currentFormat={format}
 * />
 */
'use client';

import React from 'react';
import type { BatchExportStatus, BatchExportProgress, BatchExportFormat } from '@/hooks/useBatchExport';
import styles from './ExportProgress.module.css';

interface ExportProgressProps {
  status: BatchExportStatus;
  progress: BatchExportProgress | null;
  error: string | null;
  onCancel: () => void;
  onDismiss: () => void;
  /** Current export format (for display in header) */
  currentFormat?: BatchExportFormat;
  /** Callback when format is changed by user */
  onFormatChange?: (format: BatchExportFormat) => void;
}

const FORMAT_LABELS: Record<BatchExportFormat, string> = {
  png: 'PNG',
  svg: 'SVG',
  pdf: 'PDF',
  zip: 'ZIP',
};

export function ExportProgress({
  status,
  progress,
  error,
  onCancel,
  onDismiss,
  currentFormat = 'png',
  onFormatChange,
}: ExportProgressProps) {
  if (status === 'idle') return null;

  const percent =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  const formatLabel = FORMAT_LABELS[currentFormat] ?? 'PNG';

  return (
    <div className={styles.container} role="status" aria-live="polite">
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>
          {status === 'collecting' && '准备导出…'}
          {status === 'exporting' && `批量导出 ${formatLabel}`}
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

      {/* Format selector — shown when idle or collecting, not during export */}
      {(status === 'idle' || status === 'collecting') && onFormatChange && (
        <div className={styles.formatRow}>
          <label className={styles.formatLabel} htmlFor="export-format-select">
            格式：
          </label>
          <select
            id="export-format-select"
            className={styles.formatSelect}
            value={currentFormat}
            onChange={(e) => onFormatChange(e.target.value as BatchExportFormat)}
            disabled={status === 'exporting'}
          >
            <option value="png">PNG (位图)</option>
            <option value="svg">SVG (矢量)</option>
            <option value="pdf">PDF (文档)</option>
            <option value="zip">ZIP (批量位图)</option>
          </select>
        </div>
      )}

      {/* Progress bar */}
      {(status === 'collecting' || status === 'exporting') && (
        <>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className={styles.statusRow}>
            <span className={styles.nodeName} title={progress?.nodeName ?? ''}>
              {progress?.nodeName ?? '准备中…'}
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
          {currentFormat === 'pdf' ? 'PDF 文件已开始下载' : 'ZIP 文件已开始下载'}
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
      {(status === 'collecting' || status === 'exporting') && (
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
