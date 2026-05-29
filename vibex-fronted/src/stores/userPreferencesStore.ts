/**
 * User Preferences Store
 * E011: Persisted user preferences using Zustand persist middleware with localStorage
 * P003-E3: Extended with aiScores[] for AI coding score history
 * S42-P002-E4: Extended with gridSpacing, gridVisible, cursorVisible for canvas and collaboration settings
 *
 * Supports: theme ('light'|'dark'|'system'), defaultTemplate, shortcutCustomization, aiScores,
 *           gridSpacing, gridVisible, cursorVisible
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system' | 'enterprise-a' | 'enterprise-b';
export type LocalePreference = 'en' | 'zh';

export interface ShortcutCustomization {
  action: string;
  customKey: string;
}

/** P003-E3: AI scoring record for a single diff session */
export interface AIScoreRecord {
  /** ISO timestamp when the score was recorded */
  timestamp: string;
  /** Readability score 1-5 (how readable the AI code is) */
  readability: number;
  /** Complexity score 1-5 (lower = simpler code) */
  complexity: number;
  /** Coverage score 1-5 (how well the diff covers the task) */
  coverage: number;
  /** Number of lines added in the diff */
  linesAdded: number;
  /** Number of lines removed in the diff */
  linesRemoved: number;
  /** Task description that triggered the AI session */
  task?: string;
}

export interface UserPreferencesState {
  // Theme preference
  theme: ThemePreference;

  // Locale preference (P001-E2: language switcher)
  locale: LocalePreference;

  // Default template for new projects
  defaultTemplate: string;

  // Shortcut customization overrides
  shortcutCustomization: ShortcutCustomization[];

  // P003-E3: AI score history
  aiScores: AIScoreRecord[];

  // S42-P002-E4: Canvas grid settings
  gridSpacing: 8 | 16 | 32;
  gridVisible: boolean;
  cursorVisible: boolean;

  // Actions
  setTheme: (theme: ThemePreference) => void;
  setLocale: (locale: LocalePreference) => void;
  setDefaultTemplate: (template: string) => void;
  setShortcutCustomization: (shortcuts: ShortcutCustomization[]) => void;
  /** P003-E3: Add a new AI score record */
  addAIScore: (score: Omit<AIScoreRecord, 'timestamp'>) => void;
  /** P003-E3: Remove an AI score record by index */
  removeAIScore: (index: number) => void;
  /** P003-E3: Clear all AI score records */
  clearAIScores: () => void;
  /** S42-P002-E4: Set canvas grid spacing */
  setGridSpacing: (spacing: 8 | 16 | 32) => void;
  /** S42-P002-E4: Toggle canvas grid visibility */
  setGridVisible: (visible: boolean) => void;
  /** S42-P002-E4: Toggle collaboration cursor visibility */
  setCursorVisible: (visible: boolean) => void;
  resetPreferences: () => void;
}

// Default values
const DEFAULT_PREFERENCES: Pick<
  UserPreferencesState,
  'theme' | 'locale' | 'defaultTemplate' | 'shortcutCustomization' | 'aiScores' | 'gridSpacing' | 'gridVisible' | 'cursorVisible'
> = {
  theme: 'system',
  locale: 'zh',
  defaultTemplate: 'blank',
  shortcutCustomization: [],
  aiScores: [],
  gridSpacing: 16,
  gridVisible: true,
  cursorVisible: true,
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,

      setTheme: (theme) => set({ theme }),

      setLocale: (locale) => set({ locale }),

      setDefaultTemplate: (template) => set({ defaultTemplate: template }),

      setShortcutCustomization: (shortcuts) =>
        set({ shortcutCustomization: shortcuts }),

      // P003-E3: AI score actions
      addAIScore: (score) =>
        set((state) => ({
          aiScores: [
            { ...score, timestamp: new Date().toISOString() },
            ...state.aiScores,
          ],
        })),

      removeAIScore: (index) =>
        set((state) => ({
          aiScores: state.aiScores.filter((_, i) => i !== index),
        })),

      clearAIScores: () => set({ aiScores: [] }),

      // S42-P002-E4: Canvas grid actions
      setGridSpacing: (spacing) => set({ gridSpacing: spacing }),
      setGridVisible: (visible) => set({ gridVisible: visible }),
      setCursorVisible: (visible) => set({ cursorVisible: visible }),

      resetPreferences: () => set({ ...DEFAULT_PREFERENCES }),
    }),
    {
      name: 'vibex-user-preferences',
    }
  )
);
