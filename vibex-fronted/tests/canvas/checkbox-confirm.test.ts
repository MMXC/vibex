/**
 * checkbox-confirm.test.ts — E1: Checkbox 确认语义修复
 *
 * 测试 confirmContextNode、confirmFlowNode、confirmStep action 的功能。
 * 基于: proposals-20260401-9 IMPLEMENTATION_PLAN E1
 */

import { act } from '@testing-library/react';
import { useCanvasStore } from '../../src/lib/canvas/canvasStore';

// Helper: reset store state
function resetStore() {
  act(() => {
    useCanvasStore.getState().setContextNodes([]);
    useCanvasStore.getState().setFlowNodes([]);
  });
}

describe('E1: confirmContextNode action', () => {
  beforeEach(() => {
    resetStore();
  });

  it('F1.1: confirmContextNode sets isActive=true and status=confirmed', () => {
    let nodeId = '';
    act(() => {
      useCanvasStore.getState().addContextNode({
        name: 'Test Context',
        description: 'Test description',
        type: 'core',
      });
    });
    const nodes = useCanvasStore.getState().contextNodes;
    const targetNode = nodes.find((n) => n.name === 'Test Context');
    expect(targetNode).toBeDefined();
    nodeId = targetNode!.nodeId;

    act(() => {
      useCanvasStore.getState().confirmContextNode(nodeId);
    });

    const updatedNode = useCanvasStore.getState().contextNodes.find(
      (n) => n.nodeId === nodeId
    );
    expect(updatedNode?.isActive).toBe(true);
    expect(updatedNode?.status).toBe('confirmed');
  });

  it('F1.2: confirmContextNode does not affect other nodes', () => {
    let nodeIdA = '';
    act(() => {
      useCanvasStore.getState().addContextNode({ name: 'Context A', description: '', type: 'core' });
      useCanvasStore.getState().addContextNode({ name: 'Context B', description: '', type: 'core' });
    });

    const nodes = useCanvasStore.getState().contextNodes;
    const nodeA = nodes.find((n) => n.name === 'Context A');
    const nodeB = nodes.find((n) => n.name === 'Context B');
    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();
    nodeIdA = nodeA!.nodeId;

    act(() => {
      useCanvasStore.getState().confirmContextNode(nodeIdA);
    });

    const updatedA = useCanvasStore.getState().contextNodes.find((n) => n.name === 'Context A');
    const updatedB = useCanvasStore.getState().contextNodes.find((n) => n.name === 'Context B');

    expect(updatedA?.isActive).toBe(true);
    expect(updatedA?.status).toBe('confirmed');
    expect(updatedB?.isActive).toBe(false);
    expect(updatedB?.status).toBe('pending');
  });
});

describe('E1: confirmFlowNode action', () => {
  beforeEach(() => {
    resetStore();
  });

  it('F2.1: confirmFlowNode sets isActive=true and status=confirmed', () => {
    let flowNodeId = '';
    act(() => {
      useCanvasStore.getState().addFlowNode({
        name: 'Test Flow',
        steps: [{ name: 'Step 1', actor: 'user' }],
      });
    });

    const flowNodes = useCanvasStore.getState().flowNodes;
    const targetFlow = flowNodes.find((n) => n.name === 'Test Flow');
    expect(targetFlow).toBeDefined();
    flowNodeId = targetFlow!.nodeId;

    act(() => {
      useCanvasStore.getState().confirmFlowNode(flowNodeId);
    });

    const updatedFlow = useCanvasStore.getState().flowNodes.find(
      (n) => n.nodeId === flowNodeId
    );
    expect(updatedFlow?.isActive).toBe(true);
    expect(updatedFlow?.status).toBe('confirmed');
  });
});

describe('E1: confirmStep action', () => {
  beforeEach(() => {
    resetStore();
  });

  it('F3.1: confirmStep sets isActive=true and status=confirmed for specific step', () => {
    let flowNodeId = '';
    let step1Id = '';
    act(() => {
      useCanvasStore.getState().addFlowNode({
        name: 'Test Flow',
        steps: [
          { name: 'Step 1', actor: 'user' },
          { name: 'Step 2', actor: 'admin' },
        ],
      });
    });

    const flowNodes = useCanvasStore.getState().flowNodes;
    const targetFlow = flowNodes.find((n) => n.name === 'Test Flow');
    expect(targetFlow).toBeDefined();
    expect(targetFlow!.steps.length).toBe(2);
    flowNodeId = targetFlow!.nodeId;
    step1Id = targetFlow!.steps[0].stepId;

    act(() => {
      useCanvasStore.getState().confirmStep(flowNodeId, step1Id);
    });

    const updatedFlow = useCanvasStore.getState().flowNodes.find(
      (n) => n.nodeId === flowNodeId
    );
    expect(updatedFlow?.steps[0].isActive).toBe(true);
    expect(updatedFlow?.steps[0].status).toBe('confirmed');
    // Other step should be unchanged
    expect(updatedFlow?.steps[1].isActive).toBe(false);
    expect(updatedFlow?.steps[1].status).toBe('pending');
  });
});
