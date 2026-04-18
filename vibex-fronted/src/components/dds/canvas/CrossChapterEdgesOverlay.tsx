/**
 * CrossChapterEdgesOverlay — SVG Overlay for Cross-Chapter DAG Edges
 * Epic 4: E4-U1, E4-U2
 *
 * Renders dashed SVG lines between cards from different chapters,
 * overlaid on top of the DDSScrollContainer.
 *
 * Layout assumptions:
 * - 3 chapters side by side: requirement | context | flow
 * - When a chapter is active it expands to full width; others collapse to 80px
 * - Chapter offsets are calculated from the scroll container's bounding rect:
 *   requirement → 0%
 *   context     → 33.33%  (collapsed: ~80px, but we use % for responsive)
 *   flow        → 66.66%
 * - Line endpoints: source card center + chapter offset, target card center + chapter offset
 */

'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDDSCanvasStore } from '@/stores/dds';
import type { DDSEdge, ChapterType, DDSCard } from '@/types/dds';

// ==================== Constants ====================

const CHAPTER_ORDER: ChapterType[] = ['requirement', 'context', 'flow', 'api', 'business-rules'];

/** Chapter horizontal offset as fraction of scroll container width */
const CHAPTER_OFFSETS: Record<ChapterType, number> = {
// P2-001 fix: evenly distributed (0, 0.25, 0.5, 0.75, 1)
  context: 0.25,
  flow: 0.5,
  api: 0.75,
  'business-rules': 1,
};

const COLLAPSED_WIDTH_PX = 80; // DDSPanel panelCollapsed width
const PANEL_HEADER_HEIGHT_PX = 48; // approximate panel header height

// ==================== Props ====================

export interface CrossChapterEdgesOverlayProps {
  /** Ref to the DDSScrollContainer root element */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

// ==================== Helpers ====================

/** Find which chapter a card belongs to by ID */
function findCardChapter(
  cardId: string,
  chapters: Record<ChapterType, { cards: DDSCard[] }>
): ChapterType | null {
  for (const chapter of CHAPTER_ORDER) {
    if (chapters[chapter].cards.some((c) => c.id === cardId)) {
      return chapter;
    }
  }
  return null;
}

/** Find a card by ID across all chapters */
function findCard(
  cardId: string,
  chapters: Record<ChapterType, { cards: DDSCard[] }>
): DDSCard | null {
  for (const chapter of CHAPTER_ORDER) {
    const card = chapters[chapter].cards.find((c) => c.id === cardId);
    if (card) return card;
  }
  return null;
}

// ==================== Component ====================

export const CrossChapterEdgesOverlay = memo(function CrossChapterEdgesOverlay({
  scrollContainerRef,
  className = '',
}: CrossChapterEdgesOverlayProps) {
  const crossChapterEdges = useDDSCanvasStore((s) => s.crossChapterEdges);
  const chapters = useDDSCanvasStore((s) => s.chapters);

  // Track container width for responsive layout
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const rafRef = useRef<number>(0);

  // Sync container dimensions on resize/scroll
  const updateDimensions = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        const rect = scrollContainerRef.current.getBoundingClientRect();
        setContainerWidth(rect.width);
        setContainerHeight(rect.height);
      }
    });
  }, [scrollContainerRef]);

  useEffect(() => {
    updateDimensions();
    const el = scrollContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateDimensions);
    ro.observe(el);
    el.addEventListener('scroll', updateDimensions, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', updateDimensions);
      cancelAnimationFrame(rafRef.current);
    };
  }, [scrollContainerRef, updateDimensions]);

  // Build chapter → collapsed pixel offset map
  // Collapsed panels are always 80px regardless of scroll position.
  // When expanded, a chapter fills the remaining space.
  const collapsedOffsets = (() => {
    const offsets: Record<ChapterType, number> = {
      requirement: 0,
      context: COLLAPSED_WIDTH_PX,
      flow: COLLAPSED_WIDTH_PX * 2,
      api: COLLAPSED_WIDTH_PX * 3,
      'business-rules': COLLAPSED_WIDTH_PX * 4,
    };
    return offsets;
  })();

  /**
   * Calculate the absolute X/Y of a card's center within the scroll container.
   * - Card absolute X = scrollLeft + collapsed panel offsets + card position within chapter + card width/2
   * - Card absolute Y = PANEL_HEADER_HEIGHT + card position.y + card height/2
   */
  function cardAbsoluteCenter(
    card: DDSCard,
    chapter: ChapterType,
    scrollLeft: number
  ): { x: number; y: number } {
    const panelX = scrollLeft + collapsedOffsets[chapter];
    const cardNode = scrollContainerRef.current?.querySelector(
      `[data-chapter="${chapter}"] [data-card-id="${card.id}"]`
    );
    let cardWidth = 200;
    let cardHeight = 80;
    if (cardNode) {
      const r = cardNode.getBoundingClientRect();
      cardWidth = r.width;
      cardHeight = r.height;
    }
    return {
      x: panelX + card.position.x + cardWidth / 2,
      y: PANEL_HEADER_HEIGHT_PX + card.position.y + cardHeight / 2,
    };
  }

  if (crossChapterEdges.length === 0 || containerWidth === 0) {
    return null;
  }

  const scrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;

  return (
    <svg
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 10,
      }}
      aria-hidden="true"
    >
      <defs>
        <marker
          id="cross-chapter-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" opacity="0.7" />
        </marker>
      </defs>

      {crossChapterEdges.map((edge) => {
        const sourceChapter = edge.sourceChapter ?? findCardChapter(edge.source, chapters);
        const targetChapter = edge.targetChapter ?? findCardChapter(edge.target, chapters);

        if (!sourceChapter || !targetChapter) return null;
        if (sourceChapter === targetChapter) return null; // same-chapter, skip

        const sourceCard = findCard(edge.source, chapters);
        const targetCard = findCard(edge.target, chapters);
        if (!sourceCard || !targetCard) return null;

        const from = cardAbsoluteCenter(sourceCard, sourceChapter, scrollLeft);
        const to = cardAbsoluteCenter(targetCard, targetChapter, scrollLeft);

        // Ensure we always draw from left to right
        const [sx, tx] = from.x <= to.x ? [from.x, to.x] : [to.x, from.x];
        const [sy, ty] = from.x <= to.x ? [from.y, to.y] : [to.y, from.y];

        const dx = Math.abs(to.x - from.x);
        const dy = to.y - from.y;

        // Path: smoothstep — horizontal out, vertical, horizontal in
        const path = `
          M ${from.x} ${from.y}
          C ${from.x + Math.min(dx * 0.5, 80)} ${from.y},
            ${to.x - Math.min(dx * 0.5, 80)} ${to.y},
            ${to.x} ${to.y}
        `;

        return (
          <g key={edge.id}>
            {/* Wide transparent hit area for deletion */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={16}
              style={{ pointerEvents: 'stroke' }}
              data-edge-id={edge.id}
            />
            {/* Visible dashed line */}
            <path
              d={path}
              fill="none"
              stroke="#6366f1"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeOpacity={0.7}
              markerEnd="url(#cross-chapter-arrow)"
            />
            {/* Label */}
            {edge.label && (
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 8}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize={11}
                fontFamily="system-ui, sans-serif"
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
});

export default CrossChapterEdgesOverlay;
