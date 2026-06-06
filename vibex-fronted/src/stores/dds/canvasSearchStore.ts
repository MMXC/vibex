/**
 * canvasSearchStore.ts — Sprint60 E5 + Sprint65 E4 + Sprint68 E3: 搜索体验增强
 *
 * Sprint60 E5: 搜索历史管理 — localStorage 持久化，最多 10 条，最新优先
 * Sprint65 E4: 扩展搜索结果 + 全局搜索状态
 * Sprint68 E3: 全文搜索状态 + searchNodeContent() 方法
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SearchResult } from '@/lib/db/canvasDb';
import type { NodeSearchResult } from '@/services/canvasFulltextIndex';

const MAX_HISTORY_ITEMS = 10; // E3 D4.5: MAX 10 items for history
const STORAGE_KEY = 'vibex-search-history';

export interface CanvasSearchState {
  /** 搜索历史（最新在前，最多 MAX_HISTORY_ITEMS 条） */
  searchHistory: string[];

  /** 全局搜索查询（E4 D4.4） */
  globalSearchQuery: string;

  /** 全局搜索结果（E4 D4.4/D4.5） */
  globalSearchResults: SearchResult[];

  /** 全文搜索查询（E3） */
  fulltextQuery: string;

  /** 全文搜索结果（E3） */
  fulltextResults: NodeSearchResult[];

  /** 全文搜索加载状态（E3） */
  fulltextLoading: boolean;

  /** 添加一条搜索记录到历史 */
  addToHistory: (query: string) => void;

  /** 清空搜索历史 */
  clearHistory: () => void;

  /** 设置全局搜索查询（E4 D4.4） */
  setGlobalSearchQuery: (query: string) => void;

  /** 设置全局搜索结果（E4 D4.5） */
  setGlobalSearchResults: (results: SearchResult[]) => void;

  /** 设置全文搜索查询（E3） */
  setFulltextQuery: (query: string) => void;

  /** 设置全文搜索结果（E3） */
  setFulltextResults: (results: NodeSearchResult[]) => void;

  /** 设置全文搜索加载状态（E3） */
  setFulltextLoading: (loading: boolean) => void;

  /** 执行全文节点搜索（E3） — 调用 canvasFulltextIndex.searchNodes */
  searchNodeContent: (query: string) => Promise<void>;
}

export const useCanvasSearchStore = create<CanvasSearchState>()(
  persist(
    (set, get) => ({
      searchHistory: [],

      globalSearchQuery: '',
      globalSearchResults: [],

      fulltextQuery: '',
      fulltextResults: [],
      fulltextLoading: false,

      addToHistory: (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        const current = get().searchHistory;

        // 去重：新查询移到最前
        const filtered = current.filter((item) => item !== trimmed);

        const next = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);

        set({ searchHistory: next });
      },

      clearHistory: () => {
        set({ searchHistory: [] });
      },

      setGlobalSearchQuery: (query: string) => {
        set({ globalSearchQuery: query });
      },

      setGlobalSearchResults: (results: SearchResult[]) => {
        set({ globalSearchResults: results });
      },

      setFulltextQuery: (query: string) => {
        set({ fulltextQuery: query });
      },

      setFulltextResults: (results: NodeSearchResult[]) => {
        set({ fulltextResults: results });
      },

      setFulltextLoading: (loading: boolean) => {
        set({ fulltextLoading: loading });
      },

      searchNodeContent: async (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) {
          set({ fulltextQuery: '', fulltextResults: [], fulltextLoading: false });
          return;
        }

        set({ fulltextQuery: trimmed, fulltextLoading: true });

        try {
          const { searchNodes } = await import('@/services/canvasFulltextIndex');
          const results = await searchNodes(trimmed);
          set({ fulltextResults: results, fulltextLoading: false });
        } catch (err) {
          console.error('[canvasSearchStore] searchNodeContent error:', err);
          set({ fulltextResults: [], fulltextLoading: false });
        }
      },
    }),
    {
      name: STORAGE_KEY,
      // 只持久化 searchHistory 字段（E3/E4 state is ephemeral per-session）
      partialize: (state) => ({ searchHistory: state.searchHistory }),
    }
  )
);
