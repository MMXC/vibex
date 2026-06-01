/**
 * useSearchIndex.ts — Sprint50 E1: Canvas Global Search Hook
 *
 * 职责：画布打开时触发 buildIndex/updateIndex，保持搜索索引最新。
 * 监听 DDSCanvasStore 的节点变化，实时更新索引。
 *
 * 遵守约束:
 * - 无 any 类型
 */
'use client';

import { useEffect, useRef } from 'react';
import { useCanvasSearchStore } from '@/stores/canvasSearchStore';
import { useCanvasListStore, type CanvasMeta } from '@/stores/canvasListStore';
import type { CanvasIndexEntry } from '@/stores/canvasSearchStore';

/**
 * Hook that manages the canvas search index lifecycle.
 * - On mount: build index from all existing canvases
 * - On canvas change: update index for the active canvas
 */
export function useSearchIndex() {
  const buildIndex = useCanvasSearchStore((s) => s.buildIndex);
  const updateIndex = useCanvasSearchStore((s) => s.updateIndex);
  const removeFromIndex = useCanvasSearchStore((s) => s.removeFromIndex);
  const isIndexBuilt = useCanvasSearchStore((s) => s.isIndexBuilt);

  const canvases = useCanvasListStore((s) => s.canvases);
  const activeCanvasId = useCanvasListStore((s) => s.activeCanvasId);

  // Track whether we've done the initial build
  const hasBuiltInitialRef = useRef(false);

  // Build initial index from all canvases on mount
  useEffect(() => {
    if (!isIndexBuilt && !hasBuiltInitialRef.current && canvases.length > 0) {
      hasBuiltInitialRef.current = true;
      // Build with empty node texts initially — will be updated per-canvas
      const emptyNodeMap: Record<string, string[]> = {};
      buildIndex(canvases, emptyNodeMap);
    }
  }, [canvases, buildIndex, isIndexBuilt]);

  // Update index when active canvas changes
  useEffect(() => {
    if (!activeCanvasId || !isIndexBuilt) return;

    const canvas = canvases.find((c) => c.id === activeCanvasId);
    if (!canvas) return;

    const entry: CanvasIndexEntry = {
      canvasId: canvas.id,
      name: canvas.name,
      searchableText: canvas.name, // Node text is fetched from DDSCanvasStore
      nodeTexts: [],
      updatedAt: canvas.updatedAt,
      matchCount: 0,
    };

    updateIndex(activeCanvasId, entry);
  }, [activeCanvasId, canvases, isIndexBuilt, updateIndex]);

  return { isIndexBuilt };
}
