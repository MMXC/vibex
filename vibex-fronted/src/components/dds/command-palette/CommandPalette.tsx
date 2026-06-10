/**
 * CommandPalette.tsx — S84-E3: 画布快速跳转面板
 *
 * VS Code-style quick-open panel (Ctrl+K / Cmd+K).
 * Features:
 * - Global shortcut (Ctrl+K / Cmd+K) to open/close
 * - Fuzzy search across all canvases using Fuse.js
 * - Shows recent canvases when query is empty
 * - Keyboard navigation (↑↓ Enter Esc)
 * - Click-to-navigate
 * - Recent history persisted to localStorage (top 10)
 *
 * Usage:
 *   <CommandPalette />
 *   (mount once in DDSCanvasPage, register shortcut)
 */
'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { useCommandPaletteStore } from '@/stores/commandPaletteStore';
import type { SearchResult } from '@/stores/commandPaletteStore';
import styles from './CommandPalette.module.css';

interface CommandPaletteProps {
  /** Canvas entries to populate the search index */
  canvases?: Array<{ id: string; name: string }>;
}

export function CommandPalette({ canvases = [] }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isOpen = useCommandPaletteStore((s) => s.isOpen);
  const query = useCommandPaletteStore((s) => s.query);
  const results = useCommandPaletteStore((s) => s.results);
  const close = useCommandPaletteStore((s) => s.close);
  const setQuery = useCommandPaletteStore((s) => s.setQuery);
  const recordVisit = useCommandPaletteStore((s) => s.recordVisit);
  const setSearchIndex = useCommandPaletteStore((s) => s.setSearchIndex);

  // Build Fuse search index from canvases prop
  useEffect(() => {
    setSearchIndex(
      canvases.map((c) => ({
        id: c.id,
        name: c.name,
        lastVisited: new Date(0).toISOString(),
      }))
    );
  }, [canvases, setSearchIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Keep active item in view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  const handleNavigate = useCallback(
    (result: SearchResult) => {
      recordVisit(result.canvasId, result.name);
      close();
      router.push(`/canvas/${result.canvasId}`);
    },
    [recordVisit, close, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = results[activeIndex];
        if (item) handleNavigate(item);
      }
    },
    [results, activeIndex, handleNavigate]
  );

  if (!isOpen) return null;

  const recentResults = results.filter((r) => r.type === 'recent');
  const searchResults = results.filter((r) => r.type === 'search');

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        // Close on backdrop click (but not on panel click)
        if (e.target === e.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="快速跳转面板"
    >
      <div className={styles.panel}>
        {/* Search input */}
        <div className={styles.inputRow}>
          <span className={styles.searchIcon} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="搜索画布名称或跳转..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            aria-label="搜索画布"
            data-testid="command-palette-input"
          />
          <span className={styles.shortcutHint}>Esc 关闭</span>
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          className={styles.results}
          role="listbox"
          data-testid="command-palette-results"
        >
          {results.length === 0 && query.trim() && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} aria-hidden="true">🔍</div>
              <div>未找到匹配的画布</div>
            </div>
          )}

          {results.length === 0 && !query.trim() && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} aria-hidden="true">💨</div>
              <div>最近访问的画布将显示在这里</div>
            </div>
          )}

          {recentResults.length > 0 && (
            <>
              <div className={styles.sectionLabel}>最近访问</div>
              {recentResults.map((result, i) => (
                <ResultItem
                  key={result.canvasId}
                  result={result}
                  isActive={i === activeIndex}
                  onClick={() => handleNavigate(result)}
                  onMouseEnter={() => setActiveIndex(i)}
                />
              ))}
            </>
          )}

          {searchResults.length > 0 && (
            <>
              {recentResults.length > 0 && (
                <div className={styles.sectionLabel}>搜索结果</div>
              )}
              {searchResults.map((result, i) => {
                const globalIndex = recentResults.length + i;
                return (
                  <ResultItem
                    key={result.canvasId}
                    result={result}
                    isActive={globalIndex === activeIndex}
                    onClick={() => handleNavigate(result)}
                    onMouseEnter={() => setActiveIndex(globalIndex)}
                  />
                );
              })}
            </>
          )}
        </div>

        {/* Footer hints */}
        <div className={styles.footer}>
          <span className={styles.footerHint}>
            <kbd className={styles.footerKey}>↑↓</kbd> 导航
          </span>
          <span className={styles.footerHint}>
            <kbd className={styles.footerKey}>Enter</kbd> 跳转
          </span>
          <span className={styles.footerHint}>
            <kbd className={styles.footerKey}>Esc</kbd> 关闭
          </span>
        </div>
      </div>
    </div>
  );
}

// ==================== Result Item ====================

function ResultItem({
  result,
  isActive,
  onClick,
  onMouseEnter,
}: {
  result: SearchResult;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <div
      className={`${styles.resultItem}${isActive ? ' ' + styles.active : ''}`}
      role="option"
      aria-selected={isActive}
      data-active={isActive}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      data-testid={`command-palette-item-${result.canvasId}`}
    >
      <span className={styles.resultIcon} aria-hidden="true">
        {result.type === 'recent' ? '🕐' : '📄'}
      </span>
      <span className={styles.resultName}>{result.name}</span>
      {result.type === 'search' && (
        <span className={styles.resultMeta}>搜索匹配</span>
      )}
    </div>
  );
}
