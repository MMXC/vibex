'use client';

/**
 * CanvasSearchPanel — Sprint73 E1 + Sprint74 E1: 画布内容全文搜索
 *
 * Sprint73 E1: 全文搜索 + history tab + keyboard nav
 * Sprint74 E1: recentSearches chips above input + max 20 items
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useCanvasSearchStore, type NodeSearchResult } from '@/stores/dds/canvasSearchStore';
import { useTranslations } from '@/hooks/useTranslations';

export interface CanvasSearchPanelProps {
  open: boolean;
  onClose: () => void;
}

/** Highlight matching text in a string */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            style={{
              background: '#f59e0b',
              color: '#000',
              borderRadius: '2px',
              padding: '0 1px',
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/**
 * Scroll to a node in the canvas by dispatching a custom event.
 * DDSCanvasPage listens for 'canvas:scroll-to-node' and calls fitView/setCenter.
 */
function scrollToNode(nodeId: string, canvasId: string) {
  window.dispatchEvent(
    new CustomEvent('canvas:scroll-to-node', {
      detail: { nodeId, canvasId },
    })
  );
}

export const CanvasSearchPanel = React.memo(function CanvasSearchPanel({
  open,
  onClose,
}: CanvasSearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'results' | 'history'>('results');

  // Store state
  const fulltextQuery = useCanvasSearchStore((s) => s.fulltextQuery);
  const fulltextResults = useCanvasSearchStore((s) => s.fulltextResults);
  const fulltextLoading = useCanvasSearchStore((s) => s.fulltextLoading);
  const recentSearches = useCanvasSearchStore((s) => s.recentSearches);
  const addRecentSearch = useCanvasSearchStore((s) => s.addRecentSearch);
  const clearHistory = useCanvasSearchStore((s) => s.clearHistory);
  const searchNodeContent = useCanvasSearchStore((s) => s.searchNodeContent);

  // i18n
  const t = useTranslations('search')();

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      selectedIndexRef.current = 0;
      setActiveIndex(0);
      setActiveTab('results');
    }
  }, [open]);

  // Reset selection when results change
  useEffect(() => {
    selectedIndexRef.current = 0;
  }, [fulltextResults]);

  // Handle search input change
  const handleQueryChange = useCallback(
    (query: string) => {
      searchNodeContent(query);
    },
    [searchNodeContent]
  );

  // Handle result selection
  const handleSelectResult = useCallback(
    (result: NodeSearchResult) => {
      if (fulltextQuery.trim()) {
        addRecentSearch(fulltextQuery.trim());
      }
      scrollToNode(result.nodeId, result.canvasId);
      onClose();
    },
    [fulltextQuery, addRecentSearch, onClose]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const currentItems = activeTab === 'history' ? recentSearches : fulltextResults;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndexRef.current = Math.min(
          selectedIndexRef.current + 1,
          currentItems.length - 1
        );
        setActiveIndex(selectedIndexRef.current);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, 0);
        setActiveIndex(selectedIndexRef.current);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeTab === 'history') {
          const selected = recentSearches[selectedIndexRef.current];
          if (selected) {
            handleQueryChange(selected);
            setActiveTab('results');
          }
        } else {
          const selected = fulltextResults[selectedIndexRef.current];
          if (selected) {
            handleSelectResult(selected);
          }
        }
      }
    },
    [onClose, fulltextResults, recentSearches, activeTab, handleQueryChange, handleSelectResult]
  );

  if (!open) return null;

  const isHistoryEmpty = recentSearches.length === 0;

  return (
    <div
      data-testid="canvas-search-panel"
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
      aria-label={t('canvasSearchLabel') ?? 'Canvas Node Search'}
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
          {/* Search icon */}
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
            value={fulltextQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('canvasSearchPlaceholder') ?? 'Search canvas content...'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e5e5e5',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
            aria-label={t('canvasSearchInputLabel') ?? 'Search canvas nodes'}
            aria-activedescendant={
              activeTab === 'history'
                ? `canvas-search-history-${activeIndex}`
                : `canvas-search-result-${activeIndex}`
            }
            autoComplete="off"
            spellCheck={false}
          />
          {fulltextLoading && (
            <span
              style={{
                color: '#888',
                fontSize: '0.75rem',
                animation: 'spin 1s linear infinite',
              }}
              aria-live="polite"
            >
              ⏳
            </span>
          )}
          {fulltextQuery && !fulltextLoading && (
            <button
              type="button"
              onClick={() => handleQueryChange('')}
              style={{
                background: '#2a2a2a',
                border: 'none',
                borderRadius: '4px',
                color: '#888',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '0.75rem',
              }}
              aria-label={t('clearSearch') ?? 'Clear'}
            >
              ✕
            </button>
          )}
        </div>

        {/* S74-E1: Recent Search Chips above tab bar */}
        {!isHistoryEmpty && !fulltextQuery && activeTab === 'results' && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              padding: '8px 16px',
              borderBottom: '1px solid #2a2a2a',
            }}
            aria-label={t('recentSearchChips') ?? 'Recent searches'}
            data-testid="recent-search-chips"
          >
            {recentSearches.slice(0, 5).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  handleQueryChange(item);
                  setActiveTab('results');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 10px',
                  background: '#2a2a2a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '14px',
                  color: '#aaa',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                data-testid="recent-search-chip"
                aria-label={`Recent: ${item}`}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#666"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                </svg>
                {item}
              </button>
            ))}
          </div>
        )}

        {/* Tab Bar */}
        <div
          role="tablist"
          aria-label={t('searchPanel') ?? 'Search options'}
          style={{ display: 'flex', borderBottom: '1px solid #2a2a2a' }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'results'}
            onClick={() => {
              setActiveTab('results');
              selectedIndexRef.current = 0;
              setActiveIndex(0);
            }}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'transparent',
              border: 'none',
              borderBottom:
                activeTab === 'results' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'results' ? '#e5e5e5' : '#666',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            {t('searchResults') ?? 'Results'}
            {fulltextQuery && fulltextResults.length > 0 && (
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
                {fulltextResults.length}
              </span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            onClick={() => {
              setActiveTab('history');
              selectedIndexRef.current = 0;
              setActiveIndex(0);
            }}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'transparent',
              border: 'none',
              borderBottom:
                activeTab === 'history' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'history' ? '#e5e5e5' : '#666',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            {t('recentSearches') ?? 'History'}
          </button>
        </div>

        {/* Results Panel */}
        <div
          style={{ display: activeTab === 'results' ? 'flex' : 'none', flexDirection: 'column' }}
        >
          <div
            style={{ flex: 1, overflowY: 'auto', minHeight: '60px' }}
            role="listbox"
            aria-label={t('searchResults') ?? 'Search results'}
          >
            {!fulltextQuery ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '0.875rem',
                }}
              >
                {t('searchToFind') ?? 'Type to search canvas content...'}
              </div>
            ) : fulltextLoading ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '0.875rem',
                }}
              >
                {t('searching') ?? 'Searching...'}
              </div>
            ) : fulltextResults.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '0.875rem',
                }}
              >
                {t('noResults') ?? 'No results found'}
              </div>
            ) : (
              fulltextResults.map((result, idx) => (
                <button
                  key={`${result.nodeId}-${result.canvasId}-${idx}`}
                  id={`canvas-search-result-${idx}`}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 16px',
                    background:
                      idx === selectedIndexRef.current ? '#2a2a2a' : 'transparent',
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
                    setActiveIndex(idx);
                  }}
                  data-testid={`canvas-search-result-${idx}`}
                >
                  {/* Node type badge */}
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
                      marginTop: '2px',
                    }}
                    aria-hidden="true"
                  >
                    {(result.nodeType ?? 'N')[0].toUpperCase()}
                  </span>
                  {/* Match content */}
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
                    <HighlightMatch text={result.matchedText} query={fulltextQuery} />
                  </span>
                  {/* Canvas name + score */}
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: '#555',
                      background: '#222',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      flexShrink: 0,
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={result.canvasName}
                  >
                    {result.canvasName}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* History Panel */}
        <div
          style={{
            display: activeTab === 'history' ? 'flex' : 'none',
            flexDirection: 'column',
          }}
        >
          <div
            style={{ flex: 1, overflowY: 'auto', minHeight: '60px' }}
            role="listbox"
              aria-label={t('searchHistory') ?? 'Search history'}
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
                  {t('noSearchHistory') ?? 'No search history'}
                </div>
              ) : (
                <>
                  {recentSearches.map((item, idx) => (
                  <button
                    key={item}
                    id={`canvas-search-history-${idx}`}
                    type="button"
                    onClick={() => {
                      handleQueryChange(item);
                      setActiveTab('results');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      background:
                        idx === selectedIndexRef.current ? '#2a2a2a' : 'transparent',
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
                      setActiveIndex(idx);
                    }}
                    data-testid={`canvas-search-history-${idx}`}
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
                  data-testid="clear-canvas-search-history"
                  aria-label={t('clearSearchHistory') ?? 'Clear history'}
                >
                  {t('clearHistory') ?? 'Clear history'}
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
          <span>↑↓ {t('navigate') ?? 'Navigate'}</span>
          <span>↵ {t('goTo') ?? 'Go to'}</span>
          <span>Esc {t('close') ?? 'Close'}</span>
          <span style={{ marginLeft: 'auto' }}>
            ⌘F / Ctrl+F
          </span>
        </div>
      </div>
    </div>
  );
});
