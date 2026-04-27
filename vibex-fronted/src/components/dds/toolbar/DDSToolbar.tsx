/**
 * DDSToolbar — Sticky Top Toolbar
 * Epic 2: F13
 *
 * Displays current chapter name, AI generation button, and fullscreen toggle.
 * Uses useDDSCanvasStore for activeChapter and isFullscreen state.
 * Dark glassmorphism style.
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import type { ChapterType, APIEndpointCard, StateMachineCard } from '@/types/dds';
import { exportToJSON, parseImportFile } from '@/services/dds';
import { exportDDSCanvasData, exportToStateMachine } from '@/services/dds/exporter';
import { useDDSCanvasStore, ddsChapterActions } from '@/stores/dds';
import { useCanvasExport } from '@/hooks/canvas/useCanvasExport';
import { useCanvasImport } from '@/hooks/canvas/useCanvasImport';
import styles from './DDSToolbar.module.css';

// ==================== Constants ====================

const CHAPTER_LABELS: Record<ChapterType, string> = {
  requirement: '需求',
  context: '上下文',
  flow: '流程',
  api: 'API',
  'business-rules': '业务规则',
};

// ==================== Icon SVGs ====================

function AiIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
      <circle cx="7.5" cy="14.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="14.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

// ==================== Shared download helper ====================

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== Component ====================

export interface DDSToolbarProps {
  /** Called when AI button is clicked */
  onAIGenerate?: () => void;
  /** Override isGenerating from store */
  isGenerating?: boolean;
  /** Additional class */
  className?: string;
  /** agentSession URL param */
  agentSession?: string | null;
}

