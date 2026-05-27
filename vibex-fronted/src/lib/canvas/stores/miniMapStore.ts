/**
 * VibeX miniMapStore — Zustand Store for MiniMap Panel (P005-E3)
 *
 * Responsibilities:
 * - Track MiniMap panel open/closed state
 * - Track current viewport for border rectangle overlay
 * - Provide navigateTo(x, y, zoom) action for click-to-navigate
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Viewport } from '@xyflow/react';

interface MiniMapStore {
  /** Whether the MiniMap panel is visible */
  panelOpen: boolean;
  /** Current viewport for border rectangle rendering */
  viewport: Viewport;
  /** Toggle panel visibility */
  togglePanel: () => void;
  /** Set panel open/closed */
  setPanelOpen: (open: boolean) => void;
  /** Update viewport (called from DDSFlow on viewport change) */
  setViewport: (vp: Viewport) => void;
}

export const useMiniMapStore = create<MiniMapStore>()(
  devtools(
    (set) => ({
      panelOpen: false,
      viewport: { x: 0, y: 0, zoom: 1 },

      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

      setPanelOpen: (open) => set({ panelOpen: open }),

      setViewport: (vp) => set({ viewport: vp }),
    }),
    { name: 'miniMapStore' }
  )
);
