'use client';
/**
 * RecentSearchesDropdown.tsx — Sprint75 E1: 搜索历史工具栏快捷入口
 *
 * Displays recent search terms (up to 5) in a dropdown from the toolbar.
 * Clicking a term sets the search query + dispatches dds:recent-search event to open search.
 */

import React, { useEffect, useRef } from 'react';
import { useCanvasSearchStore } from '@/stores/dds/canvasSearchStore';
import styles from './RecentSearchesDropdown.module.css';

export interface RecentSearchesDropdownProps {
  open: boolean;
  onClose: () => void;
}

const MAX_DISPLAY = 5;

export function RecentSearchesDropdown({ open, onClose }: RecentSearchesDropdownProps) {
  const recentSearches = useCanvasSearchStore((s) => s.recentSearches);
  const setSearchQuery = useCanvasSearchStore((s) => s.setSearchQuery);
  const clearHistory = useCanvasSearchStore((s) => s.clearHistory);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayItems = recentSearches.slice(0, MAX_DISPLAY);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Slight delay to avoid closing immediately when opening
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleTermClick(term: string) {
    setSearchQuery(term);
    window.dispatchEvent(new CustomEvent('dds:recent-search', { detail: { term } }));
    onClose();
  }

  function handleClearHistory(e: React.MouseEvent) {
    e.stopPropagation();
    clearHistory();
  }

  function handleViewMore(e: React.MouseEvent) {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('dds:open-search-panel'));
    onClose();
  }

  return (
    <div
      ref={dropdownRef}
      className={styles.dropdown}
      role="menu"
      aria-label="搜索历史"
    >
      <div className={styles.header}>
        <span className={styles.headerTitle}>最近搜索</span>
        {displayItems.length > 0 && (
          <button
            className={styles.clearBtn}
            onClick={handleClearHistory}
            aria-label="清除搜索历史"
            type="button"
          >
            清除历史
          </button>
        )}
      </div>

      {displayItems.length === 0 ? (
        <div className={styles.empty}>暂无搜索历史</div>
      ) : (
        <ul className={styles.list} role="list">
          {displayItems.map((term) => (
            <li key={term} role="listitem">
              <button
                className={styles.item}
                onClick={() => handleTermClick(term)}
                type="button"
                aria-label={`搜索 ${term}`}
              >
                <svg
                  className={styles.searchIcon}
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className={styles.term}>{term}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {displayItems.length > 0 && (
        <div className={styles.footer}>
          <button
            className={styles.viewMore}
            onClick={handleViewMore}
            type="button"
            aria-label="查看更多搜索历史"
          >
            查看更多
          </button>
        </div>
      )}
    </div>
  );
}
