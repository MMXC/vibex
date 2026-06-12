/**
 * ExportDialog — Batch export dialog for DDS Canvas
 *
 * E2: PNG/SVG/PDF 批量导出
 * S89-E5: Extended with JSON/PPT/Markdown + Export History
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
import { useCanvasExportStore } from '@/stores/canvasExportStore';
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

function HistoryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

// ==================== Constants ====================

const FORMAT_OPTIONS: Array<{ value: BatchExportFormat; label: string; desc: string }> = [
  { value: 'png', label: 'PNG', desc: '位图格式，适合嵌入文档' },
  { value: 'svg', label: 'SVG', desc: '矢量格式，无损缩放' },
  { value: 'pdf', label: 'PDF', desc: '多页文档，适合打印分享' },
  { value: 'json', label: 'JSON', desc: '结构化数据，程序化处理' },
  { value: 'ppt', label: 'PPT', desc: '幻灯片，每组一页' },
  { value: 'markdown', label: 'Markdown', desc: '文本格式，便于文档编写' },
];

const SCOPE_OPTIONS: Array<{ value: 'all' | 'selected'; label: string; desc: string }> = [
  { value: 'all', label: '全画布', desc: '导出所有节点' },
  { value: 'selected', label: '选中节点', desc: '仅导出已选中的节点' },
];

const FORMAT_ICONS: Record<BatchExportFormat, string> = {
  png: '🖼',
  svg: '📐',
  pdf: '📄',
  json: '{}',
  ppt: '📊',
  markdown: '📝',
};

const MAX_HISTORY = 10;

// ==================== Helpers ====================

function estimateFileSize(format: BatchExportFormat, cardCount: number, scale: number): string {
  switch (format) {
    case 'png': {
      // Rough estimate: 200KB per card at 1x, scale factor
      const bytes = cardCount * 200 * 1024 * scale * scale;
      return bytes > 1024 * 1024 ? `~${(bytes / 1024 / 1024).toFixed(1)}MB` : `~${(bytes / 1024).toFixed(0)}KB`;
    }
    case 'svg':
      return `~${(cardCount * 5).toFixed(0)}KB`;
    case 'pdf':
      return `~${(cardCount * 50 * scale).toFixed(0)}KB`;
    case 'json':
      return `~${(cardCount * 2).toFixed(0)}KB`;
    case 'ppt':
      return `~${(cardCount * 3).toFixed(0)}KB`;
    case 'markdown':
      return `~${(cardCount * 1).toFixed(0)}KB`;
    default:
      return '—';
  }
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} 小时前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

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
  const [showHistory, setShowHistory] = useState(false);

  const { status, progress, error, startExport, cancelExport } = useBatchExport();
  const exportHistory = useCanvasExportStore((s) => s.exportHistory);
  const exportScale = useCanvasExportStore((s) => s.exportScale);
  const clearExportHistory = useCanvasExportStore((s) => s.clearExportHistory);

  // Collect all cards from store chapters
  const chapters = useDDSCanvasStore((s) => s.chapters);
  const selectedCardIds = useDDSCanvasStore((s) => s.selectedCardIds);

  const totalCards =
    Object.values(chapters).reduce((sum, ch) => sum + (ch.cards?.length ?? 0), 0);
  const selectedCount = selectedCardIds.length;

  const cardsToExport = scope === 'selected' ? selectedCount : totalCards;
  const estimatedSize = estimateFileSize(format, cardsToExport, exportScale);

  const handleStartExport = useCallback(async () => {
    const allCards: DDSCard[] = [];
    for (const chapterData of Object.values(chapters)) {
      if (chapterData.cards) {
        allCards.push(...chapterData.cards);
      }
    }

    let cards: DDSCard[];
    if (scope === 'selected') {
      const selectedSet = new Set(selectedCardIds);
      cards = allCards.filter((c) => selectedSet.has(c.id));
    } else {
      cards = allCards;
    }

    if (cards.length === 0) return;

    const canvasName = 'Canvas';
    await startExport(cards, scope, format, canvasName);
  }, [chapters, selectedCardIds, scope, format, startExport]);

  const handleReExport = useCallback(async (entry: { format: string; scale?: number }) => {
    const allCards: DDSCard[] = [];
    for (const chapterData of Object.values(chapters)) {
      if (chapterData.cards) {
        allCards.push(...chapterData.cards);
      }
    }
    if (allCards.length === 0) return;
    await startExport(allCards, 'all', entry.format as BatchExportFormat, 'Canvas');
  }, [chapters, startExport]);

  const handleClose = useCallback(() => {
    if (status === 'exporting' || status === 'collecting') return;
    onClose();
  }, [status, onClose]);

  if (!open) return null;

  const isExporting = status === 'exporting' || status === 'collecting';

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={handleClose} aria-hidden="true" />

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
          <div className={styles.headerActions}>
            {exportHistory.length > 0 && (
              <button
                type="button"
                className={styles.historyToggleBtn}
                onClick={() => setShowHistory((v) => !v)}
                aria-label="导出历史"
                title="导出历史"
                data-testid="export-history-toggle"
              >
                <HistoryIcon />
                <span className={styles.historyCount}>{exportHistory.length}</span>
              </button>
            )}
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
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Export History Section */}
          {showHistory && exportHistory.length > 0 && (
            <div className={styles.historySection} data-testid="export-history-section">
              <div className={styles.historyHeader}>
                <span className={styles.historyTitle}>
                  <HistoryIcon />
                  导出历史
                </span>
                <button
                  type="button"
                  className={styles.clearHistoryBtn}
                  onClick={clearExportHistory}
                  aria-label="清空历史"
                  data-testid="export-history-clear"
                >
                  <TrashIcon />
                  清空
                </button>
              </div>
              <ul className={styles.historyList}>
                {exportHistory.slice(0, MAX_HISTORY).map((entry) => (
                  <li key={entry.id} className={styles.historyItem}>
                    <span className={styles.historyIcon} aria-hidden="true">
                      {FORMAT_ICONS[entry.format.toLowerCase() as BatchExportFormat] ?? '📦'}
                    </span>
                    <div className={styles.historyInfo}>
                      <span className={styles.historyFormat}>
                        {entry.format}{entry.scale ? ` (${entry.scale}x)` : ''}
                      </span>
                      <span className={styles.historyMeta}>
                        {entry.canvasName} · {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.reExportBtn}
                      onClick={() => handleReExport(entry)}
                      aria-label="重新导出"
                      title="重新导出"
                      data-testid="export-history-reexport"
                    >
                      <RefreshIcon />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Card count info */}
          <div className={styles.infoRow} role="status" aria-live="polite">
            <span>
              共 <strong>{totalCards}</strong> 个节点
              {scope === 'selected' && (
                <span className={styles.selectedInfo}>
                  {' '}(已选 <strong>{selectedCount}</strong> 个)
                </span>
              )}
              {cardsToExport > 0 && (
                <span className={styles.sizeEstimate}>
                  {' '}· 预估 <strong>{estimatedSize}</strong>
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

          {/* Scale selection (PNG only) */}
          {(format === 'png' || format === 'pdf') && (
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>分辨率</legend>
              <div className={styles.scaleGroup} role="radiogroup">
                {([1, 2, 3] as const).map((scale) => (
                  <label
                    key={scale}
                    className={`${styles.scaleLabel} ${exportScale === scale ? styles.scaleLabelActive : ''}`}
                  >
                    <input
                      type="radio"
                      name="export-scale"
                      value={scale}
                      checked={exportScale === scale}
                      onChange={() => useCanvasExportStore.getState().setExportScale(scale)}
                      className={styles.radioInput}
                      disabled={isExporting}
                    />
                    <span>{scale}x</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

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

          {/* Warnings */}
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

      {/* Export progress */}
      <ExportProgress
        status={status}
        progress={progress}
        error={error}
        onCancel={cancelExport}
        onDismiss={() => {}}
        currentFormat={format}
      />
    </>
  );
});
