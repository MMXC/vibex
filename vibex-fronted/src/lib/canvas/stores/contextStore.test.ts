/**
 * VibeX contextStore — Standalone Zustand Store Tests
 * Epic 3: covers recomputeActiveTree, toggleNodeSelect, deleteSelectedNodes
 */
import { useContextStore } from './contextStore';

jest.mock('./messageBridge', () => ({
  postContextActionMessage: jest.fn(),
}));

jest.mock('../id', () => ({ generateId: () => 'mock-id' }));

jest.mock('../historySlice', () => ({
  getHistoryStore: () => ({
    recordSnapshot: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
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

    it('should do nothing for flow tree (not implemented)', () => {
      useContextStore.setState({
        contextNodes: [
          { nodeId: 'ctx-1', name: 'Ctx1', description: '', type: 'core' as const, isActive: false, status: 'pending' as const, children: [] },
        ],
        selectedNodeIds: { context: [], flow: ['flow-node-1'] },
      });
      useContextStore.getState().deleteSelectedNodes('flow');
      // context node should remain untouched
      expect(useContextStore.getState().contextNodes.length).toBe(1);
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
