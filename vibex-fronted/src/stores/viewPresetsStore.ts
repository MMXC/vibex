/**
 * viewPresetsStore.ts — Canvas View Presets Store
 * S66-E3: Canvas View Presets Save & Switch
 *
 * Manages named view presets that capture canvas appearance settings
 * (background, grid, zoom, snap). Persisted to localStorage.
 */
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ViewPresetSettings {
  backgroundColor: string;
  gridSize: number;
  gridVariant: 'dots' | 'lines' | 'cross';
  defaultZoom: number;
  snapToGrid: boolean;
}

export interface ViewPreset {
  id: string;
  name: string;
  settings: ViewPresetSettings;
  fitViewOnLoad: boolean;
  createdAt: number;
  updatedAt: number;
}

interface ViewPresetsState {
  presets: ViewPreset[];
  currentPresetId: string | null;
  isLoading: boolean;
}

interface ViewPresetsActions {
  savePreset: (name: string, settings: ViewPresetSettings) => ViewPreset;
  updatePreset: (id: string, updates: Partial<Pick<ViewPreset, 'name' | 'settings' | 'fitViewOnLoad'>>) => ViewPreset | null;
  deletePreset: (id: string) => void;
  loadPreset: (id: string) => ViewPreset | null;
  getPreset: (id: string) => ViewPreset | undefined;
  $reset: () => void;
}

const generateId = () => `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_SETTINGS: ViewPresetSettings = {
  backgroundColor: '#ffffff',
  gridSize: 24,
  gridVariant: 'dots',
  defaultZoom: 1.0,
  snapToGrid: false,
};

type ViewPresetsStore = ViewPresetsState & ViewPresetsActions;

export const useViewPresetsStore = create<ViewPresetsStore>()(
  persist(
    (set, get) => ({
      presets: [],
      currentPresetId: null,
      isLoading: false,

      savePreset: (name: string, settings: ViewPresetSettings): ViewPreset => {
        const now = Date.now();
        const preset: ViewPreset = {
          id: generateId(),
          name: name.trim() || '未命名预设',
          settings: { ...DEFAULT_SETTINGS, ...settings },
          fitViewOnLoad: true,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ presets: [...state.presets, preset] }));
        return preset;
      },

      updatePreset: (
        id: string,
        updates: Partial<Pick<ViewPreset, 'name' | 'settings' | 'fitViewOnLoad'>>
      ): ViewPreset | null => {
        const state = get();
        const idx = state.presets.findIndex((p) => p.id === id);
        if (idx === -1) return null;

        const updated: ViewPreset = {
          ...state.presets[idx],
          ...updates,
          settings: updates.settings
            ? { ...state.presets[idx].settings, ...updates.settings }
            : state.presets[idx].settings,
          updatedAt: Date.now(),
        };

        const newPresets = [...state.presets];
        newPresets[idx] = updated;
        set({ presets: newPresets });
        return updated;
      },

      deletePreset: (id: string): void => {
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
          currentPresetId: state.currentPresetId === id ? null : state.currentPresetId,
        }));
      },

      loadPreset: (id: string): ViewPreset | null => {
        const state = get();
        const preset = state.presets.find((p) => p.id === id);
        if (!preset) return null;
        set({ currentPresetId: id });
        return preset;
      },

      getPreset: (id: string): ViewPreset | undefined => {
        return get().presets.find((p) => p.id === id);
      },

      $reset: (): void => {
        set({ presets: [], currentPresetId: null, isLoading: false });
      },
    }),
    {
      name: 'vibex-view-presets',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
