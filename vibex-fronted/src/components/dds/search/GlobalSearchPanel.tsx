'use client';
/**
 * GlobalSearchPanel.tsx — Sprint65 E4: 画布搜索与过滤增强
 *
 * Cmd+K global search modal — searches across all canvas names using fuzzy matching.
 * Displays results ranked by relevance (Fuse.js score).
 *
 * D4.4: Cmd+K global search panel
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { searchCanvases, type SearchResult } from '@/lib/db/canvasDb';
import { useCanvasSearchStore } from '@/stores/dds/canvasSearchStore';
import { useCanvasListStore } from '@/stores/canvasListStore';
import { useRouter } from 'next/navigation';

export interface GlobalSearchPanelProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearchPanel({ open, onClose }: GlobalSearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const addToHistory = useCanvasSearchStore((s) => s.addToHistory);
  const setActiveCanvas = useCanvasListStore((s) => s.setActiveCanvas);
  const router = useRouter();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchCanvases(query);
        setResults(found);
        setSelectedIdx(0);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    // Save to search history
    addToHistory(query);
    // Set active canvas
    setActiveCanvas(result.item.id);
    // Navigate to canvas
    router.push(`/canvas/${result.item.id}`);
    onClose();
  }, [query, addToHistory, setActiveCanvas, router, onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelect(results[selectedIdx]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [results, selectedIdx, handleSelect, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'white', borderRadius: 12, width: '100%', maxWidth: 560,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
        role="dialog"
        aria-label="全局搜索"
        aria-modal="true"
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索画布名称...（Cmd+K）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 16, color: '#111827', background: 'transparent',
            }}
            aria-label="搜索画布"
          />
          {loading && (
            <span style={{ color: '#9ca3af', fontSize: 13 }}>搜索中…</span>
          )}
          <kbd style={{
            background: '#f3f4f6', border: '1px solid #d1d5db',
            borderRadius: 4, padding: '2px 6px', fontSize: 12,
            color: '#6b7280', marginLeft: 8,
          }}>Esc</kbd>
        </div>

        {/* Results */}
        <ul style={{ maxHeight: 360, overflowY: 'auto', padding: '4px 0', margin: 0, listStyle: 'none' }}>
          {results.length === 0 && query.trim() && !loading && (
            <li style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
              未找到匹配的画布
            </li>
          )}
          {results.map((result, idx) => (
            <li key={result.item.id}>
              <button
                onClick={() => handleSelect(result)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 16px',
                  background: idx === selectedIdx ? '#f3f4f6' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
                onMouseEnter={() => setSelectedIdx(idx)}
                aria-selected={idx === selectedIdx}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                </svg>
                <span style={{ flex: 1, fontSize: 14, color: '#111827' }}>
                  {result.item.name}
                </span>
                <span style={{ fontSize: 11, color: '#d1d5db' }}>
                  {new Date(result.item.updatedAt).toLocaleDateString('zh-CN')}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div style={{
          padding: '8px 16px', borderTop: '1px solid #f3f4f6',
          fontSize: 12, color: '#9ca3af', display: 'flex', gap: 16,
        }}>
          <span>↑↓ 导航</span>
          <span>Enter 打开</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  );
}
