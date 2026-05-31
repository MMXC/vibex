/**
 * canvasStoreRegistry — Sprint48 E5: Cross-canvas clipboard paste
 *
 * Manages chapter data for multiple canvases, enabling paste-to-other-canvas.
 *
 * Each canvas stores its own chapters[] data in IndexedDB (via ddsPersistence).
 * This registry holds in-memory copies of chapter data for canvases that have been
 * opened during the session, avoiding repeated IndexedDB reads.
 *
 * Architecture:
 * - On openCanvas(canvasId): load chapters from IndexedDB → registry
 * - On crossCanvasPaste(targetCanvasId): paste from clipboard → target chapters → save to IndexedDB
 * - On closeCanvas(canvasId): registry entry remains (user may return)
 */

import type { ChapterData, DDSCard, DDSEdge, ChapterType } from '@/types/dds';
import { generateId } from './id';

// ============================================
// Types
// ============================================

export interface CanvasChapterData {
  chapters: Record<ChapterType, ChapterData>;
}

type Registry = Map<string, CanvasChapterData>;

// ============================================
// Registry
// ============================================

const registry: Registry = new Map();

export const canvasStoreRegistry = {
  /**
   * Check if canvas chapter data is cached in registry
   */
  has(canvasId: string): boolean {
    return registry.has(canvasId);
  },

  /**
   * Get cached chapter data for a canvas
   */
  get(canvasId: string): CanvasChapterData | undefined {
    return registry.get(canvasId);
  },

  /**
   * Cache chapter data for a canvas
   */
  set(canvasId: string, data: CanvasChapterData): void {
    registry.set(canvasId, data);
  },

  /**
   * Update a specific chapter's cards + edges for a canvas
   */
  updateChapter(
    canvasId: string,
    chapter: ChapterType,
    updater: (data: ChapterData) => ChapterData
  ): CanvasChapterData | undefined {
    const cached = registry.get(canvasId);
    if (!cached) return undefined;

    const updated: CanvasChapterData = {
      chapters: {
        ...cached.chapters,
        [chapter]: updater(cached.chapters[chapter]),
      },
    };
    registry.set(canvasId, updated);
    return updated;
  },

  /**
   * Get all tracked canvas IDs
   */
  keys(): string[] {
    return [...registry.keys()];
  },

  /**
   * Clear a canvas from registry (call on canvas delete)
   */
  delete(canvasId: string): void {
    registry.delete(canvasId);
  },
};
