/**
 * BusinessFlowTree.test.tsx
 *
 * Epic2 F2.1: FlowCard checkbox tooltip — "用于批量选择，非确认操作"
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BusinessFlowTree } from './BusinessFlowTree';
import * as canvasStore from '@/lib/canvas/canvasStore';

const mockToggleNodeSelect = jest.fn();
const mockSetFlowNodes = jest.fn();
const mockDeleteSelectedNodes = jest.fn();
const mockSelectAllNodes = jest.fn();
const mockClearNodeSelection = jest.fn();

jest.mock('@/lib/canvas/canvasStore', () => ({
  useCanvasStore: jest.fn(),
}));

const mockFlowNodes = [
  {
    nodeId: 'flow-1',
    contextId: 'ctx-1',
    name: 'Order Flow',
    steps: [],
    confirmed: false,
    status: 'pending' as const,
  },
];

function setupStore(overrides = {}) {
  (canvasStore.useCanvasStore as jest.Mock).mockImplementation((selector) => {
    const base = {
      flowNodes: mockFlowNodes,
      contextNodes: [{ nodeId: 'ctx-1', name: 'Order', description: '', type: 'core' as const, confirmed: false, status: 'pending' as const, children: [] }],
      selectedNodeIds: { flow: [] as string[], context: [] as string[], component: [] as string[] },
      toggleNodeSelect: mockToggleNodeSelect,
      setFlowNodes: mockSetFlowNodes,
      flowGenerating: false,
      phase: 'flow' as const,
      projectId: 'test-project',
      readonly: false,
      allContextsConfirmed: true,
      deleteSelectedNodes: mockDeleteSelectedNodes,
      selectAllNodes: mockSelectAllNodes,
      clearNodeSelection: mockClearNodeSelection,
    };
    return selector(base as typeof canvasStore.useCanvasStore extends (s: infer S) => unknown ? S : never);
  });
}

describe('Epic2 F2.1: FlowCard checkbox tooltip', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('should have tooltip "用于批量选择，非确认操作" on flow card checkbox', () => {
    setupStore();

    render(<BusinessFlowTree />);

    // Find the checkbox inside the flow card
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    const flowCheckbox = checkboxes.find((cb) =>
      cb.getAttribute('aria-label')?.includes('选择流程')
    );
    expect(flowCheckbox).toBeDefined();
    expect(flowCheckbox).toHaveAttribute('title', '用于批量选择，非确认操作');
  });
});
