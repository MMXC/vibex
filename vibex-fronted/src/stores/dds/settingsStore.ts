/**
 * settingsStore.ts — Canvas View Settings Store
 * S65-E3: Canvas View Personalization Settings Panel
 * S69-E5: Canvas View Presets (canvasPresets, saveAsPreset, applyPreset, deletePreset)
 *
 * Manages canvas appearance settings: background color, grid size/spacing,
 * default zoom level, snap-to-grid toggle, and named view presets.
 * Persisted to localStorage under 'vibex-canvas-settings'.
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

export interface CanvasPreset {
  id: string;
  name: string;
  settings: CanvasSettings;
  createdAt: number;
  updatedAt: number;
}

interface SettingsState {
  canvasPresets: CanvasPreset[];
  activePresetId: string | null;
}

interface SettingsActions {
  setBackgroundColor: (color: string) => void;
  setGridSize: (size: number) => void;
  setGridVariant: (variant: GridVariant) => void;
  setDefaultZoom: (zoom: number) => void;
  setSnapToGrid: (snap: boolean) => void;
  reset: () => void;
  saveAsPreset: (name: string, settings: CanvasSettings) => string;
  applyPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
  renamePreset: (presetId: string, name: string) => void;
  getPreset: (presetId: string) => CanvasPreset | undefined;
  getActivePreset: () => CanvasPreset | undefined;
  $presetsReset: () => void;
}

const DEFAULT_SETTINGS: CanvasSettings = {
  backgroundColor: '#ffffff',
  gridSize: 24,
  gridVariant: 'dots',
  defaultZoom: 1.0,
  snapToGrid: false,
};

const DEFAULT_PRESETS_STATE: Pick<SettingsState, 'canvasPresets' | 'activePresetId'> = {
  canvasPresets: [],
  activePresetId: null,
};

const VALID_GRID_SIZES = [12, 16, 24, 32] as const;
const VALID_ZOOM_VALUES = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const;

const generatePresetId = () =>
  `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type SettingsStore = CanvasSettings & SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      ...DEFAULT_PRESETS_STATE,

      setBackgroundColor: (color: string) => {
        if (!color.startsWith('#') || (color.length !== 4 && color.length !== 7)) return;
        set({ backgroundColor: color, activePresetId: null });
      },

      setGridSize: (size: number) => {
        if (!VALID_GRID_SIZES.includes(size as (typeof VALID_GRID_SIZES)[number])) return;
        set({ gridSize: size, activePresetId: null });
      },

      setGridVariant: (variant: GridVariant) => {
        if (!['dots', 'lines', 'cross'].includes(variant)) return;
        set({ gridVariant: variant, activePresetId: null });
      },

      setDefaultZoom: (zoom: number) => {
        if (!VALID_ZOOM_VALUES.includes(zoom as (typeof VALID_ZOOM_VALUES)[number])) return;
        set({ defaultZoom: zoom, activePresetId: null });
      },

      setSnapToGrid: (snap: boolean) => set({ snapToGrid: snap, activePresetId: null }),

      reset: () =>
        set({ ...DEFAULT_SETTINGS, canvasPresets: [], activePresetId: null }),

      saveAsPreset: (name: string, settings: CanvasSettings): string => {
        const now = Date.now();
        const preset: CanvasPreset = {
          id: generatePresetId(),
          name: name.trim() || '未命名预设',
          settings: { ...DEFAULT_SETTINGS, ...settings },
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ canvasPresets: [...state.canvasPresets, preset] }));
        return preset.id;
      },

      applyPreset: (presetId: string): void => {
        const state = get();
        const preset = state.canvasPresets.find((p) => p.id === presetId);
        if (!preset) return;
        set({
          ...preset.settings,
          activePresetId: presetId,
        });
      },

      deletePreset: (presetId: string): void => {
        set((state) => ({
          canvasPresets: state.canvasPresets.filter((p) => p.id !== presetId),
          activePresetId:
            state.activePresetId === presetId ? null : state.activePresetId,
        }));
      },

      renamePreset: (presetId: string, name: string): void => {
        set((state) => ({
          canvasPresets: state.canvasPresets.map((p) =>
            p.id === presetId
              ? { ...p, name: name.trim() || p.name, updatedAt: Date.now() }
              : p
          ),
        }));
      },

      getPreset: (presetId: string): CanvasPreset | undefined => {
        return get().canvasPresets.find((p) => p.id === presetId);
      },

      getActivePreset: (): CanvasPreset | undefined => {
        const state = get();
        if (!state.activePresetId) return undefined;
        return state.canvasPresets.find((p) => p.id === state.activePresetId);
      },

      $presetsReset: (): void => {
        set(DEFAULT_PRESETS_STATE);
      },
    }),
    {
      name: 'vibex-canvas-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
