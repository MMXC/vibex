/**
 * useCanvasViewport — React hook for canvas viewport navigation
 * S86-E2: Canvas Minimap Navigation
 *
 * Wraps canvasViewportStore and exposes viewport + navigation actions.
 * Used by MiniMapPanel to display current viewport and trigger zoom/pan.
 *
 * Usage:
 *   const { viewport, zoomTo, panTo, resetViewport } = useCanvasViewport();
 */
'use client';

import { useCallback } from 'react';
import { useCanvasViewportStore } from '@/lib/canvas/stores/canvasViewportStore';

/**
 * Hook result shape — mirrors CanvasViewportStore actions
 * but wraps them in useCallback for stable references.
 */
export interface UseCanvasViewportResult {
  /** Current viewport in flow coordinates */
  viewport: { x: number; y: number; zoom: number };
  /** Whether viewport has been initialized from a saved position */
  initialized: boolean;
  /** Update full viewport state */
  setViewport: (vp: Partial<{ x: number; y: number; zoom: number }>) => void;
  /** Zoom to a specific level (centers on current pan point) */
  zoomTo: (level: number) => void;
  /** Pan to a specific flow position (keeps current zoom) */
  panTo: (x: number, y: number) => void;
  /** Reset viewport to origin */
  resetViewport: () => void;
}

/**
 * useCanvasViewport — exposes canvas viewport state and navigation actions.
 *
 * Note: This hook reads from the store. To sync ReactFlow viewport INTO this store,
 * DDSCanvasPage should call useCanvasViewportStore.getState().setViewport()
 * on onViewportChange events.
 */
export function useCanvasViewport(): UseCanvasViewportResult {
  const viewport = useCanvasViewportStore((s) => s.viewport);
  const initialized = useCanvasViewportStore((s) => s.initialized);
  const storeZoomTo = useCanvasViewportStore((s) => s.zoomTo);
  const storePanTo = useCanvasViewportStore((s) => s.panTo);
  const storeSetViewport = useCanvasViewportStore((s) => s.setViewport);
  const storeResetViewport = useCanvasViewportStore((s) => s.resetViewport);

  const zoomTo = useCallback((level: number) => {
    storeZoomTo(level);
  }, [storeZoomTo]);

  const panTo = useCallback((x: number, y: number) => {
    storePanTo(x, y);
  }, [storePanTo]);

  const setViewport = useCallback((vp: Partial<{ x: number; y: number; zoom: number }>) => {
    storeSetViewport(vp);
  }, [storeSetViewport]);

  const resetViewport = useCallback(() => {
    storeResetViewport();
  }, [storeResetViewport]);

  return {
    viewport,
    initialized,
    setViewport,
    zoomTo,
    panTo,
    resetViewport,
  };
}