export const DDSToolbar = memo(function DDSToolbar({
  onAIGenerate,
  isGenerating: isGeneratingProp,
  className = '',
  agentSession,
}: DDSToolbarProps) {
  const activeChapter = useDDSCanvasStore((s) => s.activeChapter);
  const isFullscreen = useDDSCanvasStore((s) => s.isFullscreen);
  const isGenerating = useDDSCanvasStore((s) => s.isGenerating);
  const toggleFullscreen = useDDSCanvasStore((s) => s.toggleFullscreen);
  const chapters = useDDSCanvasStore((s) => s.chapters);
  const chatHistory = useDDSCanvasStore((s) => s.chatHistory);

  const chapterLabel = CHAPTER_LABELS[activeChapter];
  const generating = isGeneratingProp ?? isGenerating;

  const crossChapterEdges = useDDSCanvasStore((s) => s.crossChapterEdges);
  const { exportAsJSON, exportAsVibex } = useCanvasExport();
  const { showFilePicker, importFile } = useCanvasImport();

  const [ddsExportModalOpen, setDdsExportModalOpen] = useState(false);

  // E4-U3: Download OpenAPI handler
  const handleDownloadOpenAPI = useCallback(() => {
    try {
      const apiCards = chapters.api.cards as APIEndpointCard[];
      const json = exportDDSCanvasData(apiCards);
      downloadBlob(new Blob([json], { type: 'application/json' }), 'openapi.json');
      setDdsExportModalOpen(false);
    } catch (err) {
      console.error('[DDSToolbar] OpenAPI export error:', err);
    }
  }, [chapters.api.cards]);

  // E4-U4: Download StateMachine handler
  const handleDownloadStateMachine = useCallback(() => {
    try {
      const smCards = chapters['business-rules'].cards as StateMachineCard[];
      const json = exportToStateMachine(smCards);
      downloadBlob(new Blob([json], { type: 'application/json' }), 'statemachine.json');
      setDdsExportModalOpen(false);
    } catch (err) {
      console.error('[DDSToolbar] StateMachine export error:', err);
    }
  }, [chapters['business-rules'].cards]);

  const handleDDSExportJSON = () => {
    const allChapters = Object.values(chapters);
    const blob = exportAsJSON(allChapters, crossChapterEdges);
    downloadBlob(blob, `vibex-canvas-${new Date().toISOString().slice(0,10)}.json`);
    setDdsExportModalOpen(false);
  };

  const handleDDSExportVibex = async () => {
    const allChapters = Object.values(chapters);
    const blob = await exportAsVibex(allChapters, crossChapterEdges);
    downloadBlob(blob, `vibex-canvas-${new Date().toISOString().slice(0,10)}.vibex`);
    setDdsExportModalOpen(false);
  };

  const handleDDSImport = async () => {
    const file = await showFilePicker();
    if (!file) return;
    try {
      await importFile(file, (importedChapters, warnings, _rawDoc) => {
        ddsChapterActions.setChapters(importedChapters);
        if (warnings.length > 0) {
          console.warn('[DDSToolbar] Import warnings:', warnings);
        }
      });
    } catch (err) {
      console.error('[DDSToolbar] DDS import error:', err);
    }
  };

  // ---- Export handler (E4 legacy) ----
  const handleExport = () => {
    exportToJSON(
      'dds-canvas',
      'DDS Project',
      {
        requirement: { cards: chapters.requirement.cards, edges: chapters.requirement.edges },
        context: { cards: chapters.context.cards, edges: chapters.context.edges },
        flow: { cards: chapters.flow.cards, edges: chapters.flow.edges },
        api: { cards: chapters.api.cards, edges: chapters.api.edges },
        'business-rules': { cards: chapters['business-rules'].cards, edges: chapters['business-rules'].edges },
      },
      chatHistory
    );
  };

  // ---- Import handler ----
  const importRef = React.useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const handleImportClick = () => importRef.current?.click();
  const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const data = await parseImportFile(file);
      window.dispatchEvent(new CustomEvent('dds:import', { detail: { data } }));
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      e.target.value = '';
    }
  };

  const handleFullscreenToggle = () => {
    toggleFullscreen();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {/* ignore */});
    } else {
      document.exitFullscreen?.().catch(() => {/* ignore */});
    }
  };

  const handleOpenExportModal = () => setDdsExportModalOpen(true);

  return (
    <>
      <header
        className={`${styles.toolbar} ${className}`}
        data-theme="dark"
        role="banner"
      >
        {/* Left: Chapter indicator */}
        <div className={styles.leftSection}>
          {/* E2-U3: Clickable chapter tabs for quick navigation */}
          {(Object.keys(CHAPTER_LABELS) as ChapterType[]).map((ch) => (
            <button
              key={ch}
              type="button"
              className={`${styles.chapterTab} ${activeChapter === ch ? styles.chapterTabActive : ''}`}
              onClick={() => useDDSCanvasStore.getState().setActiveChapter(ch)}
              aria-label={`切换到${CHAPTER_LABELS[ch]}章节`}
              aria-pressed={activeChapter === ch}
            >
              {CHAPTER_LABELS[ch]}
            </button>
          ))}

          {/* E4-U3/U4 + E2: Export button */}
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleOpenExportModal}
            aria-label="导出画布"
            title="导出/导入画布数据"
            data-testid="canvas-export-btn"
          >
            导出
          </button>

          {/* E4: Analytics button */}
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => window.open('/dashboard?open=funnel', '_blank')}
            aria-label="查看分析漏斗"
            title="查看分析漏斗"
            data-testid="canvas-analytics-btn"
          >
            <ChartIcon />
            <span>分析</span>
          </button>

          {/* E2: Import button with hidden file input (Bug fix: wire hidden input) */}
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => importRef.current?.click()}
            aria-label="导入画布"
            title="从 .vibex 或 .json 文件导入"
            data-testid="canvas-import-btn"
          >
            导入
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json,.vibex"
            style={{ display: 'none' }}
            data-testid="canvas-import-input"
            onChange={handleImportChange}
          />
        </div>

        {/* Right: Action buttons */}
        <div className={styles.rightSection}>
          {/* AI Generate button */}
          <button
            type="button"
            className={`${styles.actionButton} ${styles.aiButton}`}
            onClick={onAIGenerate}
            disabled={generating}
            aria-label={generating ? 'AI 生成中...' : 'AI 生成'}
            aria-busy={generating}
          >
            <AiIcon />
            <span>{generating ? '生成中...' : 'AI 生成'}</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            type="button"
            className={`${styles.iconButton} ${isFullscreen ? styles.iconButtonActive : ''}`}
            onClick={handleFullscreenToggle}
            aria-label={isFullscreen ? '退出全屏' : '全屏'}
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </button>
        </div>

        {/* Import error */}
        {importError && (
          <div className={styles.toast} role="alert" aria-live="polite">
            {importError}
          </div>
        )}
      </header>

      {/* E4-U3/U4 + E2: Export/Import modal */}
      {ddsExportModalOpen && (
        <div
          className={styles.exportOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setDdsExportModalOpen(false); }}
        >
          <div className={styles.exportModal}>
            <div className={styles.modalHeader}>
              <h2 id="export-modal-title" className={styles.modalTitle}>导出/导入</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setDdsExportModalOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* E2: Canvas Export */}
              <h3 className={styles.exportSectionTitle}>画布导出</h3>
              <button
                type="button"
                className={styles.exportOption}
                onClick={handleDDSExportJSON}
                data-testid="export-json-btn"
              >
                <span className={styles.exportOptionTitle}>导出为 .json</span>
                <span className={styles.exportOptionDesc}>可读的 JSON 格式，包含 schemaVersion、metadata、chapters</span>
              </button>
              <button
                type="button"
                className={styles.exportOption}
                onClick={handleDDSExportVibex}
                data-testid="export-vibex-btn"
              >
                <span className={styles.exportOptionTitle}>导出为 .vibex</span>
                <span className={styles.exportOptionDesc}>gzip 压缩格式，文件更小</span>
              </button>

              {/* E4-U3/U4: OpenAPI / StateMachine */}
              <h3 className={styles.exportSectionTitle}>代码导出</h3>
              <button
                type="button"
                className={styles.exportOption}
                onClick={handleDownloadOpenAPI}
              >
                <span className={styles.exportOptionTitle}>OpenAPI 3.0</span>
                <span className={styles.exportOptionDesc}>导出 API 端点为 OpenAPI JSON</span>
              </button>
              <button
                type="button"
                className={styles.exportOption}
                onClick={handleDownloadStateMachine}
              >
                <span className={styles.exportOptionTitle}>State Machine JSON</span>
                <span className={styles.exportOptionDesc}>导出版务规则状态机</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default DDSToolbar;
