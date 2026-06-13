/**
 * ExportPanel — Canvas Export as Code UI Panel
 * Sprint94 E4: Canvas Export as Code
 *
 * Provides a side panel with:
 * - 4 format tabs: React, SVG, Markdown, JSON
 * - Scrollable, zoomable preview area
 * - Copy to Clipboard button
 * - Download button
 *
 * Usage:
 * <ExportPanel onClose={handleClose} />
 */
'use client';

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { useExportPanelStore, ExportPanelFormat } from '@/stores/exportStore';
import { useExport } from '@/hooks/canvas/useExport';
import styles from './ExportPanel.module.css';

// ==================== Icons ====================

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.spinner}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ==================== Format Configuration ====================

const FORMAT_TABS: { id: ExportPanelFormat; label: string; description: string; icon: string }[] = [
  { id: 'react', label: 'React', description: 'JSX Component', icon: '⚛️' },
  { id: 'svg', label: 'SVG', description: 'Vector Graphics', icon: '📐' },
  { id: 'md', label: 'Markdown', description: 'Structured Text', icon: '📝' },
  { id: 'json', label: 'JSON', description: 'Full Canvas Data', icon: '📋' },
];

// ==================== Preview Content ====================

interface PreviewContentProps {
  data: string;
  format: ExportPanelFormat;
  zoom: number;
}

const PreviewContent = memo(function PreviewContent({ data, format, zoom }: PreviewContentProps) {
  const scale = zoom / 100;

  if (format === 'svg' && data.startsWith('<?xml')) {
    // SVG: render as inline SVG via dangerouslySetInnerHTML (pre-sanitized server output)
    return (
      <div
        className={styles.svgPreviewContainer}
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        dangerouslySetInnerHTML={{ __html: data.replace(/<\?xml[^>]*\?>\s*/g, '') }}
      />
    );
  }

  if (format === 'react' || format === 'md' || format === 'json') {
    return (
      <div
        className={styles.codePreview}
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <pre>
          <code>{data}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className={styles.codePreview} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <pre><code>{data}</code></pre>
    </div>
  );
});

// ==================== Main Component ====================

export interface ExportPanelProps {
  /** Called when the panel requests to close */
  onClose: () => void;
}

/**
 * ExportPanel — Canvas Export as Code UI
 *
 * Displays a side panel with format tabs, zoomable preview,
 * and copy/download action buttons.
 */
export const ExportPanel = memo(function ExportPanel({ onClose }: ExportPanelProps) {
  const {
    isOpen,
    format,
    preview,
    isLoading,
    error,
    previewZoom,
    copySuccess,
    setFormat,
    setPreviewZoom,
    copyToClipboard,
    download,
    showCopySuccess,
  } = useExportPanelStore();

  const { fetchPreview } = useExport(
    useExportPanelStore((s) => s.canvasId),
    format,
    { autoFetch: false }
  );

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when format changes
  useEffect(() => {
    if (previewContainerRef.current) {
      previewContainerRef.current.scrollTop = 0;
    }
  }, [format, preview?.data]);

  const handleFormatChange = useCallback(
    (newFormat: ExportPanelFormat) => {
      setFormat(newFormat);
    },
    [setFormat]
  );

  const handleRefresh = useCallback(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard();
    if (ok) showCopySuccess();
  }, [copyToClipboard, showCopySuccess]);

  const handleZoomIn = useCallback(() => {
    setPreviewZoom(previewZoom + 25);
  }, [previewZoom, setPreviewZoom]);

  const handleZoomOut = useCallback(() => {
    setPreviewZoom(previewZoom - 25);
  }, [previewZoom, setPreviewZoom]);

  const handleDownload = useCallback(() => {
    download();
  }, [download]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <aside className={styles.panel} role="dialog" aria-modal="true" aria-label="Canvas Export">
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <span className={styles.headerIcon}>📦</span>
            <h2>Export as Code</h2>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close export panel"
            type="button"
          >
            <CloseIcon />
          </button>
        </header>

        {/* Format Tabs */}
        <nav className={styles.tabs} role="tablist" aria-label="Export format">
          {FORMAT_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={format === tab.id}
              className={`${styles.tab} ${format === tab.id ? styles.tabActive : ''}`}
              onClick={() => handleFormatChange(tab.id)}
              type="button"
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
              <span className={styles.tabDesc}>{tab.description}</span>
            </button>
          ))}
        </nav>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          {/* Zoom controls */}
          <div className={styles.zoomControls} role="group" aria-label="Preview zoom">
            <button
              className={styles.toolButton}
              onClick={handleZoomOut}
              disabled={previewZoom <= 50}
              aria-label="Zoom out"
              type="button"
              title="Zoom out"
            >
              <ZoomOutIcon />
            </button>
            <span className={styles.zoomLabel}>{previewZoom}%</span>
            <button
              className={styles.toolButton}
              onClick={handleZoomIn}
              disabled={previewZoom >= 200}
              aria-label="Zoom in"
              type="button"
              title="Zoom in"
            >
              <ZoomInIcon />
            </button>
          </div>

          {/* Refresh */}
          <button
            className={styles.toolButton}
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Refresh preview"
            type="button"
            title="Refresh"
          >
            <RefreshIcon />
          </button>

          {/* Stats */}
          {preview && (
            <span className={styles.stats}>
              {preview.cards ?? '?'} cards · {preview.edges ?? '?'} edges
            </span>
          )}
        </div>

        {/* Preview Area */}
        <div className={styles.previewArea} ref={previewContainerRef}>
          {isLoading && (
            <div className={styles.loadingState}>
              <SpinnerIcon />
              <span>Generating {format.toUpperCase()} preview…</span>
            </div>
          )}

          {error && !isLoading && (
            <div className={styles.errorState} role="alert">
              <span className={styles.errorIcon}>⚠️</span>
              <span className={styles.errorText}>{error}</span>
              <button
                className={styles.retryButton}
                onClick={handleRefresh}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && preview && (
            <PreviewContent data={preview.data} format={format} zoom={previewZoom} />
          )}

          {!isLoading && !error && !preview && (
            <div className={styles.emptyState}>
              <span>Select a format to preview</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <footer className={styles.footer}>
          <button
            className={`${styles.actionButton} ${styles.copyButton} ${copySuccess ? styles.copySuccess : ''}`}
            onClick={handleCopy}
            disabled={!preview || isLoading}
            type="button"
          >
            {copySuccess ? <CheckIcon /> : <CopyIcon />}
            {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
          </button>

          <button
            className={`${styles.actionButton} ${styles.downloadButton}`}
            onClick={handleDownload}
            disabled={!preview || isLoading}
            type="button"
          >
            <DownloadIcon />
            Download
          </button>
        </footer>
      </aside>
    </>
  );
});
