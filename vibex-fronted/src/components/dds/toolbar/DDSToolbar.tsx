/**
 * DDSToolbar — Sticky Top Toolbar
 * Epic 2: F13
 *
 * Displays current chapter name, AI generation button, and fullscreen toggle.
 * Uses useDDSCanvasStore for activeChapter and isFullscreen state.
 * Dark glassmorphism style.
 */

'use client';

import React, { memo } from 'react';
import { useDDSCanvasStore } from '@/stores/dds';
import type { ChapterType } from '@/types/dds';
import styles from './DDSToolbar.module.css';

// ==================== Constants ====================

const CHAPTER_LABELS: Record<ChapterType, string> = {
  requirement: '需求',
  context: '上下文',
  flow: '流程',
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

  const chapterLabel = CHAPTER_LABELS[activeChapter];
  const generating = isGeneratingProp ?? isGenerating;

  const handleFullscreenToggle = () => {
    toggleFullscreen();
    // Toggle browser fullscreen
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {/* ignore */});
    } else {
      document.exitFullscreen?.().catch(() => {/* ignore */});
    }
  };

  return (
    <header
      className={`${styles.toolbar} ${className}`}
      data-theme="dark"
      role="banner"
    >
      {/* Left: Chapter indicator */}
      <div className={styles.leftSection}>
        <div className={styles.chapterIndicator} aria-label={`当前章节: ${chapterLabel}`}>
          <span className={styles.chapterDot} aria-hidden="true" />
          <span className={styles.chapterName}>{chapterLabel}</span>
        </div>
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
    </header>
  );
});

export default DDSToolbar;
