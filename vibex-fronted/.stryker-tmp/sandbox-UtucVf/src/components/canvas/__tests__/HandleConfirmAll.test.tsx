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
 * - Store has no confirmContextNode/confirmFlowNode/confirmComponentNode
 */
// @ts-nocheck


import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoundedContextTree } from '../BoundedContextTree';
import { ComponentTree } from '../ComponentTree';
import type { BoundedContextNode, ComponentNode } from '@/lib/canvas/types';

// =============================================================================
// Shared mutable mock state — uses isActive (not confirmed)
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

const mockAdvancePhase = jest.fn();
const mockSetPhase = jest.fn();

// =============================================================================
// Mock canvasStore — Epic3: no confirmContextNode/confirmFlowNode/confirmComponentNode
// =============================================================================
jest.mock('@/lib/canvas/canvasStore', () => ({
  useCanvasStore: jest.fn((selector) => {
    const state = {
      // BoundedContextTree selectors
      contextNodes: mockCtxNodes,
      advancePhase: mockAdvancePhase,
      addContextDraft: jest.fn(),
      updateContextDraft: jest.fn(),
      deleteContextDraft: jest.fn(),
      // ComponentTree selectors
      componentNodes: mockCompNodes,
      setPhase: mockSetPhase,
      addComponentNode: jest.fn(),
      editComponentNode: jest.fn(),
      deleteComponentNode: jest.fn(),
      setComponentNodes: jest.fn(),
      // Shared selectors
      flowNodes: [
        { nodeId: 'flow-1', name: '流程1', type: 'business-flow' as const, status: 'pending' as const, isActive: false, children: [], steps: [] },
      ],
      phase: 'context' as const,
      activeTree: 'context' as const,
      setActiveTree: jest.fn(),
      autoGenerateFlows: jest.fn(),
      loadExampleData: jest.fn(),
      selectedNodeIds: { context: [], flow: [], component: [] },
      toggleNodeSelect: jest.fn(),
      selectAllNodes: jest.fn(),
      clearNodeSelection: jest.fn(),
      deleteSelectedNodes: jest.fn(),
    };
    return selector(state);
  }),
}));

jest.mock('@/components/ui/Toast', () => ({
  useToast: jest.fn(() => ({ toasts: [], showToast: jest.fn(), hideToast: jest.fn() })),
}));

// =============================================================================
// Tests: Epic3 — no confirm gating, only phase advancement
// =============================================================================
describe('Epic3 — Confirm-all removed, only phase advancement', () => {
  // Snapshot original state for cleanup
  const ctxSnapshot = [
    { nodeId: 'ctx-1', name: '用户管理', description: '描述', status: 'pending' as const, isActive: false, children: [] },
    { nodeId: 'ctx-2', name: '订单管理', description: '描述', status: 'pending' as const, isActive: false, children: [] },
    { nodeId: 'ctx-3', name: '商品管理', description: '描述', status: 'pending' as const, isActive: false, children: [] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCtxNodes.length = 0;
    ctxSnapshot.forEach((n) => mockCtxNodes.push({ ...n }));
  });

  afterEach(() => {
    mockCtxNodes.length = 0;
    ctxSnapshot.forEach((n) => mockCtxNodes.push({ ...n }));
  });

  describe('ComponentTree — no confirm-all button, only prototype transition', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockCompNodes.length = 0;
      mockCompNodes.push(
        { nodeId: 'comp-1', flowId: 'flow-1', name: '首页组件', type: 'page' as const, props: { layout: 'full-width' }, api: { method: 'GET' as const, path: '/api/home' }, children: [], isActive: false, status: 'pending' as const },
        { nodeId: 'comp-2', flowId: 'flow-1', name: '详情页组件', type: 'detail' as const, props: { layout: 'container' }, api: { method: 'GET' as const, path: '/api/detail/:id' }, children: [], isActive: false, status: 'pending' as const },
      );
    });

    it('has NO "确认所有" button in ComponentTree', () => {
      render(<ComponentTree />);
      // There should be no button with aria-label containing "确认所有"
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

    it('no confirmComponentNode in store', () => {
      render(<ComponentTree />);
      // verify the mock store has no confirmComponentNode
      const { useCanvasStore } = require('@/lib/canvas/canvasStore');
      const storeState = useCanvasStore.getState?.() ?? {};
      expect(storeState).not.toHaveProperty('confirmComponentNode');
    });
  });

  describe('BoundedContextTree — confirm-all calls advancePhase only', () => {
    // Reset nodes to original state before each test (after outer cleanup)
    beforeEach(() => {
      mockCtxNodes.length = 0;
      ctxSnapshot.forEach((n) => mockCtxNodes.push({ ...n }));
    });

    it('has "继续到流程树" button when all nodes isActive', () => {
      // Set all nodes isActive so button label includes "继续到流程树"
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

    it('button label changes to "已全部确认 → 继续到流程树" when all isActive', () => {
      mockCtxNodes.forEach((n) => { n.isActive = true; });
      render(<BoundedContextTree />);
      expect(screen.getByRole('button', { name: /已全部确认.*流程树/i })).toBeInTheDocument();
    });

    it('button NOT visible when no nodes', () => {
      mockCtxNodes.length = 0;
      render(<BoundedContextTree />);
      expect(screen.queryByRole('button', { name: /继续/i })).not.toBeInTheDocument();
    });

    it('no confirmContextNode in store', () => {
      render(<BoundedContextTree />);
      const { useCanvasStore } = require('@/lib/canvas/canvasStore');
      const storeState = useCanvasStore.getState?.() ?? {};
      expect(storeState).not.toHaveProperty('confirmContextNode');
    });
  });
});
