/**
 * settingsStore.ts — Canvas View Settings Store
 * S65-E3: Canvas View Personalization Settings Panel
 *
 * Manages canvas appearance settings: background color, grid size/spacing,
 * default zoom level, and snap-to-grid toggle. Persisted to localStorage.
 */
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type GridVariant = 'dots' | 'lines' | 'cross';

export interface CanvasSettings {
  /** Background color hex string, e.g. '#ffffff' */
  backgroundColor: string;
  /** Grid dot/line spacing in pixels: 12 | 16 | 24 | 32 */
  gridSize: number;
  /** Grid visual variant from @xyflow/react BackgroundVariant */
  gridVariant: GridVariant;
  /** Default zoom factor: 0.5 - 2.0 */
  defaultZoom: number;
  /** Whether nodes snap to grid */
  snapToGrid: boolean;
}

interface SettingsActions {
  setBackgroundColor: (color: string) => void;
  setGridSize: (size: number) => void;
  setGridVariant: (variant: GridVariant) => void;
  setDefaultZoom: (zoom: number) => void;
  setSnapToGrid: (snap: boolean) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: CanvasSettings = {
  backgroundColor: '#ffffff',
  gridSize: 24,
  gridVariant: 'dots',
  defaultZoom: 1.0,
  snapToGrid: false,
};

const VALID_GRID_SIZES = [12, 16, 24, 32] as const;
const VALID_ZOOM_VALUES = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const;

export type SettingsStore = CanvasSettings & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setBackgroundColor: (color: string) => {
        if (!color.startsWith('#') || (color.length !== 4 && color.length !== 7)) return;
        set({ backgroundColor: color });
      },

      setGridSize: (size: number) => {
        if (!VALID_GRID_SIZES.includes(size as (typeof VALID_GRID_SIZES)[number])) return;
        set({ gridSize: size });
      },

      setGridVariant: (variant: GridVariant) => {
        if (!['dots', 'lines', 'cross'].includes(variant)) return;
        set({ gridVariant: variant });
      },

      setDefaultZoom: (zoom: number) => {
        if (!VALID_ZOOM_VALUES.includes(zoom as (typeof VALID_ZOOM_VALUES)[number])) return;
        set({ defaultZoom: zoom });
      },

      setSnapToGrid: (snap: boolean) => set({ snapToGrid: snap }),

      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'vibex-canvas-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
