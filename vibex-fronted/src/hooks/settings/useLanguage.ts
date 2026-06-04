/**
 * useLanguage — Language preference hook
 *
 * Manages the user's language preference via userPreferencesStore.
 * The locale is persisted in localStorage and read by I18nProvider
 * to dynamically switch the active language.
 *
 * S61-E3: i18n infrastructure — provides useLanguage() for LanguageSwitcher
 * and any component that needs to read/write the current locale.
 */

'use client';

import { useCallback } from 'react';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import type { LocalePreference } from '@/stores/userPreferencesStore';

/**
 * Get current locale and a function to switch language.
 * @example
 *   const { locale, setLanguage } = useLanguage();
 *   setLanguage('en');
 */
export function useLanguage() {
  const locale = useUserPreferencesStore((s) => s.locale);
  const setLocale = useUserPreferencesStore((s) => s.setLocale);

  const setLanguage = useCallback(
    (lang: LocalePreference) => {
      setLocale(lang);
    },
    [setLocale]
  );

  return { locale, setLanguage };
}
