/**
 * commandPaletteStore.ts — S84-E3 base + S88-E5 extension
 *
 * S84-E3: Zustand store for Command Palette state:
 * - isOpen: whether the palette is visible
 * - query: current search query
 * - recentCanvases: last 10 visited canvas IDs (persisted to localStorage)
 * - searchResults: fuzzy search results
 *
 * S88-E5 Extension:
 * - filterCategory: active category filter (all/canvas/template/collaboration/view/settings)
 * - recentCommands: recently executed commands (max 5, persisted to localStorage)
 * - category-filtered search with `>` prefix support
 * - shortcut conflict detection helpers
 *
 * Integrates Fuse.js for fuzzy search.
 * localStorage keys:
 *   'vibex-command-palette-recent' — recent canvases
 *   'vibex-recent-commands' — recent command executions
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Fuse from 'fuse.js';

// ==================== Types ====================

export type CommandCategory = 'all' | 'canvas' | 'template' | 'collaboration' | 'view' | 'settings';

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

export interface CommandItem {
  id: string;
  name: string;
  shortcut?: string;
  category: CommandCategory;
  action: string;
  /** ISO timestamp of last execution */
  lastExecuted: string;
}

// ==================== Command Registry ====================

export interface CommandRegistry {
  id: string;
  name: string;
  shortcut?: string;
  category: CommandCategory;
  action: string;
  icon?: string;
}

const COMMAND_REGISTRY: CommandRegistry[] = [
  // Canvas commands
  { id: 'cmd-zoom-in', name: '放大画布', shortcut: 'Ctrl+=', category: 'canvas', action: 'canvas.zoomIn', icon: '🔍+' },
  { id: 'cmd-zoom-out', name: '缩小画布', shortcut: 'Ctrl+-', category: 'canvas', action: 'canvas.zoomOut', icon: '🔍-' },
  { id: 'cmd-fit-view', name: '适应视图', shortcut: 'Ctrl+0', category: 'canvas', action: 'canvas.fitView', icon: '⊞' },
  { id: 'cmd-new-node', name: '新建节点', shortcut: 'Ctrl+Enter', category: 'canvas', action: 'canvas.newNode', icon: '+' },
  { id: 'cmd-save', name: '保存画布', shortcut: 'Ctrl+S', category: 'canvas', action: 'canvas.save', icon: '💾' },
  // Template commands
  { id: 'cmd-new-template', name: '新建模板', shortcut: 'Ctrl+Shift+T', category: 'template', action: 'template.new', icon: '📋' },
  { id: 'cmd-browse-templates', name: '浏览模板市场', category: 'template', action: 'template.browse', icon: '🛒' },
  { id: 'cmd-import-template', name: '导入模板', category: 'template', action: 'template.import', icon: '📥' },
  // Collaboration commands
  { id: 'cmd-share', name: '分享画布', shortcut: 'Ctrl+Shift+S', category: 'collaboration', action: 'collaboration.share', icon: '🔗' },
  { id: 'cmd-invite', name: '邀请协作者', category: 'collaboration', action: 'collaboration.invite', icon: '👤+' },
  { id: 'cmd-comment', name: '添加评论', shortcut: 'Ctrl+Alt+C', category: 'collaboration', action: 'collaboration.comment', icon: '💬' },
  // View commands
  { id: 'cmd-toggle-minimap', name: '切换小地图', shortcut: 'Ctrl+M', category: 'view', action: 'view.minimap', icon: '🗺️' },
  { id: 'cmd-toggle-grid', name: '切换网格', shortcut: 'Ctrl+G', category: 'view', action: 'view.grid', icon: '⊞' },
  { id: 'cmd-fullscreen', name: '全屏模式', shortcut: 'F11', category: 'view', action: 'view.fullscreen', icon: '⛶' },
  // Settings commands
  { id: 'cmd-settings', name: '打开设置', shortcut: 'Ctrl+,', category: 'settings', action: 'settings.open', icon: '⚙️' },
  { id: 'cmd-shortcuts', name: '快捷键设置', category: 'settings', action: 'settings.shortcuts', icon: '⌨️' },
  { id: 'cmd-export', name: '导出画布', shortcut: 'Ctrl+Shift+E', category: 'settings', action: 'settings.export', icon: '📤' },
];

