/**
 * canvasSearchStore.ts — Sprint60 E5: 搜索体验增强
 *
 * 搜索历史管理：localStorage 持久化，最多 10 条，最新优先
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_HISTORY_ITEMS = 10;
const STORAGE_KEY = 'vibex-search-history';

export interface CanvasSearchState {
  /** 搜索历史（最新在前，最多 MAX_HISTORY_ITEMS 条） */
  searchHistory: string[];

  /** 添加一条搜索记录到历史 */
  addToHistory: (query: string) => void;

  /** 清空搜索历史 */
  clearHistory: () => void;
}

export const useCanvasSearchStore = create<CanvasSearchState>()(
  persist(
    (set, get) => ({
      searchHistory: [],

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
    }),
    {
      name: STORAGE_KEY,
      // 只持久化 searchHistory 字段
      partialize: (state) => ({ searchHistory: state.searchHistory }),
    }
  )
);
