/**
 * BatchExportPanel — Batch canvas list export configuration panel
 *
 * S57-E1: CanvasList 批量导出
 *
 * Shows a list of all canvases from canvasListStore with checkboxes,
 * a format selector (.vibex / .json), and an Export button.
 *
 * Usage:
 * <BatchExportPanel
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 */
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useCanvasListStore } from '@/stores/canvasListStore';
import { useBatchExportList } from '@/hooks/canvas/useBatchExportList';
import type { BatchListExportFormat } from '@/hooks/canvas/useBatchExportList';
import { BatchExportProgress } from './BatchExportProgress';
import styles from './BatchExportDialog.module.css';

interface BatchExportPanelProps {
  /** Whether the panel is visible */
  isOpen: boolean;
  /** Called when the user closes the panel */
  onClose: () => void;
}

const FORMAT_OPTIONS: { value: BatchListExportFormat; label: string; desc: string }[] = [
  { value: 'vibex', label: '.vibex', desc: 'ZIP压缩包，含manifest.json' },
  { value: 'json', label: '.json', desc: '纯JSON，结构化数据' },
];

export function BatchExportPanel({ isOpen, onClose }: BatchExportPanelProps) {
  const canvases = useCanvasListStore((s) => s.getSortedCanvases('updatedAt'));
  const favoriteIds = useCanvasListStore((s) => s.favoriteIds);

  // Selected canvas IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Export format
  const [format, setFormat] = useState<BatchListExportFormat>('vibex');

  const { status, progress, error, startExport, cancelExport } = useBatchExportList();

  // Filter to only favorited canvases for the export list
  const exportableCanvases = useMemo(() => {
    return canvases.filter((c) => favoriteIds.includes(c.id));
  }, [canvases, favoriteIds]);

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

  const handleToggleAll = useCallback(() => {
    if (selectedIds.size === exportableCanvases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(exportableCanvases.map((c) => c.id)));
    }
  }, [exportableCanvases, selectedIds]);

  const handleStart = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await startExport(Array.from(selectedIds), format);
  }, [selectedIds, startExport, format]);

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  // Reset selection when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isExporting = status === 'loading' || status === 'exporting';
  const canExport = selectedIds.size > 0 && !isExporting;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="批量导出">
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>批量导出收藏画布</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Canvas list */}
        <div className={styles.cardList} role="listbox" aria-multiselectable="true">
          {/* Select All row */}
          <div className={styles.selectAllRow}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={exportableCanvases.length > 0 && selectedIds.size === exportableCanvases.length}
                onChange={handleToggleAll}
                aria-label="全选"
              />
              <span>全选 ({selectedIds.size}/{exportableCanvases.length})</span>
            </label>
          </div>

          {/* Individual canvases */}
          {exportableCanvases.length === 0 ? (
            <div className={styles.empty}>当前没有收藏的画布</div>
          ) : (
            exportableCanvases.map((canvas) => (
              <div key={canvas.id} className={styles.cardItem} role="option">
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(canvas.id)}
                    onChange={() => handleToggle(canvas.id)}
                    disabled={isExporting}
                    aria-label={`选择 ${canvas.name}`}
                  />
                  <span className={styles.cardName}>{canvas.name}</span>
                  <span className={styles.cardType}>
                    {new Date(canvas.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                </label>
              </div>
            ))
          )}
        </div>

        {/* Format selector */}
        <div className={styles.formatRow}>
          <span className={styles.formatLabel}>导出格式：</span>
          <div className={styles.formatOptions} role="radiogroup" aria-label="导出格式">
            {FORMAT_OPTIONS.map((opt) => (
              <label key={opt.value} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="batch-export-format"
                  value={opt.value}
                  checked={format === opt.value}
                  onChange={() => setFormat(opt.value)}
                  disabled={isExporting}
                />
                <span>{opt.label}</span>
                <span className={styles.formatDesc}>{opt.desc}</span>
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
            导出 ({selectedIds.size} 个)
          </button>
        </div>
      </div>

      {/* Export progress overlay — shown when exporting */}
      {status !== 'idle' && (
        <div className={styles.progressOverlay}>
          <BatchExportProgress
            status={status}
            progress={progress}
            error={error}
            total={selectedIds.size}
            onCancel={cancelExport}
            onDismiss={handleDismiss}
          />
        </div>
      )}
    </div>
  );
}
