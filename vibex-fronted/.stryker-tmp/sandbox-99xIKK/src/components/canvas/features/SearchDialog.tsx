/**
 * SearchDialog — 节点搜索对话框
 * Fuse.js 模糊搜索，支持 ↑↓ 键盘导航、Enter 跳转、Esc 关闭
 *
 * Epic 2: E2-F5
 * 架构: ADR-004
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 */
// @ts-nocheck

'use client';

import React, { useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { SearchResult } from '@/hooks/canvas/useCanvasSearch';
import styles from './SearchDialog.module.css';

interface SearchDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 搜索结果（来自 useCanvasSearch） */
  results: SearchResult[];
  /** 当前搜索词 */
  query: string;
  /** 搜索词变化回调 */
  onQueryChange: (q: string) => void;
  /** 搜索耗时（ms） */
  searchTimeMs: number;
  /** 结果选中回调 */
  onSelect: (result: SearchResult) => void;
}

/** Tree type display config */
const TREE_TYPE_DISPLAY: Record<string, { label: string; icon: string }> = {
  context: { label: '限界上下文', icon: '◇' },
  flow: { label: '业务流程', icon: '→' },
  component: { label: '组件树', icon: '▣' },
};

export function SearchDialog({
  open,
  onClose,
  results,
  query,
  onQueryChange,
  searchTimeMs,
  onSelect,
}: SearchDialogProps) {
  // Focus input when dialog opens
  useEffect(() => {
    if (!open) return;
    const input = document.getElementById('canvas-search-input') as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.value = query;
    }
  }, [open, query]);

  // Keyboard navigation inside dialog
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const listbox = document.getElementById('canvas-search-results');
      if (!listbox) return;

      const items = listbox.querySelectorAll<HTMLElement>('[role="option"]');
      const activeIdx = Array.from(items).findIndex((el) => el.getAttribute('aria-selected') === 'true');

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(activeIdx + 1, items.length - 1);
        items.forEach((el, i) => el.setAttribute('aria-selected', String(i === next)));
        items[next]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(activeIdx - 1, 0);
        items.forEach((el, i) => el.setAttribute('aria-selected', String(i === prev)));
        items[prev]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIdx >= 0 && results[activeIdx]) {
          onSelect(results[activeIdx]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [results, onSelect, onClose]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="搜索节点"
    >
      <div className={styles.dialog}>
        {/* Search input */}
        <div className={styles.inputRow}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            id="canvas-search-input"
            type="text"
            className={styles.input}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="搜索节点..."
            aria-label="搜索节点"
            aria-autocomplete="list"
            aria-controls="canvas-search-results"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => onQueryChange('')}
              aria-label="清除搜索"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭搜索"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div
          id="canvas-search-results"
          className={styles.results}
          role="listbox"
          aria-label="搜索结果"
        >
          {query.trim() === '' && (
            <div className={styles.emptyHint}>输入关键词搜索节点，支持模糊匹配</div>
          )}

          {query.trim() !== '' && results.length === 0 && (
            <div className={styles.noResults}>未找到匹配的节点</div>
          )}

          {results.map((result, index) => {
            const display = TREE_TYPE_DISPLAY[result.treeType] ?? {
              label: result.treeType,
              icon: '○',
            };

            return (
              <div
                key={result.id}
                className={`${styles.resultItem} ${index === 0 ? styles.resultItemActive : ''}`}
                role="option"
                aria-selected={index === 0}
                onClick={() => onSelect(result)}
                onMouseEnter={(e) => {
                  const items = e.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="option"]');
                  items?.forEach((el, i) => el.setAttribute('aria-selected', String(i === index)));
                }}
                data-node-id={result.id}
              >
                <span className={styles.resultIcon}>{display.icon}</span>
                <div className={styles.resultContent}>
                  <span className={styles.resultLabel}>{result.name}</span>
                  <span className={styles.resultTree}>{display.label}</span>
                </div>
                <div className={styles.resultMeta}>
                  <span className={`${styles.resultStatus} ${styles[`status_${result.status}`]}`}>
                    {result.status === 'confirmed'
                      ? '✓'
                      : result.status === 'pending'
                        ? '○'
                        : result.status === 'error'
                          ? '!'
                          : '◌'}
                  </span>
                  {result.isActive !== false && (
                    <span className={styles.activeBadge}>已确认</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span>
            <kbd>↑↓</kbd> 导航
          </span>
          <span>
            <kbd>Enter</kbd> 跳转
          </span>
          <span>
            <kbd>Esc</kbd> 关闭
          </span>
          {searchTimeMs > 0 && (
            <span className={styles.searchTime}>{searchTimeMs.toFixed(0)}ms</span>
          )}
        </div>
      </div>
    </div>
  );
}
