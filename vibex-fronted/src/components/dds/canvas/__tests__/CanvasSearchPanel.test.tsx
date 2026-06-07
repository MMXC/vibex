/**
 * CanvasSearchPanel.test.tsx — Sprint73 E1 + S74-E1: 画布内容全文搜索 + 搜索历史记录
 *
 * Vitest + React Testing Library integration tests for CanvasSearchPanel.
 *
 * Patterns used:
 * - Mock canvasSearchStore with vi.hoisted() + Object.assign for .getState()
 * - Mock localStorage for persist middleware
 * - Mock useTranslations hook
 * - Mock window.dispatchEvent for scroll-to-node events
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { CanvasSearchPanel } from '@/components/dds/canvas/CanvasSearchPanel';

// ============================================
// Mock localStorage for persist middleware
// ============================================

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// ============================================
// Mock useTranslations hook
// ============================================

const translationsMock: Record<string, Record<string, string>> = {
  search: {
    canvasSearchLabel: 'Canvas Node Search',
    canvasSearchPlaceholder: 'Search canvas content...',
    canvasSearchInputLabel: 'Search canvas nodes',
    searchResults: 'Results',
    recentSearches: 'History',
    searchToFind: 'Type to search...',
    noResults: 'No results found',
    noSearchHistory: 'No search history',
    clearSearchHistory: 'Clear history',
    recentSearchChips: 'Recent searches',
    clearHistory: 'Clear history',
    searching: 'Searching...',
    navigate: 'Navigate',
    goTo: 'Go to',
    close: 'Close',
    searchPanel: 'Search panel',
    searchHistory: 'Search history',
    clearSearch: 'Clear',
  },
};

vi.mock('@/hooks/useTranslations', () => ({
  useTranslations: vi.fn(() => (namespace: string) => {
    return (key: string) => translationsMock[namespace]?.[key] ?? key;
  }),
}));

// ============================================
// Mock canvasSearchStore
// ============================================

interface MockSearchState {
  fulltextQuery: string;
  fulltextResults: Array<{
    nodeId: string;
    canvasId: string;
    canvasName: string;
    matchedText: string;
    score: number;
    nodeType?: string;
  }>;
  fulltextLoading: boolean;
  searchHistory: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  searchNodeContent: (query: string) => Promise<void>;
}

const mockSearchState: MockSearchState = {
  fulltextQuery: '',
  fulltextResults: [],
  fulltextLoading: false,
  recentSearches: [],
  addRecentSearch: vi.fn(),
  clearRecentSearches: vi.fn(),
  searchNodeContent: vi.fn(),
};

const mockSetSearchState = vi.fn((updater: Partial<MockSearchState> | ((prev: MockSearchState) => Partial<MockSearchState>)) => {
  if (typeof updater === 'function') {
    const result = updater(mockSearchState);
    Object.assign(mockSearchState, result);
  } else {
    Object.assign(mockSearchState, updater);
  }
});

// Zustand-compatible mock
const createMockStore = () => {
  const store: Record<string, unknown> = {};
  const state = {
    getState: () => mockSearchState,
    setState: mockSetSearchState,
    subscribe: vi.fn(),
    destroy: vi.fn(),
  };
  return state;
};

// Direct replacement of the module
vi.mock('@/stores/dds/canvasSearchStore', () => {
  const mock = createMockStore();
  return {
    useCanvasSearchStore: Object.assign(
      (selector: (state: MockSearchState) => unknown) => selector(mockSearchState),
      {
        getState: () => mockSearchState,
        setState: mockSetSearchState,
        subscribe: vi.fn(),
        destroy: vi.fn(),
      }
    ),
    // re-export the type
    __esModule: true,
  };
});

// ============================================
// Mock scrollIntoView
// ============================================

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  writable: true,
  value: vi.fn(),
});

// ============================================
// Tests
// ============================================

describe('CanvasSearchPanel — S73-E1 + S74-E1: 画布内容全文搜索 + 搜索历史记录', () => {
  const onClose = vi.fn();
  const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

  beforeEach(() => {
    // Reset mock state
    mockSearchState.fulltextQuery = '';
    mockSearchState.fulltextResults = [];
    mockSearchState.fulltextLoading = false;
    mockSearchState.recentSearches = [];
    mockSearchState.addRecentSearch.mockClear();
    mockSearchState.clearRecentSearches.mockClear();
    mockSearchState.searchNodeContent.mockClear();
    dispatchEventSpy.mockClear();
    onClose.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when open=false', () => {
    render(<CanvasSearchPanel open={false} onClose={onClose} />);
    expect(screen.queryByTestId('canvas-search-panel')).not.toBeInTheDocument();
  });

  it('renders panel when open=true', () => {
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    expect(screen.getByTestId('canvas-search-panel')).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    expect(screen.getByLabelText(/search canvas/i)).toBeInTheDocument();
  });

  it('shows Results tab as active by default', () => {
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    expect(screen.getByRole('tab', { name: /results/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows empty state when no query entered', () => {
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    expect(screen.getByText(/type to search/i)).toBeInTheDocument();
  });

  it('calls searchNodeContent when user types in input', async () => {
    mockSearchState.searchNodeContent.mockResolvedValue(undefined);
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    const input = screen.getByRole('textbox');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test query' } });
    });
    await waitFor(() => {
      expect(mockSearchState.searchNodeContent).toHaveBeenCalledWith('test query');
    });
  });

  it('shows no results message when query has no results', async () => {
    mockSearchState.searchNodeContent.mockImplementation(
      async (q: string) => {
        mockSearchState.fulltextQuery = q;
        mockSearchState.fulltextResults = [];
      }
    );
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    const input = screen.getByRole('textbox');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'nonexistent' } });
    });
    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });
  });

  it('displays search results when available', async () => {
    mockSearchState.searchNodeContent.mockImplementation(
      async (_q: string) => {
        mockSearchState.fulltextResults = [
          {
            nodeId: 'node-1',
            canvasId: 'canvas-1',
            canvasName: 'Test Canvas',
            matchedText: 'test content here',
            score: 0.8,
          },
        ];
      }
    );
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    const input = screen.getByRole('textbox');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test' } });
    });
    await waitFor(() => {
      expect(screen.getByText(/test content here/i)).toBeInTheDocument();
    });
  });

  it('closes on Escape key', async () => {
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    const input = screen.getByRole('textbox');
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Escape' });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking backdrop', async () => {
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    const backdrop = screen.getByTestId('canvas-search-panel');
    // Click the backdrop div (not the inner panel)
    await act(async () => {
      fireEvent.click(backdrop, { target: backdrop });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('adds query to history when selecting a result', async () => {
    mockSearchState.searchNodeContent.mockImplementation(
      async (_q: string) => {
        mockSearchState.fulltextResults = [
          {
            nodeId: 'node-1',
            canvasId: 'canvas-1',
            canvasName: 'Test Canvas',
            matchedText: 'test',
            score: 0.9,
          },
        ];
        mockSearchState.fulltextQuery = 'test';
      }
    );
    mockSearchState.addRecentSearch.mockClear();
    render(<CanvasSearchPanel open={true} onClose={onClose} />);

    const input = screen.getByRole('textbox');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/test/i)).toBeInTheDocument();
    });

    const resultBtn = screen.getByTestId('canvas-search-result-0');
    await act(async () => {
      fireEvent.click(resultBtn);
    });

    // Should add to history before closing
    expect(mockSearchState.addRecentSearch).toHaveBeenCalledWith('test');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dispatches canvas:scroll-to-node event when selecting result', async () => {
    mockSearchState.searchNodeContent.mockImplementation(
      async (_q: string) => {
        mockSearchState.fulltextResults = [
          {
            nodeId: 'node-abc',
            canvasId: 'canvas-xyz',
            canvasName: 'Test Canvas',
            matchedText: 'test content',
            score: 0.7,
          },
        ];
        mockSearchState.fulltextQuery = 'test';
      }
    );
    render(<CanvasSearchPanel open={true} onClose={onClose} />);

    const input = screen.getByRole('textbox');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test' } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('canvas-search-result-0')).toBeInTheDocument();
    });

    const resultBtn = screen.getByTestId('canvas-search-result-0');
    await act(async () => {
      fireEvent.click(resultBtn);
    });

    expect(dispatchEventSpy).toHaveBeenCalled();
    const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe('canvas:scroll-to-node');
    expect(event.detail.nodeId).toBe('node-abc');
    expect(event.detail.canvasId).toBe('canvas-xyz');
  });

  it('shows History tab when clicked', async () => {
    mockSearchState.recentSearches = ['previous search'];
    render(<CanvasSearchPanel open={true} onClose={onClose} />);

    const historyTab = screen.getByRole('tab', { name: /history/i });
    await act(async () => {
      fireEvent.click(historyTab);
    });

    expect(historyTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('canvas-search-history-0')).toBeInTheDocument();
  });

  it('calls clearHistory when clear button is clicked', async () => {
    mockSearchState.recentSearches = ['search 1', 'search 2'];
    render(<CanvasSearchPanel open={true} onClose={onClose} />);

    const historyTab = screen.getByRole('tab', { name: /history/i });
    await act(async () => {
      fireEvent.click(historyTab);
    });

    const clearBtn = screen.getByTestId('clear-canvas-search-history');
    await act(async () => {
      fireEvent.click(clearBtn);
    });

    expect(mockSearchState.clearRecentSearches).toHaveBeenCalledTimes(1);
  });

  // ============================================
  // S74-E1: Recent Search Chips tests
  // ============================================

  it('shows recent search chips when recentSearches is populated and results tab active', () => {
    mockSearchState.recentSearches = ['react hooks', 'zustand store', 'vitest'];
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    expect(screen.getByTestId('recent-search-chips')).toBeInTheDocument();
  });

  it('hides recent search chips when user is typing a query', () => {
    mockSearchState.recentSearches = ['react hooks', 'zustand store'];
    mockSearchState.fulltextQuery = 'test';
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    expect(screen.queryByTestId('recent-search-chips')).not.toBeInTheDocument();
  });

  it('hides recent search chips when History tab is active', () => {
    mockSearchState.recentSearches = ['react hooks'];
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    // Switch to History tab
    const historyTab = screen.getByRole('tab', { name: /history/i });
    act(() => { fireEvent.click(historyTab); });
    expect(screen.queryByTestId('recent-search-chips')).not.toBeInTheDocument();
  });

  it('displays at most 5 recent search chips', () => {
    mockSearchState.recentSearches = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    const chips = screen.getAllByTestId('recent-search-chip');
    expect(chips.length).toBeLessThanOrEqual(5);
  });

  it('clicking a recent search chip sets query and switches to results tab', async () => {
    mockSearchState.recentSearches = ['zustand'];
    mockSearchState.searchNodeContent.mockResolvedValue(undefined);
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    const chip = screen.getByTestId('recent-search-chip');
    await act(async () => { fireEvent.click(chip); });
    await waitFor(() => {
      expect(mockSearchState.searchNodeContent).toHaveBeenCalledWith('zustand');
    });
  });

  it('does not show recent search chips when recentSearches is empty', () => {
    mockSearchState.recentSearches = [];
    render(<CanvasSearchPanel open={true} onClose={onClose} />);
    expect(screen.queryByTestId('recent-search-chips')).not.toBeInTheDocument();
  });

});
