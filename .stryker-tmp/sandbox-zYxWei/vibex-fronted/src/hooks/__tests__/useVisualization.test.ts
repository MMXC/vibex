/**
 * Tests for useVisualization hook
 */
// @ts-nocheck


import { renderHook, act } from '@testing-library/react';
import { useVisualization } from '../useVisualization';
import { useVisualizationStore } from '@/stores/visualizationStore';
import type { VisualizationType, FlowVisualizationRaw } from '@/types/visualization';

// Reset store before each test
beforeEach(() => {
  const store = useVisualizationStore.getState();
  store.clear();
  store.setType('flow');
});

describe('useVisualization', () => {
  describe('currentType', () => {
    it('returns the current type from store', () => {
      const { result } = renderHook(() => useVisualization());
      expect(result.current.currentType).toBe('flow');

      // Change store directly
      act(() => {
        useVisualizationStore.getState().setType('mermaid');
      });

      expect(result.current.currentType).toBe('mermaid');
    });
  });

  describe('switchType', () => {
    it('updates the current type in the store', () => {
      const { result } = renderHook(() => useVisualization());

      act(() => {
        result.current.switchType('json');
      });

      expect(result.current.currentType).toBe('json');
      expect(useVisualizationStore.getState().currentType).toBe('json');
    });

    it('can switch to all three types', () => {
      const { result } = renderHook(() => useVisualization());
      const types: VisualizationType[] = ['flow', 'mermaid', 'json'];

      types.forEach((type) => {
        act(() => {
          result.current.switchType(type);
        });
        expect(result.current.currentType).toBe(type);
      });
    });
  });

  describe('transitionTime', () => {
    it('returns a transition time value', () => {
      const { result } = renderHook(() => useVisualization());
      expect(result.current.transitionTime).toBe(150);
    });
  });

  describe('error', () => {
    it('returns null when no error', () => {
      const { result } = renderHook(() => useVisualization());
      expect(result.current.error).toBeNull();
    });

    it('returns error from store', () => {
      const { result } = renderHook(() => useVisualization());

      act(() => {
        useVisualizationStore.getState().setError(new Error('Test error'));
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Test error');
    });
  });

  describe('isLoading', () => {
    it('returns false by default', () => {
      const { result } = renderHook(() => useVisualization());
      expect(result.current.isLoading).toBe(false);
    });

    it('returns loading state from store', () => {
      const { result } = renderHook(() => useVisualization());

      act(() => {
        useVisualizationStore.getState().setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('state', () => {
    it('returns nodes and edges when type is flow', () => {
      const { result } = renderHook(() => useVisualization());

      const flowData: FlowVisualizationRaw = {
        nodes: [
          { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' }, type: 'default' },
        ],
        edges: [{ id: 'e1', source: '1', target: '2', type: 'smoothstep' }],
      };

      act(() => {
        useVisualizationStore.getState().setData(flowData);
      });

      expect(result.current.state.nodes).toHaveLength(1);
      expect(result.current.state.edges).toHaveLength(1);
      expect(result.current.state.code).toBeUndefined();
      expect(result.current.state.json).toBeUndefined();
    });

    it('returns code when type is mermaid', () => {
      const { result } = renderHook(() => useVisualization());

      act(() => {
        useVisualizationStore.getState().setType('mermaid');
        useVisualizationStore.getState().setData('graph TD; A-->B;');
      });

      expect(result.current.state.code).toBe('graph TD; A-->B;');
      expect(result.current.state.nodes).toBeUndefined();
      expect(result.current.state.json).toBeUndefined();
    });

    it('returns json when type is json', () => {
      const { result } = renderHook(() => useVisualization());

      act(() => {
        useVisualizationStore.getState().setType('json');
        useVisualizationStore.getState().setData({ key: 'value' });
      });

      expect(result.current.state.json).toEqual({ key: 'value' });
      expect(result.current.state.nodes).toBeUndefined();
      expect(result.current.state.code).toBeUndefined();
    });
  });

  describe('options', () => {
    it('returns options from store', () => {
      const { result } = renderHook(() => useVisualization());

      act(() => {
        useVisualizationStore.getState().setOption('showMinimap', false);
      });

      expect(result.current.options.showMinimap).toBe(false);
      expect(result.current.options.zoom).toBeDefined();
      expect(result.current.options.selectedNodeId).toBeNull();
    });
  });

  describe('clear', () => {
    it('clears the store state', () => {
      const { result } = renderHook(() => useVisualization());

      act(() => {
        useVisualizationStore.getState().setData({ foo: 'bar' });
        useVisualizationStore.getState().setOption('selectedNodeId', 'node-1');
      });

      expect(useVisualizationStore.getState().rawData).not.toBeNull();

      act(() => {
        result.current.clear();
      });

      expect(useVisualizationStore.getState().rawData).toBeNull();
    });
  });

  describe('rawData', () => {
    it('returns raw data from store', () => {
      const { result } = renderHook(() => useVisualization());

      act(() => {
        useVisualizationStore.getState().setData({ test: 'data' });
      });

      expect(result.current.rawData).toEqual({ test: 'data' });
    });
  });
});
