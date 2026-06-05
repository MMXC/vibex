/**
 * canvasDb.test.ts — Sprint65 E4: canvasDb.ts vitest
 * D4.7: canvasDb.test.ts covers searchCanvases
 *
 * Uses vi.hoisted() for mocks + globalThis.indexedDB mock for jsdom.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock globalThis.indexedDB BEFORE importing canvasDb
const mockIDBDatabase = {
  objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
  transaction: vi.fn().mockReturnValue({
    objectStore: vi.fn().mockReturnValue({
      getAll: vi.fn().mockReturnValue({ onsuccess: null, onerror: null, result: [] }),
      put: vi.fn(),
      delete: vi.fn(),
    }),
    oncomplete: null,
    onerror: null,
  }),
  close: vi.fn(),
};

const mockIDBOpenRequest = {
  onerror: null,
  onsuccess: null,
  onupgradeneeded: null,
  result: mockIDBDatabase,
};

globalThis.indexedDB = {
  open: vi.fn().mockReturnValue(mockIDBOpenRequest),
} as unknown as IDBFactory;

const mockCanvasMeta = (id: string, name: string) => ({
  id,
  name,
  thumbnail: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('canvasDb', async () => {
  // Import canvasDb AFTER mocks are set up
  const { searchCanvases, syncCanvases } = await import('../canvasDb');

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock getAll to return test data
    const mockTx = mockIDBDatabase.transaction({} as IDBTransaction);
    const mockStore = {
      getAll: vi.fn().mockReturnValue({ onsuccess: null, onerror: null, result: [] }),
      put: vi.fn(),
      delete: vi.fn(),
    };
    (mockIDBDatabase.transaction as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      objectStore: vi.fn().mockReturnValue(mockStore),
      oncomplete: null,
      onerror: null,
    });
  });

  describe('searchCanvases', () => {
    it('returns empty array for empty query', async () => {
      const result = await searchCanvases('');
      expect(result).toEqual([]);
    });

    it('returns empty array for whitespace query', async () => {
      const result = await searchCanvases('   ');
      expect(result).toEqual([]);
    });

    it('D4.1: returns results capped at 50', async () => {
      // Mock getAll to return 100 canvases
      const manyCanvases = Array.from({ length: 100 }, (_, i) =>
        mockCanvasMeta(`id-${i}`, `Canvas ${i}`)
      );
      const mockStore = {
        getAll: vi.fn().mockReturnValue({ onsuccess: null, onerror: null, result: manyCanvases }),
        put: vi.fn(),
        delete: vi.fn(),
      };
      (mockIDBDatabase.transaction as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        objectStore: vi.fn().mockReturnValue(mockStore),
        oncomplete: null,
        onerror: null,
      });

      const results = await searchCanvases('Canvas');
      expect(results.length).toBeLessThanOrEqual(50);
    });

    it('D4.1: results sorted by relevance (score ascending)', async () => {
      const canvases = [
        mockCanvasMeta('1', '测试方案A文档'),
        mockCanvasMeta('2', '测试方案B文档'),
        mockCanvasMeta('3', '普通文档'),
      ];
      const mockStore = {
        getAll: vi.fn().mockReturnValue({ onsuccess: null, onerror: null, result: canvases }),
        put: vi.fn(),
        delete: vi.fn(),
      };
      (mockIDBDatabase.transaction as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        objectStore: vi.fn().mockReturnValue(mockStore),
        oncomplete: null,
        onerror: null,
      });

      const results = await searchCanvases('方案A');
      expect(results.length).toBeGreaterThan(0);
      // D4.1: expect(results[0].score).toBeLessThanOrEqual(results[1]?.score ?? Infinity);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeLessThanOrEqual(results[i].score);
      }
    });

    it('returns results with item and score fields', async () => {
      const canvases = [mockCanvasMeta('1', '测试画布')];
      const mockStore = {
        getAll: vi.fn().mockReturnValue({ onsuccess: null, onerror: null, result: canvases }),
        put: vi.fn(),
        delete: vi.fn(),
      };
      (mockIDBDatabase.transaction as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        objectStore: vi.fn().mockReturnValue(mockStore),
        oncomplete: null,
        onerror: null,
      });

      const results = await searchCanvases('测试');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('item');
      expect(results[0]).toHaveProperty('score');
      expect(typeof results[0].score).toBe('number');
    });
  });
});
