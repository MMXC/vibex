/**
 * LanguageSwitcher — Toolbar language dropdown
 *
 * S61-E3: i18n infrastructure — language switcher button in DDSToolbar.
 * Reads current locale from userPreferencesStore and switches to 'en' or 'zh'.
 *
 * @usage Add to DDSToolbar: import { LanguageSwitcher } from './LanguageSwitcher';
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import { useLanguage } from '@/hooks/settings/useLanguage';
import styles from './LanguageSwitcher.module.css';

function GlobeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export const LanguageSwitcher = memo(function LanguageSwitcher() {
  const { locale, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (lang: 'en' | 'zh') => {
      setLanguage(lang);
      setIsOpen(false);
    },
    [setLanguage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    []
  );

  const label = locale === 'zh' ? '中文' : 'EN';

  return (
    <div className={styles.container} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={styles.trigger}
        onClick={handleToggle}
        aria-label="切换语言"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        data-testid="language-switcher-btn"
      >
        <GlobeIcon />
        <span className={styles.label}>{label}</span>
        <ChevronIcon />
      </button>

      {isOpen && (
        <ul
          className={styles.dropdown}
          role="listbox"
          aria-label="选择语言"
        >
          <li
            role="option"
            aria-selected={locale === 'zh'}
            className={`${styles.option} ${locale === 'zh' ? styles.active : ''}`}
            onClick={() => handleSelect('zh')}
            data-testid="lang-zh"
          >
            <span>🇨🇳</span>
            <span>中文</span>
          </li>
          <li
            role="option"
            aria-selected={locale === 'en'}
            className={`${styles.option} ${locale === 'en' ? styles.active : ''}`}
            onClick={() => handleSelect('en')}
            data-testid="lang-en"
          >
            <span>🇺🇸</span>
            <span>English</span>
          </li>
        </ul>
      )}
    </div>
  );
});