export function getCommandRegistry(): CommandRegistry[] {
  return COMMAND_REGISTRY;
}

export function getCommandsByCategory(category: CommandCategory): CommandRegistry[] {
  if (category === 'all') return COMMAND_REGISTRY;
  return COMMAND_REGISTRY.filter((cmd) => cmd.category === category);
}

// ==================== System Reserved Shortcuts ====================

const SYSTEM_RESERVED = new Set(['c', 'v', 'z', 's', 'w', 'q']);

export function detectShortcutConflict(shortcut: string): boolean {
  if (!shortcut) return false;
  // Extract key from shortcut string like "Ctrl+=" or "Ctrl+C"
  const normalized = shortcut.toLowerCase().replace('ctrl+', '').replace('cmd+', '').replace('alt+', '');
  // Check if the base key is system reserved
  const baseKey = normalized.replace(/^ctrl\+|cmd\+|alt\+/gi, '').toLowerCase();
  return SYSTEM_RESERVED.has(baseKey);
}

// ==================== Store ====================

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  /** Recent canvas list — persisted to localStorage */
  recentCanvases: CanvasEntry[];
  /** Live fuzzy search results (computed) */
  results: SearchResult[];
  /** Fuse.js instance for fuzzy search */
  _fuse: Fuse<CanvasEntry> | null;

  // S88-E5: Category filter
  filterCategory: CommandCategory;
  /** Recently executed commands — persisted to localStorage (max 5) */
  recentCommands: CommandItem[];

  // S88-E5: Actions
  setFilterCategory: (c: CommandCategory) => void;
  addRecentCommand: (cmd: CommandRegistry) => void;
  removeRecentCommand: (cmdId: string) => void;
  clearRecentCommands: () => void;

  // S84-E3: Original actions (preserved)
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (q: string) => void;
  recordVisit: (canvasId: string, canvasName: string) => void;
  clearHistory: () => void;
  setSearchIndex: (canvases: CanvasEntry[]) => void;
}

// ==================== Fuse.js Config ====================

const FUSE_OPTIONS: Fuse.IFuseOptions<CanvasEntry> = {
  keys: ['name'],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 1,
};

const MAX_RECENT_COMMANDS = 5;

// ==================== Store ====================

export const useCommandPaletteStore = create<CommandPaletteState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      query: '',
      recentCanvases: [],
      results: [],
      _fuse: null,

      // S88-E5: New state
      filterCategory: 'all',
      recentCommands: [],

      // S88-E5: Category filter
      setFilterCategory: (category: CommandCategory) => {
        set({ filterCategory: category });
      },

      // S88-E5: Recent commands management
      addRecentCommand: (cmd: CommandRegistry) => {
        const { recentCommands } = get();
        const now = new Date().toISOString();
        // Remove existing entry for this command, then add to front
        const filtered = recentCommands.filter((c) => c.id !== cmd.id);
        const updated: CommandItem[] = [
          {
            id: cmd.id,
            name: cmd.name,
            shortcut: cmd.shortcut,
            category: cmd.category,
            action: cmd.action,
            lastExecuted: now,
          },
          ...filtered,
        ].slice(0, MAX_RECENT_COMMANDS);
        set({ recentCommands: updated });
      },

      removeRecentCommand: (cmdId: string) => {
        const { recentCommands } = get();
        set({ recentCommands: recentCommands.filter((c) => c.id !== cmdId) });
      },

      clearRecentCommands: () => {
        set({ recentCommands: [] });
      },

      // S84-E3: Original actions
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
        // Create NEW array (not mutate) so Zustand's Object.is comparison triggers update
        const filtered = recentCanvases.filter((c) => c.id !== canvasId);
        const updated: CanvasEntry[] = [
          { id: canvasId, name: canvasName, lastVisited: now },
          ...filtered,
        ].slice(0, 10);

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
      partialize: (state) => ({
        recentCanvases: state.recentCanvases,
        // S88-E5: persist recentCommands
        recentCommands: state.recentCommands,
      }),
    }
  )
);
