/**
 * VibeX contextStore — Standalone Zustand Store Tests
 * Epic 3: covers recomputeActiveTree, toggleNodeSelect, deleteSelectedNodes
 */
import { useContextStore } from './contextStore';

vi.mock('./messageBridge', () => ({
  postContextActionMessage: vi.fn(),
}));

vi.mock('../id', () => ({ generateId: () => 'mock-id' }));

vi.mock('../historySlice', () => ({
  getHistoryStore: () => ({
    recordSnapshot: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  }),
}));

describe('useContextStore', () => {
  beforeEach(() => {
    useContextStore.setState({
      contextNodes: [],
      contextDraft: null,
      activeTree: null,
      selectedNodeIds: { context: [], flow: [] },
      phase: 'input',
    });
  });

  // ─── recomputeActiveTree ────────────────────────────────────────────────
  describe('recomputeActiveTree', () => {
    it('should set activeTree to context when no active tree and contexts exist', () => {
      useContextStore.setState({
        contextNodes: [
          {
            nodeId: 'ctx-1',
            name: 'ctx',
            description: '',
            type: 'core' as const,
            isActive: true,
            status: 'pending' as const,
            children: [],
          },
        ],
        activeTree: null,
      });
      useContextStore.getState().recomputeActiveTree();
      expect(useContextStore.getState().activeTree).toBe('context');
    });

    it('should NOT change activeTree when no active tree and no contexts', () => {
      useContextStore.setState({ contextNodes: [], activeTree: null });
      useContextStore.getState().recomputeActiveTree();
      expect(useContextStore.getState().activeTree).toBeNull();
    });
  });

  // ─── toggleNodeSelect ────────────────────────────────────────────────────
  describe('toggleNodeSelect', () => {
    it('should select a context node when not already selected', () => {
      useContextStore.getState().toggleNodeSelect('context', 'node-1');
      expect(useContextStore.getState().selectedNodeIds.context).toContain('node-1');
    });

    it('should deselect a context node when already selected', () => {
      useContextStore.setState({ selectedNodeIds: { context: ['node-1'], flow: [] } });
      useContextStore.getState().toggleNodeSelect('context', 'node-1');
      expect(useContextStore.getState().selectedNodeIds.context).not.toContain('node-1');
    });

    it('should select a flow node when not already selected', () => {
      useContextStore.getState().toggleNodeSelect('flow', 'flow-node-1');
      expect(useContextStore.getState().selectedNodeIds.flow).toContain('flow-node-1');
    });

    it('should deselect a flow node when already selected', () => {
      useContextStore.setState({ selectedNodeIds: { context: [], flow: ['flow-node-1'] } });
      useContextStore.getState().toggleNodeSelect('flow', 'flow-node-1');
      expect(useContextStore.getState().selectedNodeIds.flow).not.toContain('flow-node-1');
    });

    it('should select a component node (not context or flow) without error', () => {
      // component tree is handled by the else branch (returns unchanged state)
      useContextStore.getState().toggleNodeSelect('component', 'comp-1');
      expect(useContextStore.getState().selectedNodeIds.context).toEqual([]);
      expect(useContextStore.getState().selectedNodeIds.flow).toEqual([]);
    });
  });

  // ─── deleteSelectedNodes ─────────────────────────────────────────────────
  describe('deleteSelectedNodes', () => {
    it('should delete all selected context nodes', () => {
      useContextStore.setState({
        contextNodes: [
          { nodeId: 'ctx-1', name: 'Ctx1', description: '', type: 'core' as const, isActive: false, status: 'pending' as const, children: [] },
          { nodeId: 'ctx-2', name: 'Ctx2', description: '', type: 'core' as const, isActive: false, status: 'pending' as const, children: [] },
          { nodeId: 'ctx-3', name: 'Ctx3', description: '', type: 'core' as const, isActive: false, status: 'pending' as const, children: [] },
        ],
        selectedNodeIds: { context: ['ctx-1', 'ctx-2'], flow: [] },
      });
      useContextStore.getState().deleteSelectedNodes('context');
      const remaining = useContextStore.getState().contextNodes;
      expect(remaining.length).toBe(1);
      expect(remaining[0].nodeId).toBe('ctx-3');
      // selection should be cleared
      expect(useContextStore.getState().selectedNodeIds.context).toEqual([]);
    });

    it('should clear flow selection for flow tree', () => {
      useContextStore.setState({
        contextNodes: [
          { nodeId: 'ctx-1', name: 'Ctx1', description: '', type: 'core' as const, isActive: false, status: 'pending' as const, children: [] },
        ],
        selectedNodeIds: { context: ['ctx-1'], flow: ['flow-node-1', 'flow-node-2'] },
      });
      useContextStore.getState().deleteSelectedNodes('flow');
      // flow selection should be cleared, context untouched
      expect(useContextStore.getState().selectedNodeIds.flow).toEqual([]);
      expect(useContextStore.getState().selectedNodeIds.context).toEqual(['ctx-1']);
    });
  });

  // ─── Basic CRUD (existing tests) ────────────────────────────────────────
  describe('basic CRUD', () => {
    it('should add a context node', () => {
      useContextStore.getState().addContextNode({
        name: '测试上下文',
        description: '测试描述',
        type: 'core',
      });
      const nodes = useContextStore.getState().contextNodes;
      expect(nodes.length).toBe(1);
      expect(nodes[0].name).toBe('测试上下文');
      expect(nodes[0].status).toBe('pending');
    });

    it('should edit a context node', () => {
      useContextStore.getState().addContextNode({ name: '原始名称', description: '', type: 'core' });
      const nodeId = useContextStore.getState().contextNodes[0].nodeId;
      useContextStore.getState().editContextNode(nodeId, { name: '新名称' });
      expect(useContextStore.getState().contextNodes[0].name).toBe('新名称');
      expect(useContextStore.getState().contextNodes[0].status).toBe('pending');
    });

    it('should delete a context node', () => {
      useContextStore.getState().addContextNode({ name: '待删除', description: '', type: 'core' });
      const nodeId = useContextStore.getState().contextNodes[0].nodeId;
      useContextStore.getState().deleteContextNode(nodeId);
      expect(useContextStore.getState().contextNodes.length).toBe(0);
    });

    it('should confirm a context node', () => {
      useContextStore.getState().addContextNode({ name: '待确认', description: '', type: 'core' });
      const nodeId = useContextStore.getState().contextNodes[0].nodeId;
      useContextStore.getState().confirmContextNode(nodeId);
      const node = useContextStore.getState().contextNodes[0];
      expect(node.status).toBe('confirmed');
      expect(node.isActive).toBe(true);
    });
  });
});

