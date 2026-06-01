/**
 * fullTextSearch.test.ts — Sprint50 E1: Canvas Global Search
 */

import { describe, it, expect } from 'vitest';
import { fullTextSearch, getSearchResults } from '../fullTextSearch';
import type { CanvasIndexEntry } from '@/stores/canvasSearchStore';

describe('fullTextSearch', () => {
  it('should return empty array for empty query', () => {
    const index = new Map<string, CanvasIndexEntry>();
    expect(fullTextSearch(index, '')).toEqual([]);
    expect(fullTextSearch(index, '   ')).toEqual([]);
  });

  it('should return empty array for empty index', () => {
    const index = new Map<string, CanvasIndexEntry>();
    expect(fullTextSearch(index, 'test')).toEqual([]);
  });

  it('should find canvas by name match', () => {
    const index = new Map<string, CanvasIndexEntry>([
      ['c1', { canvasId: 'c1', name: '电商系统', searchableText: '', nodeTexts: [], updatedAt: '2026-01-01', matchCount: 0 }],
      ['c2', { canvasId: 'c2', name: '支付系统', searchableText: '', nodeTexts: [], updatedAt: '2026-01-01', matchCount: 0 }],
    ]);

    const result = fullTextSearch(index, '电商');
    expect(result).toContain('c1');
    expect(result).not.toContain('c2');
  });

  it('should find canvas by node text match', () => {
    const index = new Map<string, CanvasIndexEntry>([
      ['c1', { canvasId: 'c1', name: 'Canvas1', searchableText: '用户下单流程', nodeTexts: ['用户下单流程'], updatedAt: '2026-01-01', matchCount: 0 }],
      ['c2', { canvasId: 'c2', name: 'Canvas2', searchableText: '支付网关', nodeTexts: ['支付网关'], updatedAt: '2026-01-01', matchCount: 0 }],
    ]);

    const result = fullTextSearch(index, '下单');
    expect(result).toContain('c1');
    expect(result).not.toContain('c2');
  });

  it('should rank name matches higher than text matches', () => {
    const index = new Map<string, CanvasIndexEntry>([
      ['c1', { canvasId: 'c1', name: '电商平台', searchableText: '', nodeTexts: [], updatedAt: '2026-01-01', matchCount: 0 }],
      ['c2', { canvasId: 'c2', name: 'Other', searchableText: '电商平台', nodeTexts: ['电商平台'], updatedAt: '2026-01-01', matchCount: 0 }],
    ]);

    const result = fullTextSearch(index, '电商');
    expect(result[0]).toBe('c1'); // name match should be first
  });

  it('should handle multi-term query', () => {
    const index = new Map<string, CanvasIndexEntry>([
      ['c1', { canvasId: 'c1', name: '支付系统', searchableText: '支付宝', nodeTexts: ['支付宝'], updatedAt: '2026-01-01', matchCount: 0 }],
      ['c2', { canvasId: 'c2', name: '支付系统', searchableText: '', nodeTexts: [], updatedAt: '2026-01-01', matchCount: 0 }],
    ]);

    const result = fullTextSearch(index, '支付 宝');
    expect(result).toContain('c1');
    expect(result[0]).toBe('c1');
  });

  it('should return results sorted by score descending', () => {
    const index = new Map<string, CanvasIndexEntry>([
      ['c1', { canvasId: 'c1', name: 'Test', searchableText: 'test', nodeTexts: ['test'], updatedAt: '2026-01-01', matchCount: 0 }],
      ['c2', { canvasId: 'c2', name: 'Test', searchableText: 'test test test', nodeTexts: ['test', 'test', 'test'], updatedAt: '2026-01-01', matchCount: 0 }],
    ]);

    const result = fullTextSearch(index, 'test');
    expect(result[0]).toBe('c2'); // more matches
  });
});

describe('getSearchResults', () => {
  it('should return empty array for empty canvasIds', () => {
    const index = new Map<string, CanvasIndexEntry>();
    expect(getSearchResults([], index)).toEqual([]);
  });

  it('should return search results with metadata', () => {
    const index = new Map<string, CanvasIndexEntry>([
      ['c1', { canvasId: 'c1', name: 'Test Canvas', searchableText: '', nodeTexts: [], updatedAt: '2026-01-01', matchCount: 0 }],
    ]);

    const result = getSearchResults(['c1'], index);
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      canvasId: 'c1',
      name: 'Test Canvas',
      updatedAt: '2026-01-01',
      matchedField: 'both',
    });
  });

  it('should skip canvasIds not in index', () => {
    const index = new Map<string, CanvasIndexEntry>();
    const result = getSearchResults(['c1', 'c2'], index);
    expect(result.length).toBe(0);
  });
});
