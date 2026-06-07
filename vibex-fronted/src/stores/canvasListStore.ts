/**
 * canvasListStore.ts — Sprint47 E4: Canvas List View + Multi-canvas Management
 *
 * 职责：管理画布列表元数据（名称、创建时间、修改时间、缩略图）。
 * 持久化：IndexedDB (ddsPersistence service) + localStorage index。
 *
 * S68-E4 扩展：
 * - copyNodesBetweenCanvases: 将选中的画布元数据条目复制到目标画布（ID 重映射）
 * - batchTemplateExport: 将选中的画布元数据导出为 .vbtmpl 下载文件
 *
 * S76-E3 扩展：
 * - canvasIndex[]: Fuse.js 搜索索引（name:2, description:1, tags:1）
 * - rebuildIndex(): 从当前 canvases 重建索引
 * - indexedSearch(query): 加权多字段搜索
 */

import { create } from 'zustand';
import Fuse from 'fuse.js';
import { generateId, generatePrefixedId } from '@/lib/canvas/id';
import type { DDSCard, DDSEdge, ChapterType } from '@/types/dds';
import type { RequirementTemplate } from '@/data/templates';
import type { CanvasChapterData } from '@/lib/canvas/canvasStoreRegistry';
import { canvasStoreRegistry } from '@/lib/canvas/canvasStoreRegistry';
import { quickSave, quickLoad } from '@/services/dds/ddsPersistence';

// ============================================
// Types
// ============================================

export interface CanvasMeta {
  id: string;
  name: string;
  thumbnail: string | null; // base64 data URL
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  /** Archive timestamp — set when canvas is archived (S64-E4) */
  archivedAt?: string;
  /** Canvas description for search indexing (S76-E3) */
  description?: string;
  /** Canvas tags for search indexing (S76-E3) */
  tags?: string[];
}

// S76-E3: Indexed search entry (mirrors canvasSearchStore.CanvasIndexEntry for canvas-level search)
export interface CanvasIndexEntry {
  canvasId: string;
  name: string;
  description: string;
  tags: string[];
  updatedAt: string;
}

// S76-E3: Indexed search result
export interface IndexedSearchResult {
  canvasId: string;
  name: string;
  updatedAt: string;
  score: number;
  matchedField: 'name' | 'description' | 'tags' | 'multiple';
}


export interface CanvasListState {
  /** In-memory canvas list, sorted by updatedAt descending */
  canvases: CanvasMeta[];
  /** Currently active (open) canvas id */
  activeCanvasId: string | null;
  /** Whether data has been loaded from IndexedDB */
  isLoaded: boolean;
  /** Search term for filtering canvases by name (Sprint48 E1) */
  searchTerm: string;
  /** Thumbnail cache — avoids re-generating toDataURL for same canvas (Sprint48 E1) */
  thumbnailCache: Record<string, string>;
  /** Multi-select set for batch export (Sprint48 E2) */
  selectedCanvasIds: Set<string>;
  /** Archive filter mode (S64-E4) */
  archiveFilterMode: 'all' | 'active' | 'archived';
  /** S76-E3: Fuse.js search index for canvasIndex[] + indexedSearch() */
  canvasIndex: CanvasIndexEntry[];
  /** S76-E3: Fuse.js instance for canvas index */
  canvasFuseIndex: Fuse<CanvasIndexEntry> | null;