// ============================================================================
// Additional branch coverage tests (E4)
// ============================================================================

describe('useContextStore — advancePhase branches (L61-75)', () => {
  beforeEach(() => {
    useContextStore.setState({ phase: 'input', activeTree: null });
  });

  it('advances phase from input to context', () => {
    useContextStore.getState().advancePhase();
    expect(useContextStore.getState().phase).toBe('context');
  });

  it('advances phase to flow and syncs activeTree', () => {
    useContextStore.setState({ phase: 'context' });
    useContextStore.getState().advancePhase();
    expect(useContextStore.getState().phase).toBe('flow');
    expect(useContextStore.getState().activeTree).toBe('flow');
  });

  it('advances phase to component and syncs activeTree', () => {
    useContextStore.setState({ phase: 'flow' });
    useContextStore.getState().advancePhase();
    expect(useContextStore.getState().phase).toBe('component');
    expect(useContextStore.getState().activeTree).toBe('component');
  });

  it('advances phase from prototype (last phase) stays at prototype', () => {
    useContextStore.setState({ phase: 'prototype' });
    useContextStore.getState().advancePhase();
    expect(useContextStore.getState().phase).toBe('prototype');
  });
});

describe('useContextStore — selectAllNodes/clearNodeSelection branches (L111-122)', () => {
  beforeEach(() => {
    useContextStore.setState({
      contextNodes: [
        { nodeId: 'n1', name: 'Node 1', type: 'core' as const, status: 'pending' as const, isActive: false, children: [] },
        { nodeId: 'n2', name: 'Node 2', type: 'core' as const, status: 'pending' as const, isActive: false, children: [] },
      ],
      selectedNodeIds: { context: [], flow: [] },
    });
  });

  it('selectAllNodes selects all context nodes', () => {
    useContextStore.getState().selectAllNodes('context');
    expect(useContextStore.getState().selectedNodeIds.context).toContain('n1');
    expect(useContextStore.getState().selectedNodeIds.context).toContain('n2');
  });

  it('selectAllNodes returns s for non-context tree (flow)', () => {
    useContextStore.getState().selectAllNodes('flow');
    expect(useContextStore.getState().selectedNodeIds.context).toHaveLength(0);
  });

  it('selectAllNodes returns s for component tree', () => {
    useContextStore.getState().selectAllNodes('component');
    expect(useContextStore.getState().selectedNodeIds.context).toHaveLength(0);
  });

  it('clearNodeSelection clears context selection', () => {
    useContextStore.setState({ selectedNodeIds: { context: ['n1', 'n2'], flow: [] } });
    useContextStore.getState().clearNodeSelection('context');
    expect(useContextStore.getState().selectedNodeIds.context).toHaveLength(0);
  });

  it('clearNodeSelection clears flow selection', () => {
    useContextStore.setState({ selectedNodeIds: { context: ['n1'], flow: ['f1', 'f2'] } });
    useContextStore.getState().clearNodeSelection('flow');
    expect(useContextStore.getState().selectedNodeIds.flow).toHaveLength(0);
    expect(useContextStore.getState().selectedNodeIds.context).toEqual(['n1']);
  });
});

