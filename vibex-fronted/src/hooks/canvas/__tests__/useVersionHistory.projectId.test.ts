/**
 * useVersionHistory — projectId null 防护测试
 *
 * Phase 1: 止血修复
 * - loadSnapshots: projectId=null 时不调用 API，设置引导错误
 * - createSnapshot: projectId=null 时不调用 API，返回 null
 * - createAiSnapshot: projectId=null 时不调用 API，直接返回
 * - open() 时 projectId=null 显示引导错误
 *
 * 参考: docs/vibex-canvas-history-projectid/IMPLEMENTATION_PLAN.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/react';
import { useVersionHistory } from '../useVersionHistory';

// Shared mutable ref for mock — must use vi.hoisted so it's available in hoisted mock factory
const { mockProjectId, setProjectId } = vi.hoisted(() => {
  let projectId: string | null = 'test-project';
  return {
    get projectId() { return projectId; },
    setProjectId: (id: string | null) => { projectId = id; },
  };
});

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

vi.mock('@/lib/canvas/stores/sessionStore', () => ({
  useSessionStore: ((selector?: (s: any) => unknown) => {
    const state = { projectId: mockProjectId };
    return selector ? selector(state) : state;
  }) as any,
}));

vi.mock('@/lib/canvas/api/canvasApi', () => ({
  canvasApi: {
    listSnapshots: vi.fn<(args: any[]) => any>(),
    createSnapshot: vi.fn<(args: any[]) => any>(),
    restoreSnapshot: vi.fn(),
  },
}));

describe('useVersionHistory — Phase 1: projectId null 防护', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setProjectId('test-project');
  });

  describe('loadSnapshots null check', () => {
    it('projectId=null 时不调用 API，设置引导错误', async () => {
      setProjectId(null);
      const canvasApi = await import('@/lib/canvas/api/canvasApi');

      const { result } = renderHook(() => useVersionHistory());
      await act(async () => { await result.current.loadSnapshots(); });

      expect(canvasApi.canvasApi.listSnapshots).not.toHaveBeenCalled();
      expect(result.current.error).toContain('请先创建项目');
      expect(result.current.snapshots).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('projectId=undefined 时不调用 API，设置引导错误', async () => {
      setProjectId(undefined as any);
      const canvasApi = await import('@/lib/canvas/api/canvasApi');

      const { result } = renderHook(() => useVersionHistory());
      await act(async () => { await result.current.loadSnapshots(); });

      expect(canvasApi.canvasApi.listSnapshots).not.toHaveBeenCalled();
      expect(result.current.error).toContain('请先创建项目');
    });
  });

  describe('createSnapshot null check', () => {
    it('projectId=null 时不调用 API，返回 null，设置引导错误', async () => {
      setProjectId(null);
      const canvasApi = await import('@/lib/canvas/api/canvasApi');

      const { result } = renderHook(() => useVersionHistory());
      const snap = await act(async () => { return await result.current.createSnapshot(); });

      expect(canvasApi.canvasApi.createSnapshot).not.toHaveBeenCalled();
      expect(snap).toBeNull();
      expect(result.current.error).toContain('请先创建项目');
    });
  });

  describe('createAiSnapshot null check', () => {
    it('projectId=null 时不调用 API，直接返回', async () => {
      setProjectId(null);
      const canvasApi = await import('@/lib/canvas/api/canvasApi');

      const { result } = renderHook(() => useVersionHistory());
      await act(async () => { await result.current.createAiSnapshot(); });

      expect(canvasApi.canvasApi.createSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('open() with null projectId', () => {
    it('open() 时 projectId=null 设置引导错误，snapshots 清空', async () => {
      setProjectId(null);
      const canvasApi = await import('@/lib/canvas/api/canvasApi');

      const { result } = renderHook(() => useVersionHistory());

      act(() => { result.current.open(); });

      await waitFor(() => {
        expect(result.current.error).toContain('请先创建项目');
        expect(result.current.snapshots).toEqual([]);
        expect(result.current.loading).toBe(false);
      });

      expect(canvasApi.canvasApi.listSnapshots).not.toHaveBeenCalled();
    });
  });
});
