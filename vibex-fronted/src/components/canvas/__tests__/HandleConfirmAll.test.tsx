/**
 * Tests for handleConfirmAll functionality (Epic B1)
 *
 * Tests the "全选确认" button (BoundedContextTree) and
 * "确认所有节点后继续" button (ComponentTree)
 *
 * Tests the confirmAll logic:
 * - Button visible when hasNodes (> 0 nodes)
 * - Button hidden when allConfirmed OR when no nodes
 * - Clicking confirms all unconfirmed nodes
 * - Phase advances after confirming
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
  { nodeId: 'ctx-1', name: '用户管理', description: '描述', status: 'pending' as const, confirmed: false, children: [] },
  { nodeId: 'ctx-2', name: '订单管理', description: '描述', status: 'pending' as const, confirmed: false, children: [] },
  { nodeId: 'ctx-3', name: '商品管理', description: '描述', status: 'pending' as const, confirmed: false, children: [] },
];

const mockCompNodes: ComponentNode[] = [
  { nodeId: 'comp-1', flowId: 'flow-1', name: '首页组件', type: 'page' as const, props: { layout: 'full-width' }, api: { method: 'GET' as const, path: '/api/home' }, children: [], confirmed: false, status: 'pending' as const },
  { nodeId: 'comp-2', flowId: 'flow-1', name: '详情页组件', type: 'detail' as const, props: { layout: 'container' }, api: { method: 'GET' as const, path: '/api/detail/:id' }, children: [], confirmed: false, status: 'pending' as const },
];

const mockConfirmCtx = jest.fn();
const mockAdvancePhase = jest.fn();
const mockConfirmComp = jest.fn();
const mockSetPhase = jest.fn();

// =============================================================================
// Mock canvasStore — single state object with BOTH ctx and comp nodes
// =============================================================================
jest.mock('@/lib/canvas/canvasStore', () => ({
  useCanvasStore: jest.fn((selector) => {
    const state = {
      // BoundedContextTree selectors
      contextNodes: mockCtxNodes,
      confirmContextNode: mockConfirmCtx,
      advancePhase: mockAdvancePhase,
      addContextDraft: jest.fn(),
      updateContextDraft: jest.fn(),
      deleteContextDraft: jest.fn(),
      // ComponentTree selectors
      componentNodes: mockCompNodes,
      confirmComponentNode: mockConfirmComp,
      setPhase: mockSetPhase,
      addComponentNode: jest.fn(),
      editComponentNode: jest.fn(),
      deleteComponentNode: jest.fn(),
      setComponentNodes: jest.fn(),
      // Shared selectors
      flowNodes: [
        { nodeId: 'flow-1', name: '流程1', type: 'business-flow' as const, status: 'pending' as const, confirmed: false, children: [], steps: [] },
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
// Tests: BoundedContextTree handleConfirmAll
// =============================================================================
describe('BoundedContextTree handleConfirmAll (B1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCtxNodes.length = 0;
    mockCtxNodes.push(
      { nodeId: 'ctx-1', name: '用户管理', description: '描述', status: 'pending' as const, confirmed: false, children: [] },
      { nodeId: 'ctx-2', name: '订单管理', description: '描述', status: 'pending' as const, confirmed: false, children: [] },
      { nodeId: 'ctx-3', name: '商品管理', description: '描述', status: 'pending' as const, confirmed: false, children: [] },
    );
  });

  it('renders confirm-all button when hasNodes', () => {
    render(<BoundedContextTree />);
    expect(screen.getByRole('button', { name: /确认所有节点后继续/i })).toBeInTheDocument();
  });

  it('confirms all unconfirmed nodes when clicked', () => {
    render(<BoundedContextTree />);
    fireEvent.click(screen.getByRole('button', { name: /确认所有节点后继续/i }));
    expect(mockConfirmCtx).toHaveBeenCalledTimes(3);
    expect(mockConfirmCtx).toHaveBeenCalledWith('ctx-1');
    expect(mockConfirmCtx).toHaveBeenCalledWith('ctx-2');
    expect(mockConfirmCtx).toHaveBeenCalledWith('ctx-3');
  });

  it('advances phase after confirming all', () => {
    render(<BoundedContextTree />);
    fireEvent.click(screen.getByRole('button', { name: /确认所有节点后继续/i }));
    expect(mockAdvancePhase).toHaveBeenCalledTimes(1);
  });

  it('does NOT render confirm-all button when all already confirmed', () => {
    mockCtxNodes.forEach((n) => { n.confirmed = true; });
    render(<BoundedContextTree />);
    expect(screen.queryByRole('button', { name: /确认所有节点后继续/i })).not.toBeInTheDocument();
  });

  it('button NOT visible when no nodes', () => {
    mockCtxNodes.length = 0;
    render(<BoundedContextTree />);
    expect(screen.queryByRole('button', { name: /确认所有节点后继续/i })).not.toBeInTheDocument();
  });
});

// =============================================================================
// Tests: ComponentTree handleConfirmAll
// =============================================================================
describe('ComponentTree handleConfirmAll (B1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCompNodes.length = 0;
    mockCompNodes.push(
      { nodeId: 'comp-1', flowId: 'flow-1', name: '首页组件', type: 'page' as const, props: { layout: 'full-width' }, api: { method: 'GET' as const, path: '/api/home' }, children: [], confirmed: false, status: 'pending' as const },
      { nodeId: 'comp-2', flowId: 'flow-1', name: '详情页组件', type: 'detail' as const, props: { layout: 'container' }, api: { method: 'GET' as const, path: '/api/detail/:id' }, children: [], confirmed: false, status: 'pending' as const },
    );
  });

  it('renders confirm-all button when hasNodes', () => {
    render(<ComponentTree />);
    expect(screen.getByRole('button', { name: /确认所有节点后继续/i })).toBeInTheDocument();
  });

  it('confirms all unconfirmed nodes when clicked', () => {
    render(<ComponentTree />);
    fireEvent.click(screen.getByRole('button', { name: /确认所有节点后继续/i }));
    expect(mockConfirmComp).toHaveBeenCalledTimes(2);
    expect(mockConfirmComp).toHaveBeenCalledWith('comp-1');
    expect(mockConfirmComp).toHaveBeenCalledWith('comp-2');
  });

  it('sets phase to prototype after confirming all', () => {
    render(<ComponentTree />);
    fireEvent.click(screen.getByRole('button', { name: /确认所有节点后继续/i }));
    expect(mockSetPhase).toHaveBeenCalledWith('prototype');
  });

  it('does NOT render confirm-all button when all already confirmed', () => {
    mockCompNodes.forEach((n) => { n.confirmed = true; });
    render(<ComponentTree />);
    // When all confirmed, aria-label changes to "已全部确认，继续到原型生成"
    expect(screen.queryByRole('button', { name: /确认所有节点后继续/i })).not.toBeInTheDocument();
  });

  it('button NOT visible when no nodes', () => {
    mockCompNodes.length = 0;
    render(<ComponentTree />);
    expect(screen.queryByRole('button', { name: /确认所有节点后继续/i })).not.toBeInTheDocument();
  });
});
