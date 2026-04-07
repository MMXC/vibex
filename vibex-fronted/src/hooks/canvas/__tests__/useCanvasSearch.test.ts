/**
 * useCanvasSearch Hook Tests
 *
 * 覆盖场景:
 * - 基本搜索过滤
 * - debounce 行为
 * - 空结果
 * - 三树合并搜索（context/flow/component）
 * - hasResults 和 searchTimeMs 追踪
 *
 * 参考: docs/proposals/20260405-1321/canvas-testing-strategy/
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasSearch } from '../useCanvasSearch';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';

// Helpers to create minimal nodes
const makeContextNode = (overrides: Partial<BoundedContextNode> = {}): BoundedContextNode => ({
  nodeId: 'ctx-1',
  name: 'Test Context',
  type: 'core',
  status: 'draft' as const,
  isActive: false,
  children: [],
  ...overrides,
});

const makeFlowNode = (overrides: Partial<BusinessFlowNode> = {}): BusinessFlowNode => ({
  nodeId: 'flow-1',
  name: 'Test Flow',
  contextId: 'ctx-1',
  status: 'draft' as const,
  steps: [],
  ...overrides,
});

const makeComponentNode = (overrides: Partial<ComponentNode> = {}): ComponentNode => ({
  nodeId: 'comp-1',
  name: 'Test Component',
  flowId: 'flow-1',
  status: 'draft' as const,
  ...overrides,
});

describe('useCanvasSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic search', () => {
    it('should return empty results for empty query', () => {
      const { result } = renderHook(() => useCanvasSearch([], [], []));
      expect(result.current.results).toEqual([]);
      expect(result.current.hasResults).toBe(false);
    });

    it('should return empty results for whitespace-only query', () => {
      const ctxNodes = [makeContextNode({ name: 'Alpha' })];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, [], [])
      );

      act(() => {
        result.current.setQuery('   ');
      });

      // Whitespace-only is treated as empty, so results should be empty
      expect(result.current.results).toEqual([]);
      expect(result.current.hasResults).toBe(false);
    });

    it('should filter context nodes by name', () => {
      const ctxNodes = [
        makeContextNode({ nodeId: 'ctx-1', name: 'Alpha' }),
        makeContextNode({ nodeId: 'ctx-2', name: 'Beta' }),
      ];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, [], [])
      );

      act(() => {
        result.current.setQuery('alpha');
        vi.advanceTimersByTime(150);
      });

      expect(result.current.results.length).toBeGreaterThan(0);
      expect(result.current.results.some((r) => r.name.toLowerCase().includes('alpha'))).toBe(true);
    });

    it('should include flow nodes in search', () => {
      const ctxNodes = [makeContextNode({ nodeId: 'ctx-1', name: 'My Context' })];
      const flowNodes = [
        makeFlowNode({ nodeId: 'flow-1', name: 'My Flow', contextId: 'ctx-1' }),
      ];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, flowNodes, [])
      );

      act(() => {
        result.current.setQuery('my flow');
        vi.advanceTimersByTime(150);
      });

      expect(result.current.results.some((r) => r.treeType === 'flow')).toBe(true);
    });

    it('should include component nodes in search', () => {
      const ctxNodes = [makeContextNode({ nodeId: 'ctx-1', name: 'Ctx' })];
      const flowNodes = [makeFlowNode({ nodeId: 'flow-1', contextId: 'ctx-1' })];
      const componentNodes = [
        makeComponentNode({ nodeId: 'comp-1', name: 'Button', flowId: 'flow-1' }),
      ];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, flowNodes, componentNodes)
      );

      act(() => {
        result.current.setQuery('button');
        vi.advanceTimersByTime(150);
      });

      expect(result.current.results.some((r) => r.treeType === 'component')).toBe(true);
    });
  });

  describe('debounce behavior', () => {
    it('should debounce isSearching flag', () => {
      const ctxNodes = [makeContextNode({ name: 'Alpha' })];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, [], [], { debounceMs: 150 })
      );

      // Before query, isSearching is false
      expect(result.current.isSearching).toBe(false);

      act(() => {
        result.current.setQuery('a');
      });

      // After setQuery, isSearching is true (debounce started)
      expect(result.current.isSearching).toBe(true);

      // Advance past debounce
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // After debounce completes, isSearching is false
      expect(result.current.isSearching).toBe(false);
    });

    it('should clear previous timer on new query (timer reset)', () => {
      const ctxNodes = [makeContextNode({ name: 'Alpha' })];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, [], [], { debounceMs: 200 })
      );

      // First query
      act(() => {
        result.current.setQuery('a');
      });
      expect(result.current.isSearching).toBe(true);

      // Before 200ms, set new query
      act(() => {
        vi.advanceTimersByTime(100);
      });
      // isSearching still true (original timer not yet fired)
      expect(result.current.isSearching).toBe(true);

      // New query resets timer
      act(() => {
        result.current.setQuery('ab');
      });

      // Advance past original timer but before new timer completes
      act(() => {
        vi.advanceTimersByTime(120);
      });

      // New timer should not have completed yet (only 120ms, need 200ms)
      expect(result.current.isSearching).toBe(true);

      // Complete the new timer
      act(() => {
        vi.advanceTimersByTime(90);
      });
      expect(result.current.isSearching).toBe(false);
    });
  });

  describe('path formatting', () => {
    it('should format flow node path with context name', () => {
      const ctxNodes = [makeContextNode({ nodeId: 'ctx-1', name: 'Alpha' })];
      const flowNodes = [
        makeFlowNode({ nodeId: 'flow-1', name: 'Beta', contextId: 'ctx-1' }),
      ];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, flowNodes, [])
      );

      act(() => {
        result.current.setQuery('beta');
        vi.advanceTimersByTime(150);
      });

      const flowResult = result.current.results.find((r) => r.treeType === 'flow');
      expect(flowResult).toBeDefined();
      expect(flowResult?.path).toContain('Alpha');
      expect(flowResult?.path).toContain('Beta');
    });

    it('should format component node path with context name', () => {
      const ctxNodes = [makeContextNode({ nodeId: 'ctx-1', name: 'Warehouse' })];
      const flowNodes = [makeFlowNode({ nodeId: 'flow-1', name: 'Inbound', contextId: 'ctx-1' })];
      const componentNodes = [
        makeComponentNode({ nodeId: 'comp-1', name: 'Scanner', flowId: 'flow-1' }),
      ];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, flowNodes, componentNodes)
      );

      act(() => {
        result.current.setQuery('scanner');
        vi.advanceTimersByTime(150);
      });

      const compResult = result.current.results.find((r) => r.treeType === 'component');
      expect(compResult).toBeDefined();
      expect(compResult?.path).toContain('Warehouse');
      expect(compResult?.path).toContain('Scanner');
    });
  });

  describe('hasResults', () => {
    it('should be false when no results', () => {
      const ctxNodes = [makeContextNode({ name: 'Alpha' })];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, [], [])
      );

      act(() => {
        result.current.setQuery('nonexistent');
        vi.advanceTimersByTime(150);
      });

      expect(result.current.hasResults).toBe(false);
    });

    it('should be true when results exist', () => {
      const ctxNodes = [makeContextNode({ name: 'Alpha' })];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, [], [])
      );

      act(() => {
        result.current.setQuery('alpha');
        vi.advanceTimersByTime(150);
      });

      expect(result.current.hasResults).toBe(true);
    });
  });

  describe('path formatting without context', () => {
    it('should use node name as path when context not found', () => {
      const ctxNodes: BoundedContextNode[] = []; // no contexts
      const flowNodes = [
        makeFlowNode({ nodeId: 'flow-1', name: 'Orphan Flow', contextId: 'non-existent' }),
      ];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, flowNodes, [])
      );

      act(() => {
        result.current.setQuery('orphan');
        vi.advanceTimersByTime(150);
      });

      const flowResult = result.current.results.find((r) => r.treeType === 'flow');
      expect(flowResult).toBeDefined();
      // Path should be just the node name (no context prefix)
      expect(flowResult?.path).toBe('Orphan Flow');
    });

    it('should use node name as path when parent flow not found', () => {
      const ctxNodes = [makeContextNode({ nodeId: 'ctx-1', name: 'Ctx' })];
      const flowNodes: BusinessFlowNode[] = []; // no flows
      const componentNodes = [
        makeComponentNode({ nodeId: 'comp-1', name: 'Orphan Component', flowId: 'non-existent' }),
      ];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, flowNodes, componentNodes)
      );

      act(() => {
        result.current.setQuery('orphan');
        vi.advanceTimersByTime(150);
      });

      const compResult = result.current.results.find((r) => r.treeType === 'component');
      expect(compResult).toBeDefined();
      // Path should be just the component name
      expect(compResult?.path).toBe('Orphan Component');
    });
  });

  describe('performance tracking', () => {
    it('should track search time as non-negative', () => {
      const ctxNodes = Array.from({ length: 100 }, (_, i) =>
        makeContextNode({ nodeId: `ctx-${i}`, name: `Node ${i}` })
      );
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, [], [])
      );

      act(() => {
        result.current.setQuery('node');
        vi.advanceTimersByTime(150);
      });

      // searchTimeMs is tracked (note: stored in ref, visible after debounce re-render)
      expect(result.current.searchTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('query state', () => {
    it('should expose current query value', () => {
      const ctxNodes = [makeContextNode({ name: 'Alpha' })];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, [], [])
      );

      expect(result.current.query).toBe('');

      act(() => {
        result.current.setQuery('test');
      });

      // query is updated immediately (before debounce)
      expect(result.current.query).toBe('test');
    });
  });

  describe('isSearching flag', () => {
    it('should be false when no query', () => {
      const { result } = renderHook(() => useCanvasSearch([], [], []));
      expect(result.current.isSearching).toBe(false);
    });

    it('should be true during debounce', () => {
      const ctxNodes = [makeContextNode({ name: 'Alpha' })];
      const { result } = renderHook(() =>
        useCanvasSearch(ctxNodes, [], [], { debounceMs: 200 })
      );

      act(() => {
        result.current.setQuery('a');
      });

      // During debounce, isSearching should be true
      expect(result.current.isSearching).toBe(true);

      // After debounce completes
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.isSearching).toBe(false);
    });
  });
});
