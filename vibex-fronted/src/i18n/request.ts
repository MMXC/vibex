/**
 * next-intl v4 request configuration
 * Used by server components to get translations.
 * 
 * Without locale routing ([locale] segment), we use
 * the locale from the userPreferencesStore via
 * a client-side context.
 */

import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Default to 'zh' when locale routing is not used.
  // The actual locale is managed by userPreferencesStore
  // and accessed via the I18nProvider client component.
  return {
    locale: 'zh',
    messages: (await import('./messages/zh.json')).default,
  };
});
