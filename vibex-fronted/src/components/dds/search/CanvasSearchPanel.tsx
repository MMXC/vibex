'use client';
/**
 * CanvasSearchPanel.tsx — Sprint65 E4: 画布搜索与过滤增强
 *
 * In-page node text search within the current canvas.
 * Used inside DDSCanvasPage for searching card text.
 *
 * D4.6: 页面内节点搜索 — searches current canvas node text
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvasSearchStore } from '@/stores/dds/canvasSearchStore';
import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';

export interface CanvasSearchPanelProps {
  open: boolean;
  onClose: () => void;
}

/** Highlight search keyword in text */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            style={{ background: '#f59e0b', color: '#000', borderRadius: '2px', padding: '0 1px' }}
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

export function CanvasSearchPanel({ open, onClose }: CanvasSearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const addToHistory = useCanvasSearchStore((s) => s.addToHistory);
  const cards = useDDSCanvasStore((s) => s.cards);

  // Focus on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIdx(0);
    }
  }, [open]);

  // Filter cards by query
  const matchingCards = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return cards.filter((card) => {
      const data = card.data as Record<string, unknown>;
      return (
        typeof data.text === 'string' && data.text.toLowerCase().includes(q)
      );
    });
  }, [cards, query]);

  const scrollToCard = useCallback((cardId: string) => {
    const el = document.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('search-highlight');
    setTimeout(() => el.classList.remove('search-highlight'), 2000);
  }, []);

  const handleSelect = useCallback((cardId: string) => {
    addToHistory(query);
    scrollToCard(cardId);
    onClose();
  }, [query, addToHistory, scrollToCard, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, matchingCards.length - 1));
      if (matchingCards.length > 0) scrollToCard(matchingCards[Math.min(selectedIdx + 1, matchingCards.length - 1)].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
      if (matchingCards.length > 0) scrollToCard(matchingCards[Math.max(selectedIdx - 1, 0)].id);
    } else if (e.key === 'Enter' && matchingCards.length > 0) {
      e.preventDefault();
      handleSelect(matchingCards[selectedIdx].id);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [matchingCards, selectedIdx, scrollToCard, handleSelect, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'white', borderRadius: 12, width: '100%', maxWidth: 480,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
        role="dialog"
        aria-label="页面内搜索"
        aria-modal="true"
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ marginRight: 8 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索页面节点…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 15, color: '#111827', background: 'transparent',
            }}
            aria-label="搜索节点"
          />
          <kbd style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, padding: '2px 6px', fontSize: 12, color: '#6b7280' }}>Esc</kbd>
        </div>

        {/* Results */}
        <ul style={{ maxHeight: 320, overflowY: 'auto', padding: '4px 0', margin: 0, listStyle: 'none' }}>
          {matchingCards.length === 0 && query.trim() && (
            <li style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              未找到匹配的节点
            </li>
          )}
          {matchingCards.slice(0, 20).map((card, idx) => {
            const data = card.data as Record<string, unknown>;
            const text = typeof data.text === 'string' ? data.text : '';
            return (
              <li key={card.id}>
                <button
                  onClick={() => handleSelect(card.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 16px',
                    background: idx === selectedIdx ? '#f3f4f6' : 'transparent',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  }}
                  onMouseEnter={() => setSelectedIdx(idx)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                  <span style={{ fontSize: 13, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <HighlightText text={text} query={query} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div style={{ padding: '6px 16px', borderTop: '1px solid #f3f4f6', fontSize: 11, color: '#d1d5db' }}>
          {matchingCards.length > 0 ? `${matchingCards.length} 个匹配` : '↑↓ 导航 · Enter 跳转 · Esc 关闭'}
        </div>
      </div>
    </div>
  );
}
