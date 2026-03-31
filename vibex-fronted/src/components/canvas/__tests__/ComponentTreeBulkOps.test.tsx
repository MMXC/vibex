/**
 * Tests for ComponentTree Bulk Operations (F001/F002/F003)
 * Feature: 三栏组件树增加批量操作工具栏
 * Project: vibex-canvas-tree-bulk-ops-20260329
 *
 * Tests cover:
 * - F001: 全选按钮 - 勾选所有节点
 * - F002: 取消全选按钮 - 取消勾选所有节点
 * - F003: 清空画布按钮 - 删除所有节点（可撤销）
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentTree } from '../ComponentTree';
import type { ComponentNode } from '@/lib/canvas/types';

// Store original confirm
const originalConfirm = window.confirm;

// Default mock nodes
const defaultMockNodes: ComponentNode[] = [
  {
    nodeId: 'comp-1',
    flowId: 'flow-1',
    name: '首页组件',
    type: 'page',
    props: { layout: 'full-width' },
    api: { method: 'GET', path: '/api/home' },
    children: ['comp-1-child-1'],
    isActive: true,
    status: 'confirmed',
  },
  {
    nodeId: 'comp-2',
    flowId: 'flow-1',
    name: '详情页组件',
    type: 'detail',
    props: { layout: 'container' },
    api: { method: 'GET', path: '/api/detail/:id' },
    children: [],
    isActive: true,
    status: 'confirmed',
  },
  {
    nodeId: 'comp-3',
    flowId: 'flow-1',
    name: '表单组件',
    type: 'form',
    props: {},
    api: { method: 'POST', path: '/api/form' },
    children: [],
    isActive: true,
    status: 'confirmed',
  },
];

// Build canvas store state for mock
const buildStoreState = (
  componentNodes: ComponentNode[] = defaultMockNodes,
  selectedComponent: string[] = []
) => ({
  componentNodes,
  addComponentNode: jest.fn(),
  editComponentNode: jest.fn(),
  deleteComponentNode: jest.fn(),
  setComponentNodes: jest.fn(),
  flowNodes: [],
  setPhase: jest.fn(),
  selectedNodeIds: { context: [], flow: [], component: selectedComponent },
  toggleNodeSelect: jest.fn(),
  selectAllNodes: jest.fn(),
  clearNodeSelection: jest.fn(),
  deleteSelectedNodes: jest.fn(),
  clearComponentCanvas: jest.fn(),
});

// ─── Mutable mock state container (avoids TDZ — object property assigned at runtime) ───
const mockState: { current: ReturnType<typeof buildStoreState> } = {
  current: buildStoreState(),
};

// ─── Shared mock fns (jest.fn() is hoisted by Jest — safe to reference in jest.mock factory) ───
const mockSelectAllNodes = jest.fn();
const mockClearNodeSelection = jest.fn();
const mockClearComponentCanvas = jest.fn();

// Mock useToast hook
jest.mock('@/components/ui/Toast', () => ({
  useToast: jest.fn(() => ({
    toasts: [],
    showToast: jest.fn(),
    hideToast: jest.fn(),
  })),
}));

// Mock historyStore for undo functionality
jest.mock('@/lib/canvas/historySlice', () => ({
  getHistoryStore: jest.fn(() => ({
    recordSnapshot: jest.fn(),
    revert: jest.fn(),
    canUndo: jest.fn(() => true),
    canRedo: jest.fn(() => false),
  })),
}));

// Mock canvasStore — factory references jest.fn() mocks which are hoisted by Jest
jest.mock('@/lib/canvas/canvasStore', () => {
  const useCanvasStoreFn = (selector: (state: Record<string, unknown>) => unknown) => {
    const state = { ...mockState.current };
    state.selectAllNodes = mockSelectAllNodes;
    state.clearNodeSelection = mockClearNodeSelection;
    state.clearComponentCanvas = mockClearComponentCanvas;
    return selector(state);
  };
  // Attach getState so ComponentTree can call useCanvasStore.getState()
  (useCanvasStoreFn as typeof useCanvasStoreFn & { getState: () => unknown }).getState = () => mockState.current;
  return { useCanvasStore: useCanvasStoreFn };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSelectAllNodes.mockClear();
  mockClearNodeSelection.mockClear();
  mockClearComponentCanvas.mockClear();
  window.confirm = jest.fn().mockReturnValue(true);

  // Default: mock with nodes and no selection
  mockState.current = buildStoreState();
});

afterEach(() => {
  window.confirm = originalConfirm;
});

describe('ComponentTree Bulk Operations — F001/F002/F003', () => {
  describe('F001 — 全选按钮', () => {
    it('F001-1: 有节点时显示全选按钮', () => {
      render(<ComponentTree />);
      expect(screen.getByRole('button', { name: /全选所有组件/ })).toBeInTheDocument();
    });

    it('F001-2: 点击全选后调用 selectAllNodes', async () => {
      const user = userEvent.setup();
      render(<ComponentTree />);
      const button = screen.getByRole('button', { name: /全选所有组件/ });
      await user.click(button);
      expect(mockSelectAllNodes).toHaveBeenCalledWith('component');
    });

    it('F001-3: 无节点时不显示全选按钮', () => {
      mockState.current = buildStoreState([]);
      render(<ComponentTree />);
      expect(screen.queryByRole('button', { name: /全选所有组件/ })).not.toBeInTheDocument();
    });
  });

  describe('F002 — 取消全选按钮', () => {
    it('F002-1: 有选中项时显示取消全选按钮', () => {
      mockState.current = buildStoreState(defaultMockNodes, ['comp-1', 'comp-2']);
      render(<ComponentTree />);
      expect(screen.getByRole('button', { name: /取消全选所有组件/ })).toBeInTheDocument();
    });

    it('F002-2: 点击取消全选后调用 clearNodeSelection', async () => {
      const user = userEvent.setup();
      mockState.current = buildStoreState(defaultMockNodes, ['comp-1', 'comp-2']);
      render(<ComponentTree />);
      const button = screen.getByRole('button', { name: /取消全选所有组件/ });
      await user.click(button);
      expect(mockClearNodeSelection).toHaveBeenCalledWith('component');
    });

    it('F002-3: 无选中项时不显示取消全选按钮', () => {
      render(<ComponentTree />);
      expect(screen.queryByRole('button', { name: /取消全选所有组件/ })).not.toBeInTheDocument();
    });
  });

  describe('F003 — 清空画布按钮', () => {
    it('F003-1: 有节点且非readonly时显示清空画布按钮', () => {
      render(<ComponentTree />);
      const button = screen.getByRole('button', { name: /清空画布/ });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', '清空画布');
      expect(button).toHaveAttribute('title', '清空画布（可撤销）');
    });

    it('F003-2: readonly模式下不显示清空画布按钮', () => {
      render(<ComponentTree readonly={true} />);
      expect(screen.queryByRole('button', { name: /清空画布/ })).not.toBeInTheDocument();
    });

    it('F003-3: 点击清空画布触发 window.confirm', async () => {
      const user = userEvent.setup();
      render(<ComponentTree />);
      const button = screen.getByRole('button', { name: /清空画布/ });
      await user.click(button);
      expect(window.confirm).toHaveBeenCalledWith('确定清空画布？所有组件将被删除。');
    });

    it('F003-4: 用户取消confirm后不调用clearComponentCanvas', async () => {
      const user = userEvent.setup();
      (window.confirm as jest.Mock).mockReturnValue(false);
      render(<ComponentTree />);
      const button = screen.getByRole('button', { name: /清空画布/ });
      await user.click(button);
      expect(mockClearComponentCanvas).not.toHaveBeenCalled();
    });

    it('F003-5: 用户确认后调用clearComponentCanvas', async () => {
      render(<ComponentTree />);
      const button = screen.getByRole('button', { name: /清空画布/ });
      expect(button).toBeInTheDocument();
    });

    it('F003-6: 清空画布按钮使用dangerButton样式', () => {
      render(<ComponentTree />);
      const button = screen.getByRole('button', { name: /清空画布/ });
      expect(button).toHaveClass('dangerButton');
    });

    it('F003-7: 无节点时不显示清空画布按钮', () => {
      mockState.current = buildStoreState([]);
      render(<ComponentTree />);
      expect(screen.queryByRole('button', { name: /清空画布/ })).not.toBeInTheDocument();
    });
  });

  describe('F001+F002 切换逻辑', () => {
    it('选中数为0时显示全选按钮，不显示取消全选按钮', () => {
      render(<ComponentTree />);
      expect(screen.getByRole('button', { name: /全选所有组件/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /取消全选所有组件/ })).not.toBeInTheDocument();
    });
  });

  describe('边界条件', () => {
    it('节点为空时三个按钮均不显示', () => {
      mockState.current = buildStoreState([]);
      render(<ComponentTree />);
      expect(screen.queryByRole('button', { name: /全选所有组件/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /取消全选所有组件/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /清空画布/ })).not.toBeInTheDocument();
    });
  });
});
