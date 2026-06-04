/**
 * ExportMenu — Dropdown export menu in DDSToolbar
 * Epic E007 (F002): Export UI Integration
 *
 * Provides quick access to JSON / Vibex / PDF / PNG / SVG export options.
 */

'use client';

import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { exportAsPNG, exportAsSVG, downloadFigmaJSON, FigmaExportChapter } from '@/hooks/useCanvasExport';
import { useCanvasExport } from '@/hooks/canvas/useCanvasExport';
import { useDDSCanvasStore } from '@/stores/dds';
import { ExportDialog } from '../export/ExportDialog';
import styles from './ExportMenu.module.css';

// ==================== Icons ====================

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.spinner}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function BatchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

// ==================== Export types ====================

type ExportFormat = 'JSON' | 'Vibex' | 'PDF' | 'PNG' | 'SVG' | 'Figma';

interface ExportOption {
  id: ExportFormat;
  label: string;
  description: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { id: 'JSON', label: 'JSON', description: '标准 JSON 格式，可用于数据迁移' },
  { id: 'Vibex', label: 'Vibex', description: 'VibeX 原生格式，完整保留所有数据' },
  { id: 'PDF', label: 'PDF', description: '跨平台文档格式，适合打印分享' },
  { id: 'PNG', label: 'PNG', description: '位图格式，适合嵌入文档或报告' },
  { id: 'SVG', label: 'SVG', description: '矢量格式，适合无损缩放' },
  { id: 'Figma', label: 'Figma', description: 'Figma 兼容 JSON，适合导入设计工具' },
];

// ==================== Helpers ====================

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== Component ====================

export interface ExportMenuProps {
  /** Additional class for the trigger button */
  className?: string;
  /** Disables the export menu */
  disabled?: boolean;
}