  // Actions
  loadCanvases: () => Promise<void>;
  createCanvas: (name?: string) => Promise<CanvasMeta>;
  deleteCanvas: (id: string) => Promise<void>;
  renameCanvas: (id: string, name: string) => Promise<void>;
  setActiveCanvas: (id: string) => void;
  updateThumbnail: (id: string, thumbnail: string) => Promise<void>;
  getSortedCanvases: (sortBy: 'name' | 'updatedAt') => CanvasMeta[];
  /** Set search term for filtering (Sprint48 E1) */
  setSearchTerm: (term: string) => void;
  /** Get filtered canvases by search term, then sort (Sprint48 E1) */
  getFilteredCanvases: (sortBy: 'name' | 'updatedAt') => CanvasMeta[];
  /** Cache thumbnail for a canvas — idempotent (Sprint48 E1) */
  cacheThumbnail: (canvasId: string, thumbnail: string) => void;
  /** Get cached thumbnail — returns null if not yet cached (Sprint48 E1) */
  getCachedThumbnail: (canvasId: string) => string | null;
  /** Toggle canvas selection for batch export (Sprint48 E2) */
  toggleSelect: (canvasId: string) => void;
  /** Clear all selections (Sprint48 E2) */
  clearSelection: () => void;
  /** Batch export selected canvases as individual PDFs (Sprint48 E2) */
  exportSelectedPDF: () => Promise<void>;
  /** Paste clipboard cards to target canvas (Sprint48 E5) */
  pasteToCanvas: (canvasId: string) => void;
  /** Batch delete all selected canvases (Sprint60 E2) */
  batchDeleteCanvas: () => Promise<void>;
  /** Batch rename all selected canvases with a function (S64-E4) */
  batchRename: (canvasIds: string[], renameFn: (name: string, idx: number) => string) => Promise<void>;
  /** Archive selected canvases — sets archivedAt (S64-E4) */
  batchArchive: (canvasIds: string[]) => Promise<void>;
  /** Unarchive selected canvases — clears archivedAt (S64-E4) */
  batchUnarchive: (canvasIds: string[]) => Promise<void>;
  /** Set archive filter mode (S64-E4) */
  setArchiveFilterMode: (mode: 'all' | 'active' | 'archived') => void;
  /**
   * S68-E4: 复制选中的画布元数据条目到目标画布。
   * srcId — 来源画布 ID（用于上下文，无实际用途）
   * nodeIds — 要复制的画布 ID 列表
   * destId — 目标画布 ID
   * 为每个条目生成新 ID 和新创建时间，名称追加 " (副本)"。
   */
  copyNodesBetweenCanvases: (srcId: string, nodeIds: string[], destId: string) => Promise<void>;
  /**
   * S68-E4: 批量导出选中的画布元数据为 .vbtmpl JSON 文件。
   * nodeIds — 要导出的画布 ID 列表
   */
  batchTemplateExport: (canvasIds: string[]) => Promise<void>;
  /**
   * S76-E2: 批量导出选中的画布节点为 PNG ZIP 文件。
   * - 从 IndexedDB 加载每个画布的完整数据
   * - 收集所有 chapters 的卡片 (context / flow / component)
   * - 逐个渲染到隐藏容器 → html-to-image 导出为 PNG
   * - 所有 PNG 打包为 ZIP 并触发浏览器下载
   */
  batchExport: (canvasIds: string[], options?: {
    format?: 'png';
    scale?: number;
    backgroundColor?: string;
    onProgress?: (current: number, total: number, name: string) => void;
  }) => Promise<void>;
  /**
   * S76-E3: 从当前 canvases 重建 Fuse.js 搜索索引。
   * 索引字段权重: name:2, description:1, tags:1 (归一化为 0.5/0.25/0.25)
   * 在 loadCanvases() 完成后自动调用。
   */
  rebuildIndex: () => void;
  /**
   * S76-E3: 使用 Fuse.js 加权搜索 canvases。
   * @param query 搜索词
   * @returns 按相关度排序的 IndexedSearchResult[]
   */
  indexedSearch: (query: string) => IndexedSearchResult[];

}

// ============================================
// Constants
// ============================================

const IDB_CANVAS_LIST_KEY = 'vibex-canvas-list';
const LOCALSTORAGE_INDEX_KEY = 'vibex-canvas-index';

