/**
 * useVersionHistory Hook Tests
 *
 * 覆盖场景:
 * - 初始状态（空 snapshots, isOpen=false）
 * - open/close 行为
 * - selectSnapshot 行为
 * - loadSnapshots 排序
 *
 * 参考: docs/proposals/20260405-1321/canvas-testing-strategy/
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVersionHistory } from '../useVersionHistory';
import type { CanvasSnapshot } from '@/lib/canvas/types';

// Mock stores — Zustand store function pattern matching existing canvas tests
vi.mock('@/lib/canvas/stores/contextStore', () => {
  const storeFn = (selector?: (s: any) => unknown) => {
    const state = { contextNodes: [], setContextNodes: vi.fn() };
    return selector ? selector(state) : state;
  };
  (storeFn as any).getState = () => ({ contextNodes: [] });
  (storeFn as any).subscribe = vi.fn(() => vi.fn());
  (storeFn as any).setState = vi.fn();
  return { useContextStore: storeFn };
});

vi.mock('@/lib/canvas/stores/flowStore', () => {
  const storeFn = (selector?: (s: any) => unknown) => {
    const state = { flowNodes: [], setFlowNodes: vi.fn() };
    return selector ? selector(state) : state;
  };
  (storeFn as any).getState = () => ({ flowNodes: [] });
  (storeFn as any).subscribe = vi.fn(() => vi.fn());
  (storeFn as any).setState = vi.fn();
  return { useFlowStore: storeFn };
});

vi.mock('@/lib/canvas/stores/componentStore', () => {
  const storeFn = (selector?: (s: any) => unknown) => {
    const state = { componentNodes: [], setComponentNodes: vi.fn() };
    return selector ? selector(state) : state;
  };
  (storeFn as any).getState = () => ({ componentNodes: [] });
  (storeFn as any).subscribe = vi.fn(() => vi.fn());
  (storeFn as any).setState = vi.fn();
  return { useComponentStore: storeFn };
});

vi.mock('@/lib/canvas/stores/sessionStore', () => {
  const storeFn = (selector?: (s: any) => unknown) => {
    const state = { projectId: 'test-project' };
    return selector ? selector(state) : state;
  };
  (storeFn as any).getState = () => ({ projectId: 'test-project' });
  (storeFn as any).subscribe = vi.fn(() => vi.fn());
  (storeFn as any).setState = vi.fn();
  return { useSessionStore: storeFn };
});

// Mock canvasApi
vi.mock('@/lib/canvas/api/canvasApi', () => ({
  canvasApi: {
    listSnapshots: vi.fn(),
    createSnapshot: vi.fn(),
    restoreSnapshot: vi.fn(),
  },
}));

const mockSnapshots: CanvasSnapshot[] = [
  {
    id: 'snap-2',
    projectId: 'test-project',
    label: 'Newer snapshot',
    trigger: 'manual' as const,
    contextNodes: [],
    flowNodes: [],
    componentNodes: [],
    createdAt: '2026-04-05T12:00:00Z',
  },
  {
    id: 'snap-1',
    projectId: 'test-project',
    label: 'Older snapshot',
    trigger: 'ai_complete' as const,
    contextNodes: [],
    flowNodes: [],
    componentNodes: [],
    createdAt: '2026-04-05T11:00:00Z',
  },
];

describe('useVersionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with empty snapshots', () => {
      const { result } = renderHook(() => useVersionHistory());
      expect(result.current.snapshots).toEqual([]);
    });

    it('should start with isOpen=false', () => {
      const { result } = renderHook(() => useVersionHistory());
      expect(result.current.isOpen).toBe(false);
    });

    it('should start with no selectedSnapshot', () => {
      const { result } = renderHook(() => useVersionHistory());
      expect(result.current.selectedSnapshot).toBeNull();
    });

    it('should start with restoring=false', () => {
      const { result } = renderHook(() => useVersionHistory());
      expect(result.current.restoring).toBe(false);
    });

    it('should start with creating=false', () => {
      const { result } = renderHook(() => useVersionHistory());
      expect(result.current.creating).toBe(false);
    });

    it('should start with loading=false', () => {
      const { result } = renderHook(() => useVersionHistory());
      expect(result.current.loading).toBe(false);
    });
  });

  describe('open/close', () => {
    it('should have open function', () => {
      const { result } = renderHook(() => useVersionHistory());
      expect(typeof result.current.open).toBe('function');
    });

    it('should have close function', () => {
      const { result } = renderHook(() => useVersionHistory());
      expect(typeof result.current.close).toBe('function');
    });

    it('should set isOpen=true when open is called', async () => {
      const canvasApi = await import('@/lib/canvas/api/canvasApi');
      (canvasApi.canvasApi.listSnapshots as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        snapshots: [],
      });

      const { result } = renderHook(() => useVersionHistory());
      await act(async () => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);
    });

    it('should set isOpen=false when close is called', async () => {
      const canvasApi = await import('@/lib/canvas/api/canvasApi');
      (canvasApi.canvasApi.listSnapshots as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        snapshots: [],
      });

      const { result } = renderHook(() => useVersionHistory());
      await act(async () => {
        result.current.open();
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it('should clear selectedSnapshot when close is called', async () => {
      const canvasApi = await import('@/lib/canvas/api/canvasApi');
      (canvasApi.canvasApi.listSnapshots as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        snapshots: [],
      });

      const { result } = renderHook(() => useVersionHistory());
      await act(async () => {
        result.current.open();
        result.current.selectSnapshot(mockSnapshots[0]);
        result.current.close();
      });
      expect(result.current.selectedSnapshot).toBeNull();
    });
  });

  describe('selectSnapshot', () => {
    it('should set selectedSnapshot', async () => {
      const { result } = renderHook(() => useVersionHistory());
      await act(async () => {
        result.current.selectSnapshot(mockSnapshots[0]);
      });
      expect(result.current.selectedSnapshot).toBe(mockSnapshots[0]);
    });

    it('should clear selectedSnapshot when called with null', async () => {
      const { result } = renderHook(() => useVersionHistory());
      await act(async () => {
        result.current.selectSnapshot(mockSnapshots[0]);
        result.current.selectSnapshot(null);
      });
      expect(result.current.selectedSnapshot).toBeNull();
    });
  });

  describe('loadSnapshots', () => {
    it('should sort snapshots by createdAt descending (newest first)', async () => {
      const canvasApi = await import('@/lib/canvas/api/canvasApi');
      (canvasApi.canvasApi.listSnapshots as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        snapshots: mockSnapshots,
      });

      const { result } = renderHook(() => useVersionHistory());
      await act(async () => {
        await result.current.loadSnapshots();
      });
      expect(result.current.snapshots).toHaveLength(2);
      expect(result.current.snapshots[0].id).toBe('snap-2'); // newer
      expect(result.current.snapshots[1].id).toBe('snap-1'); // older
    });
  });

  describe('createSnapshot', () => {
    it('should return a snapshot on success', async () => {
      const canvasApi = await import('@/lib/canvas/api/canvasApi');
      (canvasApi.canvasApi.createSnapshot as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        snapshot: {
          id: 'new-snap',
          projectId: 'test-project',
          label: 'New snapshot',
          trigger: 'manual' as const,
          contextNodes: [],
          flowNodes: [],
          componentNodes: [],
          createdAt: '2026-04-05T13:00:00Z',
        },
      });

      const { result } = renderHook(() => useVersionHistory());
      const snapshot = await act(async () => {
        return result.current.createSnapshot('Test snapshot');
      });
      expect(snapshot).not.toBeNull();
      if (snapshot) {
        expect(snapshot.id).toBe('new-snap');
      }
    });
  });

  describe('restoreSnapshot', () => {
    it('should return true on success', async () => {
      const canvasApi = await import('@/lib/canvas/api/canvasApi');
      (canvasApi.canvasApi.restoreSnapshot as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        contextNodes: [],
        flowNodes: [],
        componentNodes: [],
      });

      const { result } = renderHook(() => useVersionHistory());
      const success = await act(async () => {
        return result.current.restoreSnapshot('snap-1');
      });
      expect(success).toBe(true);
    });

    it('should close panel after successful restore', async () => {
      const canvasApi = await import('@/lib/canvas/api/canvasApi');
      (canvasApi.canvasApi.listSnapshots as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        snapshots: [],
      });
      (canvasApi.canvasApi.restoreSnapshot as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        contextNodes: [],
        flowNodes: [],
        componentNodes: [],
      });

      const { result } = renderHook(() => useVersionHistory());
      await act(async () => {
        result.current.open();
      });
      await act(async () => {
        await result.current.restoreSnapshot('snap-1');
      });
      expect(result.current.isOpen).toBe(false);
    });
  });
});