export const ExportMenu = memo(function ExportMenu({
  className = '',
  disabled = false,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);
  const [pngScale, setPngScale] = useState<1 | 2 | 3>(1); // PNG resolution selection (1x/2x/3x)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const chapters = useDDSCanvasStore((s) => s.chapters);
  const crossChapterEdges = useDDSCanvasStore((s) => s.crossChapterEdges);

  const { exportAsJSON, exportAsVibex } = useCanvasExport();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleExportJSON = useCallback(() => {
    setLoadingFormat('JSON');
    try {
      const allChapters = Object.values(chapters);
      const blob = exportAsJSON(allChapters, crossChapterEdges);
      downloadBlob(blob, `vibex-canvas-${new Date().toISOString().slice(0, 10)}.json`);
    } catch (err) {
      console.error('[ExportMenu] JSON export error:', err);
    } finally {
      setLoadingFormat(null);
      setIsOpen(false);
    }
  }, [chapters, crossChapterEdges, exportAsJSON]);

  const handleExportVibex = useCallback(async () => {
    setLoadingFormat('Vibex');
    try {
      const allChapters = Object.values(chapters);
      const blob = await exportAsVibex(allChapters, crossChapterEdges);
      downloadBlob(blob, `vibex-canvas-${new Date().toISOString().slice(0, 10)}.vibex`);
    } catch (err) {
      console.error('[ExportMenu] Vibex export error:', err);
    } finally {
      setLoadingFormat(null);
      setIsOpen(false);
    }
  }, [chapters, crossChapterEdges, exportAsVibex]);

  const handleExportPDF = useCallback(async () => {
    setLoadingFormat('PDF');
    try {
      // E006 backend API: POST /api/export/pdf
      const canvasEl = document.querySelector('[data-canvas-root]') as HTMLElement;
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: canvasEl?.outerHTML ?? '',
          title: `VibeX Canvas - ${new Date().toISOString().slice(0, 10)}`,
        }),
      });
      if (!response.ok) {
        throw new Error(`PDF export failed: ${response.statusText}`);
      }
      const blob = await response.blob();
      downloadBlob(blob, `vibex-canvas-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('[ExportMenu] PDF export error:', err);
    } finally {
      setLoadingFormat(null);
      setIsOpen(false);
    }
  }, []);

  const handleExportPNG = useCallback(async () => {
    setLoadingFormat('PNG');
    try {
      const canvasEl = document.querySelector('[data-canvas-root]') as HTMLElement;
      if (!canvasEl) {
        throw new Error('Canvas element not found');
      }
      const { exportAsPNGWithScale } = await import('@/hooks/useCanvasExport');
      await exportAsPNGWithScale(canvasEl, pngScale);
    } catch (err) {
      console.error('[ExportMenu] PNG export error:', err);
    } finally {
      setLoadingFormat(null);
      setIsOpen(false);
    }
  }, [pngScale]);

  const handleExportSVG = useCallback(async () => {
    setLoadingFormat('SVG');
    try {
      const canvasEl = document.querySelector('[data-canvas-root]') as HTMLElement;
      if (!canvasEl) {
        throw new Error('Canvas element not found');
      }
      await exportAsSVG(canvasEl);
    } catch (err) {
      console.error('[ExportMenu] SVG export error:', err);
    } finally {
      setLoadingFormat(null);
      setIsOpen(false);
    }
  }, []);

  const handleExportFigma = useCallback(async () => {
    setLoadingFormat('Figma');
    try {
      const chaptersData: FigmaExportChapter[] = Object.entries(chapters).map(
        ([id, chapter]) => ({
          id,
          label: chapter.type,
          nodes: [],
        })
      );
      downloadFigmaJSON(chaptersData);
    } catch (err) {
      console.error('[ExportMenu] Figma export error:', err);
    } finally {
      setLoadingFormat(null);
      setIsOpen(false);
    }
  }, [chapters]);

  const handleOpenBatchExport = useCallback(() => {
    setIsOpen(false);
    setIsExportDialogOpen(true);
  }, []);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      switch (format) {
        case 'JSON':
          handleExportJSON();
          break;
        case 'Vibex':
          await handleExportVibex();
          break;
        case 'PDF':
          await handleExportPDF();
          break;
        case 'PNG':
          await handleExportPNG();
          break;
        case 'SVG':
          await handleExportSVG();
          break;
        case 'Figma':
          await handleExportFigma();
          break;
      }
    },
    [handleExportJSON, handleExportVibex, handleExportPDF, handleExportPNG, handleExportSVG, handleExportFigma]
  );

  return (
    <div className={`${styles.wrapper} ${className}`} ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        onClick={() => !disabled && setIsOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="导出菜单"
        data-testid="export-menu-trigger"
      >
        <DownloadIcon />
        <span>导出</span>
        <ChevronIcon />
      </button>

      {isOpen && (
        <div
          className={styles.menu}
          role="menu"
          aria-label="导出选项"
          data-testid="export-menu-dropdown"
        >
          {loadingFormat === 'PNG' ? (
            <div className={styles.scalePanel}>
              <div className={styles.scalePanelLabel}>分辨率</div>
              <div className={styles.scaleButtons}>
                {([1, 2, 3] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.scaleBtn} ${pngScale === s ? styles.scaleBtnActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPngScale(s);
                    }}
                  >
                    {s}×
                  </button>
                ))}
              </div>
              <div className={styles.scaleHint}>
                {pngScale === 1 && '标准分辨率 (72 DPI)'}
                {pngScale === 2 && '2× 高清 (144 DPI)'}
                {pngScale === 3 && '3× 超高清 (216 DPI)'}
              </div>
            </div>
          ) : (
            EXPORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => handleExport(opt.id)}
                disabled={loadingFormat !== null}
                aria-label={`导出为 ${opt.label}`}
                data-testid={`export-option-${opt.id.toLowerCase()}`}
              >
                <span className={styles.menuItemLabel}>
                  {loadingFormat === opt.id ? (
                    <SpinnerIcon />
                  ) : (
                    opt.label
                  )}
                </span>
                <span className={styles.menuItemDesc}>{opt.description}</span>
              </button>
            ))
          )}

          {/* Batch export menu item */}
          <div className={styles.menuDivider} role="separator" />
          <button
            type="button"
            className={`${styles.menuItem} ${styles.menuItemBatch}`}
            role="menuitem"
            onClick={handleOpenBatchExport}
            aria-label="批量导出"
            data-testid="export-option-batch"
          >
            <span className={styles.menuItemLabel}>
              <BatchIcon />
              批量导出
            </span>
            <span className={styles.menuItemDesc}>PNG/SVG/PDF 多节点打包</span>
          </button>
        </div>
      )}

      <ExportDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </div>
  );
});
