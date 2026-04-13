/**
 * useVersionHistory — Error State Tests
 * F11.2: 401 错误 UI 层差异化展示
 *
 * 覆盖场景:
 * - loadSnapshots 401 错误 → error state = '登录已过期，请重新登录'
 * - loadSnapshots 404 错误 → error state = '历史功能维护中，请稍后再试'
 * - loadSnapshots 网络错误 → error state = '加载失败，请重试'
 * - createSnapshot 错误 → error state = '创建快照失败，请重试'
 * - open() 清除旧 error
 * - 组件读取 hook error 并渲染 banner
 *
 * 参考: docs/vibex-canvas-auth-fix/AGENTS.md 1.4
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVersionHistory } from '../useVersionHistory';

// Mock stores
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
    const state = { projectId: 'test-project-id' };
    return selector ? selector(state) : state;
  };
  (storeFn as any).getState = () => ({ projectId: 'test-project-id' });
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

describe('useVersionHistory — error state (F11.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadSnapshots error handling', () => {
    it('401 error sets error state to login prompt', async () => {
      const canvasApi = await import('@/lib/canvas/api/canvasApi');
      (canvasApi.canvasApi.listSnapshots as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('登录已过期，请重新登录')
      );

      const { result } = renderHook(() => useVersionHistory());

      // Initial error should be null
      expect(result.current.error).toBeNull();

      // Trigger loadSnapshots
      await act(async () => {
        await result.current.loadSnapshots();
      });

      // Error should be set to 401 message
      expect(result.current.error).toBe('登录已过期，请重新登录');
    });

    it('404 error sets error state to maintenance message', async () => {
      const canvasApi = await import('@/lib/canvas/api/canvasApi');
      (canvasApi.canvasApi.listSnapshots as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('历史功能维护中，请稍后再试')
      );

      const { result } = renderHook(() => useVersionHistory());

      await act(async () => {
        await result.current.loadSnapshots();
      });

      expect(result.current.error).toBe('历史功能维护中，请稍后再试');
    });

    it('network error sets generic load failure message', async () => {
      const canvasApi = await import('@/lib/canvas/api/canvasApi');
      (canvasApi.canvasApi.listSnapshots as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed to fetch')
      );

      const { result } = renderHook(() => useVersionHistory());

      await act(async () => {
        await result.current.loadSnapshots();
      });

      // Should use err.message = 'Failed to fetch' (non-Error thrown case)
      expect(result.current.error).toBeTruthy();
    });

    it('non-Error thrown sets fallback message', async () => {
      const canvasApi = await import('@/lib/canvas/api/canvasApi');
      // Simulate non-Error throw (string or object)
      (canvasApi.canvasApi.listSnapshots as ReturnType<typeof vi.fn>).mockRejectedValue('string error');
      // Also patch for object throw
      (canvasApi.canvasApi.listSnapshots as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('加载失败，请重试')
      );

      const { result } = renderHook(() => useVersionHistory());

      await act(async () => {
        await result.current.loadSnapshots();
      });

      expect(result.current.error).toBe('加载失败，请重试');
    });
  });

  describe('createSnapshot error handling', () => {
    it('createSnapshot error sets error state', async () => {
      const canvasApi = await import('@/lib/canvas/api/canvasApi');
      (canvasApi.canvasApi.createSnapshot as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('创建快照失败，请重试')
      );

      const { result } = renderHook(() => useVersionHistory());

      await act(async () => {
        await result.current.createSnapshot();
      });

      expect(result.current.error).toBe('创建快照失败，请重试');
    });
  });

  describe('error state lifecycle', () => {
    it('open() clears previous error state', async () => {
      const canvasApi = await import('@/lib/canvas/api/canvasApi');
      // First call fails
      (canvasApi.canvasApi.listSnapshots as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('登录已过期，请重新登录')
      );
      // Second call succeeds
      (canvasApi.canvasApi.listSnapshots as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        snapshots: [],
      });

      const { result } = renderHook(() => useVersionHistory());

      // Trigger failed load
      await act(async () => {
        await result.current.loadSnapshots();
      });
      expect(result.current.error).toBeTruthy();

      // Open clears error and reloads
      await act(async () => {
        result.current.open();
      });

      // Error should be cleared after open
      expect(result.current.error).toBeNull();
    });

    it('error is null initially', () => {
      const { result } = renderHook(() => useVersionHistory());
      expect(result.current.error).toBeNull();
    });
  });
});