// S76-E3: Fuse.js weighted search options (name:2, description:1, tags:1)
const CANVAS_SEARCH_FUSE_OPTIONS: Fuse.IFuseOptions<CanvasIndexEntry> = {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'description', weight: 1 },
    { name: 'tags', weight: 1 },
  ],
  threshold: 0.4,
  includeMatches: true,
  minMatchCharLength: 1,
  ignoreLocation: true,
};

// ============================================
// Persistence helpers (re-use ddsPersistence patterns)
// ============================================

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' !== undefined && window.indexedDB != null;
}

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
    return true;
  } catch {
    return false;
  }
}

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('vibex-canvas-list', 1);
    request.onerror = () => reject(new Error(`IndexedDB open failed: ${request.error}`));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('canvases')) {
        db.createObjectStore('canvases', { keyPath: 'id' });
      }
    };
  });
}

async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(storeName: string, value: unknown): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(storeName: string, key: string): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ============================================
// Store
// ============================================

export const useCanvasListStore = create<CanvasListState>((set, get) => ({
  canvases: [],
  activeCanvasId: null,
  isLoaded: false,
  searchTerm: '',
  thumbnailCache: {},
  selectedCanvasIds: new Set(),
  archiveFilterMode: 'active', // S64-E4: default to active (non-archived) canvases
  canvasIndex: [], // S76-E3: Fuse.js canvas search index
  canvasFuseIndex: null, // S76-E3: Fuse instance

  loadCanvases: async () => {
    if (!isIndexedDBAvailable()) {
      set({ isLoaded: true });
      return;
    }
    try {
      const canvases = await idbGetAll<CanvasMeta>('canvases');
      // Sort by updatedAt desc
      canvases.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      set({ canvases, isLoaded: true });
      // S76-E3: Rebuild search index after canvases are loaded
      get().rebuildIndex();
    } catch (err) {
      console.error('[canvasListStore] loadCanvases failed:', err);
      set({ isLoaded: true });
    }
  },

  createCanvas: async (name?: string) => {
    const now = new Date().toISOString();
    const id = generateId();
    const canvasName = name ?? `画布 ${new Date().toLocaleDateString('zh-CN')}`;

    const meta: CanvasMeta = {
      id,
      name: canvasName,
      thumbnail: null,
      createdAt: now,
      updatedAt: now,
    };

    await idbPut('canvases', meta);

    // Update localStorage index
    if (isLocalStorageAvailable()) {
      try {
        const raw = localStorage.getItem(LOCALSTORAGE_INDEX_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem(LOCALSTORAGE_INDEX_KEY, JSON.stringify([id, ...ids]));
      } catch {
        // non-critical
      }
    }

    set((state) => ({
      canvases: [meta, ...state.canvases],
    }));
    // S76-E3: Rebuild search index after canvas creation
    get().rebuildIndex();

    return meta;
  },

  deleteCanvas: async (id: string) => {
    await idbDelete('canvases', id);

    // Update localStorage index
    if (isLocalStorageAvailable()) {
      try {
        const raw = localStorage.getItem(LOCALSTORAGE_INDEX_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem(LOCALSTORAGE_INDEX_KEY, JSON.stringify(ids.filter((i) => i !== id)));
      } catch {
        // non-critical
      }
    }

    set((state) => ({
      canvases: state.canvases.filter((c) => c.id !== id),
      activeCanvasId: state.activeCanvasId === id ? null : state.activeCanvasId,
    }));
    // S76-E3: Rebuild search index after canvas deletion
    get().rebuildIndex();
  },

  renameCanvas: async (id: string, name: string) => {
    const { canvases } = get();
    const existing = canvases.find((c) => c.id === id);
    if (!existing) return;

    const updated: CanvasMeta = {
      ...existing,
      name,
      updatedAt: new Date().toISOString(),
    };

    await idbPut('canvases', updated);

    set((state) => ({
      canvases: state.canvases.map((c) => (c.id === id ? updated : c)),
    }));
    // S76-E3: Rebuild search index after canvas rename (name changed)
    get().rebuildIndex();
  },

  setActiveCanvas: (id: string) => {
    set({ activeCanvasId: id });
  },

  updateThumbnail: async (id: string, thumbnail: string) => {
    const { canvases } = get();
    const existing = canvases.find((c) => c.id === id);
    if (!existing) return;

    const updated: CanvasMeta = {
      ...existing,
      thumbnail,
      updatedAt: new Date().toISOString(),
    };

    await idbPut('canvases', updated);

    set((state) => ({
      canvases: state.canvases.map((c) => (c.id === id ? updated : c)),
    }));
  },

  getSortedCanvases: (sortBy: 'name' | 'updatedAt') => {
    const { canvases } = get();
    return [...canvases].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'zh-CN');
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  },

  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },

  getFilteredCanvases: (sortBy: 'name' | 'updatedAt') => {
    const { canvases, searchTerm, archiveFilterMode } = get();
    const term = searchTerm.trim().toLowerCase();

    let filtered = canvases;

    // Archive filter (S64-E4)
    if (archiveFilterMode === 'active') {
      filtered = filtered.filter((c) => !c.archivedAt);
    } else if (archiveFilterMode === 'archived') {
      filtered = filtered.filter((c) => !!c.archivedAt);
    }
    // 'all': no filter

    if (term) {
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(term));
    }
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'zh-CN');
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  },

  cacheThumbnail: (canvasId: string, thumbnail: string) => {
    set((state) => ({
      thumbnailCache: { ...state.thumbnailCache, [canvasId]: thumbnail },
    }));
  },

  getCachedThumbnail: (canvasId: string) => {
    return get().thumbnailCache[canvasId] ?? null;
  },

  toggleSelect: (canvasId: string) => {
    set((state) => {
      const next = new Set(state.selectedCanvasIds);
      if (next.has(canvasId)) {
        next.delete(canvasId);
      } else {
        next.add(canvasId);
      }
      return { selectedCanvasIds: next };
    });
  },

  clearSelection: () => {
    set({ selectedCanvasIds: new Set() });
  },

  exportSelectedPDF: async () => {
    const { selectedCanvasIds, canvases } = get();
    if (selectedCanvasIds.size === 0) return;

    // For each selected canvas, fetch its data and download as PDF
    for (const canvasId of selectedCanvasIds) {
      const meta = canvases.find((c) => c.id === canvasId);
      if (!meta) continue;

      try {
        // Fetch PDF from backend API
        const response = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: canvasId, name: meta.name }),
        });

        if (!response.ok) {
          console.error(`[canvasListStore] PDF export failed for ${canvasId}: ${response.statusText}`);
          continue;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meta.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]/g, '_')}-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error(`[canvasListStore] exportSelectedPDF error for ${canvasId}:`, err);
      }
    }
  },

  pasteToCanvas: (canvasId: string) => {
    // Sprint48 E5: cross-canvas paste — look up canvas name and delegate to clipboardStore
    const meta = get().canvases.find((c) => c.id === canvasId);
    if (!meta) {
      console.warn('[canvasListStore] pasteToCanvas: canvas not found', canvasId);
      return;
    }
    const { useClipboardStore } = require('@/stores/clipboardStore');
    const count = useClipboardStore.getState().crossCanvasPaste(canvasId, meta.name);
    if (count > 0) {
      console.debug('[canvasListStore] pasteToCanvas:', count, 'cards pasted to', meta.name);
    }
  },

  // ============================================================
  // Sprint60 E2: Batch Operations → S64-E4: Enhanced Batch Rename + Archive
  // ============================================================

  batchDeleteCanvas: async () => {
    const { selectedCanvasIds, canvases } = get();
    if (selectedCanvasIds.size === 0) return;

    // Delete each selected canvas sequentially
    for (const canvasId of selectedCanvasIds) {
      await get().deleteCanvas(canvasId);
    }

    // Clear selection after deletion
    set({ selectedCanvasIds: new Set() });
  },

  /**
   * S64-E4 D4.1 + D4.3: Flexible batch rename with a user-provided function.
   * Supports sequence mode (e.g. {name}1, {name}2) and regex find-replace.
   * Duplicate name auto-dedup: append -{n} if name already exists in other selected canvases.
   */
  batchRename: async (canvasIds, renameFn) => {
    if (canvasIds.length === 0) return;
    const { canvases } = get();

    // Build rename plan with deduplication
    const newNames = new Map<string, string>();
    const usedNames = new Set<string>();

    for (let i = 0; i < canvasIds.length; i++) {
      const canvasId = canvasIds[i];
      const canvas = canvases.find((c) => c.id === canvasId);
      if (!canvas) continue;

      let newName = renameFn(canvas.name, i + 1);

      // D4.4: Duplicate name detection — auto-dedup
      let dedupIndex = 2;
      let finalName = newName;
      while (usedNames.has(finalName)) {
        finalName = `${newName}-${dedupIndex}`;
        dedupIndex++;
      }
      usedNames.add(finalName);
      newNames.set(canvasId, finalName);
    }

    // Apply renames
    for (const [canvasId, newName] of newNames) {
      await get().renameCanvas(canvasId, newName);
    }

    set({ selectedCanvasIds: new Set() });
  },

  /**
   * S64-E4 D4.2: Archive selected canvases — sets archivedAt timestamp.
   */
  batchArchive: async (canvasIds) => {
    if (canvasIds.length === 0) return;
    const { canvases } = get();
    const now = new Date().toISOString();

    set((state) => ({
      canvases: state.canvases.map((c) =>
        canvasIds.includes(c.id) ? { ...c, archivedAt: now } : c
      ),
      selectedCanvasIds: new Set(),
    }));

    // Persist to IndexedDB
    for (const canvasId of canvasIds) {
      const canvas = canvases.find((c) => c.id === canvasId);
      if (canvas) {
        await idbPut('canvases', { ...canvas, archivedAt: now });
      }
    }
  },

  /**
   * S64-E4 D4.2: Unarchive selected canvases — clears archivedAt.
   */
  batchUnarchive: async (canvasIds) => {
    if (canvasIds.length === 0) return;
    const { canvases } = get();

    set((state) => ({
      canvases: state.canvases.map((c) =>
        canvasIds.includes(c.id) ? { ...c, archivedAt: undefined } : c
      ),
      selectedCanvasIds: new Set(),
    }));

    // Persist to IndexedDB
    for (const canvasId of canvasIds) {
      const canvas = canvases.find((c) => c.id === canvasId);
      if (canvas) {
        const { archivedAt: _archivedAt, ...rest } = canvas;
        await idbPut('canvases', rest);
      }
    }
  },

  /**
   * S64-E4 D4.6: Set archive filter mode.
   */
  setArchiveFilterMode: (mode) => {
    set({ archiveFilterMode: mode });
  },

  // ============================================================
  // S68-E4: Copy between canvases + Batch template export
  // ============================================================

  /**
   * S68-E4: copyNodesBetweenCanvases
   * 复制选中的画布元数据条目到目标画布区域，ID 重映射，名称追加 " (副本)"。
   */
  copyNodesBetweenCanvases: async (srcId, nodeIds, destId) => {
    if (nodeIds.length === 0) return;
    const { canvases } = get();
    const now = new Date().toISOString();

    const copies: CanvasMeta[] = nodeIds.map((id) => {
      const original = canvases.find((c) => c.id === id);
      if (!original) return null;
      const newId = generatePrefixedId('canvas');
      return {
        ...original,
        id: newId,
        name: `${original.name} (副本)`,
        createdAt: now,
        updatedAt: now,
        archivedAt: undefined,
        thumbnail: null, // thumbnails are canvas-specific; clear for copies
      };
    }).filter((c): c is CanvasMeta => c !== null);

    if (copies.length === 0) return;

    set((state) => ({
      canvases: [...state.canvases, ...copies],
      selectedCanvasIds: new Set(),
    }));

    // Persist each copy to IndexedDB
    for (const copy of copies) {
      await idbPut('canvases', copy);
    }
    // S76-E3: Rebuild search index after canvas copies created
    get().rebuildIndex();
  },

  /**
   * S68-E4: batchTemplateExport
   * 将选中的画布元数据导出为 .vbtmpl JSON 文件并触发浏览器下载。
   */
  batchTemplateExport: async (canvasIds) => {
    if (canvasIds.length === 0) return;
    const { canvases } = get();

    const selected = canvasIds
      .map((id) => canvases.find((c) => c.id === id))
      .filter((c): c is CanvasMeta => c !== null);

    if (selected.length === 0) return;

    const payload = {
      version: '1.0' as const,
      exportedAt: new Date().toISOString(),
      exportedBy: 'VibeX',
      type: 'canvas-meta-template' as const,
      canvases: selected.map(({ id: _id, ...meta }) => meta),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibex-canvas-template-${Date.now()}.vbtmpl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * S76-E2: batchExport
   * 批量导出选中的画布节点为 PNG ZIP 文件。
   *
   * 流程：
   * 1. 保存当前活跃画布 ID（用于导出后恢复）
   * 2. 遍历每个选中画布：从 IndexedDB 加载完整数据 → 收集所有 cards
   * 3. 逐个激活画布（触发 DOM 渲染）→ html-to-image 捕获为 PNG
   * 4. 所有 PNG 打包为 ZIP → 触发浏览器下载
   * 5. 恢复原始活跃画布
   */
  batchExport: async (canvasIds, options = {}) => {
    if (canvasIds.length === 0) return;
    const {
      scale = 2,
      backgroundColor = '#0f0f1a',
      onProgress,
    } = options;

    const { zipExporter, downloadExportBlob } = await import('@/services/export/ZipExporter');

    const blob = await zipExporter.exportCanvases(canvasIds, {
      format: 'png',
      scope: 'all',
      scale,
      backgroundColor,
      onProgress,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    downloadExportBlob(blob, `vibex-batch-export-${timestamp}.zip`);

    // 导出完成后清除选中状态
    get().clearSelection();
  },

  // ============================================================
  // S76-E3: Canvas indexed search (Fuse.js weighted: name:2, description:1, tags:1)
  // ============================================================

  rebuildIndex: () => {
    const { canvases } = get();
    const entries: CanvasIndexEntry[] = canvases
      .filter((c) => !c.archivedAt) // only index active canvases
      .map((c) => ({
        canvasId: c.id,
        name: c.name,
        description: c.description ?? '',
        tags: c.tags ?? [],
        updatedAt: c.updatedAt,
      }));

    const fuse = new Fuse(entries, CANVAS_SEARCH_FUSE_OPTIONS);
    set({ canvasIndex: entries, canvasFuseIndex: fuse });
  },

  indexedSearch: (query: string): IndexedSearchResult[] => {
    const { canvasFuseIndex } = get();
    if (!canvasFuseIndex || !query.trim()) return [];

    const fuseResults = canvasFuseIndex.search(query);
    return fuseResults.map((r) => {
      const matchedKeys = r.matches?.map((m) => m.key) ?? [];
      const matchedField: IndexedSearchResult['matchedField'] =
        matchedKeys.length === 1
          ? (matchedKeys[0] as 'name' | 'description' | 'tags')
          : 'multiple';

      return {
        canvasId: r.item.canvasId,
        name: r.item.name,
        updatedAt: r.item.updatedAt,
        score: r.score ?? 0,
        matchedField,
      };
    });
  },

  // ============================================================
  $reset: () => set({ selectedCanvasIds: new Set(), canvasIndex: [], canvasFuseIndex: null }),
}));
