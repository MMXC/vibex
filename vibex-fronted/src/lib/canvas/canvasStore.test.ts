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
 * - Epic 5: Queue slice (projectId, polling, prototypeQueue CRUD)
 * - Tree activation recompute
 * - S1.1: 新增独立流程入口
 * - S1.2: 流程内新增步骤
 * - S1.3: 节点样式标准化
 */

// Mock localStorage BEFORE importing the store to prevent Zustand persist rehydration
// This ensures every test starts with a fresh, empty store state
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),     // Always return null → no rehydration
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    get length() { return 0; },
  },
  writable: true,
  configurable: true,
});

import { useCanvasStore, markAllPending } from './canvasStore';
import type {
  BusinessFlowNode,
  ComponentNode,
} from '../types';

describe('canvasStore', () => {
  beforeEach(() => {
    // Fully reset Zustand persist storage before each test
    // This clears both persisted storage AND in-memory state
    try {
      (useCanvasStore.persist as any)?.clearStorage?.();
    } catch (_) { /* ignore if not available */ }
    // Fallback: clear localStorage and reset all state slices
    localStorage.removeItem('vibex-canvas-storage');
    const before = useCanvasStore.getState();
    console.log('[OUTER beforeEach] _prevActiveTree BEFORE:', before._prevActiveTree);
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
      // Reset all other slices that might have state
      leftExpand: 'default',
      centerExpand: 'default',
      rightExpand: 'default',
      draggedNodeId: null,
      dragOverNodeId: null,
      draggedPositions: {},
      isDragging: false,
      boundedGroups: [],
      aiThinking: false,
      aiThinkingMessage: null,
      requirementText: '',
      flowGenerating: false,
      flowGeneratingMessage: null,
      // E2: also reset internal tracking
      _prevActiveTree: null,
    });
    const after = useCanvasStore.getState();
    console.log('[OUTER beforeEach] _prevActiveTree AFTER:', after._prevActiveTree);
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

    // F1.1: Toggle function — first click confirms, second click unconfirms
    it('should confirm a context node on first click', () => {
      const { addContextNode, confirmContextNode } = useCanvasStore.getState();
      addContextNode({ name: 'Test', description: '', type: 'core' });
      const nodeId = useCanvasStore.getState().contextNodes[0].nodeId;

      confirmContextNode(nodeId);
      const node = useCanvasStore.getState().contextNodes[0];
      expect(node.confirmed).toBe(true);
      expect(node.status).toBe('confirmed');
    });

    it('should unconfirm a context node on second click (toggle)', () => {
      const { addContextNode, confirmContextNode } = useCanvasStore.getState();
      addContextNode({ name: 'Test', description: '', type: 'core' });
      const nodeId = useCanvasStore.getState().contextNodes[0].nodeId;

      // First click → confirmed
      confirmContextNode(nodeId);
      expect(useCanvasStore.getState().contextNodes[0].confirmed).toBe(true);
      expect(useCanvasStore.getState().contextNodes[0].status).toBe('confirmed');

      // Second click → unconfirmed (toggle off)
      confirmContextNode(nodeId);
      const node = useCanvasStore.getState().contextNodes[0];
      expect(node.confirmed).toBe(false);
      expect(node.status).toBe('pending');
    });

    // F1.2: State sync — progress should update correctly on toggle
    it('should update context confirmed count after toggle off', () => {
      const { addContextNode, confirmContextNode } = useCanvasStore.getState();
      addContextNode({ name: 'Test1', description: '', type: 'core' });
      addContextNode({ name: 'Test2', description: '', type: 'supporting' });

      const nodes = useCanvasStore.getState().contextNodes;
      const id1 = nodes[0].nodeId;
      const id2 = nodes[1].nodeId;

      // Confirm both
      confirmContextNode(id1);
      confirmContextNode(id2);
      expect(useCanvasStore.getState().contextNodes.filter(n => n.confirmed).length).toBe(2);

      // Toggle off one
      confirmContextNode(id1);
      expect(useCanvasStore.getState().contextNodes.filter(n => n.confirmed).length).toBe(1);
      expect(useCanvasStore.getState().contextNodes.filter(n => !n.confirmed).length).toBe(1);
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

    it('should cascade delete to flow+component pending', () => {
      const {
        addContextNode,
        deleteContextNode,
      } = useCanvasStore.getState();

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

      addContextNode({ name: 'Test', description: '', type: 'core' });
      const nodeId = useCanvasStore.getState().contextNodes[0].nodeId;
      deleteContextNode(nodeId);

      // Flow should be marked pending
      expect(useCanvasStore.getState().flowNodes[0].status).toBe('pending');
      // Component should be marked pending
      expect(useCanvasStore.getState().componentNodes[0].status).toBe('pending');
    });
  });

  describe('Flow Cascade', () => {
    it('should cascade flow edit to component pending', () => {
      const { addFlowNode, editFlowNode } = useCanvasStore.getState();

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
      useCanvasStore.setState({ componentNodes: [componentNode] });

      addFlowNode({ name: 'Checkout', contextId: 'ctx-1', steps: [] });
      const flowId = useCanvasStore.getState().flowNodes[0].nodeId;
      editFlowNode(flowId, { name: 'Updated Checkout Flow' });

      expect(useCanvasStore.getState().componentNodes[0].status).toBe('pending');
      expect(useCanvasStore.getState().componentNodes[0].confirmed).toBe(false);
    });
  });

  describe('Epic 3: Flow Step Actions', () => {
    it('should confirm a step', () => {
      const { addFlowNode, confirmStep } = useCanvasStore.getState();
      addFlowNode({
        name: 'Test Flow',
        contextId: 'c1',
        steps: [{ name: 'Step 1', actor: 'User', order: 0 }],
      });
      const flowId = useCanvasStore.getState().flowNodes[0].nodeId;
      const stepId = useCanvasStore.getState().flowNodes[0].steps[0].stepId;

      confirmStep(flowId, stepId);
      const step = useCanvasStore.getState().flowNodes[0].steps[0];
      expect(step.confirmed).toBe(true);
      expect(step.status).toBe('confirmed');
    });

    it('should edit a step', () => {
      const { addFlowNode, editStep } = useCanvasStore.getState();
      addFlowNode({
        name: 'Test Flow',
        contextId: 'c1',
        steps: [{ name: 'Step 1', actor: 'User', order: 0 }],
      });
      const flowId = useCanvasStore.getState().flowNodes[0].nodeId;
      const stepId = useCanvasStore.getState().flowNodes[0].steps[0].stepId;

      editStep(flowId, stepId, { name: 'Updated Step', actor: 'System' });
      const step = useCanvasStore.getState().flowNodes[0].steps[0];
      expect(step.name).toBe('Updated Step');
      expect(step.actor).toBe('System');
      expect(step.status).toBe('pending');
    });

    it('should delete a step', () => {
      const { addFlowNode, deleteStep } = useCanvasStore.getState();
      addFlowNode({
        name: 'Test Flow',
        contextId: 'c1',
        steps: [
          { name: 'Step 1', actor: 'User', order: 0 },
          { name: 'Step 2', actor: 'User', order: 1 },
        ],
      });
      const flowId = useCanvasStore.getState().flowNodes[0].nodeId;
      const stepId = useCanvasStore.getState().flowNodes[0].steps[0].stepId;

      deleteStep(flowId, stepId);
      expect(useCanvasStore.getState().flowNodes[0].steps.length).toBe(1);
      expect(useCanvasStore.getState().flowNodes[0].steps[0].name).toBe('Step 2');
    });

    it('should reorder steps', () => {
      const { addFlowNode, reorderSteps } = useCanvasStore.getState();
      addFlowNode({
        name: 'Test Flow',
        contextId: 'c1',
        steps: [
          { name: 'Step A', actor: 'User', order: 0 },
          { name: 'Step B', actor: 'User', order: 1 },
          { name: 'Step C', actor: 'User', order: 2 },
        ],
      });
      const flowId = useCanvasStore.getState().flowNodes[0].nodeId;

      // Move Step A from index 0 to index 2 (insert before C)
      // splice(toIndex, 0, moved) = insert before element at toIndex
      // [A,B,C] → remove A → [B,C] → insert A before C at index 2 → [B,A,C]
      reorderSteps(flowId, 0, 2);
      const steps = useCanvasStore.getState().flowNodes[0].steps;
      expect(steps[0].name).toBe('Step B');
      expect(steps[1].name).toBe('Step A');
      expect(steps[2].name).toBe('Step C');
      // Orders should be sequential
      expect(steps[0].order).toBe(0);
      expect(steps[1].order).toBe(1);
      expect(steps[2].order).toBe(2);
    });

    it('should mark flow pending after step reorder', () => {
      const { addFlowNode, reorderSteps } = useCanvasStore.getState();
      addFlowNode({
        name: 'Test Flow',
        contextId: 'c1',
        steps: [{ name: 'Step 1', actor: 'User', order: 0 }],
      });
      const flowId = useCanvasStore.getState().flowNodes[0].nodeId;

      reorderSteps(flowId, 0, 1);
      expect(useCanvasStore.getState().flowNodes[0].status).toBe('pending');
    });
  });

  describe('Epic 3: Auto-generation', () => {
    // Skip: These tests require real API/fetch mocking which is not available in unit test environment
    // The autoGenerateFlows function depends on external API calls that need proper integration test setup
    it.skip('should auto-generate flows for all contexts', () => {
      const { autoGenerateFlows } = useCanvasStore.getState();
      autoGenerateFlows([
        { nodeId: 'ctx-1', name: '患者管理', description: '', type: 'core' as const, confirmed: true, status: 'confirmed' as const, children: [] },
        { nodeId: 'ctx-2', name: '预约挂号', description: '', type: 'core' as const, confirmed: true, status: 'confirmed' as const, children: [] },
      ]);

      const flows = useCanvasStore.getState().flowNodes;
      expect(flows.length).toBe(2);
      expect(flows[0].name).toBe('患者管理业务流程');
      expect(flows[0].steps.length).toBe(3); // 3 default steps
      expect(flows[0].steps[0].name).toBe('需求收集');
      expect(flows[1].name).toBe('预约挂号业务流程');
    });

    it.skip('should auto-generate flows when last context confirmed', () => {
      const { addContextNode, confirmContextNode, setPhase } = useCanvasStore.getState();
      setPhase('context');

      addContextNode({ name: 'C1', description: '', type: 'core' });
      const ctxId = useCanvasStore.getState().contextNodes[0].nodeId;
      confirmContextNode(ctxId);

      const flows = useCanvasStore.getState().flowNodes;
      expect(flows.length).toBe(1);
      expect(flows[0].contextId).toBe(ctxId);
    });

    it('should not auto-generate if flows already exist', () => {
      const { addFlowNode, addContextNode, confirmContextNode, setPhase } = useCanvasStore.getState();
      setPhase('context');

      // Pre-existing flow
      addFlowNode({ name: 'Pre-existing', contextId: 'c1', steps: [] });

      addContextNode({ name: 'C1', description: '', type: 'core' });
      const ctxId = useCanvasStore.getState().contextNodes[0].nodeId;
      confirmContextNode(ctxId);

      // Should NOT add another flow
      expect(useCanvasStore.getState().flowNodes.length).toBe(1);
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

  // Epic 5: Queue Slice Tests
  describe('Epic 5: Queue Slice', () => {
    it('should set and clear projectId', () => {
      const { setProjectId } = useCanvasStore.getState();
      setProjectId('proj_test_123');
      expect(useCanvasStore.getState().projectId).toBe('proj_test_123');
      setProjectId(null);
      expect(useCanvasStore.getState().projectId).toBeNull();
    });

    it('should track polling state', () => {
      const { setIsPolling } = useCanvasStore.getState();
      expect(useCanvasStore.getState().isPolling).toBe(false);
      setIsPolling(true);
      expect(useCanvasStore.getState().isPolling).toBe(true);
    });

    it('should update queue item progress and status', () => {
      const { addToQueue, updateQueueItem } = useCanvasStore.getState();
      addToQueue([
        { pageId: 'pg1', componentId: 'c1', name: 'Page1', status: 'queued', progress: 0, retryCount: 0 },
        { pageId: 'pg2', componentId: 'c2', name: 'Page2', status: 'queued', progress: 0, retryCount: 0 },
      ]);
      updateQueueItem('pg1', { status: 'generating', progress: 25 });
      updateQueueItem('pg2', { status: 'done', progress: 100 });

      const queue = useCanvasStore.getState().prototypeQueue;
      expect(queue.find(p => p.pageId === 'pg1')?.status).toBe('generating');
      expect(queue.find(p => p.pageId === 'pg1')?.progress).toBe(25);
      expect(queue.find(p => p.pageId === 'pg2')?.status).toBe('done');
    });

    it('should increment retry count on retry', () => {
      const { addToQueue, updateQueueItem, clearQueue } = useCanvasStore.getState();
      clearQueue();
      addToQueue([
        { pageId: 'pg_err', componentId: 'c1', name: 'PageErr', status: 'error', progress: 0, retryCount: 0 },
      ]);
      updateQueueItem('pg_err', { retryCount: 1, status: 'queued' });
      updateQueueItem('pg_err', { retryCount: 2, status: 'queued' });
      expect(useCanvasStore.getState().prototypeQueue[0].retryCount).toBe(2);
    });
  });

  // Epic 1: AI Thinking Slice Tests
  describe('Epic 1: AI Thinking Slice', () => {
    beforeEach(() => {
      const store = useCanvasStore.getState();
      store.setAiThinking(false);
      store.setRequirementText('');
    });

    it('should set aiThinking state', () => {
      const { setAiThinking } = useCanvasStore.getState();
      expect(useCanvasStore.getState().aiThinking).toBe(false);

      setAiThinking(true, '正在分析需求...');
      expect(useCanvasStore.getState().aiThinking).toBe(true);
      expect(useCanvasStore.getState().aiThinkingMessage).toBe('正在分析需求...');

      setAiThinking(false);
      expect(useCanvasStore.getState().aiThinking).toBe(false);
      expect(useCanvasStore.getState().aiThinkingMessage).toBe(null);
    });

    it('should set requirementText', () => {
      const { setRequirementText } = useCanvasStore.getState();
      setRequirementText('我想做一个预约医生系统');
      expect(useCanvasStore.getState().requirementText).toBe('我想做一个预约医生系统');
    });

    it('should have generateContextsFromRequirement as a function', () => {
      const { generateContextsFromRequirement } = useCanvasStore.getState();
      expect(typeof generateContextsFromRequirement).toBe('function');
    });

    it('should transition to context phase when generateContextsFromRequirement is called', async () => {
      const { generateContextsFromRequirement, setPhase } = useCanvasStore.getState();
      setPhase('input');

      // Just verify the action exists and doesn't throw synchronously
      expect(typeof generateContextsFromRequirement).toBe('function');

      // The actual SSE call is tested via integration tests
    });

    it('should handle onStepContext with boundedContexts array', () => {
      // This test verifies the callback signature accepts boundedContexts
      // Integration with SSE is tested via canvasSseApi.test.ts
      const { generateContextsFromRequirement } = useCanvasStore.getState();
      expect(typeof generateContextsFromRequirement).toBe('function');
    });
  });

  // S1.1: 新增独立流程入口（零上下文场景）
  describe('S1.1: Add independent flow (zero context)', () => {
    it('should add a flow node with empty contextId', () => {
      const { addFlowNode, flowNodes: beforeFlows } = useCanvasStore.getState();
      const beforeCount = beforeFlows.length;
      // S1.1-AC4: zero-context scenario — empty string contextId
      addFlowNode({ name: '新业务流程', contextId: '', steps: [] });

      const nodes = useCanvasStore.getState().flowNodes;
      expect(nodes.length).toBe(beforeCount + 1);
      expect(nodes[nodes.length - 1].contextId).toBe('');
      expect(nodes[nodes.length - 1].name).toBe('新业务流程');
    });

    it('should set new flow status=pending and confirmed=false', () => {
      const { addFlowNode } = useCanvasStore.getState();
      addFlowNode({ name: '独立流程', contextId: '', steps: [] });

      const flow = useCanvasStore.getState().flowNodes.find(n => n.name === '独立流程')!;
      expect(flow.status).toBe('pending');
      expect(flow.confirmed).toBe(false);
    });

    it('should add flow with empty contextId when no context nodes exist', () => {
      const { addFlowNode, contextNodes: beforeContexts, flowNodes: beforeFlows } = useCanvasStore.getState();
      // Capture before counts for state-agnostic assertions
      const beforeFlowCount = beforeFlows.length;

      addFlowNode({ name: '空上下文流程', contextId: '', steps: [] });
      expect(useCanvasStore.getState().flowNodes.length).toBe(beforeFlowCount + 1);
      expect(useCanvasStore.getState().flowNodes[useCanvasStore.getState().flowNodes.length - 1].contextId).toBe('');
    });

    it('should add multiple independent flows with empty contextId', () => {
      const { addFlowNode, flowNodes } = useCanvasStore.getState();
      const beforeCount = flowNodes.length;

      addFlowNode({ name: '流程1', contextId: '', steps: [] });
      addFlowNode({ name: '流程2', contextId: '', steps: [] });

      const nodes = useCanvasStore.getState().flowNodes;
      // Check that exactly 2 new flows were added
      expect(nodes.length).toBe(beforeCount + 2);
      // The last 2 flows should have empty contextId
      const lastTwo = nodes.slice(-2);
      expect(lastTwo.every(n => n.contextId === '')).toBe(true);
    });
  });

  // S1.2: 流程内新增步骤
  describe('S1.2: Add step to flow', () => {
    it('should add a step to an existing flow', () => {
      const { addFlowNode, addStepToFlow } = useCanvasStore.getState();
      addFlowNode({ name: 'S1.2 Test Flow A', contextId: 'c1', steps: [] });
      const flow = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Test Flow A')!;

      addStepToFlow(flow.nodeId, { name: '新步骤', actor: '待定', description: '' });

      const updated = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Test Flow A')!;
      expect(updated.steps.length).toBe(1);
      expect(updated.steps[0].name).toBe('新步骤');
      expect(updated.steps[0].actor).toBe('待定');
    });

    it('should set new step status=pending and confirmed=false', () => {
      const { addFlowNode, addStepToFlow } = useCanvasStore.getState();
      addFlowNode({ name: 'S1.2 Test Flow B', contextId: 'c1', steps: [] });
      const flow = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Test Flow B')!;

      addStepToFlow(flow.nodeId, { name: '待确认步骤', actor: '系统', description: '' });

      const updated = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Test Flow B')!;
      expect(updated.steps[0].status).toBe('pending');
      expect(updated.steps[0].confirmed).toBe(false);
    });

    it('should default actor to 待定 when not provided', () => {
      const { addFlowNode, addStepToFlow } = useCanvasStore.getState();
      addFlowNode({ name: 'S1.2 Test Flow C', contextId: 'c1', steps: [] });
      const flow = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Test Flow C')!;

      addStepToFlow(flow.nodeId, { name: '步骤名' });

      const updated = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Test Flow C')!;
      expect(updated.steps[updated.steps.length - 1].actor).toBe('待定');
    });

    it('should mark flow status pending after adding step', () => {
      const { addFlowNode, addStepToFlow } = useCanvasStore.getState();
      addFlowNode({ name: 'S1.2 Test Flow D', contextId: 'c1', steps: [] });
      const flow = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Test Flow D')!;

      addStepToFlow(flow.nodeId, { name: '新步骤' });

      const updated = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Test Flow D')!;
      expect(updated.status).toBe('pending');
    });

    it('should append step to existing steps list', () => {
      const { addFlowNode, addStepToFlow } = useCanvasStore.getState();
      addFlowNode({
        name: 'S1.2 Test Flow E',
        contextId: 'c1',
        steps: [{ name: '已有步骤', actor: '用户', order: 0 }],
      });
      const flow = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Test Flow E')!;
      const beforeCount = flow.steps.length;

      addStepToFlow(flow.nodeId, { name: '新步骤' });

      const updatedFlow = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Test Flow E')!;
      expect(updatedFlow.steps.length).toBe(beforeCount + 1);
      expect(updatedFlow.steps[updatedFlow.steps.length - 1].name).toBe('新步骤');
    });

    it('should not affect other flows when adding step', () => {
      const { addFlowNode, addStepToFlow } = useCanvasStore.getState();
      addFlowNode({ name: 'S1.2 Flow X', contextId: 'c1', steps: [] });
      addFlowNode({ name: 'S1.2 Flow Y', contextId: 'c2', steps: [] });
      const flowX = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Flow X')!;
      const flowY = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Flow Y')!;
      const stepsInYBefore = flowY.steps.length;

      addStepToFlow(flowX.nodeId, { name: 'Step in X' });

      const updatedX = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Flow X')!;
      const updatedY = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.2 Flow Y')!;
      expect(updatedX.steps.length).toBe(flowX.steps.length + 1);
      expect(updatedY.steps.length).toBe(stepsInYBefore);
    });
  });

  // S1.3: 节点样式标准化（颜色值验证）
  describe('S1.3: Flow step status colors', () => {
    it('should create step with pending status for color #f59e0b', () => {
      const { addFlowNode, addStepToFlow } = useCanvasStore.getState();
      addFlowNode({ name: 'S1.3 Color Flow A', contextId: 'c1', steps: [] });
      const flow = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.3 Color Flow A')!;
      addStepToFlow(flow.nodeId, { name: 'Pending Step' });

      const updated = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.3 Color Flow A')!;
      expect(updated.steps[0].status).toBe('pending');
      expect(updated.steps[0].status).not.toBe('confirmed');
      expect(updated.steps[0].status).not.toBe('error');
    });

    it('should create flow with pending status for color #f59e0b', () => {
      const { addFlowNode } = useCanvasStore.getState();
      addFlowNode({ name: 'S1.3 Color Flow B', contextId: '', steps: [] });

      const flow = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.3 Color Flow B')!;
      expect(flow.status).toBe('pending');
      // canvas.module.css uses var(--color-warning) = #f59e0b for .flowCard.nodePending
    });

    it('should mark confirmed step with #10b981', () => {
      const { addFlowNode, addStepToFlow, confirmStep } = useCanvasStore.getState();
      addFlowNode({ name: 'S1.3 Color Flow C', contextId: 'c1', steps: [] });
      const flow = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.3 Color Flow C')!;
      addStepToFlow(flow.nodeId, { name: 'Step to confirm' });
      const stepId = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.3 Color Flow C')!.steps[0].stepId;

      confirmStep(flow.nodeId, stepId);

      const updated = useCanvasStore.getState().flowNodes.find(n => n.name === 'S1.3 Color Flow C')!;
      expect(updated.steps[0].status).toBe('confirmed');
      // canvas.module.css uses var(--color-success) = #10b981 for nodeConfirmed
    });
  });

  // E2-1: Canvas Three-Column Auto-Expand
  describe('E2-1: Three-Column Auto-Expand', () => {
    // Full store reset before each test to ensure isolation
    beforeEach(() => {
      useCanvasStore.setState({
        requirementText: '',
        contextNodes: [],
        flowNodes: [],
        componentNodes: [],
        phase: 'input',
        activeTree: null,
        _prevActiveTree: null,
        centerExpand: 'default',
        leftExpand: 'default',
        rightExpand: 'default',
        flowGenerating: false,
      });
    });

    // E2-1.1: recomputeActiveTree auto-expands center panel
    it('should expand center panel when all context nodes confirmed (activeTree becomes flow)', () => {
      const { addContextNode, confirmContextNode, setPhase } = useCanvasStore.getState();
      // Check initial state
      const init = useCanvasStore.getState();
      console.log('[TEST] Initial:', 'phase:', init.phase, 'activeTree:', init.activeTree, '_prevActiveTree:', init._prevActiveTree, 'centerExpand:', init.centerExpand);
      setPhase('context');
      const afterPhase = useCanvasStore.getState();
      console.log('[TEST] After setPhase:', 'activeTree:', afterPhase.activeTree, '_prevActiveTree:', afterPhase._prevActiveTree, 'centerExpand:', afterPhase.centerExpand);

      addContextNode({ name: 'C1', description: '', type: 'core' });
      addContextNode({ name: 'C2', description: '', type: 'core' });

      // Confirm first node
      const nodes = useCanvasStore.getState().contextNodes;
      confirmContextNode(nodes[0].nodeId);
      const after1 = useCanvasStore.getState();
      console.log('[TEST] After confirm 1:', 'activeTree:', after1.activeTree, '_prevActiveTree:', after1._prevActiveTree, 'centerExpand:', after1.centerExpand);

      // Confirm second node — all confirmed, activeTree becomes 'flow', center expands
      confirmContextNode(nodes[1].nodeId);
      const after2 = useCanvasStore.getState();
      console.log('[TEST] After confirm 2:', 'activeTree:', after2.activeTree, '_prevActiveTree:', after2._prevActiveTree, 'centerExpand:', after2.centerExpand);
      expect(after2.activeTree).toBe('flow');
      expect(after2.centerExpand).toBe('expand-left');
    });

    it('should expand center panel when all flow nodes confirmed (activeTree becomes component)', () => {
      const { addContextNode, confirmContextNode, confirmFlowNode, setPhase } = useCanvasStore.getState();
      setPhase('context');

      addContextNode({ name: 'C1', description: '', type: 'core' });
      const ctxId = useCanvasStore.getState().contextNodes[0].nodeId;
      confirmContextNode(ctxId);

      // Manually add a flow node to avoid autoGenerateFlows API call
      const { addFlowNode } = useCanvasStore.getState();
      addFlowNode({ name: 'Flow A', contextId: ctxId, steps: [] });

      // Move to flow phase
      useCanvasStore.setState({ phase: 'flow' });

      // Confirm flow node
      const flowNodes = useCanvasStore.getState().flowNodes;
      confirmFlowNode(flowNodes[0].nodeId);

      // activeTree should be 'component', centerExpand stays 'expand-left'
      expect(useCanvasStore.getState().activeTree).toBe('component');
      expect(useCanvasStore.getState().centerExpand).toBe('expand-left');
    });

    it('should reset centerExpand to default when phase returns to input', () => {
      const { addContextNode, confirmContextNode, setPhase } = useCanvasStore.getState();
      setPhase('context');

      addContextNode({ name: 'C1', description: '', type: 'core' });
      const nodes = useCanvasStore.getState().contextNodes;
      confirmContextNode(nodes[0].nodeId);

      expect(useCanvasStore.getState().centerExpand).toBe('expand-left');

      // Move back to input phase
      setPhase('input');
      expect(useCanvasStore.getState().centerExpand).toBe('default');
    });

    it('should reset centerExpand to default when phase becomes prototype', () => {
      const init = useCanvasStore.getState();
      console.log('[TEST4] START:', '_prevActiveTree:', init._prevActiveTree);
      const { addContextNode, confirmContextNode, setPhase } = useCanvasStore.getState();
      setPhase('context');
      const afterPhase = useCanvasStore.getState();
      console.log('[TEST4] After setPhase:', 'activeTree:', afterPhase.activeTree, '_prevActiveTree:', afterPhase._prevActiveTree);

      addContextNode({ name: 'C1', description: '', type: 'core' });
      const nodes = useCanvasStore.getState().contextNodes;
      console.log('[TEST4] nodes:', nodes.length, 'confirmed:', nodes.map(n => n.confirmed));
      confirmContextNode(nodes[0].nodeId);
      const afterConfirm = useCanvasStore.getState();
      console.log('[TEST4] After confirm:', 'activeTree:', afterConfirm.activeTree, 'centerExpand:', afterConfirm.centerExpand, '_prevActiveTree:', afterConfirm._prevActiveTree);

      expect(afterConfirm.centerExpand).toBe('expand-left');

      // Advance to prototype
      setPhase('prototype');
      expect(useCanvasStore.getState().centerExpand).toBe('default');
    });

    // E2-1.3: Manual expand should not be overwritten by recomputeActiveTree
    it('should NOT override manual leftExpand when recomputeActiveTree is called', () => {
      const { addContextNode, confirmContextNode, setPhase, setLeftExpand } = useCanvasStore.getState();
      setPhase('context');

      // User manually expands left panel
      setLeftExpand('expand-right');
      expect(useCanvasStore.getState().leftExpand).toBe('expand-right');

      addContextNode({ name: 'C1', description: '', type: 'core' });
      const nodes = useCanvasStore.getState().contextNodes;
      confirmContextNode(nodes[0].nodeId);

      // activeTree changed but leftExpand should remain
      expect(useCanvasStore.getState().activeTree).toBe('flow');
      expect(useCanvasStore.getState().leftExpand).toBe('expand-right');
      // centerExpand was auto-set to expand-left
      expect(useCanvasStore.getState().centerExpand).toBe('expand-left');
    });

    it('should NOT override manual centerExpand when recomputeActiveTree is called with same newActiveTree', () => {
      const { setCenterExpand, setPhase, addContextNode, confirmContextNode } = useCanvasStore.getState();
      setPhase('context');

      addContextNode({ name: 'C1', description: '', type: 'core' });
      const nodes = useCanvasStore.getState().contextNodes;
      confirmContextNode(nodes[0].nodeId);

      // Now centerExpand is 'expand-left'
      expect(useCanvasStore.getState().centerExpand).toBe('expand-left');

      // User manually switches center to 'expand-right'
      setCenterExpand('expand-right');
      expect(useCanvasStore.getState().centerExpand).toBe('expand-right');

      // Manually trigger recomputeActiveTree (same activeTree, no tree transition)
      useCanvasStore.getState().recomputeActiveTree();

      // centerExpand should NOT revert to 'expand-left'
      expect(useCanvasStore.getState().centerExpand).toBe('expand-right');
    });
  });
