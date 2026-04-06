/**
 * Tests for Epic 3 confirm-all removal (canvas-three-tree-unification)
 *
 * Epic 3 removed confirmAllComponentNodes/confirmContextNode/confirmFlowNode from the store.
 * The "confirm all" functionality that called these store methods is gone.
 *
 * Tests verify:
 * - ComponentTree has NO "确认所有" button (only "继续到原型生成")
 * - ComponentTree "继续到原型生成" calls setPhase('prototype')
 * - BoundedContextTree "确认所有 → 继续到流程树" calls advancePhase() (no confirm gating)
 * - The component store exports don't include confirm methods
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoundedContextTree } from '../BoundedContextTree';
import { ComponentTree } from '../ComponentTree';
import type { BoundedContextNode, ComponentNode } from '@/lib/canvas/types';

// =============================================================================
// Shared mutable mock state
// =============================================================================
const mockCtxNodes: BoundedContextNode[] = [
  { nodeId: 'ctx-1', name: '用户管理', description: '描述', status: 'pending' as const, isActive: false, children: [] },
  { nodeId: 'ctx-2', name: '订单管理', description: '描述', status: 'pending' as const, isActive: false, children: [] },
  { nodeId: 'ctx-3', name: '商品管理', description: '描述', status: 'pending' as const, isActive: false, children: [] },
];

const mockCompNodes: ComponentNode[] = [
  { nodeId: 'comp-1', flowId: 'flow-1', name: '首页组件', type: 'page' as const, props: { layout: 'full-width' }, api: { method: 'GET' as const, path: '/api/home' }, children: [], isActive: false, status: 'pending' as const },
  { nodeId: 'comp-2', flowId: 'flow-1', name: '详情页组件', type: 'detail' as const, props: { layout: 'container' }, api: { method: 'GET' as const, path: '/api/detail/:id' }, children: [], isActive: false, status: 'pending' as const },
];

const mockFlowNodes = [
  { nodeId: 'flow-1', name: '流程1', type: 'business-flow' as const, status: 'pending' as const, isActive: false, children: [], steps: [] },
];

const mockAdvancePhase = vi.fn();
const mockSetPhase = vi.fn();

// =============================================================================
// Mock the correct stores
// =============================================================================
vi.mock('@/lib/canvas/stores/contextStore', () => ({
  useContextStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      contextNodes: mockCtxNodes,
      phase: 'context' as const,
      activeTree: 'context' as const,
      advancePhase: mockAdvancePhase,
      setPhase: mockSetPhase,
      setActiveTree: vi.fn(),
      autoGenerateFlows: vi.fn(),
      loadExampleData: vi.fn(),
      selectedNodeIds: { context: [], flow: [], component: [] },
      toggleNodeSelect: vi.fn(),
      selectAllNodes: vi.fn(),
      clearNodeSelection: vi.fn(),
      deleteSelectedNodes: vi.fn(),
      addContextDraft: vi.fn(),
      updateContextDraft: vi.fn(),
      deleteContextDraft: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/lib/canvas/stores/componentStore', () => ({
  useComponentStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      componentNodes: mockCompNodes,
      setComponentNodes: vi.fn(),
      addComponentNode: vi.fn(),
      editComponentNode: vi.fn(),
      deleteComponentNode: vi.fn(),
      componentGenerating: false,
      setComponentGenerating: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/lib/canvas/stores/flowStore', () => ({
  useFlowStore: vi.fn((selector?: (s: any) => any) => {
    const state = { flowNodes: mockFlowNodes };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/lib/canvas/historySlice', () => ({
  getHistoryStore: vi.fn(() => ({
    recordSnapshot: vi.fn(),
  })),
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: vi.fn(() => ({ toasts: [], showToast: vi.fn(), hideToast: vi.fn() })),
}));

// =============================================================================
// Tests: Epic3 — no confirm gating, only phase advancement
// =============================================================================
describe('Epic3 — Confirm-all removed, only phase advancement', () => {
  const ctxSnapshot: BoundedContextNode[] = [
    { nodeId: 'ctx-1', name: '用户管理', description: '描述', status: 'pending' as const, isActive: false, children: [] },
    { nodeId: 'ctx-2', name: '订单管理', description: '描述', status: 'pending' as const, isActive: false, children: [] },
    { nodeId: 'ctx-3', name: '商品管理', description: '描述', status: 'pending' as const, isActive: false, children: [] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtxNodes.length = 0;
    ctxSnapshot.forEach((n) => mockCtxNodes.push({ ...n }));
    mockCompNodes.length = 0;
    mockCompNodes.push(
      { nodeId: 'comp-1', flowId: 'flow-1', name: '首页组件', type: 'page' as const, props: { layout: 'full-width' }, api: { method: 'GET' as const, path: '/api/home' }, children: [], isActive: false, status: 'pending' as const },
      { nodeId: 'comp-2', flowId: 'flow-1', name: '详情页组件', type: 'detail' as const, props: { layout: 'container' }, api: { method: 'GET' as const, path: '/api/detail/:id' }, children: [], isActive: false, status: 'pending' as const },
    );
  });

  afterEach(() => {
    mockCtxNodes.length = 0;
    ctxSnapshot.forEach((n) => mockCtxNodes.push({ ...n }));
  });

  describe('ComponentTree — no confirm-all button, only prototype transition', () => {
    it('has NO "确认所有" button in ComponentTree', () => {
      render(<ComponentTree />);
      expect(screen.queryByRole('button', { name: /确认所有/i })).not.toBeInTheDocument();
    });

    it('has "继续到原型生成" button when has nodes', () => {
      render(<ComponentTree />);
      expect(screen.getByRole('button', { name: /继续到原型生成/i })).toBeInTheDocument();
    });

    it('"继续到原型生成" button calls setPhase("prototype")', () => {
      render(<ComponentTree />);
      fireEvent.click(screen.getByRole('button', { name: /继续到原型生成/i }));
      expect(mockSetPhase).toHaveBeenCalledWith('prototype');
    });

    it('"继续到原型生成" button NOT visible when no nodes', () => {
      mockCompNodes.length = 0;
      render(<ComponentTree />);
      expect(screen.queryByRole('button', { name: /继续到原型生成/i })).not.toBeInTheDocument();
    });
  });

  describe('BoundedContextTree — confirm-all calls advancePhase only', () => {
    it('has "继续到流程树" button when all nodes isActive', () => {
      mockCtxNodes.forEach((n) => { n.isActive = true; });
      render(<BoundedContextTree />);
      expect(screen.getByRole('button', { name: /继续到流程树/i })).toBeInTheDocument();
    });

    it('"继续到流程树" button calls advancePhase', () => {
      mockCtxNodes.forEach((n) => { n.isActive = true; });
      render(<BoundedContextTree />);
      fireEvent.click(screen.getByRole('button', { name: /继续到流程树/i }));
      expect(mockAdvancePhase).toHaveBeenCalledTimes(1);
    });

    it('button label includes "已全部确认" when all isActive', () => {
      mockCtxNodes.forEach((n) => { n.isActive = true; });
      render(<BoundedContextTree />);
      expect(screen.getByRole('button', { name: /已全部确认.*流程树/i })).toBeInTheDocument();
    });

    it('button NOT visible when no nodes', () => {
      mockCtxNodes.length = 0;
      render(<BoundedContextTree />);
      expect(screen.queryByRole('button', { name: /继续/i })).not.toBeInTheDocument();
    });
  });
});
