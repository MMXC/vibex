/**
 * BoundedContextTree.test.tsx — Epic 1: E1 checkbox UX fix
 * Updated for new store architecture (useContextStore only).
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BoundedContextNode } from '@/lib/canvas/types';
import { BoundedContextTree } from './BoundedContextTree';

const ctxNodes: BoundedContextNode[] = [
  { nodeId: 'ctx-1', name: '患者管理', description: '管理患者基本信息', type: 'core', isActive: true, status: 'confirmed', children: [] },
  { nodeId: 'ctx-2', name: '预约挂号', description: '处理预约和排班', type: 'supporting', isActive: false, status: 'pending', children: [] },
  { nodeId: 'ctx-3', name: '支付结算', description: '诊金支付和医保结算', type: 'generic', isActive: false, status: 'pending', children: [] },
];

const mockToggleContextNode = jest.fn();
const mockToggleNodeSelect = jest.fn();
const mockAdvancePhase = jest.fn();

jest.mock('@/lib/canvas/stores/contextStore', () => ({
  useContextStore: jest.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      contextNodes: ctxNodes,
      phase: 'context',
      advancePhase: mockAdvancePhase,
      activeTree: 'context',
      setActiveTree: jest.fn(),
      selectedNodeIds: { context: [] as string[], flow: [] as string[], component: [] as string[] },
      toggleNodeSelect: mockToggleNodeSelect,
      selectAllNodes: jest.fn(),
      clearNodeSelection: jest.fn(),
      deleteSelectedNodes: jest.fn(),
      toggleContextNode: mockToggleContextNode,
      toggleContextSelection: jest.fn(),
      setContextNodes: jest.fn(),
      addContextNode: jest.fn(),
      deleteContextNode: jest.fn(),
      editContextNode: jest.fn(),
      confirmContextNode: jest.fn(),
      setContextDraft: jest.fn(),
      contextDraft: null,
    };
    return selector ? selector(state) : state;
  }),
}));

jest.mock('@/lib/canvas/stores/flowStore', () => ({
  useFlowStore: jest.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = { flowNodes: [], phase: 'context' as const, activeTree: 'context' as const };
    return selector ? selector(state) : state;
  }),
}));

jest.mock('@/lib/canvas/stores/sessionStore', () => ({
  useSessionStore: jest.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = { aiThinking: false, aiThinkingMessage: null, requirementText: '' };
    return selector ? selector(state) : state;
  }),
}));

jest.mock('@/hooks/canvas/useDragSelection', () => ({
  useDragSelection: jest.fn(() => ({
    isDragging: false, selectionBox: null, containerRef: { current: null }, isNodeInBox: jest.fn(), isSelecting: false,
  })),
  useModifierKey: jest.fn(() => false),
}));

jest.mock('@/components/ui/Toast', () => ({
  useToast: jest.fn(() => ({ showToast: jest.fn() })),
}));

describe('BoundedContextTree — Epic 1: E1 checkbox UX', () => {
  beforeEach(() => { jest.clearAllMocks(); });
  afterEach(cleanup);

  it('renders all context nodes', () => {
    render(<BoundedContextTree />);
    expect(screen.getByText('患者管理')).toBeInTheDocument();
    expect(screen.getByText('预约挂号')).toBeInTheDocument();
    expect(screen.getByText('支付结算')).toBeInTheDocument();
  });

  it('has exactly 1 checkbox per node', () => {
    render(<BoundedContextTree />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('each checkbox has aria-label="确认节点"', () => {
    render(<BoundedContextTree />);
    for (const cb of screen.getAllByRole('checkbox')) {
      expect(cb).toHaveAttribute('aria-label', '确认节点');
    }
  });

  it('clicking checkbox calls toggleNodeSelect (selection, not confirmation)', async () => {
    const user = userEvent.setup();
    render(<BoundedContextTree />);
    await user.click(screen.getAllByRole('checkbox')[0]);
    // E1 fix: checkbox now calls onToggleSelect → toggleNodeSelect (selection)
    // not toggleContextNode (confirmation)
    expect(mockToggleNodeSelect).toHaveBeenCalledWith('context', 'ctx-1');
    expect(mockToggleContextNode).not.toHaveBeenCalled();
  });

  it('has no nodeTypeBadge (type text hidden)', () => {
    render(<BoundedContextTree />);
    expect(screen.queryByText('核心')).not.toBeInTheDocument();
    expect(screen.queryByText('支撑')).not.toBeInTheDocument();
    expect(screen.queryByText('通用')).not.toBeInTheDocument();
  });

  it('has no confirmedBadge (no extra checkmarks)', () => {
    render(<BoundedContextTree />);
    expect(document.querySelectorAll('[aria-label="已确认"]')).toHaveLength(0);
  });

  it('has advance-to-flow button when nodes exist', () => {
    render(<BoundedContextTree />);
    expect(screen.getByText(/继续到流程树/)).toBeInTheDocument();
  });

  it('advance button calls advancePhase', async () => {
    const user = userEvent.setup();
    render(<BoundedContextTree />);
    await user.click(screen.getByText(/继续到流程树/));
    expect(mockAdvancePhase).toHaveBeenCalledTimes(1);
  });
});
