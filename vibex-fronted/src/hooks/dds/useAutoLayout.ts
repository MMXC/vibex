/**
 * useAutoLayout — Hook to apply Dagre auto-layout to the current chapter
 *
 * S50-E2: 画布节点自动布局
 *
 * Usage:
 *   const { applyAutoLayout } = useAutoLayout(chapter);
 *
 * The hook reads all cards + edges from DDSCanvasStore, computes new positions
 * using Dagre, updates the store, and triggers fitView.
 */

import { useCallback } from 'react';
import { useDDSCanvasStore, ddsChapterActions } from '@/stores/dds';
import { useAutoLayoutStore } from '@/stores/dds/autoLayoutStore';
import {
  computeDagreLayout,
  applyPositionsToCards,
  type LayoutDirection,
} from '@/lib/canvas/dagreLayout';
import type { ChapterType } from '@/types/dds';

/** Max cards to show warning — dagre gets slow on very large graphs */
const LAYOUT_WARN_THRESHOLD = 200;

interface UseAutoLayoutOptions {
  /** Chapter to layout (defaults to active chapter) */
  chapter?: ChapterType;
  /** Layout direction */
  direction?: LayoutDirection;
}

interface UseAutoLayoutResult {
  /** Apply auto-layout to the current chapter */
  applyAutoLayout: (opts?: UseAutoLayoutOptions) => void;
  /** Whether layout is in progress */
  isLayouting: boolean;
  /** Last used layout direction */
  lastDirection: LayoutDirection;
}

export function useAutoLayout(chapter?: ChapterType): UseAutoLayoutResult {
  const storeChapter = useDDSCanvasStore((s) => s.activeChapter);
  const activeChapter = chapter ?? storeChapter;

  const { isLayouting, lastLayoutDirection, startLayout, endLayout } = useAutoLayoutStore();

  const applyAutoLayout = useCallback(
    (opts: UseAutoLayoutOptions = {}) => {
      const targetChapter = opts.chapter ?? activeChapter;
      const direction = opts.direction ?? lastLayoutDirection;

      const chapters = useDDSCanvasStore.getState().chapters;
      const chapterData = chapters[targetChapter];
      if (!chapterData) return;

      const { cards, edges } = chapterData;

      if (cards.length === 0) return;

      if (cards.length > LAYOUT_WARN_THRESHOLD) {
        console.warn(
          `[useAutoLayout] Large graph (${cards.length} nodes) — layout may be slow`
        );
      }

      startLayout(direction);

      try {
        // Compute new positions
        const positions = computeDagreLayout(cards, edges, { direction });

        // Update each card's position in the store
        for (const card of cards) {
          const newPos = positions.get(card.id);
          if (newPos) {
            ddsChapterActions.updateCard(targetChapter, card.id, { position: newPos });
          }
        }

        // Record history snapshot after layout
        const updatedCards = applyPositionsToCards(cards, positions);
        useDDSCanvasStore.getState().recordSnapshot?.(targetChapter, updatedCards);

        endLayout();
      } catch (err) {
        console.error('[useAutoLayout] Layout failed:', err);
        useAutoLayoutStore.getState().reset();
      }
    },
    [activeChapter, lastLayoutDirection, startLayout, endLayout]
  );

  return {
    applyAutoLayout,
    isLayouting,
    lastDirection: lastLayoutDirection,
  };
}
