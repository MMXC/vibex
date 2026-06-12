/**
 * useAISuggestions — S89-E2: AI Design Suggestions
 *
 * Generates 1-3 design suggestions based on canvas content analysis.
 * Runs on initial canvas load and when chapters change.
 *
 * Rules:
 * - Nodes > 50 → "Consider grouping nodes into chapters"
 * - Chapter has 0 edges → "Add connections between cards"
 * - Only one chapter type present → "Consider adding other chapter types"
 * - No cards in chapter → "Add cards to {chapter}"
 */

'use client';

import { useMemo } from 'react';
import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';
import type { ChapterType } from '@/types/dds';
import type { AISuggestion, SuggestionType } from '@/stores/dds/aiDesignSuggestionsStore';

interface CanvasStats {
  totalNodes: number;
  totalEdges: number;
  chapters: Record<ChapterType, { cards: number; edges: number }>;
  chapterTypes: Set<ChapterType>;
}

function analyzeCanvas(chapters: Record<ChapterType, { cards: Array<{ id: string }>; edges: Array<{ id: string }> }>): CanvasStats {
  const chapterStats: CanvasStats['chapters'] = {} as CanvasStats['chapters'];
  let totalNodes = 0;
  let totalEdges = 0;
  const chapterTypes = new Set<ChapterType>();

  (Object.keys(chapters) as ChapterType[]).forEach((chapterType) => {
    const ch = chapters[chapterType];
    const cards = ch.cards.length;
    const edges = ch.edges.length;
    totalNodes += cards;
    totalEdges += edges;
    chapterStats[chapterType] = { cards, edges };
    if (cards > 0) chapterTypes.add(chapterType);
  });

  return { totalNodes, totalEdges, chapters: chapterStats, chapterTypes };
}

function generateSuggestions(stats: CanvasStats): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const idPrefix = `sg-${Date.now()}-`;

  // Rule 1: Too many nodes (over 50) → suggest grouping
  if (stats.totalNodes > 50) {
    suggestions.push({
      id: `${idPrefix}grouping`,
      type: 'structure',
      icon: '📦',
      title: 'Consider grouping nodes',
      description: `This canvas has ${stats.totalNodes} nodes. Grouping related nodes into separate chapters improves readability and structure.`,
      status: 'pending',
    });
  }

  // Rule 2: Check each chapter for missing connections
  (Object.keys(stats.chapters) as ChapterType[]).forEach((chapterType) => {
    const ch = stats.chapters[chapterType];
    if (ch.cards > 0 && ch.edges === 0) {
      suggestions.push({
        id: `${idPrefix}connections-${chapterType}`,
        type: 'connection',
        icon: '🔗',
        title: 'Add connections',
        description: `The ${chapterType} chapter has ${ch.cards} cards but no connections. Adding edges helps show relationships between cards.`,
        status: 'pending',
        targetChapter: chapterType,
      });
    }
  });

  // Rule 3: Single chapter type → suggest diversity
  if (stats.chapterTypes.size === 1 && stats.totalNodes > 5) {
    const onlyType = [...stats.chapterTypes][0];
    suggestions.push({
      id: `${idPrefix}diversity`,
      type: 'structure',
      icon: '🏗️',
      title: 'Add more chapter types',
      description: `Only ${onlyType} chapter is being used. Consider adding other chapter types (context, flow, api, business-rules) for a complete DDS canvas.`,
      status: 'pending',
    });
  }

  // Rule 4: Empty chapter with other chapters populated
  if (stats.totalNodes > 0) {
    const allChapters: ChapterType[] = ['requirement', 'context', 'flow', 'api', 'business-rules'];
    const emptyChapters = allChapters.filter((ct) => stats.chapters[ct].cards === 0);
    if (emptyChapters.length > 0 && stats.chapterTypes.size > 0) {
      suggestions.push({
        id: `${idPrefix}empty-chapter`,
        type: 'structure',
        icon: '📝',
        title: `Add content to ${emptyChapters[0]} chapter`,
        description: `The ${emptyChapters[0]} chapter is empty. A complete DDS canvas typically includes multiple chapter types.`,
        status: 'pending',
        targetChapter: emptyChapters[0],
      });
    }
  }

  // Rule 5: Many nodes but few chapters used
  if (stats.totalNodes > 20 && stats.chapterTypes.size <= 2) {
    suggestions.push({
      id: `${idPrefix}chapter-distribution`,
      type: 'layout',
      icon: '📊',
      title: 'Distribute content across chapters',
      description: `Most content is concentrated in few chapter types. Spreading nodes across multiple chapter types creates a more balanced canvas.`,
      status: 'pending',
    });
  }

  // Limit to 3 suggestions
  return suggestions.slice(0, 3);
}

export interface UseAISuggestionsReturn {
  suggestions: AISuggestion[];
  /** Stats about the current canvas */
  stats: CanvasStats | null;
}

export function useAISuggestions(): UseAISuggestionsReturn {
  const chapters = useDDSCanvasStore((s) => s.chapters);

  const stats = useMemo(() => analyzeCanvas(chapters), [chapters]);

  const suggestions = useMemo(() => generateSuggestions(stats), [stats]);

  return { suggestions, stats };
}
