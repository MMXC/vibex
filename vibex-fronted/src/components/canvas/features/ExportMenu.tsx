'use client';

/**
 * ExportMenu — 画布导出菜单 (PNG/SVG/JSON/Markdown)
 * E4-F9: 多格式导出
 *
 * 支持 PNG/SVG（图片）、JSON（完整数据）、Markdown（结构化描述）
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useCanvasExport, type ExportFormat, type ExportScope } from '@/hooks/canvas/useCanvasExport';
import { zipExporter, type BatchFormat } from '@/services/export/ZipExporter';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import styles from './ExportMenu.module.css';

interface ExportMenuProps {
  /** 导出触发按钮文字 */
  label?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

type ExportStatus = {
  format: ExportFormat;
  message: string;
  type: 'success' | 'error' | 'info';
};

export function ExportMenu({ label = '导出', disabled = false }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState<ExportScope>('all');
  const [selectedBatchFormat, setSelectedBatchFormat] = useState<BatchFormat>('png');
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { exportCanvas, isExporting } = useCanvasExport();
  const { contextNodes, flowNodes, componentNodes } = useCanvasStore();

  const clearStatusAfter = useCallback((ms: number) => {
    setTimeout(() => setExportStatus(null), ms);
  }, []);

  const handleExport = useCallback(async (format: ExportFormat) => {
    const statusLabel: Record<ExportFormat, string> = {
      png: 'PNG',
      svg: 'SVG',
      json: 'JSON',
      markdown: 'Markdown',
    };
    setExportStatus({ format, message: `正在导出 ${statusLabel[format]}...`, type: 'info' });
    try {
      await exportCanvas({ format, scope: selectedScope });
      setExportStatus({ format, message: `${statusLabel[format]} 导出成功 ✓`, type: 'success' });
      clearStatusAfter(2000);
    } catch (err) {
      setExportStatus({ format, message: `导出失败: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
      clearStatusAfter(4000);
    }
  }, [exportCanvas, selectedScope, clearStatusAfter]);

  const handleBatchExport = useCallback(async () => {
    setExportStatus({ format: 'png', message: '正在批量导出...', type: 'info' });
    setBatchProgress({ current: 0, total: 1 });
    try {
      const zipBlob = await zipExporter.exportZip(
        contextNodes,
        flowNodes,
        componentNodes,
        {
          format: selectedBatchFormat,
          scope: selectedScope === 'all' ? 'all' : selectedScope,
          onProgress: (current, total) => setBatchProgress({ current, total }),
        }
      );
      // Trigger download
      const timestamp = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vibex-batch-${selectedScope}-${timestamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      const count = contextNodes.length + flowNodes.length + componentNodes.length;
      setExportStatus({
        format: 'png',
        message: `批量导出成功 ✓ 共导出 ${count} 个节点`,
        type: 'success',
      });
      clearStatusAfter(3000);
    } catch (err) {
      setExportStatus({
        format: 'png',
        message: `批量导出失败: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
      clearStatusAfter(4000);
    } finally {
      setBatchProgress(null);
    }
  }, [contextNodes, flowNodes, componentNodes, selectedBatchFormat, selectedScope, clearStatusAfter]);

  // Close menu on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const scopeOptions: { value: ExportScope; label: string }[] = [
    { value: 'all', label: '全图 (所有树)' },
    { value: 'context', label: '上下文树' },
    { value: 'flow', label: '流程树' },
    { value: 'component', label: '组件树' },
  ];

  const formatOptions: { format: ExportFormat; label: string; description: string }[] = [
    { format: 'png', label: 'PNG', description: '位图，适合截图分享' },
    { format: 'svg', label: 'SVG', description: '矢量图，可无损缩放' },
    { format: 'json', label: 'JSON', description: '完整画布数据' },
    { format: 'markdown', label: 'Markdown', description: '结构化文本文档' },
  ];

  return (
    <div className={styles.exportMenuWrapper} ref={menuRef}>
      <button
        type="button"
        className={styles.exportTrigger}
        onClick={() => setIsOpen((v) => !v)}
        disabled={disabled || isExporting}
        aria-label="导出画布"
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="export-menu-trigger"
        title="导出画布为 PNG/SVG/JSON/Markdown"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>{label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.exportDropdown} role="menu" data-testid="export-dropdown">
          {/* Scope selector */}
          <div className={styles.scopeSection}>
            <span className={styles.sectionLabel}>导出范围</span>
            {scopeOptions.map((opt) => (
              <label key={opt.value} className={styles.scopeOption}>
                <input
                  type="radio"
                  name="export-scope"
                  value={opt.value}
                  checked={selectedScope === opt.value}
                  onChange={() => setSelectedScope(opt.value)}
                  className={styles.scopeRadio}
                />
                {opt.label}
              </label>
            ))}
          </div>

          {/* Format buttons */}
          <div className={styles.formatSection}>
            <span className={styles.sectionLabel}>格式</span>
            <div className={styles.formatGrid}>
              {formatOptions.map(({ format, label: formatLabel, description }) => (
                <button
                  key={format}
                  type="button"
                  className={styles.formatBtn}
                  onClick={() => handleExport(format)}
                  disabled={isExporting}
                  role="menuitem"
                  data-testid={`export-${format}-btn`}
                  title={description}
                  aria-label={`导出为 ${formatLabel}: ${description}`}
                >
                  <FormatIcon format={format} />
                  {formatLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Batch Export section */}
          <div className={styles.batchSection}>
            <span className={styles.sectionLabel}>批量导出 (ZIP)</span>
            <div className={styles.batchFormatRow}>
              <label className={styles.batchFormatLabel}>
                <input
                  type="radio"
                  name="batch-format"
                  value="png"
                  checked={selectedBatchFormat === 'png'}
                  onChange={() => setSelectedBatchFormat('png')}
                  className={styles.scopeRadio}
                />
                PNG
              </label>
              <label className={styles.batchFormatLabel}>
                <input
                  type="radio"
                  name="batch-format"
                  value="svg"
                  checked={selectedBatchFormat === 'svg'}
                  onChange={() => setSelectedBatchFormat('svg')}
                  className={styles.scopeRadio}
                />
                SVG
              </label>
            </div>
            <button
              type="button"
              className={styles.batchExportBtn}
              onClick={handleBatchExport}
              disabled={isExporting || (contextNodes.length === 0 && flowNodes.length === 0 && componentNodes.length === 0)}
              data-testid="export-all-btn"
              aria-label="导出全部节点为 ZIP 文件"
              title="将所有节点导出为 PNG/SVG 文件并打包为 ZIP"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {batchProgress
                ? `导出中 ${batchProgress.current}/${batchProgress.total}...`
                : `📦 导出全部节点 ZIP`}
            </button>
            {batchProgress && (
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(batchProgress.current / Math.max(batchProgress.total, 1)) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={batchProgress.current}
                  aria-valuemin={0}
                  aria-valuemax={batchProgress.total}
                />
              </div>
            )}
          </div>

          {/* Status message */}
          {exportStatus && (
            <div
              className={`${styles.exportStatus} ${styles[`exportStatus_${exportStatus.type}`]}`}
              role="status"
              aria-live="polite"
            >
              {exportStatus.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FormatIcon({ format }: { format: ExportFormat }) {
  if (format === 'png' || format === 'svg') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        {format === 'png' ? (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </>
        ) : (
          <>
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </>
        )}
      </svg>
    );
  }
  if (format === 'json') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    );
  }
  // markdown
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="7 15 10 12 7 9" />
      <line x1="14" y1="15" x2="17" y2="15" />
      <line x1="14" y1="9" x2="17" y2="9" />
    </svg>
  );
}
