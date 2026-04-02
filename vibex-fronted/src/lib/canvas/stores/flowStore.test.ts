/**
 * flowStore unit tests — Epic 3
 * Tests flow node CRUD, step CRUD, and draft state.
 */
import { useFlowStore } from './flowStore';

// Mock addMessage to avoid canvasStore dependency
jest.mock('../canvasStore', () => ({
  useCanvasStore: {
    getState: () => ({ addMessage: jest.fn() }),
  },
}));

describe('useFlowStore', () => {
  beforeEach(() => {
    useFlowStore.setState({
      flowNodes: [],
      flowDraft: null,
    });
  });

  describe('flow node CRUD', () => {
    it('should add a flow node', () => {
      useFlowStore.getState().addFlowNode({
        contextId: 'ctx-1',
        name: '流程A',
        steps: [{ name: 'Step 1', actor: 'User' }],
      });
      const nodes = useFlowStore.getState().flowNodes;
      expect(nodes.length).toBe(1);
      expect(nodes[0].name).toBe('流程A');
      expect(nodes[0].status).toBe('pending');
      expect(nodes[0].steps[0].name).toBe('Step 1');
    });

    it('should set flow nodes', () => {
      const nodes: Parameters<typeof useFlowStore.getState>[0]['flowNodes'] = [{
        nodeId: 'node-1',
        contextId: 'ctx-1',
        name: 'Flow1',
        steps: [],
        isActive: false,
        status: 'pending',
        children: [],
      }];
      useFlowStore.getState().setFlowNodes(nodes);
      expect(useFlowStore.getState().flowNodes.length).toBe(1);
    });

    it('should edit a flow node', () => {
      useFlowStore.getState().addFlowNode({ contextId: 'ctx-1', name: 'Original', steps: [] });
      const nodeId = useFlowStore.getState().flowNodes[0].nodeId;
      useFlowStore.getState().editFlowNode(nodeId, { name: 'Updated' });
      expect(useFlowStore.getState().flowNodes[0].name).toBe('Updated');
      expect(useFlowStore.getState().flowNodes[0].status).toBe('pending');
    });

    it('should delete a flow node', () => {
      useFlowStore.getState().addFlowNode({ contextId: 'ctx-1', name: 'ToDelete', steps: [] });
      expect(useFlowStore.getState().flowNodes.length).toBe(1);
      const nodeId = useFlowStore.getState().flowNodes[0].nodeId;
      useFlowStore.getState().deleteFlowNode(nodeId);
      expect(useFlowStore.getState().flowNodes.length).toBe(0);
    });

    it('should confirm a flow node and cascade confirm to all steps', () => {
      useFlowStore.getState().addFlowNode({
        contextId: 'ctx-1',
        name: 'ToConfirm',
        steps: [{ name: 'Step 1', actor: 'User' }, { name: 'Step 2', actor: 'Admin' }],
      });
      const nodeId = useFlowStore.getState().flowNodes[0].nodeId;
      useFlowStore.getState().confirmFlowNode(nodeId);
      const node = useFlowStore.getState().flowNodes[0];
      expect(node.status).toBe('confirmed');
      expect(node.isActive).toBe(true);
      expect(node.steps[0].status).toBe('confirmed');
      expect(node.steps[0].isActive).toBe(true);
      expect(node.steps[1].status).toBe('confirmed');
      expect(node.steps[1].isActive).toBe(true);
    });

    it('should unconfirm a flow node and cascade unconfirm to all steps', () => {
      useFlowStore.getState().addFlowNode({
        contextId: 'ctx-1',
        name: 'ToUnconfirm',
        steps: [{ name: 'Step 1', actor: 'User' }],
      });
      const nodeId = useFlowStore.getState().flowNodes[0].nodeId;
      // First confirm
      useFlowStore.getState().confirmFlowNode(nodeId);
      expect(useFlowStore.getState().flowNodes[0].status).toBe('confirmed');
      // Then unconfirm via toggle
      useFlowStore.getState().confirmFlowNode(nodeId);
      const node = useFlowStore.getState().flowNodes[0];
      expect(node.status).toBe('pending');
      expect(node.isActive).toBe(false);
      expect(node.steps[0].status).toBe('pending');
      expect(node.steps[0].isActive).toBe(false);
    });
  });

  describe('step operations', () => {
    let nodeId: string;

    beforeEach(() => {
      useFlowStore.getState().addFlowNode({
        contextId: 'ctx-1',
        name: 'FlowWithSteps',
        steps: [{ name: 'Step 1', actor: 'User' }],
      });
      nodeId = useFlowStore.getState().flowNodes[0].nodeId;
    });

    it('should confirm a step', () => {
      const stepId = useFlowStore.getState().flowNodes[0].steps[0].stepId;
      useFlowStore.getState().confirmStep(nodeId, stepId);
      const step = useFlowStore.getState().flowNodes[0].steps[0];
      expect(step.status).toBe('confirmed');
      expect(step.isActive).toBe(true);
    });

    it('should add a step to flow', () => {
      useFlowStore.getState().addStepToFlow(nodeId, { name: 'New Step', actor: 'Admin' });
      const steps = useFlowStore.getState().flowNodes[0].steps;
      expect(steps.length).toBe(2);
      expect(steps[1].name).toBe('New Step');
      expect(steps[1].actor).toBe('Admin');
    });

    it('should edit a step', () => {
      const stepId = useFlowStore.getState().flowNodes[0].steps[0].stepId;
      useFlowStore.getState().editStep(nodeId, stepId, { name: 'Edited Step' });
      expect(useFlowStore.getState().flowNodes[0].steps[0].name).toBe('Edited Step');
    });

    it('should delete a step', () => {
      const stepId = useFlowStore.getState().flowNodes[0].steps[0].stepId;
      useFlowStore.getState().deleteStep(nodeId, stepId);
      expect(useFlowStore.getState().flowNodes[0].steps.length).toBe(0);
    });

    it('should reorder steps', () => {
      useFlowStore.getState().addStepToFlow(nodeId, { name: 'Step B' });
      const steps = useFlowStore.getState().flowNodes[0].steps;
      const stepA = steps[0].stepId;
      const stepB = steps[1].stepId;
      // Move step B (index 1) to position 0
      useFlowStore.getState().reorderSteps(nodeId, 1, 0);
      const reordered = useFlowStore.getState().flowNodes[0].steps;
      expect(reordered[0].stepId).toBe(stepB);
      expect(reordered[1].stepId).toBe(stepA);
    });
  });

  describe('draft state', () => {
    it('should set flow draft', () => {
      expect(useFlowStore.getState().flowDraft).toBeNull();
      useFlowStore.getState().setFlowDraft({ name: 'Draft Flow' });
      expect(useFlowStore.getState().flowDraft?.name).toBe('Draft Flow');
    });

    it('should clear flow draft', () => {
      useFlowStore.getState().setFlowDraft({ name: 'Draft Flow' });
      useFlowStore.getState().setFlowDraft(null);
      expect(useFlowStore.getState().flowDraft).toBeNull();
    });
  });
});
