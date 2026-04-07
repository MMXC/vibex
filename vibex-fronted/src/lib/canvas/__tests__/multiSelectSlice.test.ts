/**
 * multiSelectSlice.test.ts — Epic 3 E3-F2: Multi-select & batch operations
 *
 * Tests the multi-select slice in canvasStore:
 * - selectedNodeIds state per tree
 * - toggleNodeSelect
 * - selectNode
 * - clearNodeSelection
 * - selectAllNodes
 * - deleteSelectedNodes (batch delete)
 */

import { useCanvasStore } from '../canvasStore';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '../types';

// Mock localStorage to prevent Zustand persist errors
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    get length() { return 0; },
  },
  writable: true,
  configurable: true,
});

// Mock history slice
vi.mock('../historySlice', () => ({
  getHistoryStore: () => ({
    recordSnapshot: vi.fn(),
  }),
}));

// Helper: create a minimal mock node
function mockContextNode(overrides: Partial<BoundedContextNode> = {}): BoundedContextNode {
  return {
    nodeId: `ctx-${Math.random().toString(36).slice(2, 6)}`,
    name: 'Test Context',
    description: 'Test description',
    type: 'core',
    confirmed: false,
    status: 'pending',
    children: [],
    ...overrides,
  };
}

function mockFlowNode(overrides: Partial<BusinessFlowNode> = {}): BusinessFlowNode {
  return {
    nodeId: `flow-${Math.random().toString(36).slice(2, 6)}`,
    name: 'Test Flow',
    contextId: 'ctx-1',
    steps: [],
    confirmed: false,
    status: 'pending',
    children: [],
    ...overrides,
  };
}

function mockComponentNode(overrides: Partial<ComponentNode> = {}): ComponentNode {
  return {
    nodeId: `comp-${Math.random().toString(36).slice(2, 6)}`,
    name: 'Test Component',
    flowId: 'flow-1',
    type: 'page',
    props: {},
    api: { method: 'GET', path: '/test', params: [] },
    confirmed: false,
    status: 'pending',
    children: [],
    ...overrides,
  };
}

