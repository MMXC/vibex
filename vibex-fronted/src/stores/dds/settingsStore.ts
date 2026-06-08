/**
 * settingsStore.ts — Canvas View Settings Store
 * S65-E3: Canvas View Personalization Settings Panel
 * S69-E5: Canvas View Presets (canvasPresets, saveAsPreset, applyPreset, deletePreset)
 * S76-E1: 画布背景设置集成 — canvasBackground unified background settings
 *
 * Manages canvas appearance settings: background color, grid size/spacing,
 * default zoom level, snap-to-grid toggle, and named view presets.
 * Persisted to localStorage under 'vibex-canvas-settings'.
 */
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type GridVariant = 'dots' | 'lines' | 'cross';

/** S76-E1: Unified background settings — variant + gap + size + grid color */
export interface CanvasBackground {
  /** Grid visual variant */
  variant: GridVariant;
  /** Grid gap in pixels */
  gap: number;
  /** Grid dot/line size */
  size: number;
  /** Grid line color (hex) */
  color: string;
}

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

/** E5 (Sprint77): DPR performance mode */
export type DprMode = 'auto' | '1x' | '2x';

interface SettingsState {
  canvasPresets: CanvasPreset[];
  activePresetId: string | null;
  /** S76-E1: Unified canvas background settings (variant + gap + size + color) */
  canvasBackground: CanvasBackground;
  /** E5 (Sprint77): DPR performance mode */
  dprMode: DprMode;
}

interface SettingsActions {
  setBackgroundColor: (color: string) => void;
  setGridSize: (size: number) => void;
  setGridVariant: (variant: GridVariant) => void;
  setDefaultZoom: (zoom: number) => void;
  setSnapToGrid: (snap: boolean) => void;
  /** S76-E1: Set all canvas background settings at once */
  setCanvasBackground: (bg: Partial<CanvasBackground>) => void;
  /** E5 (Sprint77): Set DPR performance mode */
  setDprMode: (mode: DprMode) => void;
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

/** S76-E1: Default canvas background */
const DEFAULT_CANVAS_BACKGROUND: CanvasBackground = {
  variant: 'dots',
  gap: 16,
  size: 1,
  color: '#e5e7eb',
};

const DEFAULT_PRESETS_STATE: Pick<SettingsState, 'canvasPresets' | 'activePresetId' | 'dprMode'> = {
  canvasPresets: [],
  activePresetId: null,
  dprMode: 'auto',
};

const VALID_GRID_SIZES = [12, 16, 24, 32] as const;
const VALID_ZOOM_VALUES = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const;

const generatePresetId = () =>
  `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type SettingsStore = Omit<CanvasSettings, 'gridSize' | 'gridVariant'> & SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      ...DEFAULT_PRESETS_STATE,
      canvasBackground: DEFAULT_CANVAS_BACKGROUND,

      setBackgroundColor: (color: string) => {
        if (!color.startsWith('#') || (color.length !== 4 && color.length !== 7)) return;
        set({ backgroundColor: color, activePresetId: null });
      },

      setGridSize: (size: number) => {
        if (!VALID_GRID_SIZES.includes(size as (typeof VALID_GRID_SIZES)[number])) return;
        set((state) => ({
          gridSize: size,
          // Sync canvasBackground.gap when gridSize changes
          canvasBackground: { ...state.canvasBackground, gap: size },
          activePresetId: null,
        }));
      },

      setGridVariant: (variant: GridVariant) => {
        if (!['dots', 'lines', 'cross'].includes(variant)) return;
        set((state) => ({
          gridVariant: variant,
          // Sync canvasBackground.variant when gridVariant changes
          canvasBackground: { ...state.canvasBackground, variant },
          activePresetId: null,
        }));
      },

      setDefaultZoom: (zoom: number) => {
        if (!VALID_ZOOM_VALUES.includes(zoom as (typeof VALID_ZOOM_VALUES)[number])) return;
        set({ defaultZoom: zoom, activePresetId: null });
      },

      setSnapToGrid: (snap: boolean) => set({ snapToGrid: snap, activePresetId: null }),

      /** S76-E1: Set canvas background settings — updates variant, gap, size, color */
      setCanvasBackground: (bg: Partial<CanvasBackground>) => {
        set((state) => {
          // Validate variant if provided
          if (bg.variant !== undefined && !['dots', 'lines', 'cross'].includes(bg.variant)) return state;
          // Validate gap if provided (any positive integer)
          if (bg.gap !== undefined && (bg.gap < 1 || bg.gap > 100)) return state;
          return {
            canvasBackground: { ...state.canvasBackground, ...bg },
            activePresetId: null,
          };
        });
      },

      /** E5 (Sprint77): Set DPR performance mode */
      setDprMode: (mode: DprMode) => {
        set({ dprMode: mode });
      },

      reset: () =>
        set({ ...DEFAULT_SETTINGS, canvasPresets: [], activePresetId: null, canvasBackground: DEFAULT_CANVAS_BACKGROUND }),

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
          // Sync canvasBackground from preset's gridVariant + gridSize
          canvasBackground: {
            variant: preset.settings.gridVariant,
            gap: preset.settings.gridSize,
            size: 1,
            color: '#e5e7eb',
          },
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
