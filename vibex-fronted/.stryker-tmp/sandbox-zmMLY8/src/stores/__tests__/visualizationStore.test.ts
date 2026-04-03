/**
 * Tests for Visualization Types and Store
 */
// @ts-nocheck


import { useVisualizationStore } from '@/stores/visualizationStore';
import type {
  VisualizationType,
  AnyVisualizationData,
  FlowVisualizationData,
  MermaidVisualizationData,
  JsonTreeVisualizationData,
  JsonTreeNode,
} from '@/types/visualization';

// ==================== Type Tests ====================

describe('VisualizationType', () => {
  it('should be one of the three supported types', () => {
    const types: VisualizationType[] = ['flow', 'mermaid', 'json'];
    expect(types).toContain('flow');
    expect(types).toContain('mermaid');
    expect(types).toContain('json');
    expect(types).toHaveLength(3);
  });
});

describe('FlowVisualizationData', () => {
  it('should have correct discriminated union structure', () => {
    const data: FlowVisualizationData = {
      type: 'flow',
      raw: { nodes: [], edges: [] },
      parsedAt: '2026-03-23T00:00:00Z',
    };
    expect(data.type).toBe('flow');
    expect(data.raw).toBeDefined();
    expect(data.raw.nodes).toBeInstanceOf(Array);
    expect(data.raw.edges).toBeInstanceOf(Array);
  });

  it('should allow optional metadata', () => {
    const data: FlowVisualizationData = {
      type: 'flow',
      raw: { nodes: [], edges: [] },
      projectId: 'proj-123',
      name: 'My Flow',
    };
    expect(data.projectId).toBe('proj-123');
    expect(data.name).toBe('My Flow');
  });
});

describe('MermaidVisualizationData', () => {
  it('should have correct discriminated union structure', () => {
    const data: MermaidVisualizationData = {
      type: 'mermaid',
      raw: 'graph TD\n  A --> B',
      parsedAt: '2026-03-23T00:00:00Z',
    };
    expect(data.type).toBe('mermaid');
    expect(typeof data.raw).toBe('string');
    expect(data.raw).toContain('graph TD');
  });
});

describe('JsonTreeVisualizationData', () => {
  it('should have correct discriminated union structure', () => {
    const root: JsonTreeNode = {
      id: 'root',
      key: 'root',
      value: {},
      type: 'object',
      depth: 0,
      path: [],
      isLeaf: false,
    };
    const data: JsonTreeVisualizationData = {
      type: 'json',
      raw: { root, totalCount: 1 },
      parsedAt: '2026-03-23T00:00:00Z',
    };
    expect(data.type).toBe('json');
    expect(data.raw.root).toBeDefined();
    expect(data.raw.totalCount).toBe(1);
  });
});

describe('AnyVisualizationData union', () => {
  it('should accept FlowVisualizationData', () => {
    const data: AnyVisualizationData = {
      type: 'flow',
      raw: { nodes: [], edges: [] },
    };
    expect(data.type).toBe('flow');
  });

  it('should accept MermaidVisualizationData', () => {
    const data: AnyVisualizationData = {
      type: 'mermaid',
      raw: 'sequenceDiagram\n  A->>B: Hello',
    };
    expect(data.type).toBe('mermaid');
  });

  it('should accept JsonTreeVisualizationData', () => {
    const data: AnyVisualizationData = {
      type: 'json',
      raw: {
        root: {
          id: 'r',
          key: 'root',
          value: null,
          type: 'null',
          depth: 0,
          path: [],
          isLeaf: true,
        },
        totalCount: 1,
      },
    };
    expect(data.type).toBe('json');
  });
});

// ==================== Store Tests ====================

