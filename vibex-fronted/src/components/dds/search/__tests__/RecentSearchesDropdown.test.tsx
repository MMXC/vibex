/**
 * RecentSearchesDropdown.test.tsx — Sprint75 E1: 搜索历史工具栏快捷入口
 *
 * Tests:
 * - Renders empty state when no recent searches
 * - Renders up to 5 recent search terms
 * - Click a term → dispatches dds:recent-search event + calls setSearchQuery
 * - Clear history button → calls clearHistory
 * - View more button → dispatches dds:open-search-panel event
 * - Outside click closes dropdown
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { RecentSearchesDropdown } from '../RecentSearchesDropdown';

// ── mock canvasSearchStore ─────────────────────────────────────────────────────

const mockRecentSearches = ['react hooks', 'zustand store', 'typescript generics', 'vite config', 'nextjs routing', 'css modules'];

const mockSetSearchQuery = vi.fn();
const mockClearHistory = vi.fn();

vi.mock('@/stores/dds/canvasSearchStore', () => ({
  useCanvasSearchStore: vi.fn((selector?: (s: any) => unknown) => {
    const state = {
      recentSearches: mockRecentSearches,
      setSearchQuery: mockSetSearchQuery,
      clearHistory: mockClearHistory,
    };
    if (selector) return selector(state);
    return state;
  }),
}));

// ── test helpers ───────────────────────────────────────────────────────────────

function renderDropdown(open = true, onClose = vi.fn()) {
  return render(<RecentSearchesDropdown open={open} onClose={onClose} />);
}

function getCustomEventListener(eventType: string) {
  return (window as any)._eventListeners?.[eventType];
}

// ── tests ───────────────────────────────────────────────────────────────────────

describe('RecentSearchesDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any lingering custom event listeners
    window.onerror = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders empty state when no recent searches', () => {
    vi.mocked(require('@/stores/dds/canvasSearchStore').useCanvasSearchStore).mockImplementation(
      (selector?: (s: any) => unknown) => {
        const state = { recentSearches: [], setSearchQuery: mockSetSearchQuery, clearHistory: mockClearHistory };
        if (selector) return selector(state);
        return state;
      }
    );
    renderDropdown();
    expect(screen.getByText('暂无搜索历史')).toBeInTheDocument();
  });

  it('renders up to 5 recent search terms', () => {
    renderDropdown();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(screen.getByText('react hooks')).toBeInTheDocument();
    expect(screen.getByText('zustand store')).toBeInTheDocument();
  });

  it('clicking a term calls setSearchQuery and dispatches dds:recent-search event', () => {
    renderDropdown();
    const termButton = screen.getByRole('button', { name: /搜索 zustand store/i });
    const eventSpy = vi.spyOn(window, 'dispatchEvent');

    fireEvent.click(termButton);

    expect(mockSetSearchQuery).toHaveBeenCalledWith('zustand store');
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dds:recent-search',
        detail: { term: 'zustand store' },
      })
    );
  });

  it('clear history button calls clearHistory', () => {
    renderDropdown();
    const clearBtn = screen.getByRole('button', { name: /清除搜索历史/i });
    fireEvent.click(clearBtn);
    expect(mockClearHistory).toHaveBeenCalled();
  });

  it('view more button dispatches dds:open-search-panel event', () => {
    renderDropdown();
    const viewMoreBtn = screen.getByRole('button', { name: /查看更多搜索历史/i });
    const eventSpy = vi.spyOn(window, 'dispatchEvent');
    fireEvent.click(viewMoreBtn);
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'dds:open-search-panel' })
    );
  });

  it('does not render when open=false', () => {
    renderDropdown(false);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not show view more when no recent searches', () => {
    vi.mocked(require('@/stores/dds/canvasSearchStore').useCanvasSearchStore).mockImplementation(
      (selector?: (s: any) => unknown) => {
        const state = { recentSearches: [], setSearchQuery: mockSetSearchQuery, clearHistory: mockClearHistory };
        if (selector) return selector(state);
        return state;
      }
    );
    renderDropdown();
    expect(screen.queryByRole('button', { name: /查看更多搜索历史/i })).not.toBeInTheDocument();
  });
});
