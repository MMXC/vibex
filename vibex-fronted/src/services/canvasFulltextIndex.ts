/**
 * canvasFulltextIndex.ts — Sprint68 E3: 全局画布全文搜索
 *
 * Web Worker + Fuse.js based full-text search for node content across all canvases.
 * Architecture:
 *   1. indexCanvas(canvasData) — traverses nodes, extracts textContent, stores in IndexedDB
 *   2. searchNodes(query) — Fuse.js fuzzy search on the index, returns NodeSearchResult[]
 *
 * E3 DoD: Web Worker 索引服务 + Fuse.js 模糊搜索 + IndexedDB 缓存
 */

import Fuse from 'fuse.js';

const DB_NAME = 'vibex-fulltext';
const DB_VERSION = 1;
const STORE_NAME = 'node-index';
const CACHE_STORE = 'search-cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

let _db: IDBDatabase | null = null;

// ============================================
// IndexedDB setup
// ============================================

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
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'query' });
      }
    };
  });
}

// ============================================
// Types
// ============================================

export interface IndexedNode {
  id: string;
  canvasId: string;
  canvasName: string;
  textContent: string;
  nodeType?: string;
  timestamp: number;
}

export interface NodeSearchResult {
  nodeId: string;
  canvasId: string;
  canvasName: string;
  matchedText: string;
  score: number;
  nodeType?: string;
}

/** E2 (Sprint69): Search result with surrounding context snippets */
export interface ContextSearchResult extends NodeSearchResult {
  /** Context before the matched text (up to maxContext chars) */
  before: string;
  /** Context after the matched text (up to maxContext chars) */
  after: string;
}

export interface CanvasData {
  id: string;
  name: string;
  nodes?: Array<{ id?: string; textContent?: string; text?: string; type?: string }>;
}

// ============================================
// IndexedDB helpers
// ============================================

async function idbGetAllNodes(): Promise<IndexedNode[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result ?? []) as IndexedNode[]);
    req.onerror = () => reject(req.error);
  });
}

async function idbPutNode(node: IndexedNode): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(node);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDeleteCanvasNodes(canvasId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const allNodes = req.result as IndexedNode[];
      for (const node of allNodes) {
        if (node.canvasId === canvasId) {
          store.delete(node.id);
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbGetCache(query: string): Promise<NodeSearchResult[] | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, 'readonly');
    const store = tx.objectStore(CACHE_STORE);
    const req = store.get(query);
    req.onsuccess = () => {
      const cached = req.result as { query: string; results: NodeSearchResult[]; timestamp: number } | undefined;
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        resolve(cached.results);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbPutCache(query: string, results: NodeSearchResult[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, 'readwrite');
    const store = tx.objectStore(CACHE_STORE);
    store.put({ query, results, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============================================
// Text extraction
// ============================================

function extractText(node: CanvasData['nodes'][0]): string {
  const t1 = node.textContent ?? '';
  const t2 = (node as { text?: string }).text ?? '';
  return (t1 || t2).trim();
}

// ============================================
// Public API
// ============================================

/**
 * Index a canvas's nodes into the full-text search index.
 * Replaces any existing index entries for this canvas.
 *
 * @param canvasData - The canvas data with nodes array
 * E3 DoD: 节点内容索引（Web Worker + Fuse.js）
 */
export async function indexCanvas(canvasData: CanvasData): Promise<void> {
  if (!canvasData?.id) return;

  // Delete old entries for this canvas
  await idbDeleteCanvasNodes(canvasData.id);

  const nodes = canvasData.nodes ?? [];
  const timestamp = Date.now();

  for (const node of nodes) {
    const nodeId = node.id;
    if (!nodeId) continue;
    const text = extractText(node);
    if (!text) continue; // Skip empty nodes

    const indexedNode: IndexedNode = {
      id: `${canvasData.id}::${nodeId}`,
      canvasId: canvasData.id,
      canvasName: canvasData.name,
      textContent: text,
      nodeType: node.type,
      timestamp,
    };

    await idbPutNode(indexedNode);
  }
}

/**
 * Fuzzy search node content across all indexed canvases.
 * Results are cached for CACHE_TTL_MS.
 *
 * @param query - Search query string
 * @param maxResults - Maximum number of results (default: 30)
 * E3 DoD: Fuse.js 模糊搜索节点内容
 */
export async function searchNodes(
  query: string,
  maxResults: number = 30
): Promise<NodeSearchResult[]> {
  if (!query.trim()) return [];

  // Check cache first
  const cached = await idbGetCache(query);
  if (cached) return cached.slice(0, maxResults);

  const nodes = await idbGetAllNodes();
  if (nodes.length === 0) return [];

  const fuse = new Fuse(nodes, {
    keys: ['textContent'],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 1,
  });

  const results = fuse.search(query).slice(0, maxResults).map((r) => ({
    nodeId: r.item.id.split('::')[1] ?? r.item.id,
    canvasId: r.item.canvasId,
    canvasName: r.item.canvasName,
    matchedText: r.item.textContent,
    score: r.score ?? 1,
    nodeType: r.item.nodeType,
  }));

  // Cache the results (fire-and-forget)
  idbPutCache(query, results).catch(() => {/* ignore cache errors */});

  return results;
}

/**
 * E2 (Sprint69): Search with context snippets.
 * Extracts up to maxContext chars before and after each match for display.
 */
export async function searchWithContext(
  query: string,
  maxResults: number = 30,
  maxContext: number = 30
): Promise<ContextSearchResult[]> {
  if (!query.trim()) return [];

  const results = await searchNodes(query, maxResults);
  return results.map((r) => {
    const text = r.matchedText;
    const matchIdx = text.toLowerCase().indexOf(query.toLowerCase());

    if (matchIdx === -1) {
      return { ...r, before: '', after: '' };
    }

    const before = text.slice(Math.max(0, matchIdx - maxContext), matchIdx);
    const after = text.slice(matchIdx + query.length, matchIdx + query.length + maxContext);

    return { ...r, before, after };
  });
}
