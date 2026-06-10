/**
 * commandPaletteStore.ts — S84-E3: 画布快速跳转面板
 *
 * Zustand store for Command Palette state:
 * - isOpen: whether the palette is visible
 * - query: current search query
 * - recentCanvases: last 10 visited canvas IDs (persisted to localStorage)
 * - searchResults: fuzzy search results
 *
 * Integrates Fuse.js for fuzzy search.
 * localStorage key: 'vibex-command-palette-recent'
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Fuse from 'fuse.js';

// ==================== Types ====================

export interface CanvasEntry {
  id: string;
  name: string;
  /** ISO timestamp of last visit */
  lastVisited: string;
}

export interface SearchResult {
  canvasId: string;
  name: string;
  score: number;
  type: 'recent' | 'search';
}

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  /** Recent canvas list — persisted to localStorage */
  recentCanvases: CanvasEntry[];
  /** Live fuzzy search results (computed) */
  results: SearchResult[];
  /** Fuse.js instance for fuzzy search */
  _fuse: Fuse<CanvasEntry> | null;

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (q: string) => void;
  /** Record a canvas visit (adds or bumps to top of recent list) */
  recordVisit: (canvasId: string, canvasName: string) => void;
  /** Clear all recent history */
  clearHistory: () => void;
  /** Set the canvas list for search indexing */
  setSearchIndex: (canvases: CanvasEntry[]) => void;
}

// ==================== Fuse.js Config ====================

const FUSE_OPTIONS: Fuse.IFuseOptions<CanvasEntry> = {
  keys: ['name'],
  threshold: 0.4,        // fuzzy tolerance
  includeScore: true,
  minMatchCharLength: 1,
};

// ==================== Store ====================

export const useCommandPaletteStore = create<CommandPaletteState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      query: '',
      recentCanvases: [],
      results: [],
      _fuse: null,

      open: () => {
        set({ isOpen: true, query: '', results: [] });
      },

      close: () => {
        set({ isOpen: false, query: '', results: [] });
      },

      toggle: () => {
        const { isOpen } = get();
        if (isOpen) {
          set({ isOpen: false, query: '', results: [] });
        } else {
          set({ isOpen: true, query: '', results: [] });
        }
      },

      setQuery: (query: string) => {
        const { _fuse, recentCanvases } = get();
        let results: SearchResult[] = [];

        if (query.trim() && _fuse) {
          // Fuzzy search across all indexed canvases
          const fuseResults = _fuse.search(query.trim());
          results = fuseResults.map((r) => ({
            canvasId: r.item.id,
            name: r.item.name,
            score: r.score ?? 1,
            type: 'search' as const,
          }));
        } else if (!query.trim()) {
          // Show recent canvases when query is empty
          const recent = recentCanvases.slice(0, 10).map((c) => ({
            canvasId: c.id,
            name: c.name,
            score: 0,
            type: 'recent' as const,
          }));
          results = recent;
        }

        set({ query, results });
      },

      recordVisit: (canvasId: string, canvasName: string) => {
        const { recentCanvases } = get();
        const now = new Date().toISOString();

        // Remove existing entry for this canvas, then add to front
        const filtered = recentCanvases.filter((c) => c.id !== canvasId);
        const updated = [
          { id: canvasId, name: canvasName, lastVisited: now },
          ...filtered,
        ].slice(0, 10); // keep only top 10

        set({ recentCanvases: updated });
      },

      clearHistory: () => {
        set({ recentCanvases: [] });
      },

      setSearchIndex: (canvases: CanvasEntry[]) => {
        const fuse = new Fuse(canvases, FUSE_OPTIONS);
        set({ _fuse: fuse });
      },
    }),
    {
      name: 'vibex-command-palette-recent',
      // Only persist recentCanvases (not transient UI state)
      partialize: (state) => ({ recentCanvases: state.recentCanvases }),
    }
  )
);
