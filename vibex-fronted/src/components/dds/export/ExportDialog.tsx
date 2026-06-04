/**
 * ExportDialog — Batch export dialog for DDS Canvas
 *
 * E2: PNG/SVG/PDF 批量导出
 *
 * Provides a dialog for selecting export format, scope, and triggering
 * batch export via useBatchExport + ExportProgress.
 *
 * Usage:
 * <ExportDialog
 *   open={isDialogOpen}
 *   onClose={() => setIsDialogOpen(false)}
 * />
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import { useBatchExport } from '@/hooks/useBatchExport';
import { ExportProgress } from './ExportProgress';
import { useDDSCanvasStore } from '@/stores/dds';
import type { BatchExportFormat } from '@/hooks/useBatchExport';
import type { DDSCard } from '@/types/dds';
import styles from './ExportDialog.module.css';

// ==================== Icons ====================

function BatchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

// ==================== Constants ====================

const FORMAT_OPTIONS: Array<{ value: BatchExportFormat; label: string; desc: string }> = [
  { value: 'png', label: 'PNG', desc: '位图格式，适合嵌入文档' },
  { value: 'svg', label: 'SVG', desc: '矢量格式，无损缩放' },
  { value: 'pdf', label: 'PDF', desc: '多页文档，适合打印分享' },
];

const SCOPE_OPTIONS: Array<{ value: 'all' | 'selected'; label: string; desc: string }> = [
  { value: 'all', label: '全画布', desc: '导出所有节点' },
  { value: 'selected', label: '选中节点', desc: '仅导出已选中的节点' },
];

// ==================== Component ====================

export interface ExportDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Called when dialog requests close */
  onClose: () => void;
}

export const ExportDialog = memo(function ExportDialog({
  open,
  onClose,
}: ExportDialogProps) {
  const [format, setFormat] = useState<BatchExportFormat>('png');
  const [scope, setScope] = useState<'all' | 'selected'>('all');

  const { status, progress, error, startExport, cancelExport } = useBatchExport();

  // Collect all cards from store chapters
  const chapters = useDDSCanvasStore((s) => s.chapters);
  const selectedCardIds = useDDSCanvasStore((s) => s.selectedCardIds);

  const handleStartExport = useCallback(async () => {
    // Collect all cards from all chapters
    const allCards: DDSCard[] = [];
    for (const chapterData of Object.values(chapters)) {
      if (chapterData.cards) {
        allCards.push(...chapterData.cards);
      }
    }

    let cardsToExport: DDSCard[];
    if (scope === 'selected') {
      const selectedSet = new Set(selectedCardIds);
      cardsToExport = allCards.filter((c) => selectedSet.has(c.id));
    } else {
      cardsToExport = allCards;
    }

    if (cardsToExport.length === 0) {
      return;
    }

    await startExport(cardsToExport, scope, format);
  }, [chapters, selectedCardIds, scope, format, startExport]);

  const handleClose = useCallback(() => {
    if (status === 'exporting' || status === 'collecting') {
      return; // Don't close during export
    }
    onClose();
  }, [status, onClose]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open && status !== 'idle') {
      // Keep the progress visible briefly — let ExportProgress handle dismissal
    }
  }, [open, status]);

  if (!open) return null;

  const totalCards =
    Object.values(chapters).reduce((sum, ch) => sum + (ch.cards?.length ?? 0), 0);
  const selectedCount = selectedCardIds.length;

  const isExporting = status === 'exporting' || status === 'collecting';

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        data-testid="export-dialog"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <BatchIcon />
            <h2 id="export-dialog-title" className={styles.title}>
              批量导出
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="关闭"
            disabled={isExporting}
            data-testid="export-dialog-close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Card count info */}
          <div className={styles.infoRow} role="status" aria-live="polite">
            <span>
              共{' '}
              <strong>{totalCards}</strong>{' '}
              个节点
              {scope === 'selected' && (
                <span className={styles.selectedInfo}>
                  {' '}(已选 <strong>{selectedCount}</strong> 个)
                </span>
              )}
            </span>
          </div>

          {/* Format selection */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>导出格式</legend>
            <div className={styles.optionGroup} role="radiogroup">
              {FORMAT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`${styles.optionLabel} ${format === opt.value ? styles.optionLabelActive : ''}`}
                >
                  <input
                    type="radio"
                    name="export-format"
                    value={opt.value}
                    checked={format === opt.value}
                    onChange={() => setFormat(opt.value)}
                    className={styles.radioInput}
                    disabled={isExporting}
                  />
                  <span className={styles.radioCustom} aria-hidden="true" />
                  <span className={styles.optionText}>
                    <span className={styles.optionTitle}>{opt.label}</span>
                    <span className={styles.optionDesc}>{opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Scope selection */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>导出范围</legend>
            <div className={styles.optionGroup} role="radiogroup">
              {SCOPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`${styles.optionLabel} ${scope === opt.value ? styles.optionLabelActive : ''}`}
                >
                  <input
                    type="radio"
                    name="export-scope"
                    value={opt.value}
                    checked={scope === opt.value}
                    onChange={() => setScope(opt.value as 'all' | 'selected')}
                    className={styles.radioInput}
                    disabled={isExporting}
                  />
                  <span className={styles.radioCustom} aria-hidden="true" />
                  <span className={styles.optionText}>
                    <span className={styles.optionTitle}>{opt.label}</span>
                    <span className={styles.optionDesc}>{opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Empty state warning */}
          {scope === 'selected' && selectedCount === 0 && (
            <div className={styles.warning} role="alert">
              <AlertIcon />
              <span>请先在画布上选中节点</span>
            </div>
          )}

          {totalCards === 0 && (
            <div className={styles.warning} role="alert">
              <AlertIcon />
              <span>画布上没有可导出的节点</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleClose}
            disabled={isExporting}
          >
            取消
          </button>
          <button
            type="button"
            className={styles.startBtn}
            onClick={handleStartExport}
            disabled={
              isExporting ||
              (scope === 'selected' && selectedCount === 0) ||
              totalCards === 0
            }
            data-testid="export-dialog-start"
          >
            <BatchIcon />
            开始导出
          </button>
        </div>
      </div>

      {/* Export progress (fixed bottom-right, outside dialog) */}
      <ExportProgress
        status={status}
        progress={progress}
        error={error}
        onCancel={cancelExport}
        onDismiss={() => {
          /* ExportProgress handles its own dismissal */
        }}
        currentFormat={format}
      />
    </>
  );
});
