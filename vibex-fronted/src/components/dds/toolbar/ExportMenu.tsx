/**
 * ExportMenu — Dropdown export menu in DDSToolbar
 * Epic E007 (F002): Export UI Integration
 *
 * Provides quick access to JSON / Vibex / PDF / PNG / SVG export options.
 */

'use client';

import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { exportAsPNG, exportAsSVG } from '@/hooks/useCanvasExport';
import { useCanvasExport } from '@/hooks/canvas/useCanvasExport';
import { useDDSCanvasStore } from '@/stores/dds';
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

// ==================== Export types ====================

type ExportFormat = 'JSON' | 'Vibex' | 'PDF' | 'PNG' | 'SVG';

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
      await exportAsPNG(canvasEl);
    } catch (err) {
      console.error('[ExportMenu] PNG export error:', err);
    } finally {
      setLoadingFormat(null);
      setIsOpen(false);
    }
  }, []);

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
      }
    },
    [handleExportJSON, handleExportVibex, handleExportPDF, handleExportPNG, handleExportSVG]
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
          {EXPORT_OPTIONS.map((opt) => (
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
          ))}
        </div>
      )}
    </div>
  );
});
