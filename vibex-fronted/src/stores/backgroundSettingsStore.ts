/**
 * BackgroundSettings Store
 * 画布背景自定义状态管理
 * S55-E4
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BackgroundVariant } from '@xyflow/react';

export type BackgroundPreset = 'dots' | 'lines' | 'cross' | 'solid' | 'custom';

export interface BackgroundSettings {
  variant: BackgroundVariant;
  gap: number;
  size: number;
  color: string;
}

export interface BackgroundSettingsState {
  preset: BackgroundPreset;
  customColor: string;
  
  // Actions
  setPreset: (preset: BackgroundPreset) => void;
  setCustomColor: (color: string) => void;
  resetToDefaults: () => void;
  
  // Computed
  getBackgroundSettings: () => BackgroundSettings;
}

// Exported for use in DDSFlow selector
export const PRESET_SETTINGS: Record<BackgroundPreset, BackgroundSettings> = {
  dots: {
    variant: BackgroundVariant.Dots,
    gap: 24,
    size: 1,
    color: 'rgba(255,255,255,0.06)',
  },
  lines: {
    variant: BackgroundVariant.Lines,
    gap: 24,
    size: 1,
    color: 'rgba(255,255,255,0.06)',
  },
  cross: {
    variant: BackgroundVariant.Cross,
    gap: 24,
    size: 1,
    color: 'rgba(255,255,255,0.06)',
  },
  solid: {
    variant: BackgroundVariant.Dots,
    gap: 0,
    size: 0,
    color: 'rgba(0,0,0,0.03)',
  },
  custom: {
    variant: BackgroundVariant.Dots,
    gap: 24,
    size: 1,
    color: 'rgba(255,255,255,0.06)',
  },
};

const DEFAULT_PRESET: BackgroundPreset = 'dots';
const DEFAULT_CUSTOM_COLOR = '#3b82f6';

export const useBackgroundSettingsStore = create<BackgroundSettingsState>()(
  persist(
    (set, get) => ({
      preset: DEFAULT_PRESET,
      customColor: DEFAULT_CUSTOM_COLOR,
      
      setPreset: (preset: BackgroundPreset) => {
        set({ preset });
      },
      
      setCustomColor: (color: string) => {
        set({ customColor: color });
        // Auto-switch to custom preset when user picks a color
        set({ preset: 'custom' });
      },
      
      resetToDefaults: () => {
        set({ preset: DEFAULT_PRESET, customColor: DEFAULT_CUSTOM_COLOR });
      },
      
      getBackgroundSettings: (): BackgroundSettings => {
        const { preset, customColor } = get();
        if (preset === 'custom') {
          return {
            variant: BackgroundVariant.Dots,
            gap: 24,
            size: 1,
            color: customColor,
          };
        }
        return PRESET_SETTINGS[preset];
      },
    }),
    {
      name: 'background-settings',
    }
  )
);
