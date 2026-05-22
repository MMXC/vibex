/**
 * User Preferences Store
 * E011: Persisted user preferences using Zustand persist middleware with localStorage
 *
 * Supports: theme ('light'|'dark'|'system'), defaultTemplate, shortcutCustomization
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system' | 'enterprise-a' | 'enterprise-b';
export type LocalePreference = 'en' | 'zh';

export interface ShortcutCustomization {
  action: string;
  customKey: string;
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

  // Actions
  setTheme: (theme: ThemePreference) => void;
  setLocale: (locale: LocalePreference) => void;
  setDefaultTemplate: (template: string) => void;
  setShortcutCustomization: (shortcuts: ShortcutCustomization[]) => void;
  resetPreferences: () => void;
}

// Default values
const DEFAULT_PREFERENCES: Pick<
  UserPreferencesState,
  'theme' | 'locale' | 'defaultTemplate' | 'shortcutCustomization'
> = {
  theme: 'system',
  locale: 'zh',
  defaultTemplate: 'blank',
  shortcutCustomization: [],
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

      resetPreferences: () => set({ ...DEFAULT_PREFERENCES }),
    }),
    {
      name: 'vibex-user-preferences',
    }
  )
);
