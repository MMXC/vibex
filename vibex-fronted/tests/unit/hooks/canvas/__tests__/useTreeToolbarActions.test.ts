/**
 * useTreeToolbarActions Hook Tests
 *
 * 覆盖场景:
 * - 根据 treeType 返回正确的 store
 * - 三种 treeType 全部覆盖
 *
 * 参考: docs/proposals/20260405-1321/canvas-testing-strategy/
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTreeToolbarActions } from '@/hooks/canvas/useTreeToolbarActions';
import * as contextStoreModule from '@/lib/canvas/stores/contextStore';
import * as flowStoreModule from '@/lib/canvas/stores/flowStore';
import * as componentStoreModule from '@/lib/canvas/stores/componentStore';

// Mock stores with distinct identities so we can verify which one is returned
const mockContextStore = { contextNodes: [], selectedContextIds: [], _mockId: 'context' };
const mockFlowStore = { flowNodes: [], selectedFlowIds: [], _mockId: 'flow' };
const mockComponentStore = { componentNodes: [], selectedComponentIds: [], _mockId: 'component' };

vi.mock('@/lib/canvas/stores/contextStore', () => ({
  useContextStore: vi.fn(() => mockContextStore),
}));

vi.mock('@/lib/canvas/stores/flowStore', () => ({
  useFlowStore: vi.fn(() => mockFlowStore),
}));

vi.mock('@/lib/canvas/stores/componentStore', () => ({
  useComponentStore: vi.fn(() => mockComponentStore),
}));

describe('useTreeToolbarActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('treeType=context', () => {
    it('should return contextStore', () => {
      const { result } = renderHook(() => useTreeToolbarActions('context'));
      expect(result.current.store).toBe(mockContextStore);
    });
  });

  describe('treeType=flow', () => {
    it('should return flowStore', () => {
      const { result } = renderHook(() => useTreeToolbarActions('flow'));
      expect(result.current.store).toBe(mockFlowStore);
    });
  });

  describe('treeType=component', () => {
    it('should return componentStore', () => {
      const { result } = renderHook(() => useTreeToolbarActions('component'));
      expect(result.current.store).toBe(mockComponentStore);
    });
  });

  describe('return structure', () => {
    it('should return object with store property', () => {
      const { result } = renderHook(() => useTreeToolbarActions('context'));
      expect(result.current).toHaveProperty('store');
      expect(typeof result.current.store).toBe('object');
    });

    it('should call all three store hooks', () => {
      renderHook(() => useTreeToolbarActions('context'));

      // The hook calls all three store hooks unconditionally
      expect(vi.mocked(contextStoreModule.useContextStore)).toHaveBeenCalled();
      expect(vi.mocked(flowStoreModule.useFlowStore)).toHaveBeenCalled();
      expect(vi.mocked(componentStoreModule.useComponentStore)).toHaveBeenCalled();
    });
  });
});
