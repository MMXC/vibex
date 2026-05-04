'use client';

import { useState, useEffect, useId } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './SearchBar.module.css';

export interface SearchBarProps {
  /** 搜索占位提示 */
  placeholder?: string;
  /** 防抖延迟（ms），默认 300 */
  debounceMs?: number;
  /** 外部可控的初始值 */
  defaultValue?: string;
  /** 防抖后的搜索词回调 */
  onSearch: (query: string) => void;
  /** 附加 CSS 类名 */
  className?: string;
}

/**
 * SearchBar — Dashboard 模糊搜索栏
 *
 * 内置 debounce（默认 300ms），只在 debounce 稳定后触发 onSearch 回调。
 * 显示实时键入的原始值，向父层透传去抖后的值。
 *
 * E3-S1
 */
export function SearchBar({
  placeholder = '搜索项目...',
  debounceMs = 300,
  defaultValue = '',
  onSearch,
  className,
}: SearchBarProps) {
  const inputId = useId();
  const [query, setQuery] = useState(defaultValue);
  const debouncedQuery = useDebounce(query, debounceMs);

  // 每次 debounced 值变化时通知父层
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className={`${styles.searchBox} ${className ?? ''}`} role="search">
      <label htmlFor={inputId} className={styles.srOnly}>
        {placeholder}
      </label>
      <span className={styles.searchIcon} aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={styles.searchInput}
        autoComplete="off"
        data-testid="project-search-input"
      />
      {query && (
        <button
          className={styles.clearBtn}
          onClick={handleClear}
          type="button"
          aria-label="清除搜索"
          title="清除搜索"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
