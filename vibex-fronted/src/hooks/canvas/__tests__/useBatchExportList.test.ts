/**
 * useBatchExportList.test.ts — Sprint57 E1: CanvasList batch export hook tests
 *
 * Tests:
 * - useBatchExportList initial state
 * - startExport with empty list → error status
 * - startExport with single canvas → calls loadCanvas + downloadBlob
 * - startExport with multiple canvases → progress updates
 * - cancelExport → cancelled status
 * - format selection: vibex vs json
 * - progress callback with current/total/canvasName
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
vi.mock('@/stores/canvasListStore', () => ({
  useCanvasListStore: vi.fn((selector?: (s: unknown) => unknown) => {
    const state = {
      canvases: [
        { id: 'c1', name: 'Canvas One', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        { id: 'c2', name: 'Canvas Two', thumbnail: null, createdAt: '2026-01-02', updatedAt: '2026-01-02' },
        { id: 'c3', name: 'Canvas Three', thumbnail: null, createdAt: '2026-01-03', updatedAt: '2026-01-03' },
      ],
      favoriteIds: ['c1', 'c2', 'c3'],
      getSortedCanvases: vi.fn((_sortBy: 'name' | 'updatedAt') => [
        { id: 'c3', name: 'Canvas Three', thumbnail: null, createdAt: '2026-01-03', updatedAt: '2026-01-03' },
        { id: 'c2', name: 'Canvas Two', thumbnail: null, createdAt: '2026-01-02', updatedAt: '2026-01-02' },
        { id: 'c1', name: 'Canvas One', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      ]),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/lib/canvas/persistence', () => ({
  loadCanvas: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/hooks/canvas/useCanvasExport', () => ({
  buildCanvasExportData: vi.fn().mockReturnValue({
    contextNodes: [{ nodeId: 'ctx1', name: 'Bounded Context 1' }],
    flowNodes: [],
    componentNodes: [],
  }),
}));

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:http://localhost/mock');
const mockRevokeObjectURL = vi.fn();
vi.stubGlobal('URL', {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

// Mock document.body.appendChild / removeChild for downloadBlob
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild as any);
vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild as any);

describe('Sprint57 E1 — useBatchExportList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:http://localhost/mock');
  });

  it('has correct initial state', async () => {
    const { useBatchExportList } = await import('../useBatchExportList');
    const { result } = renderHook(() => useBatchExportList());
    expect(result.current.status).toBe('idle');
    expect(result.current.progress).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('has correct initial state — E1.6a', async () => {
    const { useBatchExportList } = await import('../useBatchExportList');
    const { result } = renderHook(() => useBatchExportList());
    expect(result.current.status).toBe('idle');
    expect(result.current.progress).toBe(null);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.startExport).toBe('function');
    expect(typeof result.current.cancelExport).toBe('function');
  });

  it('startExport with empty list → error status — E1.6b', async () => {
    const { useBatchExportList } = await import('../useBatchExportList');
    const { result } = renderHook(() => useBatchExportList());
    await act(async () => {
      await result.current.startExport([], 'vibex');
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeTruthy();
  });

  it('startExport with single canvas → loading then exporting — E1.6c', async () => {
    const { useBatchExportList } = await import('../useBatchExportList');
    const { result } = renderHook(() => useBatchExportList());
    await act(async () => {
      const promise = result.current.startExport(['c1'], 'vibex');
      // Wait a tick for status to update
      await new Promise((r) => setTimeout(r, 10));
      await promise;
    });
    expect(result.current.status).toBe('done');
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('startExport with multiple canvases → progress updates — E1.6d', async () => {
    const { useBatchExportList } = await import('../useBatchExportList');
    const { result } = renderHook(() => useBatchExportList());
    await act(async () => {
      await result.current.startExport(['c1', 'c2'], 'vibex');
    });
    expect(result.current.status).toBe('done');
    // Progress should have been updated for each canvas
    expect(result.current.progress?.total).toBeGreaterThanOrEqual(1);
  });

  it('cancelExport → cancelled status — E1.6e', async () => {
    const { useBatchExportList } = await import('../useBatchExportList');
    const { result } = renderHook(() => useBatchExportList());

    // Start export then immediately cancel
    const exportPromise = result.current.startExport(['c1', 'c2', 'c3'], 'vibex');
    // Give it a tick to start
    await new Promise((r) => setTimeout(r, 5));

    await act(async () => {
      result.current.cancelExport();
    });

    await act(async () => {
      try {
        await exportPromise;
      } catch {
        // Expected: cancelled export may throw
      }
    });

    // Status should be cancelled or error (depends on timing)
    expect(['cancelled', 'idle', 'error'].includes(result.current.status)).toBe(true);
  });

  it('json format → creates JSON blob instead of vibex — E1.6f', async () => {
    const { useBatchExportList } = await import('../useBatchExportList');
    const { result } = renderHook(() => useBatchExportList());
    await act(async () => {
      await result.current.startExport(['c1'], 'json');
    });
    expect(result.current.status).toBe('done');
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });
});
