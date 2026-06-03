/**
 * canvasSearchStore.test.ts — Sprint60 E5: canvasSearchStore unit tests
 *
 * Vitest patterns used:
 * - Zustand dual-interface mock: vi.hoisted() + Object.assign for .getState()
 * - localStorage mock for persist middleware
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasSearchStore } from '@/stores/dds/canvasSearchStore';

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
// Import after mock is set
// ============================================

describe('canvasSearchStore', () => {
  beforeEach(() => {
    // Reset store state
    useCanvasSearchStore.setState({ searchHistory: [] });
    store['vibex-search-history'] = JSON.stringify({ state: { searchHistory: [] }, version: 0 });
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  describe('initial state', () => {
    it('has empty searchHistory', () => {
      const state = useCanvasSearchStore.getState();
      expect(state.searchHistory).toEqual([]);
    });
  });

  describe('addToHistory', () => {
    it('adds a query to history', () => {
      useCanvasSearchStore.getState().addToHistory('测试查询');
      expect(useCanvasSearchStore.getState().searchHistory).toContain('测试查询');
    });

    it('adds new query at the front', () => {
      useCanvasSearchStore.getState().addToHistory('第一个');
      useCanvasSearchStore.getState().addToHistory('第二个');
      const history = useCanvasSearchStore.getState().searchHistory;
      expect(history[0]).toBe('第二个');
      expect(history[1]).toBe('第一个');
    });

    it('deduplicates: moves existing query to front instead of duplicating', () => {
      useCanvasSearchStore.getState().addToHistory('重复查询');
      useCanvasSearchStore.getState().addToHistory('其他');
      useCanvasSearchStore.getState().addToHistory('重复查询');
      const history = useCanvasSearchStore.getState().searchHistory;
      // Should appear only once, at front
      const occurrences = history.filter((item) => item === '重复查询').length;
      expect(occurrences).toBe(1);
      expect(history[0]).toBe('重复查询');
    });

    it('caps history at 10 items', () => {
      for (let i = 0; i < 15; i++) {
        useCanvasSearchStore.getState().addToHistory(`查询${i}`);
      }
      const history = useCanvasSearchStore.getState().searchHistory;
      expect(history.length).toBeLessThanOrEqual(10);
    });

    it('trims whitespace from query', () => {
      useCanvasSearchStore.getState().addToHistory('  前后空格  ');
      expect(useCanvasSearchStore.getState().searchHistory).toContain('前后空格');
    });

    it('ignores empty or whitespace-only queries', () => {
      useCanvasSearchStore.getState().addToHistory('已有');
      useCanvasSearchStore.getState().addToHistory('   ');
      useCanvasSearchStore.getState().addToHistory('');
      expect(useCanvasSearchStore.getState().searchHistory).toEqual(['已有']);
    });

    it('searchHistory length increases after addToHistory', () => {
      const initial = useCanvasSearchStore.getState().searchHistory.length;
      useCanvasSearchStore.getState().addToHistory('持久化测试');
      expect(useCanvasSearchStore.getState().searchHistory.length).toBe(initial + 1);
    });
  });

  describe('clearHistory', () => {
    it('clears all history', () => {
      useCanvasSearchStore.getState().addToHistory('A');
      useCanvasSearchStore.getState().addToHistory('B');
      useCanvasSearchStore.getState().clearHistory();
      expect(useCanvasSearchStore.getState().searchHistory).toEqual([]);
    });

    it('clears history and count goes to zero', () => {
      useCanvasSearchStore.getState().addToHistory('A');
      useCanvasSearchStore.getState().clearHistory();
      expect(useCanvasSearchStore.getState().searchHistory.length).toBe(0);
    });
  });
});
