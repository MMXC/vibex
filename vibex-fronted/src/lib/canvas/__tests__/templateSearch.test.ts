/**
 * templateSearch.test.ts
 * Sprint52 E4: 模板管理增强 — Fuse.js 模糊搜索测试
 *
 * Tests the fuzzy search functionality using Fuse.js with threshold 0.3.
 * Pure unit tests — no DOM/browser required.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mock fuse.js ───────────────────────────────────────────────────────────────
const mockFuseSearch = vi.fn();

vi.mock('fuse.js', () => ({
  default: class MockFuse {
    constructor(_options: unknown) {}
    search = mockFuseSearch;
  },
}));

// ─── Import after mock ─────────────────────────────────────────────────────────
import { searchTemplates } from '../templateSearch';

describe('templateSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchTemplates', () => {
    it('returns all templates when query is empty', async () => {
      const templates = [
        { id: 't1', name: '空白画布', description: '从零开始', tags: [] },
        { id: 't2', name: '流程图', description: '业务流程', tags: [] },
      ] as const;
      // When query is empty, Fuse is not called
      const result = await searchTemplates('', templates as never[]);
      expect(result).toHaveLength(2);
      expect(mockFuseSearch).not.toHaveBeenCalled();
    });

    it('returns Fuse.js results for non-empty query', async () => {
      const templates = [
        { id: 't1', name: '空白画布', description: '从零开始', tags: ['blank'] },
        { id: 't2', name: '流程图', description: '业务流程', tags: ['flow'] },
      ] as const;
      mockFuseSearch.mockReturnValue([
        { item: templates[1], score: 0.1 },
      ]);

      const result = await searchTemplates('流程', templates as never[]);
      expect(mockFuseSearch).toHaveBeenCalledWith('流程');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t2');
    });

    it('deduplicates Fuse.js results by id', async () => {
      const t1 = { id: 't1', name: '测试模板', description: '测试', tags: [] as string[] };
      const templates = [t1];
      // Fuse returns same item twice
      mockFuseSearch.mockReturnValue([{ item: t1 }, { item: t1 }]);

      const result = await searchTemplates('测试', templates as never[]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t1');
    });

    it('returns empty array when Fuse finds nothing', async () => {
      const templates = [
        { id: 't1', name: '空白画布', description: '从零开始', tags: [] as string[] },
      ] as const;
      mockFuseSearch.mockReturnValue([]);

      const result = await searchTemplates('xyznotfound', templates as never[]);
      expect(result).toHaveLength(0);
    });
  });
});
