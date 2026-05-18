/**
 * I18nProvider — client-side i18n context provider
 * 
 * Wraps the app with next-intl's NextIntlClientProvider.
 * Locale is stored in userPreferencesStore.locale.
 * 
 * Usage:
 *   <I18nProvider locale="zh">...</I18nProvider>
 */

'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

interface I18nProviderProps {
  children: ReactNode;
  locale?: string;
  messages?: Record<string, unknown>;
}

export function I18nProvider({ children, locale = 'zh', messages }: I18nProviderProps) {
  // Messages are loaded server-side in request.ts
  // For now, we pass messages directly since we're not using locale routing
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
