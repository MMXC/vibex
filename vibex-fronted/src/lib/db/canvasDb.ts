/**
 * canvasDb.ts — Sprint65 E4: 画布搜索与过滤增强
 *
 * IndexedDB fuzzy search for canvases using Fuse.js.
 * Provides canvas-level search by name (and optionally by node content).
 *
 * D4.1: searchCanvases(query) — fuzzy search, results capped at 50, scored by relevance
 */

import Fuse from 'fuse.js';
import type { CanvasMeta } from '@/stores/canvasListStore';

// ============================================
// IndexedDB setup
// ============================================

const DB_NAME = 'vibex-canvas-search';
const DB_VERSION = 1;
const STORE_NAME = 'canvas-meta';

let _db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(new Error(`IndexedDB open failed: ${request.error}`));
    request.onsuccess = () => {
      _db = request.result;
      resolve(_db);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function idbGetAll(): Promise<CanvasMeta[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as CanvasMeta[]);
    req.onerror = () => reject(req.error);
  });
}

async function idbPutAll(canvases: CanvasMeta[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const canvas of canvases) {
      store.put(canvas);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============================================
// Search
// ============================================

const MAX_RESULTS = 50;

export interface SearchResult {
  item: CanvasMeta;
  score: number; // lower = better match
}

/**
 * Fuzzy search canvases by name using Fuse.js.
 * Results are sorted by relevance score (ascending = better match).
 * Max 50 results returned.
 *
 * D4.1: searchCanvases(query)
 * expect(results.length).toBeLessThanOrEqual(50);
 * expect(results[0].score).toBeLessThanOrEqual(results[1]?.score ?? Infinity);
 */
export async function searchCanvases(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const canvases = await idbGetAll();
  if (canvases.length === 0) return [];

  const fuse = new Fuse(canvases, {
    keys: ['name'],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 1,
  });

  const results = fuse.search(query);
  return results.slice(0, MAX_RESULTS).map((r) => ({
    item: r.item,
    score: r.score ?? 1,
  }));
}

// ============================================
// CRUD (sync with canvasListStore)
// ============================================

/**
 * Sync all canvases from canvasListStore into the search index.
 * Call this after canvasListStore.loadCanvases() or after mutations.
 */
export async function syncCanvases(canvases: CanvasMeta[]): Promise<void> {
  await idbPutAll(canvases);
}

/**
 * Add or update a single canvas in the search index.
 */
export async function upsertCanvas(canvas: CanvasMeta): Promise<void> {
  await idbPutAll([canvas]);
}

/**
 * Remove a canvas from the search index.
 */
export async function removeCanvas(id: string): Promise<void> {
  await idbDelete(id);
}
