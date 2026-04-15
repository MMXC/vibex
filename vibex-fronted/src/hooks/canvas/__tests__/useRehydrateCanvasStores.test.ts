/**
 * Unit Tests: useRehydrateCanvasStores — E6 Three-Tree Persistence
 *
 * E6: Zustand stores rehydrate from localStorage on page load.
 * Tests the manual rehydration hook (skipHydration: true → false).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRehydrateCanvasStores } from '../useRehydrateCanvasStores';

// Mutable store mocks
const contextRehydrate = vi.fn().mockResolvedValue(undefined);
const flowRehydrate = vi.fn().mockResolvedValue(undefined);
const componentRehydrate = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/canvas/stores/contextStore', () => ({
  useContextStore: Object.assign(vi.fn(() => ({ nodes: [], addNode: vi.fn() })), { persist: { rehydrate: contextRehydrate } }),
}));

vi.mock('@/lib/canvas/stores/flowStore', () => ({
  useFlowStore: Object.assign(vi.fn(() => ({ nodes: [], addNode: vi.fn() })), { persist: { rehydrate: flowRehydrate } }),
}));

vi.mock('@/lib/canvas/stores/componentStore', () => ({
  useComponentStore: Object.assign(vi.fn(() => ({ nodes: [], addNode: vi.fn() })), { persist: { rehydrate: componentRehydrate } }),
}));

describe('useRehydrateCanvasStores — E6 AC2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    contextRehydrate.mockResolvedValue(undefined);
    flowRehydrate.mockResolvedValue(undefined);
    componentRehydrate.mockResolvedValue(undefined);
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('TC-E6-01: hook returns isRehydrated boolean', () => {
    const { result } = renderHook(() => useRehydrateCanvasStores());
    expect(typeof result.current.isRehydrated).toBe('boolean');
  });

  it('TC-E6-02: all three stores call rehydrate', async () => {
    renderHook(() => useRehydrateCanvasStores());
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    expect(contextRehydrate).toHaveBeenCalled();
    expect(flowRehydrate).toHaveBeenCalled();
    expect(componentRehydrate).toHaveBeenCalled();
  });

  it('TC-E6-03: isRehydrated true after rehydration completes', async () => {
    const { result } = renderHook(() => useRehydrateCanvasStores());
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    expect(result.current.isRehydrated).toBe(true);
  });

  it('TC-E6-04: isRehydrated true even if rehydration fails (graceful degradation)', async () => {
    contextRehydrate.mockRejectedValue(new Error('Storage unavailable'));
    const { result } = renderHook(() => useRehydrateCanvasStores());
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    // Graceful degradation — app should still work
    expect(result.current.isRehydrated).toBe(true);
  });
});
