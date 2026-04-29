'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import type { DDSSearchResult } from '@/hooks/dds/useDDSCanvasSearch';

export interface DDSSearchPanelProps {
  open: boolean;
  onClose: () => void;
  results: DDSSearchResult[];
  query: string;
  onQueryChange: (q: string) => void;
  onSelectResult: (result: DDSSearchResult) => void;
}

const CHAPTER_LABELS: Record<string, string> = {
  requirement: '需求',
  context: '上下文',
  flow: '流程',
  api: 'API',
  'business-rules': '业务规则',
};

function scrollToCard(cardId: string): void {
  const el = document.querySelector(`[data-card-id="${cardId}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  // Highlight pulse
  el.classList.add('search-highlight');
  setTimeout(() => {
    el.classList.remove('search-highlight');
  }, 2000);
}

export const DDSSearchPanel = React.memo(function DDSSearchPanel({
  open,
  onClose,
  results,
  query,
  onQueryChange,
  onSelectResult,
}: DDSSearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedIndexRef = useRef(0);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      selectedIndexRef.current = 0;
    }
  }, [open]);

  // Reset selection when results change
  useEffect(() => {
    selectedIndexRef.current = 0;
  }, [results]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndexRef.current = Math.min(
          selectedIndexRef.current + 1,
          results.length - 1
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = results[selectedIndexRef.current];
        if (selected) {
          scrollToCard(selected.card.id);
          onSelectResult(selected);
        }
      }
    },
    [onClose, results, onSelectResult]
  );

  if (!open) return null;

  return (
    <div
      data-testid="dds-search-panel"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="搜索 DDS 卡片"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          margin: '0 1rem',
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #2a2a2a',
            gap: '10px',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#888"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索卡片..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e5e5e5',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
            aria-label="搜索卡片"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              style={{
                background: '#2a2a2a',
                border: 'none',
                borderRadius: '4px',
                color: '#888',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '0.75rem',
              }}
              aria-label="清空搜索"
            >
              ✕
            </button>
          )}
        </div>

        {/* Results */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: '60px',
          }}
          role="listbox"
          aria-label="搜索结果"
        >
          {!query ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#666',
                fontSize: '0.875rem',
              }}
            >
              输入关键词搜索所有章节卡片
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#666',
                fontSize: '0.875rem',
              }}
            >
              未找到匹配结果
            </div>
          ) : (
            results.map((result, idx) => (
              <button
                key={`${result.card.id}-${result.chapter}`}
                type="button"
                onClick={() => {
                  scrollToCard(result.card.id);
                  onSelectResult(result);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  background: idx === selectedIndexRef.current ? '#2a2a2a' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #222',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                role="option"
                aria-selected={idx === selectedIndexRef.current}
                onMouseEnter={() => {
                  selectedIndexRef.current = idx;
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '22px',
                    height: '22px',
                    borderRadius: '4px',
                    background: '#2d2d2d',
                    color: '#888',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {(result.chapter[0] ?? "").toUpperCase()}
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#e5e5e5',
                    fontSize: '0.875rem',
                  }}
                >
                  {result.card.title}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#555',
                    background: '#222',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    flexShrink: 0,
                  }}
                  aria-label={`章节: ${CHAPTER_LABELS[result.chapter] ?? result.chapter}`}
                >
                  {CHAPTER_LABELS[result.chapter] ?? result.chapter}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '8px 16px',
            borderTop: '1px solid #2a2a2a',
            fontSize: '0.7rem',
            color: '#444',
          }}
          aria-hidden="true"
        >
          <span>↑↓ 导航</span>
          <span>↵ 跳转</span>
          <span>Esc 关闭</span>
          <span style={{ marginLeft: 'auto' }}>⌘K 搜索</span>
        </div>
      </div>
    </div>
  );
});
