/**
 * canvasSearchStore.test.ts — Sprint60 E5 + Sprint65 E4 + Sprint68 E3 + Sprint74 E1
 *
 * Sprint60 E5: canvasSearchStore unit tests
 * Sprint65 E4: globalSearchQuery / globalSearchResults tests
 * Sprint68 E3: fulltextQuery / fulltextResults / searchNodeContent tests
 * Sprint74 E1: recentSearches (max 20) + addRecentSearch tests
 *
 * Vitest patterns used:
 * - Zustand dual-interface mock: vi.hoisted() + Object.assign for .getState()
 * - localStorage mock for persist middleware
 * - Dynamic import mocking for searchNodeContent
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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
// Mock canvasFulltextIndex for searchNodeContent
// ============================================

const mockSearchNodes = vi.fn();

vi.mock('@/services/canvasFulltextIndex', () => ({
  searchNodes: (...args: unknown[]) => mockSearchNodes(...args),
}));

// ============================================
// Import after mocks are set
// ============================================

describe('canvasSearchStore — Sprint74 E1: recentSearches', () => {
  beforeEach(() => {
    useCanvasSearchStore.setState({
      recentSearches: [],
      globalSearchQuery: '',
      globalSearchResults: [],
      fulltextQuery: '',
      fulltextResults: [],
      fulltextLoading: false,
    });
    store['vibex-search-history'] = JSON.stringify({ state: { recentSearches: [] }, version: 0 });
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    mockSearchNodes.mockReset();
    vi.clearAllMocks();
  });

  describe('S74-E1: recentSearches state + addRecentSearch', () => {
    it('initial state has empty recentSearches', () => {
      const state = useCanvasSearchStore.getState();
      expect(state.recentSearches).toEqual([]);
    });

    it('addRecentSearch adds a single query', () => {
      useCanvasSearchStore.getState().addRecentSearch('测试查询');
      expect(useCanvasSearchStore.getState().recentSearches).toEqual(['测试查询']);
    });

    it('addRecentSearch prepends new queries (most recent first)', () => {
      useCanvasSearchStore.getState().addRecentSearch('第一个');
      useCanvasSearchStore.getState().addRecentSearch('第二个');
      useCanvasSearchStore.getState().addRecentSearch('第三个');
      expect(useCanvasSearchStore.getState().recentSearches[0]).toBe('第三个');
      expect(useCanvasSearchStore.getState().recentSearches[2]).toBe('第一个');
    });

    it('addRecentSearch deduplicates — existing query moves to top', () => {
      useCanvasSearchStore.getState().addRecentSearch('查询A');
      useCanvasSearchStore.getState().addRecentSearch('查询B');
      useCanvasSearchStore.getState().addRecentSearch('查询A'); // re-search A
      const history = useCanvasSearchStore.getState().recentSearches;
      expect(history[0]).toBe('查询A');
      expect(history.filter((s) => s === '查询A')).toHaveLength(1);
      expect(history).toHaveLength(2);
    });

    it('recentSearches max is 20 items', () => {
      for (let i = 0; i < 25; i++) {
        useCanvasSearchStore.getState().addRecentSearch(`查询${i}`);
      }
      const history = useCanvasSearchStore.getState().recentSearches;
      expect(history.length).toBeLessThanOrEqual(20);
      expect(history[0]).toBe('查询24'); // newest first
    });

    it('addRecentSearch trims whitespace', () => {
      useCanvasSearchStore.getState().addRecentSearch('  带空格  ');
      expect(useCanvasSearchStore.getState().recentSearches[0]).toBe('带空格');
    });

    it('addRecentSearch ignores empty/whitespace-only queries', () => {
      useCanvasSearchStore.getState().addRecentSearch('  ');
      expect(useCanvasSearchStore.getState().recentSearches).toEqual([]);
    });

    it('clearHistory clears all recentSearches', () => {
      useCanvasSearchStore.getState().addRecentSearch('A');
      useCanvasSearchStore.getState().addRecentSearch('B');
      useCanvasSearchStore.getState().clearHistory();
      expect(useCanvasSearchStore.getState().recentSearches).toEqual([]);
    });
  });

  describe('S74-E1: addToHistory backward compat alias', () => {
    it('addToHistory calls addRecentSearch (same behavior)', () => {
      useCanvasSearchStore.getState().addToHistory('通过旧方法添加');
      expect(useCanvasSearchStore.getState().recentSearches).toEqual(['通过旧方法添加']);
    });
  });
});

describe('canvasSearchStore — Sprint68 E3: fulltext search', () => {
  beforeEach(() => {
    useCanvasSearchStore.setState({
      recentSearches: [],
      globalSearchQuery: '',
      globalSearchResults: [],
      fulltextQuery: '',
      fulltextResults: [],
      fulltextLoading: false,
    });
    store['vibex-search-history'] = JSON.stringify({ state: { recentSearches: [] }, version: 0 });
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    mockSearchNodes.mockReset();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('has empty fulltextQuery by default', () => {
      const state = useCanvasSearchStore.getState();
      expect(state.fulltextQuery).toBe('');
    });

    it('has empty fulltextResults by default', () => {
      const state = useCanvasSearchStore.getState();
      expect(state.fulltextResults).toEqual([]);
    });

    it('has fulltextLoading false by default', () => {
      const state = useCanvasSearchStore.getState();
      expect(state.fulltextLoading).toBe(false);
    });
  });

  describe('setFulltextQuery', () => {
    it('sets fulltextQuery', () => {
      useCanvasSearchStore.getState().setFulltextQuery('测试查询');
      expect(useCanvasSearchStore.getState().fulltextQuery).toBe('测试查询');
    });
  });

  describe('setFulltextResults', () => {
    it('sets fulltextResults', () => {
      const mockResults = [
        { nodeId: 'n1', canvasId: 'c1', canvasName: '测试画布', matchedText: '内容A', score: 0.1 },
        { nodeId: 'n2', canvasId: 'c2', canvasName: '画布B', matchedText: '内容B', score: 0.2 },
      ];
      useCanvasSearchStore.getState().setFulltextResults(mockResults);
      expect(useCanvasSearchStore.getState().fulltextResults).toHaveLength(2);
      expect(useCanvasSearchStore.getState().fulltextResults[0].canvasName).toBe('测试画布');
    });
  });

  describe('setFulltextLoading', () => {
    it('sets fulltextLoading to true', () => {
      useCanvasSearchStore.getState().setFulltextLoading(true);
      expect(useCanvasSearchStore.getState().fulltextLoading).toBe(true);
    });

    it('sets fulltextLoading to false', () => {
      useCanvasSearchStore.getState().setFulltextLoading(true);
      useCanvasSearchStore.getState().setFulltextLoading(false);
      expect(useCanvasSearchStore.getState().fulltextLoading).toBe(false);
    });
  });

  describe('searchNodeContent — E3 D4.2: Fuse.js 模糊搜索', () => {
    it('calls searchNodes and sets results on success', async () => {
      const mockResults = [
        { nodeId: 'n1', canvasId: 'c1', canvasName: '画布A', matchedText: '找到的内容', score: 0.1 },
      ];
      mockSearchNodes.mockResolvedValue(mockResults);

      const promise = useCanvasSearchStore.getState().searchNodeContent('找到');
      expect(useCanvasSearchStore.getState().fulltextLoading).toBe(true);

      await promise;

      expect(mockSearchNodes).toHaveBeenCalledWith('找到');
      expect(useCanvasSearchStore.getState().fulltextQuery).toBe('找到');
      expect(useCanvasSearchStore.getState().fulltextResults).toHaveLength(1);
      expect(useCanvasSearchStore.getState().fulltextLoading).toBe(false);
    });

    it('clears results when query is empty', async () => {
      mockSearchNodes.mockResolvedValue([]);

      await useCanvasSearchStore.getState().searchNodeContent('   ');

      expect(mockSearchNodes).not.toHaveBeenCalled();
      expect(useCanvasSearchStore.getState().fulltextQuery).toBe('');
      expect(useCanvasSearchStore.getState().fulltextResults).toEqual([]);
      expect(useCanvasSearchStore.getState().fulltextLoading).toBe(false);
    });

    it('handles searchNodes error gracefully', async () => {
      mockSearchNodes.mockRejectedValue(new Error('index error'));

      await useCanvasSearchStore.getState().searchNodeContent('查询');

      expect(useCanvasSearchStore.getState().fulltextResults).toEqual([]);
      expect(useCanvasSearchStore.getState().fulltextLoading).toBe(false);
    });

    it('stores up to MAX_RECENT_SEARCHES (20) for search history', async () => {
      mockSearchNodes.mockResolvedValue([]);
      for (let i = 0; i < 25; i++) {
        await useCanvasSearchStore.getState().searchNodeContent(`查询${i}`);
      }
      const history = useCanvasSearchStore.getState().recentSearches;
      expect(history.length).toBeLessThanOrEqual(20);
    });
  });

  // S73-E1: 画布内容全文搜索 — searchNodes 同步方法
  describe('searchNodes — S73-E1 D1.1: 同步全文搜索查询', () => {
    it('returns current fulltextResults synchronously', () => {
      const mockResults = [
        { nodeId: 'node-1', canvasId: 'canvas-1', canvasName: 'Test Canvas', matchedText: 'test content', score: 0.5 },
        { nodeId: 'node-2', canvasId: 'canvas-1', canvasName: 'Test Canvas', matchedText: 'another match', score: 0.3 },
      ];
      useCanvasSearchStore.getState().setFulltextResults(mockResults);

      const results = useCanvasSearchStore.getState().searchNodes('test');
      expect(results).toHaveLength(2);
      expect(results[0].nodeId).toBe('node-1');
      expect(results[1].nodeId).toBe('node-2');
    });

    it('returns empty array when fulltextResults is empty', () => {
      useCanvasSearchStore.getState().setFulltextResults([]);
      const results = useCanvasSearchStore.getState().searchNodes('anything');
      expect(results).toEqual([]);
    });

    it('returns empty array by default (no search performed)', () => {
      const results = useCanvasSearchStore.getState().searchNodes('query');
      expect(results).toEqual([]);
    });

    it('ignores the query parameter — returns current state', () => {
      const mockResults = [
        { nodeId: 'n1', canvasId: 'c1', canvasName: 'Canvas', matchedText: 'hello world', score: 0.8 },
      ];
      useCanvasSearchStore.getState().setFulltextResults(mockResults);

      const r1 = useCanvasSearchStore.getState().searchNodes('ignored');
      const r2 = useCanvasSearchStore.getState().searchNodes('also-ignored');
      expect(r1).toEqual(mockResults);
      expect(r2).toEqual(mockResults);
    });
  });
});
