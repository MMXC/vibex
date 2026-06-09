/**
 * useBatchCanvasExport.test.ts
 *
 * S83-E5: 批量导出 ZIP
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

const getHook = () => import('../useBatchCanvasExport').then(m => m.useBatchCanvasExport);

// Use vi.hoisted so mocks are available at eval time for vi.mock factories
const { quickLoad } = vi.hoisted(() => {
  const fn = vi.fn().mockResolvedValue({
    chapters: {
      requirement: { cards: [], edges: [] },
      context: { cards: [], edges: [] },
      flow: { cards: [], edges: [] },
    },
  });
  return { quickLoad: fn };
});

const mockCanvases = [
  { id: 'c1', name: '画布A', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'c2', name: '画布B', createdAt: '2026-01-02', updatedAt: '2026-01-02' },
  { id: 'c3', name: '画布C', createdAt: '2026-01-03', updatedAt: '2026-01-03' },
];

const mockStoreFn = vi.fn(() => ({ canvases: mockCanvases }));

vi.mock('@/services/dds/ddsPersistence', () => ({
  quickLoad,
}));

vi.mock('@/stores/canvasListStore', () => ({
  useCanvasListStore: (selector?: (s: { canvases: typeof mockCanvases }) => unknown) => {
    const state = { canvases: mockCanvases };
    return selector ? selector(state) : state;
  },
}));

class MockZip {
  _files: Record<string, string> = {};
  file(name: string, _content: string) { this._files[name] = ''; return this; }
  async generateAsync() { return new Blob(['ZIP'], { type: 'application/zip' }); }
}

vi.mock('jszip', () => ({
  default: MockZip as unknown as { new(): MockZip },
}));

describe('S83-E5 — useBatchCanvasExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('starts with empty selection and idle status', async () => {
      const useBatchCanvasExport = await getHook();
      const { result } = renderHook(() => useBatchCanvasExport());
      expect(result.current.selectedCanvasIds.size).toBe(0);
      expect(result.current.status).toBe('idle');
    });

    it('reports total canvases from store', async () => {
      const useBatchCanvasExport = await getHook();
      const { result } = renderHook(() => useBatchCanvasExport());
      expect(result.current.totalCanvases).toBe(3);
    });
  });

  describe('toggleSelect', () => {
    it('adds canvas id to selection', async () => {
      const useBatchCanvasExport = await getHook();
      const { result } = renderHook(() => useBatchCanvasExport());
      act(() => result.current.toggleSelect('c1'));
      expect(result.current.selectedCanvasIds.has('c1')).toBe(true);
    });

    it('removes canvas id when already selected', async () => {
      const useBatchCanvasExport = await getHook();
      const { result } = renderHook(() => useBatchCanvasExport());
      act(() => result.current.toggleSelect('c1'));
      act(() => result.current.toggleSelect('c1'));
      expect(result.current.selectedCanvasIds.has('c1')).toBe(false);
    });
  });

  describe('selectAll / clearSelection', () => {
    it('selectAll marks all canvases selected', async () => {
      const useBatchCanvasExport = await getHook();
      const { result } = renderHook(() => useBatchCanvasExport());
      act(() => result.current.selectAll());
      expect(result.current.selectedCanvasIds.size).toBe(3);
    });

    it('clearSelection empties selection', async () => {
      const useBatchCanvasExport = await getHook();
      const { result } = renderHook(() => useBatchCanvasExport());
      act(() => result.current.selectAll());
      act(() => result.current.clearSelection());
      expect(result.current.selectedCanvasIds.size).toBe(0);
    });
  });

  describe('startExport', () => {
    it('does nothing when selection is empty', async () => {
      const useBatchCanvasExport = await getHook();
      const { result } = renderHook(() => useBatchCanvasExport());
      await act(async () => { await result.current.startExport(); });
      expect(result.current.status).toBe('idle');
    });

    it('transitions to done on successful export', async () => {
      const useBatchCanvasExport = await getHook();
      const { result } = renderHook(() => useBatchCanvasExport());
      act(() => result.current.toggleSelect('c1'));
      await act(async () => { await result.current.startExport(); });
      expect(result.current.status).toBe('done');
    });

    it('calls quickLoad for each selected canvas', async () => {
      const useBatchCanvasExport = await getHook();
      const { result } = renderHook(() => useBatchCanvasExport());
      act(() => result.current.toggleSelect('c1'));
      act(() => result.current.toggleSelect('c2'));
      await act(async () => { await result.current.startExport(); });
      expect(quickLoad).toHaveBeenCalledTimes(2);
      expect(quickLoad).toHaveBeenCalledWith('c1');
      expect(quickLoad).toHaveBeenCalledWith('c2');
    });
  });

  describe('cancelExport', () => {
    it('sets status to cancelled', async () => {
      const useBatchCanvasExport = await getHook();
      const { result } = renderHook(() => useBatchCanvasExport());
      act(() => result.current.toggleSelect('c1'));
      act(() => result.current.cancelExport());
      expect(result.current.status).toBe('cancelled');
    });
  });
});
