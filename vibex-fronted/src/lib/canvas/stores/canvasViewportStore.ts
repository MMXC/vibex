/**
 * VibeX canvasViewportStore — Zustand Store for Canvas Viewport Navigation
 * S86-E2: Canvas Minimap Navigation
 *
 * Responsibilities:
 * - Track canvas viewport in flow coordinates (x, y, zoom)
 * - Provide zoomTo(level) — smooth zoom to target level
 * - Provide panTo(x, y) — smooth pan to target flow position
 * - Persist last-viewed viewport to sessionStorage for page-refresh restoration
 *
 * Distinction from viewportBoundsStore:
 * - viewportBoundsStore: screen coordinates from scroll/resize events (debounced)
 * - canvasViewportStore: flow coordinates from ReactFlow viewport (transformed)
 *
 * Integration:
 * - DDSCanvasPage writes viewport changes from rf.getViewport() into this store
 * - useCanvasViewport() exposes viewport + zoomTo/panTo to MiniMapPanel
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Viewport } from '@xyflow/react';

export interface CanvasViewport {
  /** Horizontal offset of the flow viewport (px) */
  x: number;
  /** Vertical offset of the flow viewport (px) */
  y: number;
  /** Current zoom level (1 = 100%) */
  zoom: number;
}

interface CanvasViewportStore {
  /** Current viewport in flow coordinates */
  viewport: CanvasViewport;
  /** Whether the viewport has been initialized from a saved position */
  initialized: boolean;

  /** Update full viewport state (called from ReactFlow onViewportChange) */
  setViewport: (vp: Partial<CanvasViewport>) => void;
  /** Zoom to a specific level (centers on current pan point) */
  zoomTo: (level: number) => void;
  /** Pan to a specific flow position (keeps current zoom) */
  panTo: (x: number, y: number) => void;
  /** Reset viewport to origin */
  resetViewport: () => void;
}

const DEFAULT_VIEWPORT: CanvasViewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const useCanvasViewportStore = create<CanvasViewportStore>()(
  devtools(
    persist(
      (set, get) => ({
        viewport: DEFAULT_VIEWPORT,
        initialized: false,

        setViewport: (vp) =>
          set(
            (state) => ({
              viewport: { ...state.viewport, ...vp },
              initialized: true,
            }),
            false,
            'setViewport'
          ),

        zoomTo: (level) =>
          set(
            (state) => ({
              viewport: { ...state.viewport, zoom: level },
            }),
            false,
            'zoomTo'
          ),

        panTo: (x, y) =>
          set(
            (state) => ({
              viewport: { ...state.viewport, x, y },
            }),
            false,
            'panTo'
          ),

        resetViewport: () =>
          set(
            {
              viewport: DEFAULT_VIEWPORT,
              initialized: true,
            },
            false,
            'resetViewport'
          ),
      }),
      {
        name: 'canvasViewportStore',
        storage: {
          getItem: (name) => {
            try {
              const value = sessionStorage.getItem(name);
              return value ? JSON.parse(value) : null;
            } catch {
              return null;
            }
          },
          setItem: (name, value) => {
            try {
              sessionStorage.setItem(name, JSON.stringify(value));
            } catch {
              // sessionStorage unavailable (e.g., SSR)
            }
          },
          removeItem: (name) => {
            try {
              sessionStorage.removeItem(name);
            } catch {
              // ignore
            }
          },
        },
      }
    ),
    { name: 'canvasViewportStore' }
  )
);

/**
 * Compute the center point of the current viewport in flow coordinates.
 * Used by zoomTo to keep the center stable when zooming.
 */
export function getViewportCenter(vp: CanvasViewport, containerWidth: number, containerHeight: number) {
  return {
    cx: vp.x + containerWidth / 2 / vp.zoom,
    cy: vp.y + containerHeight / 2 / vp.zoom,
  };
}
