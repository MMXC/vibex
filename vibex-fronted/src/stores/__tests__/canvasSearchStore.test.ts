/**
 * canvasSearchStore.test.ts — Sprint50 E1: Canvas Global Search
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasSearchStore } from '../canvasSearchStore';

describe('CanvasSearchStore', () => {
  beforeEach(() => {
    useCanvasSearchStore.getState().$reset();
  });

  it('should have initial state', () => {
    const state = useCanvasSearchStore.getState();
    expect(state.keywordIndex.size).toBe(0);
    expect(state.results).toEqual([]);
    expect(state.isIndexBuilt).toBe(false);
    expect(state.isPanelOpen).toBe(false);
    expect(state.query).toBe('');
  });

  describe('buildIndex', () => {
    it('should build index from canvases', () => {
      const canvases = [
        { id: 'c1', name: '电商项目', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-02' },
        { id: 'c2', name: '支付系统', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-03' },
      ];
      const nodeTexts: Record<string, string[]> = {
        c1: ['用户下单', '库存扣减'],
        c2: ['支付网关', '对账'],
      };

      useCanvasSearchStore.getState().buildIndex(canvases, nodeTexts);

      const state = useCanvasSearchStore.getState();
      expect(state.isIndexBuilt).toBe(true);
      expect(state.keywordIndex.size).toBe(2);
      expect(state.keywordIndex.get('c1')?.name).toBe('电商项目');
      expect(state.keywordIndex.get('c1')?.nodeTexts).toEqual(['用户下单', '库存扣减']);
    });

    it('should build empty index when no canvases', () => {
      useCanvasSearchStore.getState().buildIndex([], {});
      const state = useCanvasSearchStore.getState();
      expect(state.isIndexBuilt).toBe(true);
      expect(state.keywordIndex.size).toBe(0);
    });
  });

  describe('search', () => {
    it('should return empty results for empty query', () => {
      const canvases = [
        { id: 'c1', name: 'Test', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-02' },
      ];
      useCanvasSearchStore.getState().buildIndex(canvases, {});

      useCanvasSearchStore.getState().search('');
      expect(useCanvasSearchStore.getState().results).toEqual([]);
    });

    it('should return empty results when index not built', () => {
      useCanvasSearchStore.getState().search('test');
      expect(useCanvasSearchStore.getState().results).toEqual([]);
    });

    it('should find canvases by name match', () => {
      const canvases = [
        { id: 'c1', name: '电商域', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-02' },
        { id: 'c2', name: '支付系统', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-03' },
      ];
      useCanvasSearchStore.getState().buildIndex(canvases, {});

      useCanvasSearchStore.getState().search('电商');
      const results = useCanvasSearchStore.getState().results;
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.name === '电商域')).toBe(true);
    });

    it('should find canvases by node text match', () => {
      const canvases = [
        { id: 'c1', name: 'Test1', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-02' },
        { id: 'c2', name: 'Test2', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-03' },
      ];
      const nodeTexts: Record<string, string[]> = {
        c1: ['用户下单流程'],
        c2: ['支付网关'],
      };
      useCanvasSearchStore.getState().buildIndex(canvases, nodeTexts);

      useCanvasSearchStore.getState().search('下单');
      const results = useCanvasSearchStore.getState().results;
      expect(results.some((r) => r.canvasId === 'c1')).toBe(true);
    });

    it('should rank name matches higher than text matches', () => {
      const canvases = [
        { id: 'c1', name: '支付系统', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-02' },
        { id: 'c2', name: 'Test', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-03' },
      ];
      const nodeTexts: Record<string, string[]> = {
        c1: [],
        c2: ['支付系统'],
      };
      useCanvasSearchStore.getState().buildIndex(canvases, nodeTexts);

      useCanvasSearchStore.getState().search('支付');
      const results = useCanvasSearchStore.getState().results;
      // c1 (name match) should rank higher than c2 (text match)
      expect(results[0]?.canvasId).toBe('c1');
    });
  });

  describe('updateIndex', () => {
    it('should update an existing entry', () => {
      const canvases = [
        { id: 'c1', name: 'Original', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-02' },
      ];
      useCanvasSearchStore.getState().buildIndex(canvases, {});

      useCanvasSearchStore.getState().updateIndex('c1', {
        canvasId: 'c1',
        name: 'Updated',
        searchableText: '用户下单',
        nodeTexts: ['用户下单'],
        updatedAt: '2026-01-04',
        matchCount: 0,
      });

      expect(useCanvasSearchStore.getState().keywordIndex.get('c1')?.name).toBe('Updated');
    });
  });

  describe('removeFromIndex', () => {
    it('should remove a canvas from index', () => {
      const canvases = [
        { id: 'c1', name: 'Canvas1', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-02' },
        { id: 'c2', name: 'Canvas2', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-03' },
      ];
      useCanvasSearchStore.getState().buildIndex(canvases, {});

      useCanvasSearchStore.getState().removeFromIndex('c1');

      const state = useCanvasSearchStore.getState();
      expect(state.keywordIndex.has('c1')).toBe(false);
      expect(state.keywordIndex.has('c2')).toBe(true);
    });
  });

  describe('setPanelOpen', () => {
    it('should set panel open state', () => {
      useCanvasSearchStore.getState().setPanelOpen(true);
      expect(useCanvasSearchStore.getState().isPanelOpen).toBe(true);

      useCanvasSearchStore.getState().setPanelOpen(false);
      expect(useCanvasSearchStore.getState().isPanelOpen).toBe(false);
    });
  });
});
