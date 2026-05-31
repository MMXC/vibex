/**
 * canvasListStore.ts — Sprint47 E4: Canvas List View + Multi-canvas Management
 *
 * 职责：管理画布列表元数据（名称、创建时间、修改时间、缩略图）。
 * 持久化：IndexedDB (ddsPersistence service) + localStorage index。
 */

import { create } from 'zustand';
import { generateId } from '@/lib/canvas/id';

// ============================================
// Types
// ============================================

export interface CanvasMeta {
  id: string;
  name: string;
  thumbnail: string | null; // base64 data URL
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
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
}

// ============================================
// Constants
// ============================================

const IDB_CANVAS_LIST_KEY = 'vibex-canvas-list';
const LOCALSTORAGE_INDEX_KEY = 'vibex-canvas-index';

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
    const { canvases, searchTerm } = get();
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? canvases.filter((c) => c.name.toLowerCase().includes(term))
      : canvases;
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
}));
