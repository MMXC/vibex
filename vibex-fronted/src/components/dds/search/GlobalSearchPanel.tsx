'use client';
/**
 * GlobalSearchPanel.tsx — Sprint65 E4 + Sprint68 E3: 画布搜索与过滤增强
 *
 * Sprint65 E4: Cmd+K global search modal — searches across all canvas names using fuzzy matching.
 * Sprint68 E3: Added Tab2 — 节点内容全文搜索（Tab1: 画布名称, Tab2: 节点内容）
 *
 * D4.4: Cmd+K global search panel
 * E3: 新增 Tab2 节点内容搜索
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

// ============================================
// Sub-components
// ============================================

type SearchTab = 'canvas' | 'content';

function TabBar({ activeTab, onTabChange }: { activeTab: SearchTab; onTabChange: (t: SearchTab) => void }) {
  return (
    <div style={{ display: 'flex', gap: 0, padding: '8px 12px 0', borderBottom: '1px solid #e5e7eb' }}>
      {(['canvas', 'content'] as SearchTab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          style={{
            flex: 1, padding: '6px 8px', border: 'none',
            borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
            background: 'transparent', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
            color: activeTab === tab ? '#3b82f6' : '#6b7280',
            borderRadius: '4px 4px 0 0',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          aria-selected={activeTab === tab}
          role="tab"
        >
          {tab === 'canvas' ? '画布名称' : '节点内容'}
        </button>
      ))}
    </div>
  );
}

function CanvasResults({
  results, selectedIdx, loading, onSelect, onHover, query
}: {
  results: SearchResult[]; selectedIdx: number; loading: boolean;
  onSelect: (r: SearchResult) => void; onHover: (i: number) => void; query: string;
}) {
  return (
    <ul style={{ maxHeight: 320, overflowY: 'auto', padding: '4px 0', margin: 0, listStyle: 'none' }} role="tabpanel">
      {results.length === 0 && query.trim() && !loading && (
        <li style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          未找到匹配的画布
        </li>
      )}
      {results.map((result, idx) => (
        <li key={result.item.id}>
          <button
            onClick={() => onSelect(result)}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 16px',
              background: idx === selectedIdx ? '#f3f4f6' : 'transparent',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
            onMouseEnter={() => onHover(idx)}
            aria-selected={idx === selectedIdx}
            role="option"
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
  );
}

function NodeContentResults({
  results, selectedIdx, loading, onSelect, onHover, query
}: {
  results: Array<{ nodeId: string; canvasId: string; canvasName: string; matchedText: string; score: number; before?: string; after?: string }>;
  selectedIdx: number; loading: boolean;
  onSelect: (r: typeof results[0]) => void; onHover: (i: number) => void; query: string;
}) {
  /**
   * E2 (Sprint69): Render matched text with <mark> highlighting.
   * Falls back to plain text if no before/after context is available.
   */
  const renderSnippet = (result: typeof results[0]) => {
    if (result.before !== undefined && result.after !== undefined) {
      return (
        <span style={{ fontSize: 12, color: '#6b7280', paddingLeft: 22 }}>
          {result.before}
          <mark style={{ background: '#fef08a', borderRadius: 2 }}>{result.matchedText}</mark>
          {result.after}
        </span>
      );
    }
    return (
      <span style={{ fontSize: 12, color: '#6b7280', paddingLeft: 22, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        &quot;{result.matchedText}&quot;
      </span>
    );
  };

  return (
    <ul style={{ maxHeight: 320, overflowY: 'auto', padding: '4px 0', margin: 0, listStyle: 'none' }} role="tabpanel">
      {results.length === 0 && query.trim() && !loading && (
        <li style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          未找到匹配的内容
        </li>
      )}
      {results.map((result, idx) => (
        <li key={`${result.canvasId}::${result.nodeId}`}>
          <button
            onClick={() => onSelect(result)}
            style={{
              width: '100%', textAlign: 'left', padding: '8px 16px',
              background: idx === selectedIdx ? '#f3f4f6' : 'transparent',
              border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}
            onMouseEnter={() => onHover(idx)}
            aria-selected={idx === selectedIdx}
            role="option"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>
                {result.canvasName}
              </span>
            </span>
            {renderSnippet(result)}
          </button>
        </li>
      ))}
    </ul>
  );
}

// ============================================
// Main component
// ============================================

export function GlobalSearchPanel({ open, onClose }: GlobalSearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('canvas');
  const [canvasResults, setCanvasResults] = useState<SearchResult[]>([]);
  const [nodeResults, setNodeResults] = useState<Array<{ nodeId: string; canvasId: string; canvasName: string; matchedText: string; score: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const addToSearchHistory = useCanvasSearchStore((s) => s.addToSearchHistory);
  const setActiveCanvas = useCanvasListStore((s) => s.setActiveCanvas);
  const router = useRouter();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setCanvasResults([]);
      setNodeResults([]);
      setSelectedIdx(0);
      setActiveTab('canvas');
    }
  }, [open]);

  // Debounced canvas name search
  useEffect(() => {
    if (activeTab !== 'canvas' || !query.trim()) {
      if (!query.trim()) setCanvasResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchCanvases(query);
        setCanvasResults(found);
        setSelectedIdx(0);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, activeTab]);

  // Debounced node content search (E3 Tab2)
  useEffect(() => {
    if (activeTab !== 'content' || !query.trim()) {
      if (!query.trim()) setNodeResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { searchWithContext } = await import('@/services/canvasFulltextIndex');
        const found = await searchWithContext(query);
        setNodeResults(found);
        setSelectedIdx(0);
      } catch (err) {
        console.error('[GlobalSearchPanel] node search error:', err);
        setNodeResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, activeTab]);

  // Switch tab → reset selection
  const handleTabChange = useCallback((tab: SearchTab) => {
    setActiveTab(tab);
    setSelectedIdx(0);
    setQuery('');
    setCanvasResults([]);
    setNodeResults([]);
  }, []);

  const handleSelectCanvas = useCallback((result: SearchResult) => {
    addToSearchHistory(query);
    setActiveCanvas(result.item.id);
    router.push(`/canvas/${result.item.id}`);
    onClose();
  }, [query, addToSearchHistory, setActiveCanvas, router, onClose]);

  const handleSelectNode = useCallback((result: { nodeId: string; canvasId: string; canvasName: string; matchedText: string }) => {
    addToSearchHistory(query);
    setActiveCanvas(result.canvasId);
    // TODO(E3): highlightNode(result.nodeId) — would require passing highlightNode from DDSCanvasPage
    router.push(`/canvas/${result.canvasId}`);
    onClose();
  }, [query, addToSearchHistory, setActiveCanvas, router, onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const activeResults = activeTab === 'canvas' ? canvasResults : nodeResults;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, activeResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeResults.length > 0) {
      e.preventDefault();
      if (activeTab === 'canvas') {
        handleSelectCanvas(canvasResults[selectedIdx]);
      } else {
        handleSelectNode(nodeResults[selectedIdx]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [activeTab, canvasResults, nodeResults, selectedIdx, handleSelectCanvas, handleSelectNode, onClose]);

  if (!open) return null;

  const placeholder = activeTab === 'canvas' ? '搜索画布名称...（Cmd+K）' : '搜索节点内容...';

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
        {/* Tab bar (E3) */}
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 16, color: '#111827', background: 'transparent',
            }}
            aria-label={activeTab === 'canvas' ? '搜索画布' : '搜索节点内容'}
            role="searchbox"
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
        {activeTab === 'canvas' ? (
          <CanvasResults
            results={canvasResults}
            selectedIdx={selectedIdx}
            loading={loading}
            onSelect={handleSelectCanvas}
            onHover={setSelectedIdx}
            query={query}
          />
        ) : (
          <NodeContentResults
            results={nodeResults}
            selectedIdx={selectedIdx}
            loading={loading}
            onSelect={handleSelectNode}
            onHover={setSelectedIdx}
            query={query}
          />
        )}

        {/* Footer */}
        <div style={{
          padding: '8px 16px', borderTop: '1px solid #f3f4f6',
          fontSize: 12, color: '#9ca3af', display: 'flex', gap: 16,
        }}>
          <span>↑↓ 导航</span>
          <span>Enter 打开</span>
          <span>Esc 关闭</span>
          <span>Tab 切换类型</span>
        </div>
      </div>
    </div>
  );
}
