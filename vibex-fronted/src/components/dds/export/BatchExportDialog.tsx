/**
 * BatchExportDialog — Multi-canvas batch export UI
 *
 * E2: PNG/SVG/PDF 批量导出
 *
 * Shows a list of all cards on the canvas with multi-select checkboxes.
 * Selected cards are exported as a ZIP archive via useBatchExport.
 *
 * Usage:
 * <BatchExportDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';
import { useBatchExport } from '@/hooks/useBatchExport';
import type { DDSCard, BoundedContextCard, UserStoryCard, FlowStepCard, APIEndpointCard, StateMachineCard, ChapterType } from '@/types/dds';
import type { BatchExportFormat } from '@/hooks/useBatchExport';
import { ExportProgress } from './ExportProgress';
import styles from './BatchExportDialog.module.css';

// Derive all cards from all chapters — store exposes chapters[].cards[], not a flat allCards array
const selectAllCards = (state: ReturnType<typeof useDDSCanvasStore.getState>) =>
  (Object.values(state.chapters) as { cards: DDSCard[] }[]).flatMap((ch) => ch.cards);

interface BatchExportDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** Called when the user closes the dialog */
  onClose: () => void;
}

const CARD_TYPE_LABELS: Record<string, string> = {
  'bounded-context': '限界上下文',
  'user-story': '用户故事',
  'flow-step': '流程步骤',
  'api-endpoint': 'API端点',
  'state-machine': '状态机',
};

function getCardName(card: DDSCard): string {
  switch (card.type) {
    case 'bounded-context':
      return (card as BoundedContextCard).name;
    case 'user-story':
      return (card as UserStoryCard).role + ' — ' + (card as UserStoryCard).action;
    case 'flow-step':
      return (card as FlowStepCard).stepName;
    case 'api-endpoint':
      return (card as APIEndpointCard).name;
    case 'state-machine':
      return (card as StateMachineCard).name;
    default:
      return card.id;
  }
}

export function BatchExportDialog({ isOpen, onClose }: BatchExportDialogProps) {
  const allCards = useDDSCanvasStore(selectAllCards);

  // Selected card IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Export format
  const [format, setFormat] = useState<BatchExportFormat>('png');

  const { status, progress, error, startExport, cancelExport } = useBatchExport();

  // Derive selected cards array
  const selectedCards = useMemo(() => {
    return allCards.filter((c) => selectedIds.has(c.id));
  }, [allCards, selectedIds]);

  const handleToggleAll = useCallback(() => {
    if (selectedIds.size === allCards.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allCards.map((c) => c.id)));
    }
  }, [allCards, selectedIds]);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleStart = useCallback(async () => {
    if (selectedCards.length === 0) return;
    await startExport(selectedCards, 'all', format);
  }, [selectedCards, startExport, format]);

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  // Reset selection when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isExporting = status === 'collecting' || status === 'exporting';
  const canExport = selectedCards.length > 0 && !isExporting;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="批量导出">
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>批量导出画布</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Card list */}
        <div className={styles.cardList} role="listbox" aria-multiselectable="true">
          {/* Select All row */}
          <div className={styles.selectAllRow}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={allCards.length > 0 && selectedIds.size === allCards.length}
                onChange={handleToggleAll}
                aria-label="全选"
              />
              <span>全选 ({selectedIds.size}/{allCards.length})</span>
            </label>
          </div>

          {/* Individual cards */}
          {allCards.length === 0 ? (
            <div className={styles.empty}>当前画布没有可导出的卡片</div>
          ) : (
            allCards.map((card) => (
              <div key={card.id} className={styles.cardItem} role="option">
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(card.id)}
                    onChange={() => handleToggle(card.id)}
                    aria-label={`选择 ${getCardName(card)}`}
                  />
                  <span className={styles.cardType}>{CARD_TYPE_LABELS[card.type] ?? card.type}</span>
                  <span className={styles.cardName}>{getCardName(card)}</span>
                </label>
              </div>
            ))
          )}
        </div>

        {/* Format selector */}
        <div className={styles.formatRow}>
          <span className={styles.formatLabel}>导出格式：</span>
          <div className={styles.formatOptions} role="radiogroup" aria-label="导出格式">
            {(['png', 'svg', 'pdf'] as BatchExportFormat[]).map((f) => (
              <label key={f} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="export-format"
                  value={f}
                  checked={format === f}
                  onChange={() => setFormat(f)}
                  disabled={isExporting}
                />
                {f.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isExporting}
          >
            取消
          </button>
          <button
            className={styles.exportBtn}
            onClick={handleStart}
            disabled={!canExport}
          >
            导出 ({selectedCards.length} 个)
          </button>
        </div>
      </div>

      {/* Export progress overlay — shown when exporting */}
      {status !== 'idle' && (
        <div className={styles.progressOverlay}>
          <ExportProgress
            status={status}
            progress={progress}
            error={error}
            onCancel={cancelExport}
            onDismiss={handleDismiss}
            currentFormat={format}
          />
        </div>
      )}
    </div>
  );
}
