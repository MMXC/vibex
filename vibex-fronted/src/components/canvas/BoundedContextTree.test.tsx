/**
 * BoundedContextTree.test.tsx
 *
 * Epic 3: confirmed → isActive
 * - Confirmation checkbox removed (no confirmContextNode method)
 * - No "确认所有" button — replaced by "继续到原型生成"
 * - Nodes use isActive field instead of confirmed
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoundedContextTree } from './BoundedContextTree';
import type { BoundedContextNode } from '@/lib/canvas/types';

const mockCtxNodes: BoundedContextNode[] = [
  { nodeId: 'ctx-1', name: '患者管理', description: '管理患者基本信息', type: 'core', isActive: true, status: 'pending', children: [] },
  { nodeId: 'ctx-2', name: '预约挂号', description: '处理预约和排班', type: 'core', isActive: true, status: 'pending', children: [] },
  { nodeId: 'ctx-3', name: '支付结算', description: '诊金支付和医保结算', type: 'supporting', isActive: false, status: 'pending', children: [] },
];

const mockAdvancePhase = jest.fn();
const mockDeleteCtx = jest.fn();

// =============================================================================
// Mock canvasStore
// =============================================================================
jest.mock('@/lib/canvas/canvasStore', () => ({
  useCanvasStore: jest.fn((selector) => {
    const state = {
      contextNodes: mockCtxNodes,
      flowNodes: [],
      componentNodes: [],
      advancePhase: mockAdvancePhase,
      addContextDraft: jest.fn(),
      updateContextDraft: jest.fn(),
      deleteContextDraft: jest.fn(),
      deleteContextNode: mockDeleteCtx,
      setContextNodes: jest.fn(),
      selectedNodeIds: { context: [] as string[], component: [] as string[], flow: [] as string[] },
      toggleNodeSelect: jest.fn(),
      selectAllNodes: jest.fn(),
      clearNodeSelection: jest.fn(),
      deleteSelectedNodes: jest.fn(),
      phase: 'context',
      activeTree: 'context',
      setActiveTree: jest.fn(),
      autoGenerateFlows: jest.fn(),
      loadExampleData: jest.fn(),
    };
    return selector(state);
  }),
}));

jest.mock('@/hooks/canvas/useDragSelection', () => ({
  useDragSelection: jest.fn(() => ({
    isDragging: false,
    selectionBox: null,
    containerRef: { current: null },
    isNodeInBox: jest.fn(),
    isSelecting: false,
  })),
  useModifierKey: jest.fn(() => false),
}));

jest.mock('@/components/ui/Toast', () => ({
  useToast: jest.fn(() => ({ showToast: jest.fn() })),
}));

// =============================================================================
// Tests
// =============================================================================
describe('BoundedContextTree — Epic 3: isActive (no confirm)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCtxNodes.forEach((n) => { n.isActive = true; n.status = 'pending'; });
    mockCtxNodes[2].isActive = false;
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all context nodes', () => {
    render(<BoundedContextTree />);
    expect(screen.getByText('患者管理')).toBeInTheDocument();
    expect(screen.getByText('预约挂号')).toBeInTheDocument();
    expect(screen.getByText('支付结算')).toBeInTheDocument();
  });

  it('has no confirmation checkboxes (Epic 3 removal)', () => {
    render(<BoundedContextTree />);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('has no "确认所有" buttons', () => {
    render(<BoundedContextTree />);
    expect(screen.queryByRole('button', { name: /确认所有/ })).not.toBeInTheDocument();
  });

  it('shows "继续到原型生成" button when nodes exist', () => {
    render(<BoundedContextTree />);
    expect(screen.getByRole('button', { name: /继续到原型生成/ })).toBeInTheDocument();
  });

  it('"继续到原型生成" button calls advancePhase', async () => {
    const user = userEvent.setup();
    render(<BoundedContextTree />);
    await user.click(screen.getByRole('button', { name: /继续到原型生成/ }));
    expect(mockAdvancePhase).toHaveBeenCalledTimes(1);
  });
});
