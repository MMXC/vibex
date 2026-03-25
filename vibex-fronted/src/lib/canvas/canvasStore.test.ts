/**
 * Canvas Store — Unit Tests
 *
 * 覆盖 canvasStore 核心逻辑：
 * - Phase slice 状态切换
 * - Panel collapse toggle
 * - Context slice CRUD
 * - Flow slice CRUD
 * - Cascade context → flow+component pending
 * - Cascade flow → component pending
 * - Tree activation recompute
 */
import { useCanvasStore, markAllPending } from './canvasStore';
import type {
  BusinessFlowNode,
  ComponentNode,
} from '../types';

describe('canvasStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCanvasStore.setState({
      phase: 'input',
      activeTree: null,
      contextPanelCollapsed: false,
      flowPanelCollapsed: false,
      componentPanelCollapsed: false,
      contextNodes: [],
      contextDraft: null,
      flowNodes: [],
      flowDraft: null,
      componentNodes: [],
      componentDraft: null,
      projectId: null,
      prototypeQueue: [],
      isPolling: false,
    });
  });

  describe('Phase Slice', () => {
    it('should start at input phase', () => {
      const { phase, activeTree } = useCanvasStore.getState();
      expect(phase).toBe('input');
      expect(activeTree).toBeNull();
    });

    it('should set phase', () => {
      const { setPhase } = useCanvasStore.getState();
      setPhase('context');
      expect(useCanvasStore.getState().phase).toBe('context');
    });

    it('should advance phase from input to context', () => {
      const { advancePhase } = useCanvasStore.getState();
      advancePhase();
      expect(useCanvasStore.getState().phase).toBe('context');
    });

    it('should advance phase through all phases', () => {
      const { advancePhase } = useCanvasStore.getState();
      advancePhase(); // input → context
      advancePhase(); // context → flow
      advancePhase(); // flow → component
      advancePhase(); // component → prototype
      expect(useCanvasStore.getState().phase).toBe('prototype');
      // Can't advance beyond prototype
      advancePhase();
      expect(useCanvasStore.getState().phase).toBe('prototype');
    });

    it('should set active tree', () => {
      const { setActiveTree } = useCanvasStore.getState();
      setActiveTree('context');
      expect(useCanvasStore.getState().activeTree).toBe('context');
    });
  });

  describe('Panel Collapse Slice', () => {
    it('should toggle context panel', () => {
      const { toggleContextPanel } = useCanvasStore.getState();
      expect(useCanvasStore.getState().contextPanelCollapsed).toBe(false);
      toggleContextPanel();
      expect(useCanvasStore.getState().contextPanelCollapsed).toBe(true);
      toggleContextPanel();
      expect(useCanvasStore.getState().contextPanelCollapsed).toBe(false);
    });

    it('should toggle flow panel', () => {
      const { toggleFlowPanel } = useCanvasStore.getState();
      toggleFlowPanel();
      expect(useCanvasStore.getState().flowPanelCollapsed).toBe(true);
    });

    it('should toggle component panel', () => {
      const { toggleComponentPanel } = useCanvasStore.getState();
      toggleComponentPanel();
      expect(useCanvasStore.getState().componentPanelCollapsed).toBe(true);
    });
  });

  describe('Context Slice', () => {
    it('should add a context node', () => {
      const { addContextNode } = useCanvasStore.getState();
      addContextNode({
        name: 'Order Context',
        description: 'Manages orders',
        type: 'core',
      });

      const nodes = useCanvasStore.getState().contextNodes;
      expect(nodes.length).toBe(1);
      expect(nodes[0].name).toBe('Order Context');
      expect(nodes[0].type).toBe('core');
      expect(nodes[0].confirmed).toBe(false);
      expect(nodes[0].status).toBe('pending');
    });

    it('should confirm a context node', () => {
      const { addContextNode, confirmContextNode } = useCanvasStore.getState();
      addContextNode({ name: 'Test', description: '', type: 'core' });
      const nodeId = useCanvasStore.getState().contextNodes[0].nodeId;

      confirmContextNode(nodeId);
      const node = useCanvasStore.getState().contextNodes[0];
      expect(node.confirmed).toBe(true);
      expect(node.status).toBe('confirmed');
    });

    it('should edit a context node and cascade to flow+component', () => {
      const {
        addContextNode,
        editContextNode,
      } = useCanvasStore.getState();

      // Setup flow and component nodes
      const flowNode: BusinessFlowNode = {
        nodeId: 'flow-1',
        contextId: 'ctx-1',
        name: 'Order Flow',
        steps: [],
        confirmed: true,
        status: 'confirmed',
      };
      const componentNode: ComponentNode = {
        nodeId: 'comp-1',
        flowId: 'flow-1',
        name: 'Order Page',
        type: 'page',
        props: {},
        api: { method: 'GET', path: '/api/orders', params: [] },
        children: [],
        confirmed: true,
        status: 'confirmed',
      };

      useCanvasStore.setState({
        flowNodes: [flowNode],
        componentNodes: [componentNode],
      });

      // Add context node and edit it
      addContextNode({ name: 'Test', description: '', type: 'core' });
      const nodeId = useCanvasStore.getState().contextNodes[0].nodeId;
      editContextNode(nodeId, { name: 'Updated Context' });

      // Flow should be marked pending
      const updatedFlow = useCanvasStore.getState().flowNodes[0];
      expect(updatedFlow.status).toBe('pending');
      expect(updatedFlow.confirmed).toBe(false);

      // Component should be marked pending
      const updatedComp = useCanvasStore.getState().componentNodes[0];
      expect(updatedComp.status).toBe('pending');
      expect(updatedComp.confirmed).toBe(false);
    });

    it('should delete a context node', () => {
      const { addContextNode, deleteContextNode } = useCanvasStore.getState();
      addContextNode({ name: 'Test', description: '', type: 'core' });
      const nodeId = useCanvasStore.getState().contextNodes[0].nodeId;

      deleteContextNode(nodeId);
      expect(useCanvasStore.getState().contextNodes.length).toBe(0);
    });

    it('should set context draft', () => {
      const { setContextDraft } = useCanvasStore.getState();
      setContextDraft({ name: 'Draft', description: 'draft desc' });
      expect(useCanvasStore.getState().contextDraft?.name).toBe('Draft');
      setContextDraft(null);
      expect(useCanvasStore.getState().contextDraft).toBeNull();
    });
  });

  describe('Flow Slice', () => {
    it('should add a flow node', () => {
      const { addFlowNode } = useCanvasStore.getState();
      addFlowNode({
        name: 'Checkout Flow',
        contextId: 'ctx-1',
        steps: [
          { name: 'Add to cart', actor: 'User', order: 0 },
          { name: 'Pay', actor: 'User', order: 1 },
        ],
      });

      const nodes = useCanvasStore.getState().flowNodes;
      expect(nodes.length).toBe(1);
      expect(nodes[0].name).toBe('Checkout Flow');
      expect(nodes[0].steps.length).toBe(2);
      expect(nodes[0].steps[0].confirmed).toBe(false);
    });

    it('should confirm a flow node', () => {
      const { addFlowNode, confirmFlowNode } = useCanvasStore.getState();
      addFlowNode({ name: 'Test', contextId: 'c1', steps: [] });
      const nodeId = useCanvasStore.getState().flowNodes[0].nodeId;

      confirmFlowNode(nodeId);
      const node = useCanvasStore.getState().flowNodes[0];
      expect(node.confirmed).toBe(true);
    });

    it('should cascade flow edit to component pending', () => {
      const { editFlowNode } = useCanvasStore.getState();

      const comp: ComponentNode = {
        nodeId: 'comp-1',
        flowId: 'flow-1',
        name: 'Page',
        type: 'page',
        props: {},
        api: { method: 'GET', path: '/api', params: [] },
        children: [],
        confirmed: true,
        status: 'confirmed',
      };
      useCanvasStore.setState({ componentNodes: [comp] });

      editFlowNode('flow-1', { name: 'Updated Flow' });
      expect(useCanvasStore.getState().componentNodes[0].status).toBe('pending');
      expect(useCanvasStore.getState().componentNodes[0].confirmed).toBe(false);
    });
  });

  describe('Component Slice', () => {
    it('should add a component node', () => {
      const { addComponentNode } = useCanvasStore.getState();
      addComponentNode({
        flowId: 'flow-1',
        name: 'Order Form',
        type: 'form',
        props: {},
        api: { method: 'POST', path: '/api/orders', params: [] },
        children: [],
        confirmed: false,
      });

      const nodes = useCanvasStore.getState().componentNodes;
      expect(nodes.length).toBe(1);
      expect(nodes[0].name).toBe('Order Form');
      expect(nodes[0].type).toBe('form');
      expect(nodes[0].status).toBe('pending');
    });

    it('should confirm a component node', () => {
      const { addComponentNode, confirmComponentNode } = useCanvasStore.getState();
      addComponentNode({
        flowId: 'f1',
        name: 'Test',
        type: 'page',
        props: {},
        api: { method: 'GET', path: '/api', params: [] },
        children: [],
        confirmed: false,
      });
      const nodeId = useCanvasStore.getState().componentNodes[0].nodeId;
      confirmComponentNode(nodeId);
      expect(useCanvasStore.getState().componentNodes[0].confirmed).toBe(true);
    });
  });

  describe('Queue Slice', () => {
    it('should add pages to queue', () => {
      const { addToQueue } = useCanvasStore.getState();
      addToQueue([
        { pageId: 'p1', componentId: 'c1', name: 'Home', status: 'queued', progress: 0, retryCount: 0 },
        { pageId: 'p2', componentId: 'c2', name: 'Detail', status: 'queued', progress: 0, retryCount: 0 },
      ]);

      expect(useCanvasStore.getState().prototypeQueue.length).toBe(2);
    });

    it('should update queue item', () => {
      const { addToQueue, updateQueueItem } = useCanvasStore.getState();
      addToQueue([
        { pageId: 'p1', componentId: 'c1', name: 'Home', status: 'queued', progress: 0, retryCount: 0 },
      ]);

      updateQueueItem('p1', { status: 'generating', progress: 50 });
      expect(useCanvasStore.getState().prototypeQueue[0].status).toBe('generating');
      expect(useCanvasStore.getState().prototypeQueue[0].progress).toBe(50);
    });

    it('should remove from queue', () => {
      const { addToQueue, removeFromQueue } = useCanvasStore.getState();
      addToQueue([
        { pageId: 'p1', componentId: 'c1', name: 'Home', status: 'queued', progress: 0, retryCount: 0 },
      ]);
      removeFromQueue('p1');
      expect(useCanvasStore.getState().prototypeQueue.length).toBe(0);
    });

    it('should clear queue', () => {
      const { addToQueue, clearQueue, setProjectId } = useCanvasStore.getState();
      setProjectId('proj-1');
      addToQueue([
        { pageId: 'p1', componentId: 'c1', name: 'Home', status: 'queued', progress: 0, retryCount: 0 },
      ]);
      clearQueue();
      expect(useCanvasStore.getState().prototypeQueue.length).toBe(0);
      expect(useCanvasStore.getState().projectId).toBeNull();
    });
  });

  describe('Tree Activation', () => {
    it('should activate flow tree when all context nodes confirmed', () => {
      const { addContextNode, confirmContextNode, setPhase } = useCanvasStore.getState();
      setPhase('context');

      addContextNode({ name: 'C1', description: '', type: 'core' });
      addContextNode({ name: 'C2', description: '', type: 'core' });

      const nodes = useCanvasStore.getState().contextNodes;
      confirmContextNode(nodes[0].nodeId);
      expect(useCanvasStore.getState().activeTree).toBe('context'); // Not all confirmed yet

      confirmContextNode(nodes[1].nodeId);
      expect(useCanvasStore.getState().activeTree).toBe('flow');
    });

    it('should not activate flow when no context nodes', () => {
      const { setPhase } = useCanvasStore.getState();
      setPhase('context');
      expect(useCanvasStore.getState().activeTree).toBe('context');
    });
  });
});

describe('markAllPending', () => {
  it('should mark all nodes pending and unconfirm', () => {
    const nodes = [
      { status: 'confirmed' as const, confirmed: true, name: 'A' },
      { status: 'confirmed' as const, confirmed: true, name: 'B' },
    ];
    const result = markAllPending(nodes);
    expect(result[0].status).toBe('pending');
    expect(result[0].confirmed).toBe(false);
    expect(result[1].status).toBe('pending');
    expect(result[1].confirmed).toBe(false);
  });
});
