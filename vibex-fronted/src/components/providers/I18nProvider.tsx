/**
 * I18nProvider — client-side i18n context provider
 *
 * Wraps the app with next-intl's NextIntlClientProvider.
 * Locale is stored in userPreferencesStore.locale (P001-E2).
 *
 * Usage:
 *   <I18nProvider locale="zh">...</I18nProvider>
 */

'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';

interface I18nProviderProps {
  children: ReactNode;
  locale?: string;
  messages?: Record<string, unknown>;
}

export function I18nProvider({ children, locale, messages }: I18nProviderProps) {
  // P001-E2: Read locale from userPreferencesStore for dynamic language switching
  const storeLocale = useUserPreferencesStore((s) => s.locale);
  const activeLocale = storeLocale ?? locale ?? 'zh';

  return (
    <NextIntlClientProvider locale={activeLocale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
