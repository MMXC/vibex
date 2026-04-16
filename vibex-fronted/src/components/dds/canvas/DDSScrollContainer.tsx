/**
 * DDSScrollContainer — Horizontal Scroll-Snap Canvas Layout
 * Epic 2: F10
 *
 * 3-panel horizontal scroll-snap layout:
 * - requirement | context | flow
 * - Collapsed: 80px with vertical label
 * - Expanded: flex:1 with content
 * - ThumbNav inside each panel for quick chapter switching
 */

'use client';

import React, {
  memo,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useDDSCanvasStore } from '@/stores/dds';
import type { ChapterType, ChapterData } from '@/types/dds';
import { DDSPanel } from './DDSPanel';
import { DDSThumbNav, DDSThumbButton } from './DDSThumbNav';
import { useChapterURLSync } from '@/hooks/dds/useChapterURLSync';
import styles from './DDSScrollContainer.module.css';

// ==================== Constants ====================

const CHAPTER_ORDER: ChapterType[] = ['requirement', 'context', 'flow'];

const CHAPTER_LABELS: Record<ChapterType, string> = {
  requirement: '需求',
  context: '上下文',
  flow: '流程',
};

const CHAPTER_SHORT_LABELS: Record<ChapterType, string> = {
  requirement: '求',
  context: '上',
  flow: '流',
};

// ==================== Props ====================

export interface DDSScrollContainerProps {
  /** Render function for a chapter's content */
  renderChapterContent?: (chapter: ChapterType, data: ChapterData) => ReactNode;
  /** Additional class for the root container */
  className?: string;
}

// ==================== Component ====================

export const DDSScrollContainer = memo(function DDSScrollContainer({
  renderChapterContent,
  className = '',
}: DDSScrollContainerProps) {
  // E2-U1-AC1: URL sync — reads ?chapter= from URL, updates URL when activeChapter changes
  useChapterURLSync();

  const activeChapter = useDDSCanvasStore((s) => s.activeChapter);
  const setActiveChapter = useDDSCanvasStore((s) => s.setActiveChapter);
  const chapters = useDDSCanvasStore((s) => s.chapters);
  const isFullscreen = useDDSCanvasStore((s) => s.isFullscreen);

  // Refs for each panel — used for scrollIntoView
  const panelRefs = useRef<Record<ChapterType, HTMLDivElement | null>>({
    requirement: null,
    context: null,
    flow: null,
  });

  // Set ref for a panel
  const setPanelRef = useCallback((chapter: ChapterType) => (el: HTMLDivElement | null) => {
    panelRefs.current[chapter] = el;
  }, []);

  // Jump to a chapter panel via scrollIntoView
  const navigateToChapter = useCallback(
    (chapter: ChapterType) => {
      const el = panelRefs.current[chapter];
      if (!el) return;

      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });

      // Also update the active chapter in the store
      setActiveChapter(chapter);
    },
    [setActiveChapter]
  );

  // Scroll event handler — detect which panel is in view and sync activeChapter
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;

      // Find which panel is most visible
      let bestChapter: ChapterType = activeChapter;
      let bestRatio = 0;

      for (const chapter of CHAPTER_ORDER) {
        const el = panelRefs.current[chapter];
        if (!el) continue;

        const panelLeft = el.offsetLeft - container.offsetLeft;
        const panelRight = panelLeft + el.offsetWidth;

        // Calculate overlap ratio
        const visibleLeft = Math.max(panelLeft, scrollLeft);
        const visibleRight = Math.min(panelRight, scrollLeft + containerWidth);
        const visibleWidth = Math.max(0, visibleRight - visibleLeft);
        const ratio = visibleWidth / el.offsetWidth;

        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestChapter = chapter;
        }
      }

      if (bestChapter !== activeChapter && bestRatio > 0.3) {
        setActiveChapter(bestChapter);
      }
    },
    [activeChapter, setActiveChapter]
  );

  // When activeChapter changes externally (e.g. from store), scroll to that panel
  useEffect(() => {
    const el = panelRefs.current[activeChapter];
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
    }
  }, [activeChapter]);

  return (
    <div
      className={`${styles.ddsHorizontal} ${isFullscreen ? styles.fullscreen : ''} ${className}`}
      onScroll={handleScroll}
      data-theme="dark"
      role="main"
      aria-label="详细设计画布"
    >
      {CHAPTER_ORDER.map((chapter) => {
        const data = chapters[chapter];
        const isExpanded = activeChapter === chapter;

        return (
          <DDSPanel
            key={chapter}
            chapterType={chapter}
            label={CHAPTER_LABELS[chapter]}
            isExpanded={isExpanded}
            panelRef={setPanelRef(chapter)}
          >
            {/* Thumbnail nav at bottom */}
            <DDSThumbNav isCollapsed={!isExpanded}>
              {CHAPTER_ORDER.map((navChapter) => (
                <DDSThumbButton
                  key={navChapter}
                  label={CHAPTER_LABELS[navChapter]}
                  shortLabel={CHAPTER_SHORT_LABELS[navChapter]}
                  isActive={activeChapter === navChapter}
                  onClick={() => navigateToChapter(navChapter)}
                />
              ))}
            </DDSThumbNav>

            {/* Chapter content */}
            <div className={styles.panelContent}>
              {data.loading ? (
                <div className={styles.loadingOverlay}>
                  <div className={styles.loadingSpinner} aria-label="加载中" />
                </div>
              ) : data.error ? (
                <div className={styles.errorBanner} role="alert">
                  {data.error}
                </div>
              ) : renderChapterContent ? (
                renderChapterContent(chapter, data)
              ) : (
                // Default empty state
                <DefaultChapterContent chapter={chapter} />
              )}
            </div>
          </DDSPanel>
        );
      })}
    </div>
  );
});

// ==================== Default Empty Content ====================

function DefaultChapterContent({ chapter }: { chapter: ChapterType }) {
  const placeholders: Record<ChapterType, string> = {
    requirement: '暂无需求卡片\n\n点击 + 添加用户故事',
    context: '暂无限界上下文\n\n点击 + 添加上下文',
    flow: '暂无流程步骤\n\n点击 + 添加流程',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--color-text-muted)',
        fontSize: '14px',
        whiteSpace: 'pre-line',
        textAlign: 'center',
      }}
      role="status"
      aria-label={placeholders[chapter]}
    >
      {placeholders[chapter]}
    </div>
  );
}

export default DDSScrollContainer;
