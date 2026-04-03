/**
 * BoundedContextTree.test.tsx
 *
 * Epic 1: E1 checkbox UX fix
 * - Single confirmation checkbox per node (replaces dual-checkbox design)
 * - No nodeTypeBadge (type shown via border color)
 * - No confirmedBadge (confirmation shown by border color)
 * - Toggle bidirectional via toggleContextNode()
 */
// @ts-nocheck

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoundedContextTree } from './BoundedContextTree';
import type { BoundedContextNode } from '@/lib/canvas/types';

const mockCtxNodes: BoundedContextNode[] = [
  { nodeId: 'ctx-1', name: '患者管理', description: '管理患者基本信息', type: 'core', isActive: true, status: 'confirmed', children: [] },
  { nodeId: 'ctx-2', name: '预约挂号', description: '处理预约和排班', type: 'supporting', isActive: false, status: 'pending', children: [] },
  { nodeId: 'ctx-3', name: '支付结算', description: '诊金支付和医保结算', type: 'generic', isActive: false, status: 'pending', children: [] },
];

const mockAdvancePhase = jest.fn();
const mockDeleteCtx = jest.fn();
const mockToggleContextNode = jest.fn();

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
      toggleContextNode: mockToggleContextNode,
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
describe('BoundedContextTree — Epic 1: E1 checkbox UX fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCtxNodes[0].status = 'confirmed';
    mockCtxNodes[0].isActive = true;
    mockCtxNodes[1].status = 'pending';
    mockCtxNodes[1].isActive = false;
    mockCtxNodes[2].status = 'pending';
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

  // E1: Single checkbox per node (T1)
  it('has exactly 1 checkbox per node (E1 single checkbox)', () => {
    render(<BoundedContextTree />);
    // 3 nodes → 3 checkboxes (one per node)
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  // E1: Checkbox has aria-label='确认节点' (T1)
  it('each checkbox has aria-label="确认节点" (E1)', () => {
    render(<BoundedContextTree />);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => {
      expect(cb).toHaveAttribute('aria-label', '确认节点');
    });
  });

  // E1: Clicking checkbox calls toggleContextNode (T4)
  it('clicking checkbox calls toggleContextNode (E1 toggle)', async () => {
    const user = userEvent.setup();
    render(<BoundedContextTree />);
    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(firstCheckbox);
    expect(mockToggleContextNode).toHaveBeenCalledWith('ctx-1');
  });

  // E1: No nodeTypeBadge (T2)
  it('has no nodeTypeBadge element (E1 removal)', () => {
    render(<BoundedContextTree />);
    // nodeTypeBadge was a div with class styles.nodeTypeBadge — check it doesn't appear
    // We verify by checking that type text (核心/支撑/通用) is NOT in document
    expect(screen.queryByText('核心')).not.toBeInTheDocument();
    expect(screen.queryByText('支撑')).not.toBeInTheDocument();
    expect(screen.queryByText('通用')).not.toBeInTheDocument();
  });

  // E1: No confirmedBadge (T3)
  it('has no confirmedBadge element (E1 removal)', () => {
    render(<BoundedContextTree />);
    // No SVG checkmark badges should appear
    // The confirmedBadge was an SVG span — verify the document doesn't have extra checkmarks
    const checkmarks = document.querySelectorAll('[aria-label="已确认"]');
    expect(checkmarks).toHaveLength(0);
  });

  it('has primary flow-tree advance button when nodes exist', () => {
    render(<BoundedContextTree />);
    expect(screen.getByText(/继续到流程树/)).toBeInTheDocument();
  });

  it('primary flow-tree button calls advancePhase', async () => {
    const user = userEvent.setup();
    render(<BoundedContextTree />);
    await user.click(screen.getByText(/继续到流程树/));
    expect(mockAdvancePhase).toHaveBeenCalledTimes(1);
  });
});
