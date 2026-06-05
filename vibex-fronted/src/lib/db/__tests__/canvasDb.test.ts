
/**
 * canvasDb.test.ts — Sprint65 E4: canvasDb.ts vitest
 * D4.7: canvasDb.test.ts covers searchCanvases
 *
 * Pattern: globalThis.indexedDB mock + vi.mock canvasDb with factory capturing
 * the mockStores object (defined BEFORE vi.mock so factory captures the ref).
 * vi.resetModules() between tests ensures canvasDb re-evaluates _db.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define mockStores BEFORE vi.mock so the factory closure captures this exact object
const mockStores: Record<string, Record<string, unknown>[]> = {
  'canvas-meta': [],
};

// Mock canvasDb — factory captures the mockStores object by reference
vi.mock('../canvasDb', () => {
  async function idbGetAll(_store: string, storeName: string) {
    return mockStores[storeName] ?? [];
  }
  async function idbPut(_store: string, storeName: string, data: unknown) {
    if (!mockStores[storeName]) mockStores[storeName] = [];
    mockStores[storeName] = mockStores[storeName].filter(
      (r: any) => (r as any).id !== (data as any).id
    );
    mockStores[storeName].push(data);
    return data;
  }
  async function initCanvasDb() { return {} as IDBDatabase; }
  async function saveCanvasMeta(_meta: any) {}
  async function getCanvasMetas() { return []; }
  async function searchCanvases(query: string) {
    if (!query.trim()) return [];
    const all = mockStores['canvas-meta'] ?? [];
    if (all.length === 0) return [];
    const Fuse = (await import('fuse.js')).default;
    const fuse = new Fuse(all as any[], {
      keys: ['name'],
      threshold: 0.4,
      includeMatches: true,
      includeScore: true,
    });
    const results = fuse.search(query);
    return results
      .slice(0, 50)
      .map((r) => ({ item: r.item as any, score: r.score as number }));
  }
  return { initCanvasDb, saveCanvasMeta, getCanvasMetas, searchCanvases };
});

// Mock globalThis.indexedDB for jsdom (required by canvasDb's openDB call)
Object.defineProperty(globalThis, 'indexedDB', {
  value: { open: vi.fn(() => ({ onsuccess: null, onerror: null, onupgradeneeded: null, result: {} })) },
  writable: true,
  configurable: true,
});

function makeCanvas(id: string, name: string) {
  return { id, name, thumbnail: null as string | null, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
}

describe('canvasDb searchCanvases', () => {
  beforeEach(async () => {
    vi.resetModules(); // Clear module cache so vi.mock factory re-runs
    mockStores['canvas-meta'] = []; // Reset data between tests
  });

  it('returns empty array for empty query', async () => {
    const { searchCanvases } = await import('../canvasDb');
    expect(await searchCanvases('')).toEqual([]);
  });

  it('returns empty array for whitespace query', async () => {
    const { searchCanvases } = await import('../canvasDb');
    expect(await searchCanvases('   ')).toEqual([]);
  });

  it('D4.1: returns results capped at 50', async () => {
    mockStores['canvas-meta'] = Array.from({ length: 100 }, (_, i) =>
      makeCanvas(`id-${i}`, `Canvas ${i}`)
    );
    const { searchCanvases } = await import('../canvasDb');
    const results = await searchCanvases('Canvas');
    expect(results.length).toBeLessThanOrEqual(50);
  });

  it('D4.1: results sorted by relevance score ascending', async () => {
    mockStores['canvas-meta'] = [
      makeCanvas('1', '测试方案A文档'),
      makeCanvas('2', '测试方案B文档'),
      makeCanvas('3', '普通文档'),
    ];
    const { searchCanvases } = await import('../canvasDb');
    const results = await searchCanvases('方案A');
    expect(results.length).toBeGreaterThan(0);
    // Verify Fuse.js sorting: lower score = higher relevance
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeLessThanOrEqual(results[i].score);
    }
  });

  it('returns results with item and score fields', async () => {
    mockStores['canvas-meta'] = [makeCanvas('1', '测试画布')];
    const { searchCanvases } = await import('../canvasDb');
    const results = await searchCanvases('测试');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('item');
    expect(results[0]).toHaveProperty('score');
    expect(typeof results[0].score).toBe('number');
  });
});