describe('useContextStore — toggleContextNode branches (L197-228)', () => {
  beforeEach(() => {
    useContextStore.setState({
      contextNodes: [
        { nodeId: 'n-confirmed', name: 'Confirmed', type: 'core' as const, status: 'confirmed' as const, isActive: true, children: [] },
        { nodeId: 'n-pending', name: 'Pending', type: 'core' as const, status: 'pending' as const, isActive: false, children: [] },
      ],
    });
  });

  it('unconfirms a confirmed node (confirmed branch)', () => {
    useContextStore.getState().toggleContextNode('n-confirmed');
    const node = useContextStore.getState().contextNodes.find((n) => n.nodeId === 'n-confirmed');
    expect(node?.status).toBe('pending');
    expect(node?.isActive).toBe(false);
  });

  it('confirms a pending node (pending branch)', () => {
    useContextStore.getState().toggleContextNode('n-pending');
    const node = useContextStore.getState().contextNodes.find((n) => n.nodeId === 'n-pending');
    expect(node?.status).toBe('confirmed');
    expect(node?.isActive).toBe(true);
  });

  it('does nothing for non-existent nodeId', () => {
    expect(() => useContextStore.getState().toggleContextNode('non-existent')).not.toThrow();
  });
});

describe('useContextStore — toggleContextSelection branches', () => {
  beforeEach(() => {
    useContextStore.setState({
      contextNodes: [
        { nodeId: 'n1', name: 'Node 1', type: 'core' as const, status: 'pending' as const, isActive: false, selected: false, children: [] },
      ],
    });
  });

  it('toggles selected to true', () => {
    useContextStore.getState().toggleContextSelection('n1');
    expect(useContextStore.getState().contextNodes[0].selected).toBe(true);
  });

  it('toggles selected back to false', () => {
    useContextStore.getState().toggleContextSelection('n1');
    useContextStore.getState().toggleContextSelection('n1');
    expect(useContextStore.getState().contextNodes[0].selected).toBe(false);
  });
});

describe('useContextStore — setContextNodes', () => {
  beforeEach(() => {
    useContextStore.setState({ contextNodes: [] });
  });

  it('setContextNodes replaces all context nodes', () => {
    const nodes = [
      { nodeId: 'c1', name: 'Context 1', type: 'core' as const, status: 'confirmed' as const, isActive: true, children: [] },
      { nodeId: 'c2', name: 'Context 2', type: 'core' as const, status: 'pending' as const, isActive: false, children: [] },
    ];
    useContextStore.getState().setContextNodes(nodes);
    expect(useContextStore.getState().contextNodes).toEqual(nodes);
  });
});

describe('useContextStore — setContextDraft/setPhase/setBoundedGroups', () => {
  it('setActiveTree updates activeTree', () => {
    useContextStore.getState().setActiveTree('flow');
    expect(useContextStore.getState().activeTree).toBe('flow');
  });

  it('setPhase updates phase', () => {
    useContextStore.getState().setPhase('flow');
    expect(useContextStore.getState().phase).toBe('flow');
  });

  it('setContextDraft sets draft', () => {
    useContextStore.getState().setContextDraft({ name: 'Draft' });
    expect(useContextStore.getState().contextDraft).toEqual({ name: 'Draft' });
  });

  it('setContextDraft clears draft with null', () => {
    useContextStore.getState().setContextDraft({ name: 'Draft' });
    useContextStore.getState().setContextDraft(null);
    expect(useContextStore.getState().contextDraft).toBeNull();
  });

  it('setBoundedGroups sets groups', () => {
    const groups = [{ groupId: 'g1', name: 'Group 1', contextIds: ['c1'] }];
    useContextStore.getState().setBoundedGroups(groups);
    expect(useContextStore.getState().boundedGroups).toEqual(groups);
  });
});

