'use client';

/**
 * BatchExportPanel.tsx — S83-E5: Batch Canvas Export ZIP Panel
 *
 * Displays per-canvas export progress during a batch canvas export operation.
 * Replaces the simple inline dialog in BatchOpsToolbar with a richer panel:
 * - Per-canvas status row with progress bar
 * - Overall progress bar
 * - Cancel / Close / Download actions
 * - Dismiss via Escape or click-outside (when idle/done/error)
 *
 * S83-E5 AC:
 * - AC1: Shows per-canvas status (pending/exporting/done/failed/skipped)
 * - AC2: Overall progress fraction (e.g., "3/5 canvases")
 * - AC3: Cancel button aborts export
 * - AC4: Download triggered automatically on completion
 * - AC5: Panel dismissable after completion or cancellation
 */

import { useEffect, useRef } from 'react';
import { useBatchCanvasExport } from '@/hooks/useBatchCanvasExport';
import type { CanvasExportResult, BatchCanvasExportProgress } from '@/hooks/useBatchCanvasExport';
import styles from './BatchExportPanel.module.css';

interface BatchExportPanelProps {
  /** Canvas IDs to export */
  canvasIds: string[];
  /** Whether the panel is open */
  open: boolean;
  /** Called when panel should close */
  onClose: () => void;
  /** Optional: pre-selected format (default: 'png') */
  defaultFormat?: 'png' | 'svg' | 'pdf';
}

/** Individual canvas row with progress */
function CanvasExportRow({ result }: { result: CanvasExportResult }) {
  const progressPct =
    result.nodeProgress && result.nodeProgress.total > 0
      ? Math.round((result.nodeProgress.current / result.nodeProgress.total) * 100)
      : result.status === 'done'
      ? 100
      : result.status === 'failed'
      ? 0
      : 0;

  const statusIcon =
    result.status === 'done'
      ? '✅'
      : result.status === 'failed'
      ? '❌'
      : result.status === 'exporting'
      ? '⏳'
      : result.status === 'skipped'
      ? '⏭'
      : '⏸';

  const statusLabel =
    result.status === 'done'
      ? '完成'
      : result.status === 'failed'
      ? `失败: ${result.error}`
      : result.status === 'exporting'
      ? `导出中 (${result.nodeProgress?.current ?? 0}/${result.nodeProgress?.total ?? '?'})`
      : result.status === 'skipped'
      ? '跳过'
      : '等待';

  return (
    <div className={styles['canvas-row']}>
      <span className={styles['canvas-row__icon']}>{statusIcon}</span>
      <span className={styles['canvas-row__name']} title={result.canvasName}>
        {result.canvasName}
      </span>
      <div className={styles['canvas-row__progress-bar']}>
        <div
          className={`${styles['canvas-row__progress-fill']} ${result.status === 'failed' ? styles['canvas-row__progress-fill--error'] : ''}`}
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className={styles['canvas-row__status']}>{statusLabel}</span>
    </div>
  );
}

/** Overall progress bar at the top */
function OverallProgress({ progress }: { progress: BatchCanvasExportProgress }) {
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  return (
    <div className={styles['overall-progress']}>
      <div className={styles['overall-progress__header']}>
        <span className={styles['overall-progress__label']}>
          整体进度 — {progress.current}/{progress.total} 个画布
        </span>
        <span className={styles['overall-progress__pct']}>{pct}%</span>
      </div>
      <div className={styles['overall-progress__bar']} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={styles['overall-progress__fill']}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function BatchExportPanel({ canvasIds, open, onClose, defaultFormat = 'png' }: BatchExportPanelProps) {
  const { status, progress, startExport, cancelExport, error } = useBatchCanvasExport();
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-start export when panel opens
  useEffect(() => {
    if (open && status === 'idle' && canvasIds.length > 0) {
      startExport(canvasIds, { format: defaultFormat });
    }
  }, [open, status, canvasIds, defaultFormat, startExport]);

  // Escape / click-outside dismiss when idle/done/cancelled/error
  useEffect(() => {
    if (!open) return;
    if (status !== 'idle' && status !== 'done' && status !== 'cancelled' && status !== 'error') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, status, onClose]);

  if (!open) return null;

  const isRunning = status === 'running';
  const isDone = status === 'done';
  const isCancelled = status === 'cancelled';
  const isError = status === 'error';
  const isIdle = status === 'idle';

  return (
    <div className={styles['panel-overlay']} role="dialog" aria-modal="true" aria-labelledby="batch-export-panel-title">
      <div className={styles['panel']} ref={panelRef}>
        {/* Header */}
        <div className={styles['panel__header']}>
          <h3 id="batch-export-panel-title" className={styles['panel__title']}>
            📦 批量导出画布
          </h3>
          {(isDone || isCancelled || isError) && (
            <button
              className={styles['panel__close-btn']}
              onClick={onClose}
              aria-label="关闭"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status banner */}
        {isIdle && (
          <p className={styles['panel__status-text']}>准备开始导出 {canvasIds.length} 个画布…</p>
        )}
        {isRunning && progress && (
          <>
            <OverallProgress progress={progress} />
            <p className={styles['panel__status-text']}>
              正在导出: <strong>{progress.currentCanvasName}</strong>
            </p>
          </>
        )}
        {isDone && (
          <p className={`${styles['panel__status-text']} ${styles['panel__status-text--success']}`}>
            ✅ 导出完成！ZIP 文件已开始下载。
          </p>
        )}
        {isCancelled && (
          <p className={`${styles['panel__status-text']} ${styles['panel__status-text--warning']}`}>
            ⏹ 导出已取消。
          </p>
        )}
        {isError && (
          <p className={`${styles['panel__status-text']} ${styles['panel__status-text--error']}`}>
            ❌ 导出失败: {error}
          </p>
        )}

        {/* Per-canvas rows */}
        {progress && (
          <div className={styles['canvas-list']}>
            {progress.canvases.map((c) => (
              <CanvasExportRow key={c.canvasId} result={c} />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className={styles['panel__actions']}>
          {isRunning && (
            <button
              className={styles['panel__cancel-btn']}
              onClick={cancelExport}
            >
              取消导出
            </button>
          )}
          {(isDone || isCancelled || isError) && (
            <button
              className={styles['panel__close-action-btn']}
              onClick={onClose}
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
