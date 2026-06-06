/**
 * canvasSearchStore.test.ts — Sprint60 E5 + Sprint65 E4 + Sprint68 E3
 *
 * Sprint60 E5: canvasSearchStore unit tests
 * Sprint65 E4: globalSearchQuery / globalSearchResults tests
 * Sprint68 E3: fulltextQuery / fulltextResults / searchNodeContent tests
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

describe('canvasSearchStore — Sprint68 E3: fulltext search', () => {
  beforeEach(() => {
    // Reset store state
    useCanvasSearchStore.setState({
      searchHistory: [],
      globalSearchQuery: '',
      globalSearchResults: [],
      fulltextQuery: '',
      fulltextResults: [],
      fulltextLoading: false,
    });
    store['vibex-search-history'] = JSON.stringify({ state: { searchHistory: [] }, version: 0 });
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
      // Should set loading true immediately
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

    it('stores up to MAX_HISTORY_ITEMS (10) for search history', async () => {
      mockSearchNodes.mockResolvedValue([]);
      for (let i = 0; i < 12; i++) {
        await useCanvasSearchStore.getState().searchNodeContent(`查询${i}`);
      }
      const history = useCanvasSearchStore.getState().searchHistory;
      expect(history.length).toBeLessThanOrEqual(10);
    });
  });
});
