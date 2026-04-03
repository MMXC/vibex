/**
 * treeStatus.test.ts — Unit tests for TreeStatus (F-3.2) + PhaseProgressBar data-testid (F-3.1)
 *
 * Epic: vibex-canvas-analysis / dev-epic3-p2体验优化
 * Tests:
 *   F-3.2: TreeStatus displays correct node counts
 *   F-3.1: PhaseProgressBar disabled buttons have title + data-testid
 */
// @ts-nocheck


import { render, screen } from '@testing-library/react';
import React from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { TreeStatus } from '@/components/canvas/TreeStatus';
import { PhaseProgressBar } from '@/components/canvas/PhaseProgressBar';

// =============================================================================
// Helper
// =============================================================================

function setTreeData(contexts: number, flows: number, components: number) {
  const store = useCanvasStore.getState();
  store.setContextNodes(
    Array.from({ length: contexts }, (_, i) => ({
      nodeId: `c${i}`,
      name: `Ctx ${i}`,
      description: '',
      type: 'core' as const,
      confirmed: true,
      status: 'confirmed' as const,
      children: [] as string[],
    }))
  );
  store.setFlowNodes(
    Array.from({ length: flows }, (_, i) => ({
      nodeId: `f${i}`,
      contextId: 'c0',
      name: `Flow ${i}`,
      steps: [],
      confirmed: true,
      status: 'confirmed' as const,
      children: [] as string[],
    }))
  );
  store.setComponentNodes(
    Array.from({ length: components }, (_, i) => ({
      nodeId: `comp${i}`,
      flowId: 'f0',
      name: `Comp ${i}`,
      type: 'page' as const,
      props: {},
      api: { method: 'GET' as const, path: '/', params: [] as string[] },
      children: [] as string[],
      confirmed: true,
      status: 'confirmed' as const,
    }))
  );
}

// =============================================================================
// F-3.2: TreeStatus tests
// =============================================================================

describe('F-3.2: TreeStatus', () => {
  beforeEach(() => {
    const store = useCanvasStore.getState();
    store.setContextNodes([]);
    store.setFlowNodes([]);
    store.setComponentNodes([]);
  });

  it('has data-testid="tree-status"', () => {
    render(<TreeStatus />);
    expect(screen.getByTestId('tree-status')).toBeInTheDocument();
  });

  it('displays correct context count', () => {
    setTreeData(3, 0, 0);
    render(<TreeStatus />);
    expect(screen.getByTestId('tree-status')).toHaveTextContent(/上下文 3/);
  });

  it('displays correct flow count', () => {
    setTreeData(1, 2, 0);
    render(<TreeStatus />);
    expect(screen.getByTestId('tree-status')).toHaveTextContent(/流程 2/);
  });

  it('displays correct component count', () => {
    setTreeData(0, 0, 5);
    render(<TreeStatus />);
    expect(screen.getByTestId('tree-status')).toHaveTextContent(/组件 5/);
  });

  it('displays all three tree counts', () => {
    setTreeData(3, 2, 4);
    render(<TreeStatus />);
    const el = screen.getByTestId('tree-status');
    expect(el).toHaveTextContent(/上下文 3/);
    expect(el).toHaveTextContent(/流程 2/);
    expect(el).toHaveTextContent(/组件 4/);
  });

  it('shows ✓ when all contexts are confirmed', () => {
    setTreeData(2, 0, 0);
    render(<TreeStatus />);
    expect(screen.getByTestId('tree-status')).toHaveTextContent(/✓/);
  });

  it('shows ✓ when all flows are confirmed', () => {
    setTreeData(0, 3, 0);
    render(<TreeStatus />);
    expect(screen.getByTestId('tree-status')).toHaveTextContent(/✓/);
  });

  it('shows ✓ when all components are confirmed', () => {
    setTreeData(0, 0, 3);
    render(<TreeStatus />);
    expect(screen.getByTestId('tree-status')).toHaveTextContent(/✓/);
  });

  it('displays 0 when trees are empty', () => {
    render(<TreeStatus />);
    const el = screen.getByTestId('tree-status');
    expect(el).toHaveTextContent(/上下文 0/);
    expect(el).toHaveTextContent(/流程 0/);
    expect(el).toHaveTextContent(/组件 0/);
  });
});

// =============================================================================
// F-3.1: PhaseProgressBar disabled button title + data-testid
// =============================================================================

describe('F-3.1: PhaseProgressBar disabled buttons', () => {
  it('has data-testid on each phase button', () => {
    render(<PhaseProgressBar currentPhase="context" onPhaseClick={undefined} />);

    expect(screen.getByTestId('step-input')).toBeInTheDocument();
    expect(screen.getByTestId('step-context')).toBeInTheDocument();
    expect(screen.getByTestId('step-flow')).toBeInTheDocument();
    expect(screen.getByTestId('step-component')).toBeInTheDocument();
  });

  it('pending phase button is disabled', () => {
    render(<PhaseProgressBar currentPhase="context" onPhaseClick={undefined} />);
    // flow is pending (after context), component is pending
    expect(screen.getByTestId('step-flow')).toBeDisabled();
    expect(screen.getByTestId('step-component')).toBeDisabled();
  });

  it('completed and active phase buttons are enabled when onPhaseClick provided', () => {
    render(<PhaseProgressBar currentPhase="flow" onPhaseClick={jest.fn()} />);
    // input and context are completed (clickable), flow is active
    expect(screen.getByTestId('step-input')).toBeEnabled();
    expect(screen.getByTestId('step-context')).toBeEnabled();
    expect(screen.getByTestId('step-flow')).toBeEnabled();
  });

  it('disabled button has title attribute', () => {
    render(<PhaseProgressBar currentPhase="input" onPhaseClick={undefined} />);
    // flow and component are pending when currentPhase is 'input'
    const flowBtn = screen.getByTestId('step-flow');
    expect(flowBtn).toBeDisabled();
    expect(flowBtn).toHaveAttribute('title');
    expect(flowBtn.getAttribute('title')).not.toBe('');
  });
});
