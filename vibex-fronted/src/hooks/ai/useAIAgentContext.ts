/**
 * useAIAgentContext.ts — Sprint61 E4: AI Session Canvas Context Integration
 *
 * Hook that serializes the current DDS canvas state into a context string
 * suitable for passing to an AI agent.
 *
 * Usage:
 * ```
 * const { canvasSummary, canvasContext } = useAIAgentContext();
 * // canvasSummary = "4 nodes, 2 edges, chapters: requirement, flow"
 * ```
 */

'use client';

import { useMemo } from 'react';
import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';
import { useAgentStore, type CanvasContext, type RetryMode } from '@/stores/dds/agentStore';
import type { ChapterType } from '@/types/dds';

// ==================== Constants ====================

const CHAPTER_LABELS: Record<ChapterType, string> = {
  requirement: '需求',
  context: '限界上下文',
  flow: '流程',
  api: 'API',
  'business-rules': '业务规则',
};

// ==================== Hook ====================

export interface UseAIAgentContextOptions {
  /** Optional session ID to attach context to a specific session */
  sessionId?: string | null;
}

export interface UseAIAgentContextReturn {
  /**
   * Human-readable canvas summary string.
   * E.g. "4 nodes, 2 edges, chapters: 需求, 流程"
   */
  canvasSummary: string;
  /**
   * Full canvas context object for store injection.
   */
  canvasContext: CanvasContext;
  /**
   * Current default retry mode.
   */
  retryMode: RetryMode;
  /**
   * Set the retry mode for a session.
   */
  setRetryMode: (mode: RetryMode) => void;
  /**
   * Attach current canvas context to a session.
   */
  attachToSession: (sessionId: string) => void;
}

/**
 * useAIAgentContext — Serialize DDS canvas state for AI context injection.
 */
export function useAIAgentContext(
  options: UseAIAgentContextOptions = {}
): UseAIAgentContextReturn {
  const { sessionId } = options;

  // Canvas state from DDSCanvasStore
  const projectId = useDDSCanvasStore((s) => s.projectId);
  const chapters = useDDSCanvasStore((s) => s.chapters);
  const activeChapter = useDDSCanvasStore((s) => s.activeChapter);

  // Agent store actions
  const setDefaultRetryMode = useAgentStore((s) => s.setDefaultRetryMode);
  const defaultRetryMode = useAgentStore((s) => s.defaultRetryMode);
  const setCanvasContext = useAgentStore((s) => s.setCanvasContext);

  // Build per-chapter counts
  const chapterCounts = useMemo<Record<ChapterType, { nodes: number; edges: number }>>(() => {
    const allChapters: ChapterType[] = [
      'requirement',
      'context',
      'flow',
      'api',
      'business-rules',
    ];
    const result = {} as Record<ChapterType, { nodes: number; edges: number }>;
    for (const ch of allChapters) {
      const chapterData = chapters[ch];
      result[ch] = {
        nodes: chapterData?.cards.length ?? 0,
        edges: chapterData?.edges.length ?? 0,
      };
    }
    return result;
  }, [chapters]);

  // Total counts
  const totalNodes = useMemo(
    () => Object.values(chapterCounts).reduce((sum, c) => sum + c.nodes, 0),
    [chapterCounts]
  );
  const totalEdges = useMemo(
    () => Object.values(chapterCounts).reduce((sum, c) => sum + c.edges, 0),
    [chapterCounts]
  );

  // Chapters that have content
  const activeChapters = useMemo(() => {
    return Object.entries(chapterCounts)
      .filter(([, counts]) => counts.nodes > 0 || counts.edges > 0)
      .map(([ch]) => CHAPTER_LABELS[ch as ChapterType])
      .join(', ');
  }, [chapterCounts]);

  // Human-readable summary string
  const canvasSummary = useMemo(() => {
    if (totalNodes === 0 && totalEdges === 0) {
      return '画布为空';
    }
    const chapterPart = activeChapters ? `, chapters: ${activeChapters}` : '';
    return `${totalNodes} node${totalNodes !== 1 ? 's' : ''}, ${totalEdges} edge${totalEdges !== 1 ? 's' : ''}${chapterPart}`;
  }, [totalNodes, totalEdges, activeChapters]);

  // Full context object
  const canvasContext = useMemo<CanvasContext>(
    () => ({
      summary: canvasSummary,
      chapterCounts,
      totalNodes,
      totalEdges,
      projectId,
    }),
    [canvasSummary, chapterCounts, totalNodes, totalEdges, projectId]
  );

  // Attach context to a specific session
  const attachToSession = (sid: string) => {
    setCanvasContext(sid, canvasContext);
  };

  return {
    canvasSummary,
    canvasContext,
    retryMode: defaultRetryMode,
    setRetryMode: (mode: RetryMode) => {
      setDefaultRetryMode(mode);
    },
    attachToSession,
  };
}
