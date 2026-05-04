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
  forwardRef,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
  type RefObject,
} from 'react';
import { useDDSCanvasStore } from '@/stores/dds';
import type { ChapterType, ChapterData } from '@/types/dds';
import { DDSPanel } from './DDSPanel';
import { ChapterPanel } from './ChapterPanel';
import { DDSThumbNav, DDSThumbButton } from './DDSThumbNav';
import { useChapterURLSync } from '@/hooks/dds/useChapterURLSync';
import styles from './DDSScrollContainer.module.css';

// ==================== Constants ====================

const CHAPTER_ORDER: ChapterType[] = ['requirement', 'context', 'flow', 'api', 'business-rules'];

const CHAPTER_LABELS: Record<ChapterType, string> = {
  requirement: '需求',
  context: '上下文',
  flow: '流程',
  api: 'API',
  'business-rules': '业务规则',
};

const CHAPTER_SHORT_LABELS: Record<ChapterType, string> = {
  requirement: '求',
  context: '上',
  flow: '流',
  api: 'API',
  'business-rules': '规',
};

// ==================== Props ====================

export interface DDSScrollContainerProps {
  /** Render function for a chapter's content */
  renderChapterContent?: (chapter: ChapterType, data: ChapterData) => ReactNode;
  /** Additional class for the root container */
  className?: string;
  /** Ref forwarded to the root scroll container div */
  rootRef?: RefObject<HTMLDivElement | null>;
  /** E1-S2: 模板 requirement 内容，用于 auto-fill */
  templateRequirement?: string;
}

// ==================== Component ====================

export const DDSScrollContainer = memo(
  forwardRef<HTMLDivElement, DDSScrollContainerProps>(function DDSScrollContainer({
  renderChapterContent,
  className = '',
  rootRef,
  templateRequirement,
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
    api: null,
    'business-rules': null,
  });

  // Set ref for a panel
  const setPanelRef = useCallback((chapter: ChapterType) => (el: HTMLDivElement | null) => {
    panelRefs.current[chapter] = el;
  }, []);

  // E2-U3: Jump to a chapter panel via scrollIntoView
  // Also called by toolbar chapter tabs (via setActiveChapter → useEffect below)
  const navigateToChapter = useCallback(
    (chapter: ChapterType) => {
      const el = panelRefs.current[chapter];
      if (!el) return;

      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
    },
    []
  );

  // E2-U3: Listen to activeChapter changes from toolbar tabs and scroll to the chapter.
  // Use a ref to distinguish internal (IntersectionObserver) vs external (toolbar) changes.
  const lastScrollChapterRef = useRef<ChapterType | null>(null);
  useEffect(() => {
    // If the active chapter changed to a value different from what we just scrolled to,
    // it means the change came from an external source (toolbar tab click → setActiveChapter).
    // In that case, scroll to the new chapter.
    if (activeChapter !== lastScrollChapterRef.current) {
      const el = panelRefs.current[activeChapter];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
      lastScrollChapterRef.current = activeChapter;
    }
  }, [activeChapter]);

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
        lastScrollChapterRef.current = bestChapter;
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
      ref={rootRef}
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
                // Default: render ChapterPanel with card CRUD
                <ChapterPanel chapter={chapter} templateRequirement={chapter === 'requirement' ? templateRequirement : undefined} />
              )}
            </div>
          </DDSPanel>
        );
      })}
    </div>
  );
}))

export default DDSScrollContainer;
