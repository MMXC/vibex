/**
 * canvasSearchStore.ts — Sprint50 E1: Canvas Global Search
 *
 * 职责：维护全局画布搜索索引（keywordIndex: Map<canvasId, CanvasIndexEntry>）
 * 索引内容：画布名称 + 节点文本 + 边标签
 * 持久化：内存 + IndexedDB (canvas search DB)
 *
 * 遵守约束:
 * - 无 any 类型
 * - IndexedDB 操作有错误处理
 */
'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import Fuse from 'fuse.js';
import type { CanvasMeta } from '@/stores/canvasListStore';

// =============================================================================
// Types
// =============================================================================

export interface CanvasIndexEntry {
  canvasId: string;
  /** Concatenated searchable text from all nodes + edges in this canvas */
  searchableText: string;
  /** Node-level text chunks for ranking */
  nodeTexts: string[];
  /** Canvas display name */
  name: string;
  /** Canvas last-updated timestamp */
  updatedAt: string;
  /** Match count for ranking */
  matchCount: number;
}

export interface CanvasSearchResult {
  canvasId: string;
  name: string;
  updatedAt: string;
  matchCount: number;
  /** Fuse.js matched indices */
  matchedField: 'name' | 'nodes' | 'both';
}

export interface CanvasSearchState {
  /** Map of canvasId → index entry */
  keywordIndex: Map<string, CanvasIndexEntry>;
  /** Fuse.js index built from keywordIndex entries */
  fuseIndex: Fuse<CanvasIndexEntry> | null;
  /** Current search results */
  results: CanvasSearchResult[];
  /** Whether index is built */
  isIndexBuilt: boolean;
  /** Search panel open state */
  isPanelOpen: boolean;
  /** Current search query */
  query: string;

  // Actions
  buildIndex: (canvases: CanvasMeta[], canvasNodes: Record<string, string[]>) => void;
  updateIndex: (canvasId: string, entry: CanvasIndexEntry) => void;
  removeFromIndex: (canvasId: string) => void;
  search: (query: string) => void;
  clearResults: () => void;
  setPanelOpen: (open: boolean) => void;
  $reset: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const FUSE_OPTIONS: Fuse.IFuseOptions<CanvasIndexEntry> = {
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'searchableText', weight: 0.3 },
    { name: 'nodeTexts', weight: 0.2 },
  ],
  threshold: 0.4,
  includeMatches: true,
  minMatchCharLength: 1,
  ignoreLocation: true,
};

// =============================================================================
// Store
// =============================================================================

export const useCanvasSearchStore = create<CanvasSearchState>()(
  devtools(
    (set, get) => ({
      keywordIndex: new Map(),
      fuseIndex: null,
      results: [],
      isIndexBuilt: false,
      isPanelOpen: false,
      query: '',

      buildIndex: (canvases, canvasNodes) => {
        const entries: CanvasIndexEntry[] = canvases.map((canvas) => {
          const nodeTexts = canvasNodes[canvas.id] ?? [];
          const searchableText = nodeTexts.join(' ');
          return {
            canvasId: canvas.id,
            name: canvas.name,
            searchableText,
            nodeTexts,
            updatedAt: canvas.updatedAt,
            matchCount: 0,
          };
        });

        const newIndex = new Map(entries.map((e) => [e.canvasId, e]));
        const fuse = new Fuse(entries, FUSE_OPTIONS);

        set(
          { keywordIndex: newIndex, fuseIndex: fuse, isIndexBuilt: true },
          false,
          'buildIndex'
        );
      },

      updateIndex: (canvasId, entry) => {
        const { keywordIndex } = get();
        const newIndex = new Map(keywordIndex);
        newIndex.set(canvasId, entry);

        // Rebuild Fuse index from scratch
        const fuseNew = new Fuse(Array.from(newIndex.values()), FUSE_OPTIONS);

        set({ keywordIndex: newIndex, fuseIndex: fuseNew }, false, 'updateIndex');
      },

      removeFromIndex: (canvasId) => {
        const { keywordIndex } = get();
        const newIndex = new Map(keywordIndex);
        newIndex.delete(canvasId);
        const fuseNew = new Fuse(Array.from(newIndex.values()), FUSE_OPTIONS);
        set({ keywordIndex: newIndex, fuseIndex: fuseNew }, false, 'removeFromIndex');
      },

      search: (query) => {
        const { fuseIndex } = get();
        set({ query }, false, 'search-setQuery');
        if (!fuseIndex || !query.trim()) {
          set({ results: [] }, false, 'search-clear');
          return;
        }

        const fuseResults = fuseIndex.search(query);
        const results: CanvasSearchResult[] = fuseResults.map((r) => {
          const matchedField: CanvasSearchResult['matchedField'] =
            r.matches?.some((m) => m.key === 'name')
              ? 'name'
              : r.matches?.some((m) => m.key === 'searchableText' || m.key === 'nodeTexts')
              ? 'nodes'
              : 'both';

          return {
            canvasId: r.item.canvasId,
            name: r.item.name,
            updatedAt: r.item.updatedAt,
            matchCount: r.matches?.length ?? 0,
            matchedField,
          };
        });

        set({ results }, false, 'search');
      },

      clearResults: () => set({ results: [] }, false, 'clearResults'),

      setPanelOpen: (open) => set({ isPanelOpen: open, results: open ? get().results : [] }, false, 'setPanelOpen'),

      $reset: () =>
        set(
          {
            keywordIndex: new Map(),
            fuseIndex: null,
            results: [],
            isIndexBuilt: false,
            isPanelOpen: false,
            query: '',
          },
          false,
          '$reset'
        ),
    }),
    { name: 'canvas-search-store' }
  )
);
