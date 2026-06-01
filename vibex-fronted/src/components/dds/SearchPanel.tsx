/**
 * SearchPanel.tsx — Sprint50 E1: Canvas Global Search Panel
 *
 * 画布全局搜索面板（Cmd+K 激活）。
 * 与 DDSSearchPanel（卡内搜索）不同：此面板搜索所有画布。
 */
'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useCanvasSearchStore } from '@/stores/canvasSearchStore';
import { useCanvasListStore } from '@/stores/canvasListStore';
import type { CanvasSearchResult } from '@/stores/canvasSearchStore';

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
  onSelectCanvas: (canvasId: string) => void;
}

/**
 * Format relative time (e.g., "2 hours ago", "yesterday")
 */
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export const SearchPanel = React.memo(function SearchPanel({
  open,
  onClose,
  onSelectCanvas,
}: SearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedIndexRef = useRef(0);

  const query = useCanvasSearchStore((s) => s.query ?? '');
  const results = useCanvasSearchStore((s) => s.results);
  const search = useCanvasSearchStore((s) => s.search);
  const setPanelOpen = useCanvasSearchStore((s) => s.setPanelOpen);

  const canvases = useCanvasListStore((s) => s.canvases);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      selectedIndexRef.current = 0;
    }
  }, [open]);

  // Close handler
  const handleClose = useCallback(() => {
    setPanelOpen(false);
    onClose();
  }, [onClose, setPanelOpen]);

  // Reset selection when results change
  useEffect(() => {
    selectedIndexRef.current = 0;
  }, [results]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndexRef.current = Math.min(selectedIndexRef.current + 1, results.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = results[selectedIndexRef.current];
        if (selected) {
          onSelectCanvas(selected.canvasId);
          handleClose();
        }
      }
    },
    [handleClose, results, onSelectCanvas]
  );

  // Search handler (debounced via store)
  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      search(q);
    },
    [search]
  );

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="全局画布搜索"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          margin: '0 1rem',
          background: 'var(--color-bg-secondary, #1e1e2e)',
          border: '1px solid var(--color-border, #3a3a4a)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
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
            padding: '14px 18px',
            borderBottom: '1px solid var(--color-border, #3a3a4a)',
            gap: '12px',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-text-muted, #888)"
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
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="搜索画布..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text-primary, #e5e5e5)',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
            aria-label="搜索画布"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={() => search('')}
              style={{
                background: 'var(--color-bg-tertiary, #2a2a3a)',
                border: 'none',
                borderRadius: '4px',
                color: 'var(--color-text-muted, #888)',
                cursor: 'pointer',
                padding: '2px 8px',
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
            minHeight: '80px',
          }}
          role="listbox"
          aria-label="搜索结果"
        >
          {!query ? (
            // Show all canvases when no query
            canvases.length === 0 ? (
              <EmptyState message="暂无画布" />
            ) : (
              canvases.slice(0, 10).map((canvas, idx) => (
                <ResultRow
                  key={canvas.id}
                  canvas={canvas}
                  idx={idx}
                  selectedIndexRef={selectedIndexRef}
                  onSelect={() => {
                    onSelectCanvas(canvas.id);
                    handleClose();
                  }}
                />
              ))
            )
          ) : results.length === 0 ? (
            <EmptyState message="未找到匹配画布" />
          ) : (
            results.map((result, idx) => {
              const canvas = canvases.find((c) => c.id === result.canvasId);
              if (!canvas) return null;
              return (
                <ResultRow
                  key={result.canvasId}
                  canvas={canvas}
                  idx={idx}
                  selectedIndexRef={selectedIndexRef}
                  matchedField={result.matchedField}
                  onSelect={() => {
                    onSelectCanvas(result.canvasId);
                    handleClose();
                  }}
                />
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '8px 18px',
            borderTop: '1px solid var(--color-border, #3a3a4a)',
            fontSize: '0.7rem',
            color: 'var(--color-text-muted, #666)',
          }}
          aria-hidden="true"
        >
          <span>↑↓ 导航</span>
          <span>↵ 打开</span>
          <span>Esc 关闭</span>
          <span style={{ marginLeft: 'auto' }}>⌘K 搜索</span>
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// Sub-components
// =============================================================================

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '24px',
        textAlign: 'center',
        color: 'var(--color-text-muted, #888)',
        fontSize: '0.875rem',
      }}
    >
      {message}
    </div>
  );
}

interface ResultRowProps {
  canvas: { id: string; name: string; updatedAt: string };
  idx: number;
  selectedIndexRef: React.MutableRefObject<number>;
  matchedField?: 'name' | 'nodes' | 'both';
  onSelect: () => void;
}

function ResultRow({ canvas, idx, selectedIndexRef, matchedField, onSelect }: ResultRowProps) {
  const isSelected = idx === selectedIndexRef.current;
  const timeLabel = formatRelativeTime(canvas.updatedAt);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => {
        selectedIndexRef.current = idx;
      }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 18px',
        background: isSelected ? 'var(--color-bg-tertiary, #2a2a3a)' : 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--color-border, #2a2a3a)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.1s',
      }}
      role="option"
      aria-selected={isSelected}
    >
      {/* Canvas icon */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-text-muted, #888)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>

      <span
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: 'var(--color-text-primary, #e5e5e5)',
          fontSize: '0.9rem',
        }}
      >
        {canvas.name || '未命名画布'}
      </span>

      <span
        style={{
          fontSize: '0.7rem',
          color: 'var(--color-text-muted, #666)',
          flexShrink: 0,
        }}
      >
        {timeLabel}
      </span>

      {matchedField && (
        <span
          style={{
            fontSize: '0.65rem',
            color: 'var(--color-accent, #7c6af7)',
            background: 'var(--color-bg-tertiary, #2a2a3a)',
            padding: '2px 6px',
            borderRadius: '3px',
            flexShrink: 0,
          }}
          aria-label={`匹配字段: ${matchedField}`}
        >
          {matchedField === 'name' ? '名称' : matchedField === 'nodes' ? '内容' : '名称+内容'}
        </span>
      )}
    </button>
  );
}
