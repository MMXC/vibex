/**
 * useTranslations — i18n translation hook
 * 
 * Provides translation function `t(key)` that reads from next-intl.
 * Uses the namespace pattern: call `useTranslations('namespace')` then `t('key')`.
 * 
 * For DDSToolbar pilot: `const t = useTranslations('toolbar')()` → `t('aiGenerate')`
 * 
 * @example
 *   const t = useTranslations('toolbar')();
 *   <span>{t('aiGenerate')}</span>
 * 
 *   const t = useTranslations('export')();
 *   <h2>{t('title')}</h2>
 */

'use client';

import { useTranslations as useNextIntlTranslations } from 'next-intl';

/**
 * Returns a translation function for the given namespace.
 * Call as: `const t = useTranslations('toolbar')()` — extra `()` is intentional
 * to match next-intl's API pattern.
 */
export function useTranslations(namespace: string) {
  const t = useNextIntlTranslations(namespace);
  // Return a function that takes a key string
  // (extra () makes it match the pattern `useTranslations(ns)()`)
  return () => t;
}
