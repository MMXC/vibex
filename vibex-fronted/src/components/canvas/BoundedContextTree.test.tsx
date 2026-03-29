/**
 * BoundedContextTree.test.tsx
 *
 * Epic 3 S3.1: 单元测试更新 — checkbox 数量验证
 *
 * 验收标准:
 * - 每个卡片只有一个 checkbox
 * - "确认所有" 按钮文案正确
 * - 无"确认"按钮残留
 * - 删除按钮始终可用（无需预勾选）
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoundedContextTree } from './BoundedContextTree';
import type { BoundedContextNode } from '@/lib/canvas/types';

// =============================================================================
// Mutable mock data (reassigned in tests to simulate state changes)
// =============================================================================
const mockCtxNodes: BoundedContextNode[] = [
  { nodeId: 'ctx-1', name: '患者管理', description: '管理患者基本信息', type: 'core', confirmed: false, status: 'pending', children: [] },
  { nodeId: 'ctx-2', name: '预约挂号', description: '处理预约和排班', type: 'core', confirmed: false, status: 'pending', children: [] },
  { nodeId: 'ctx-3', name: '支付结算', description: '诊金支付和医保结算', type: 'supporting', confirmed: false, status: 'pending', children: [] },
];

const mockConfirmCtx = jest.fn();
const mockAdvancePhase = jest.fn();
const mockToggleSelect = jest.fn();
const mockSelectAll = jest.fn();
const mockClearSelection = jest.fn();
const mockDeleteSelected = jest.fn();
const mockDeleteCtx = jest.fn();

// =============================================================================
// Mock canvasStore — matches HandleConfirmAll.test.tsx pattern
// =============================================================================
jest.mock('@/lib/canvas/canvasStore', () => ({
  useCanvasStore: jest.fn((selector) => {
    const state = {
      contextNodes: mockCtxNodes,
      flowNodes: [],
      componentNodes: [],
      confirmContextNode: mockConfirmCtx,
      advancePhase: mockAdvancePhase,
      addContextDraft: jest.fn(),
      updateContextDraft: jest.fn(),
      deleteContextDraft: jest.fn(),
      deleteContextNode: mockDeleteCtx,
      setContextNodes: jest.fn(),
      selectedNodeIds: { context: [] as string[], component: [] as string[], flow: [] as string[] },
      toggleNodeSelect: mockToggleSelect,
      selectAllNodes: mockSelectAll,
      clearNodeSelection: mockClearSelection,
      deleteSelectedNodes: mockDeleteSelected,
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
describe('BoundedContextTree — Epic 3 S3.1: Checkbox Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset confirmed state to false for each test
    mockCtxNodes.forEach((n) => { n.confirmed = false; });
  });

  afterEach(() => {
    cleanup();
  });

  describe('S1.1/S1.2/S1.3: 每个卡片只有一个 checkbox', () => {
    it('每个节点只有一个 checkbox（confirmation checkbox）', () => {
      render(<BoundedContextTree />);
      expect(screen.getAllByRole('checkbox')).toHaveLength(mockCtxNodes.length);
    });

    it('无 aria-label="选择 xxx" 的 selection checkbox 残留', () => {
      render(<BoundedContextTree />);
      expect(screen.queryAllByLabelText(/选择/)).toHaveLength(0);
    });
  });

  describe('S1.4: 无独立"确认"按钮残留', () => {
    it('页面中不存在"确认"按钮（已由 checkbox 取代）', () => {
      render(<BoundedContextTree />);
      expect(screen.queryAllByRole('button', { name: /确认$/ })).toHaveLength(0);
    });
  });

  describe('S1.5: "确认所有"按钮文案正确', () => {
    it('存在"确认所有"按钮', () => {
      render(<BoundedContextTree />);
      // May find multiple (one per BoundedContextGroup) — use getAllByRole
      expect(screen.getAllByRole('button', { name: /确认所有/ }).length).toBeGreaterThan(0);
    });

    it('不存在"全选"按钮（旧文案）', () => {
      render(<BoundedContextTree />);
      expect(screen.queryByRole('button', { name: /全选/ })).not.toBeInTheDocument();
    });
  });

  describe('S2.1: 批量删除优化 — 删除按钮始终可用', () => {
    it('有节点时始终显示"删除全部"按钮（无需预勾选）', () => {
      render(<BoundedContextTree />);
      expect(screen.getByRole('button', { name: /删除全部/ })).toBeInTheDocument();
    });

    it('点击"确认所有"调用 confirmContextNode 所有节点', async () => {
      const user = userEvent.setup();
      render(<BoundedContextTree />);
      const confirmAllButtons = screen.getAllByRole('button', { name: /确认所有/ });
      await user.click(confirmAllButtons[0]);
      expect(mockConfirmCtx).toHaveBeenCalledTimes(mockCtxNodes.length);
      mockCtxNodes.forEach((n) => expect(mockConfirmCtx).toHaveBeenCalledWith(n.nodeId));
    });
  });

  describe('S3.1: Checkbox 直接切换 confirmed 状态', () => {
    it('点击 checkbox 调用 confirmContextNode', async () => {
      const user = userEvent.setup();
      render(<BoundedContextTree />);
      await user.click(screen.getAllByRole('checkbox')[0]);
      expect(mockConfirmCtx).toHaveBeenCalledWith('ctx-1');
    });

    it('已确认节点的 checkbox 为 checked 状态', () => {
      mockCtxNodes[0].confirmed = true;
      mockCtxNodes[1].confirmed = false;
      render(<BoundedContextTree />);
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });
  });
});
