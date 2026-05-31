/**
 * useCanvasList.ts — Sprint47 E4: Canvas List Hook
 *
 * 封装 canvasListStore，提供 React 友好的接口。
 */

import { useEffect } from 'react';
import {
  useCanvasListStore,
  type CanvasMeta,
} from '@/stores/canvasListStore';

export function useCanvasList() {
  const {
    canvases,
    activeCanvasId,
    isLoaded,
    searchTerm,
    loadCanvases,
    createCanvas,
    deleteCanvas,
    renameCanvas,
    setActiveCanvas,
    updateThumbnail,
    getSortedCanvases,
    setSearchTerm,
    getFilteredCanvases,
    cacheThumbnail,
    getCachedThumbnail,
  } = useCanvasListStore();

  useEffect(() => {
    if (!isLoaded) {
      loadCanvases();
    }
  }, [isLoaded, loadCanvases]);

  return {
    canvases,
    activeCanvasId,
    isLoaded,
    searchTerm,
    createCanvas,
    deleteCanvas,
    renameCanvas,
    setActiveCanvas,
    updateThumbnail,
    getSortedCanvases,
    setSearchTerm,
    getFilteredCanvases,
    cacheThumbnail,
    getCachedThumbnail,
  };
}

/** Hook returning a single canvas by id */
export function useCanvasMeta(id: string | null): CanvasMeta | null {
  const canvases = useCanvasListStore((s) => s.canvases);
  if (!id) return null;
  return canvases.find((c) => c.id === id) ?? null;
}
