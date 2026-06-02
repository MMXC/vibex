/**
 * useBatchExportList.test.ts — Sprint57 E1: CanvasList batch export hook tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Capture native URL before any stubbing (needed by Vite module runner)
const nativeURL = URL;

// Mock JSZip before any imports
vi.mock('jszip', () => ({
  default: class MockJSZip {
    folder() { return this; }
    file() {}
    async generateAsync() { return new Blob(['PK...'], { type: 'application/zip' }); }
  },
}));

// Mock dependencies BEFORE imports — Zustand store with both selector pattern + getState()
vi.mock('@/stores/canvasListStore', () => {
  const mockState = {
    canvases: [
      { id: 'c1', name: 'Canvas One', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { id: 'c2', name: 'Canvas Two', thumbnail: null, createdAt: '2026-01-02', updatedAt: '2026-01-02' },
      { id: 'c3', name: 'Canvas Three', thumbnail: null, createdAt: '2026-01-03', updatedAt: '2026-01-03' },
    ],
    favoriteIds: ['c1', 'c2'],
    getSortedCanvases: vi.fn(),
  };
  return {
    useCanvasListStore: Object.assign(
      vi.fn((selector?: (s: typeof mockState) => unknown) => {
        return selector ? selector(mockState) : mockState;
      }),
      { getState: () => mockState }
    ),
  };
});

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

// Mock URL: acts as a real URL constructor (for Vite's `new URL(...)`)
// but lets tests spy on createObjectURL/revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:http://localhost/mock');
const mockRevokeObjectURL = vi.fn();

class MockURL {
  static createObjectURL = mockCreateObjectURL;
  static revokeObjectURL = mockRevokeObjectURL;

  href: string;
  protocol: string;
  hostname: string;
  pathname: string;
  search: string;
  hash: string;

  constructor(url: string, base?: string) {
    const native = new nativeURL(url, base);
    this.href = native.href;
    this.protocol = native.protocol;
    this.hostname = native.hostname;
    this.pathname = native.pathname;
    this.search = native.search ?? '';
    this.hash = native.hash ?? '';
  }
}

vi.stubGlobal('URL', MockURL);

describe('Sprint57 E1 — useBatchExportList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:http://localhost/mock');
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    expect(typeof result.current.startExport).toBe('function');
    expect(typeof result.current.cancelExport).toBe('function');
  });

  it('startExport with empty list → error status', async () => {
    const { useBatchExportList } = await import('../useBatchExportList');
    const { result } = renderHook(() => useBatchExportList());

    await act(async () => {
      await result.current.startExport([], 'vibex');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('没有选择要导出的画布');
  });

  it('startExport with single canvas → status transitions to done', async () => {
    const { useBatchExportList } = await import('../useBatchExportList');
    const { result } = renderHook(() => useBatchExportList());

    await act(async () => {
      await result.current.startExport(['c1'], 'vibex');
    });

    // Debug: log error if status is not 'done'
    if (result.current.status !== 'done') {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] startExport error:', result.current.error, 'status:', result.current.status);
    }

    expect(result.current.status).toBe('done');
    expect(result.current.error).toBe(null);
  });

  it('startExport with multiple canvases → progress updates with current/total', async () => {
    const { useBatchExportList } = await import('../useBatchExportList');
    const { result } = renderHook(() => useBatchExportList());

    await act(async () => {
      await result.current.startExport(['c1', 'c2', 'c3'], 'vibex');
    });

    expect(result.current.status).toBe('done');
    expect(result.current.progress?.total).toBe(3);
  });

  it('cancelExport → status becomes cancelled', async () => {
    const { useBatchExportList } = await import('../useBatchExportList');
    const { result } = renderHook(() => useBatchExportList());

    let exportPromise: Promise<void>;
    await act(async () => {
      exportPromise = result.current.startExport(['c1', 'c2'], 'vibex');
      // Cancel immediately
      result.current.cancelExport();
      await exportPromise;
    });

    expect(result.current.status).toBe('cancelled');
  });

  it('startExport with json format → produces .json file', async () => {
    const { useBatchExportList } = await import('../useBatchExportList');
    const { result } = renderHook(() => useBatchExportList());

    await act(async () => {
      await result.current.startExport(['c1', 'c2'], 'json');
    });

    expect(result.current.status).toBe('done');
  });
});
