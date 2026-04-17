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
import { useDDSCanvasStore } from '@/stores/dds';
import type { ChapterType, APIEndpointCard, StateMachineCard } from '@/types/dds';
import { exportToJSON, parseImportFile } from '@/services/dds';
import { exportDDSCanvasData, exportToStateMachine } from '@/services/dds/exporter';
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

function downloadJSON(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
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
}

export const DDSToolbar = memo(function DDSToolbar({
  onAIGenerate,
  isGenerating: isGeneratingProp,
  className = '',
}: DDSToolbarProps) {
  const activeChapter = useDDSCanvasStore((s) => s.activeChapter);
  const isFullscreen = useDDSCanvasStore((s) => s.isFullscreen);
  const isGenerating = useDDSCanvasStore((s) => s.isGenerating);
  const toggleFullscreen = useDDSCanvasStore((s) => s.toggleFullscreen);
  const chapters = useDDSCanvasStore((s) => s.chapters);
  const chatHistory = useDDSCanvasStore((s) => s.chatHistory);

  const chapterLabel = CHAPTER_LABELS[activeChapter];
  const generating = isGeneratingProp ?? isGenerating;

  // E4-U3/U4: Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // E4-U3: Download OpenAPI handler
  const handleDownloadOpenAPI = useCallback(() => {
    try {
      const apiCards = chapters.api.cards as APIEndpointCard[];
      const json = exportDDSCanvasData(apiCards);
      downloadJSON(json, 'openapi.json');
      setIsExportModalOpen(false);
      setExportError(null);
    } catch (err) {
      setExportError('导出 OpenAPI 失败');
      console.error('[DDSToolbar] OpenAPI export error:', err);
    }
  }, [chapters.api.cards]);

  // E4-U4: Download StateMachine handler
  const handleDownloadStateMachine = useCallback(() => {
    try {
      const smCards = chapters['business-rules'].cards as StateMachineCard[];
      const json = exportToStateMachine(smCards);
      downloadJSON(json, 'statemachine.json');
      setIsExportModalOpen(false);
      setExportError(null);
    } catch (err) {
      setExportError('导出 StateMachine 失败');
      console.error('[DDSToolbar] StateMachine export error:', err);
    }
  }, [chapters['business-rules'].cards]);

  // ---- Export handler ----
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

          {/* E4-U3/U4: Export button */}
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => setIsExportModalOpen(true)}
            aria-label="导出"
            title="导出为 OpenAPI / StateMachine"
          >
            导出
          </button>
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

      {/* E4-U3/U4: Export modal */}
      {isExportModalOpen && (
        <div
          className={styles.exportOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setIsExportModalOpen(false); }}
        >
          <div className={styles.exportModal}>
            <div className={styles.modalHeader}>
              <h2 id="export-modal-title" className={styles.modalTitle}>导出文档</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setIsExportModalOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
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
              {exportError && (
                <p className={styles.exportError} role="alert">{exportError}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default DDSToolbar;
