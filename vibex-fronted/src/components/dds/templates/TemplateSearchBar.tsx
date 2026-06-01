/**
 * TemplateSearchBar.tsx — Template Fuzzy Search Input
 * Sprint49 E2: 画布模板管理完善
 *
 * Debounced search input that updates templateStore.searchQuery reactively.
 */
'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import styles from './TemplateSearchBar.module.css';

interface TemplateSearchBarProps {
  placeholder?: string;
}

export function TemplateSearchBar({ placeholder = '搜索模板...' }: TemplateSearchBarProps) {
  const [localQuery, setLocalQuery] = useState('');
  const { setSearchQuery, searchQuery } = useTemplateStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);

    // Debounce 300ms
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }, [setSearchQuery]);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    setSearchQuery('');
  }, [setSearchQuery]);

  return (
    <div className={styles.searchBar}>
      <span className={styles.searchIcon} aria-hidden="true">🔍</span>
      <input
        type="search"
        className={styles.searchInput}
        value={localQuery}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="搜索模板"
        autoComplete="off"
        spellCheck={false}
      />
      {localQuery && (
        <button
          type="button"
          className={styles.searchClear}
          onClick={handleClear}
          aria-label="清除搜索"
        >
          ✕
        </button>
      )}
    </div>
  );
}