describe('useVisualizationStore', () => {
  beforeEach(() => {
    useVisualizationStore.getState().clear();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useVisualizationStore.getState();
      expect(state.currentType).toBe('flow');
      expect(state.rawData).toBeNull();
      expect(state.visualizationData).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should have correct initial options', () => {
      const state = useVisualizationStore.getState();
      expect(state.options.zoom).toBe(1);
      expect(state.options.selectedNodeId).toBeNull();
      expect(state.options.searchQuery).toBe('');
      expect(state.options.showMinimap).toBe(true);
    });
  });

  describe('setType', () => {
    it('should update currentType', () => {
      const { setType } = useVisualizationStore.getState();
      setType('mermaid');
      expect(useVisualizationStore.getState().currentType).toBe('mermaid');
    });

    it('should clear error when setting type', () => {
      const { setType, setError } = useVisualizationStore.getState();
      setError(new Error('test'));
      setType('json');
      expect(useVisualizationStore.getState().error).toBeNull();
    });
  });

  describe('setData', () => {
    it('should set rawData and reset visualization state', () => {
      const { setData } = useVisualizationStore.getState();
      const testData = { nodes: [], edges: [] };
      setData(testData);

      const state = useVisualizationStore.getState();
      expect(state.rawData).toEqual(testData);
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.visualizationData).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should update isLoading', () => {
      const { setLoading } = useVisualizationStore.getState();
      setLoading(true);
      expect(useVisualizationStore.getState().isLoading).toBe(true);
      setLoading(false);
      expect(useVisualizationStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error and clear loading/data', () => {
      const { setError, setData } = useVisualizationStore.getState();
      setData({ test: true });
      const err = new Error('render failed');
      setError(err);

      const state = useVisualizationStore.getState();
      expect(state.error).toBe(err);
      expect(state.isLoading).toBe(false);
      expect(state.visualizationData).toBeNull();
    });

    it('should clear error when passed null', () => {
      const { setError } = useVisualizationStore.getState();
      setError(new Error('test'));
      setError(null);
      expect(useVisualizationStore.getState().error).toBeNull();
    });
  });

  describe('setVisualizationData', () => {
    it('should set data and update currentType', () => {
      const { setVisualizationData } = useVisualizationStore.getState();
      const data = {
        type: 'mermaid' as const,
        raw: 'graph TD\n  A --> B',
      };
      setVisualizationData(data);

      const state = useVisualizationStore.getState();
      expect(state.visualizationData).toEqual(data);
      expect(state.currentType).toBe('mermaid');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('clear', () => {
    it('should reset state to initial values', () => {
      const store = useVisualizationStore.getState();
      store.setType('mermaid');
      store.setData({ nodes: [] });
      store.setError(new Error('test'));
      store.setOption('zoom', 2);
      store.setOption('searchQuery', 'test');
      store.clear();

      const state = useVisualizationStore.getState();
      expect(state.currentType).toBe('flow');
      expect(state.rawData).toBeNull();
      expect(state.visualizationData).toBeNull();
      expect(state.error).toBeNull();
      expect(state.options.zoom).toBe(1);
      expect(state.options.searchQuery).toBe('');
    });
  });

  describe('setOption', () => {
    it('should update individual option', () => {
      const { setOption } = useVisualizationStore.getState();
      setOption('zoom', 1.5);
      expect(useVisualizationStore.getState().options.zoom).toBe(1.5);
    });

    it('should update selectedNodeId', () => {
      const { setOption } = useVisualizationStore.getState();
      setOption('selectedNodeId', 'node-42');
      expect(useVisualizationStore.getState().options.selectedNodeId).toBe('node-42');
    });

    it('should update searchQuery', () => {
      const { setOption } = useVisualizationStore.getState();
      setOption('searchQuery', 'user');
      expect(useVisualizationStore.getState().options.searchQuery).toBe('user');
    });

    it('should update showMinimap', () => {
      const { setOption } = useVisualizationStore.getState();
      setOption('showMinimap', false);
      expect(useVisualizationStore.getState().options.showMinimap).toBe(false);
    });
  });

  describe('resetOptions', () => {
    it('should reset options to defaults', () => {
      const { setOption, resetOptions } = useVisualizationStore.getState();
      setOption('zoom', 3);
      setOption('selectedNodeId', 'node-99');
      setOption('searchQuery', 'find me');
      setOption('showMinimap', false);
      resetOptions();

      const state = useVisualizationStore.getState();
      expect(state.options.zoom).toBe(1);
      expect(state.options.selectedNodeId).toBeNull();
      expect(state.options.searchQuery).toBe('');
      expect(state.options.showMinimap).toBe(true);
    });
  });
});
