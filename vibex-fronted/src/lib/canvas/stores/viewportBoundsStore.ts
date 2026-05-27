/**
 * VibeX viewportBoundsStore — Zustand Store
 * P005-E1: react-virtual 安装 + viewportBounds store
 *
 * Responsibilities:
 * - Track canvas viewport bounds (x, y, width, height)
 * - Persist viewport position to sessionStorage (refresh page restores viewport)
 * - Support virtualization culling (P005-E2)
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface ViewportBounds {
  /** Horizontal scroll offset (px) */
  x: number;
  /** Vertical scroll offset (px) */
  y: number;
  /** Visible viewport width (px) */
  width: number;
  /** Visible viewport height (px) */
  height: number;
  /** Current zoom level (default: 1) */
  zoom: number;
}

interface ViewportBoundsStore {
  viewportBounds: ViewportBounds;
  updateViewportBounds: (bounds: Partial<ViewportBounds>) => void;
  resetViewportBounds: () => void;
}

const DEFAULT_BOUNDS: ViewportBounds = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  zoom: 1,
};

export const useViewportBoundsStore = create<ViewportBoundsStore>()(
  devtools(
    persist(
      (set) => ({
        viewportBounds: DEFAULT_BOUNDS,

        updateViewportBounds: (bounds) =>
          set((state) => ({
            viewportBounds: { ...state.viewportBounds, ...bounds },
          })),

        resetViewportBounds: () =>
          set({ viewportBounds: DEFAULT_BOUNDS }),
      }),
      {
        name: 'vibex-viewport-bounds',
        // Only persist in sessionStorage (cleared on tab close)
        storage: {
          getItem: (name) => {
            if (typeof sessionStorage === 'undefined') return null;
            const value = sessionStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: (name, value) => {
            if (typeof sessionStorage === 'undefined') return;
            sessionStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            if (typeof sessionStorage === 'undefined') return;
            sessionStorage.removeItem(name);
          },
        },
      }
    )
  )
);