describe('Multi-Select Slice', () => {
  beforeEach(() => {
    // Reset store state
    useCanvasStore.getState().setContextNodes([]);
    useCanvasStore.getState().setFlowNodes([]);
    useCanvasStore.getState().setComponentNodes([]);
    // Clear selection
    useCanvasStore.getState().clearNodeSelection('context');
    useCanvasStore.getState().clearNodeSelection('flow');
    useCanvasStore.getState().clearNodeSelection('component');
  });

  // ── selectedNodeIds state ─────────────────────────────────────────────────

  describe('selectedNodeIds state', () => {
    it('initializes with empty selections for all trees', () => {
      const state = useCanvasStore.getState();
      expect(state.selectedNodeIds.context).toEqual([]);
      expect(state.selectedNodeIds.flow).toEqual([]);
      expect(state.selectedNodeIds.component).toEqual([]);
    });

    it('persists selection per tree independently', () => {
      const { toggleNodeSelect } = useCanvasStore.getState();
      toggleNodeSelect('context', 'ctx-1');
      toggleNodeSelect('flow', 'flow-1');

      const state = useCanvasStore.getState();
      expect(state.selectedNodeIds.context).toContain('ctx-1');
      expect(state.selectedNodeIds.flow).toContain('flow-1');
      expect(state.selectedNodeIds.component).toEqual([]);
    });
  });

  // ── toggleNodeSelect ─────────────────────────────────────────────────────

  describe('toggleNodeSelect', () => {
    it('selects an unselected node', () => {
      const { toggleNodeSelect } = useCanvasStore.getState();
      toggleNodeSelect('context', 'ctx-1');

      expect(useCanvasStore.getState().selectedNodeIds.context).toContain('ctx-1');
    });

    it('deselects a selected node (toggle off)', () => {
      const { toggleNodeSelect } = useCanvasStore.getState();
      toggleNodeSelect('context', 'ctx-1');
      toggleNodeSelect('context', 'ctx-1');

      expect(useCanvasStore.getState().selectedNodeIds.context).not.toContain('ctx-1');
    });

    it('can select multiple nodes across the same tree', () => {
      const { toggleNodeSelect } = useCanvasStore.getState();
      toggleNodeSelect('context', 'ctx-1');
      toggleNodeSelect('context', 'ctx-2');
      toggleNodeSelect('context', 'ctx-3');

      const ids = useCanvasStore.getState().selectedNodeIds.context;
      expect(ids).toContain('ctx-1');
      expect(ids).toContain('ctx-2');
      expect(ids).toContain('ctx-3');
      expect(ids.length).toBe(3);
    });

    it('is tree-specific — selecting context does not affect flow', () => {
      const { toggleNodeSelect } = useCanvasStore.getState();
      toggleNodeSelect('context', 'ctx-1');

      expect(useCanvasStore.getState().selectedNodeIds.flow).toEqual([]);
    });
  });

  // ── selectNode ──────────────────────────────────────────────────────────

  describe('selectNode', () => {
    it('selects a single node', () => {
      const { selectNode } = useCanvasStore.getState();
      selectNode('context', 'ctx-1');

      expect(useCanvasStore.getState().selectedNodeIds.context).toContain('ctx-1');
    });
  });

  // ── clearNodeSelection ───────────────────────────────────────────────────

  describe('clearNodeSelection', () => {
    it('clears all selections for the specified tree', () => {
      const { toggleNodeSelect, clearNodeSelection } = useCanvasStore.getState();
      toggleNodeSelect('context', 'ctx-1');
      toggleNodeSelect('context', 'ctx-2');
      clearNodeSelection('context');

      expect(useCanvasStore.getState().selectedNodeIds.context).toEqual([]);
    });

    it('only clears the specified tree', () => {
      const { toggleNodeSelect, clearNodeSelection } = useCanvasStore.getState();
      toggleNodeSelect('context', 'ctx-1');
      toggleNodeSelect('flow', 'flow-1');
      clearNodeSelection('context');

      const state = useCanvasStore.getState();
      expect(state.selectedNodeIds.context).toEqual([]);
      expect(state.selectedNodeIds.flow).toContain('flow-1');
    });
  });

  // ── selectAllNodes ───────────────────────────────────────────────────────

  describe('selectAllNodes', () => {
    it('selects all nodes in the tree', () => {
      const ctx1 = mockContextNode({ nodeId: 'ctx-1' });
      const ctx2 = mockContextNode({ nodeId: 'ctx-2' });
      const ctx3 = mockContextNode({ nodeId: 'ctx-3' });

      useCanvasStore.getState().setContextNodes([ctx1, ctx2, ctx3]);
      useCanvasStore.getState().selectAllNodes('context');

      const ids = useCanvasStore.getState().selectedNodeIds.context;
      expect(ids).toContain('ctx-1');
      expect(ids).toContain('ctx-2');
      expect(ids).toContain('ctx-3');
      expect(ids.length).toBe(3);
    });

    it('works on empty tree', () => {
      const { selectAllNodes } = useCanvasStore.getState();
      selectAllNodes('context');

      expect(useCanvasStore.getState().selectedNodeIds.context).toEqual([]);
    });

    it('selectAll for flow tree', () => {
      const flow1 = mockFlowNode({ nodeId: 'flow-1' });
      const flow2 = mockFlowNode({ nodeId: 'flow-2' });

      useCanvasStore.getState().setFlowNodes([flow1, flow2]);
      useCanvasStore.getState().selectAllNodes('flow');

      const ids = useCanvasStore.getState().selectedNodeIds.flow;
      expect(ids).toContain('flow-1');
      expect(ids).toContain('flow-2');
    });
  });

  // ── deleteSelectedNodes (batch delete) ──────────────────────────────────

  describe('deleteSelectedNodes', () => {
    it('deletes all selected nodes in a batch', () => {
      const ctx1 = mockContextNode({ nodeId: 'ctx-1' });
      const ctx2 = mockContextNode({ nodeId: 'ctx-2' });
      const ctx3 = mockContextNode({ nodeId: 'ctx-3' });

      useCanvasStore.getState().setContextNodes([ctx1, ctx2, ctx3]);
      useCanvasStore.getState().toggleNodeSelect('context', 'ctx-1');
      useCanvasStore.getState().toggleNodeSelect('context', 'ctx-2');
      useCanvasStore.getState().deleteSelectedNodes('context');

      const remaining = useCanvasStore.getState().contextNodes;
      expect(remaining.map((n) => n.nodeId)).toEqual(['ctx-3']);
    });

    it('clears selection after batch delete', () => {
      const ctx1 = mockContextNode({ nodeId: 'ctx-1' });
      const ctx2 = mockContextNode({ nodeId: 'ctx-2' });

      useCanvasStore.getState().setContextNodes([ctx1, ctx2]);
      useCanvasStore.getState().toggleNodeSelect('context', 'ctx-1');
      useCanvasStore.getState().deleteSelectedNodes('context');

      expect(useCanvasStore.getState().selectedNodeIds.context).toEqual([]);
    });

    it('does nothing when no nodes are selected', () => {
      const ctx1 = mockContextNode({ nodeId: 'ctx-1' });
      useCanvasStore.getState().setContextNodes([ctx1]);
      useCanvasStore.getState().deleteSelectedNodes('context');

      expect(useCanvasStore.getState().contextNodes.length).toBe(1);
    });

    it('deletes from flow tree correctly', () => {
      const flow1 = mockFlowNode({ nodeId: 'flow-1' });
      const flow2 = mockFlowNode({ nodeId: 'flow-2' });

      useCanvasStore.getState().setFlowNodes([flow1, flow2]);
      useCanvasStore.getState().toggleNodeSelect('flow', 'flow-2');
      useCanvasStore.getState().deleteSelectedNodes('flow');

      const remaining = useCanvasStore.getState().flowNodes;
      expect(remaining.map((n) => n.nodeId)).toEqual(['flow-1']);
    });

    it('deletes from component tree correctly', () => {
      const comp1 = mockComponentNode({ nodeId: 'comp-1' });
      const comp2 = mockComponentNode({ nodeId: 'comp-2' });

      useCanvasStore.getState().setComponentNodes([comp1, comp2]);
      useCanvasStore.getState().toggleNodeSelect('component', 'comp-1');
      useCanvasStore.getState().deleteSelectedNodes('component');

      const remaining = useCanvasStore.getState().componentNodes;
      expect(remaining.map((n) => n.nodeId)).toEqual(['comp-2']);
    });

    it('deletes single node when only one is selected', () => {
      const ctx1 = mockContextNode({ nodeId: 'ctx-1' });
      const ctx2 = mockContextNode({ nodeId: 'ctx-2' });

      useCanvasStore.getState().setContextNodes([ctx1, ctx2]);
      useCanvasStore.getState().toggleNodeSelect('context', 'ctx-1');
      useCanvasStore.getState().deleteSelectedNodes('context');

      const remaining = useCanvasStore.getState().contextNodes;
      expect(remaining.map((n) => n.nodeId)).toEqual(['ctx-2']);
    });
  });
});
