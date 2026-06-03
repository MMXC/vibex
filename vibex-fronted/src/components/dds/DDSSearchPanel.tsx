'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { DDSSearchResult } from '@/hooks/dds/useDDSCanvasSearch';
import { useCanvasSearchStore } from '@/stores/dds/canvasSearchStore';

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

/** 高亮搜索关键词 */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} style={{ background: '#f59e0b', color: '#000', borderRadius: '2px', padding: '0 1px' }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function scrollToCard(cardId: string): void {
  const el = document.querySelector(`[data-card-id="${cardId}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  const [activeTab, setActiveTab] = useState<'results' | 'history'>('results');

  const searchHistory = useCanvasSearchStore((s) => s.searchHistory);
  const addToHistory = useCanvasSearchStore((s) => s.addToHistory);
  const clearHistory = useCanvasSearchStore((s) => s.clearHistory);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      selectedIndexRef.current = 0;
      setActiveTab('results');
    }
  }, [open]);

  // Reset selection when results change
  useEffect(() => {
    selectedIndexRef.current = 0;
  }, [results]);

  // Commit to history when query changes and results are selected
  const handleSelectResult = useCallback(
    (result: DDSSearchResult) => {
      if (query.trim()) {
        addToHistory(query.trim());
      }
      scrollToCard(result.card.id);
      onSelectResult(result);
    },
    [query, addToHistory, onSelectResult]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      const currentItems = activeTab === 'history' ? searchHistory : results;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndexRef.current = Math.min(
          selectedIndexRef.current + 1,
          currentItems.length - 1
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeTab === 'history') {
          const selected = searchHistory[selectedIndexRef.current];
          if (selected) {
            onQueryChange(selected);
            setActiveTab('results');
          }
        } else {
          const selected = results[selectedIndexRef.current];
          if (selected) {
            handleSelectResult(selected);
          }
        }
      }
    },
    [onClose, results, searchHistory, activeTab, onQueryChange, handleSelectResult]
  );

  if (!open) return null;

  const isHistoryEmpty = searchHistory.length === 0;

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

        {/* Tab Bar */}
        <div
          role="tablist"
          aria-label="搜索面板"
          style={{
            display: 'flex',
            borderBottom: '1px solid #2a2a2a',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'results'}
            aria-controls="search-results-panel"
            onClick={() => {
              setActiveTab('results');
              selectedIndexRef.current = 0;
            }}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'results' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'results' ? '#e5e5e5' : '#666',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            搜索结果
            {query && results.length > 0 && (
              <span
                style={{
                  marginLeft: '6px',
                  background: '#3b82f6',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '0 6px',
                  fontSize: '0.65rem',
                  lineHeight: '16px',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                }}
              >
                {results.length}
              </span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            aria-controls="search-history-panel"
            onClick={() => {
              setActiveTab('history');
              selectedIndexRef.current = 0;
            }}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'history' ? '#e5e5e5' : '#666',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            最近搜索
          </button>
        </div>

        {/* Results Panel */}
        <div
          id="search-results-panel"
          role="tabpanel"
          aria-labelledby="results-tab"
          style={{ display: activeTab === 'results' ? 'flex' : 'none', flexDirection: 'column' }}
        >
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
                  onClick={() => handleSelectResult(result)}
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
                    {(result.chapter[0] ?? '').toUpperCase()}
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
                    {/* E5 D5.2: 高亮匹配关键词 */}
                    <HighlightText text={result.card.title} query={query} />
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
        </div>

        {/* History Panel */}
        <div
          id="search-history-panel"
          role="tabpanel"
          aria-labelledby="history-tab"
          style={{
            display: activeTab === 'history' ? 'flex' : 'none',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              minHeight: '60px',
            }}
            role="listbox"
            aria-label="搜索历史"
          >
            {isHistoryEmpty ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '0.875rem',
                }}
              >
                暂无搜索历史
              </div>
            ) : (
              <>
                {searchHistory.map((item, idx) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      onQueryChange(item);
                      setActiveTab('results');
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
                    data-testid="history-item"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#555"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                    </svg>
                    <span
                      style={{
                        flex: 1,
                        color: '#ccc',
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        color: '#444',
                        flexShrink: 0,
                      }}
                    >
                      #{idx + 1}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearHistory}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderTop: '1px solid #2a2a2a',
                    color: '#666',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                  data-testid="clear-history"
                  aria-label="清空搜索历史"
                >
                  清空历史
                </button>
              </>
            )}
          </div>
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
