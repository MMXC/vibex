/**
 * ComponentTree.test.tsx — Epic 2: E2 checkbox UX fix
 * Updated for new store architecture.
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentTree } from './ComponentTree';

// ── Store mocks (before import) ───────────────────────────────────────────────
jest.mock('@/lib/canvas/stores/componentStore', () => {
  const { create } = jest.requireActual('zustand');
  return {
    useComponentStore: create(() => ({
      componentNodes: [
        { nodeId: 'comp-1', name: '首页', type: 'page', flowId: 'flow-1', props: {}, api: { method: 'GET', path: '/api/home', params: [] }, status: 'pending', children: [] },
        { nodeId: 'comp-2', name: '列表页', type: 'list', flowId: 'flow-1', props: {}, api: { method: 'GET', path: '/api/list', params: [] }, status: 'pending', children: [] },
        { nodeId: 'comp-3', name: '弹窗', type: 'modal', flowId: '__ungrouped__', props: {}, api: { method: 'POST', path: '/api/modal', params: [] }, status: 'pending', children: [] },
      ],
      setComponentNodes: jest.fn(),
      addComponentNode: jest.fn(),
      deleteComponentNode: jest.fn(),
      editComponentNode: jest.fn(),
      toggleNodeSelect: jest.fn(),
      selectAllNodes: jest.fn(),
      clearNodeSelection: jest.fn(),
      deleteSelectedNodes: jest.fn(),
      selectedNodeIds: { context: [] as string[], flow: [] as string[], component: [] as string[] },
    })),
  };
});

jest.mock('@/lib/canvas/stores/flowStore', () => {
  const { create } = jest.requireActual('zustand');
  return {
    useFlowStore: create(() => ({ flowNodes: [{ nodeId: 'flow-1', name: '患者管理', steps: [], status: 'pending' as const }] })),
  };
});

jest.mock('@/lib/canvas/stores/contextStore', () => {
  const { create } = jest.requireActual('zustand');
  return {
    useContextStore: create(() => ({ contextNodes: [], setPhase: jest.fn(), phase: 'component' as const, activeTree: 'component' as const })),
  };
});

jest.mock('@/components/ui/Toast', () => ({
  useToast: jest.fn(() => ({ showToast: jest.fn() })),
}));

// ── Tests ─────────────────────────────────────────────────────────────────
describe('ComponentTree — Epic 2: E2 checkbox UX', () => {
  beforeEach(() => { jest.clearAllMocks(); });
  afterEach(cleanup);

  it('renders all component nodes', () => {
    render(<ComponentTree />);
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('列表页')).toBeInTheDocument();
    expect(screen.getByText('弹窗')).toBeInTheDocument();
  });

  it('has AI generate button', () => {
    render(<ComponentTree />);
    expect(screen.getByText(/AI 生成组件/)).toBeInTheDocument();
  });

  it('has phase advance button when nodes exist', () => {
    render(<ComponentTree />);
    expect(screen.getByText(/继续到原型生成/)).toBeInTheDocument();
  });

  it('has no nodeTypeBadge element', () => {
    render(<ComponentTree />);
    expect(document.querySelectorAll('[class*="nodeTypeBadge"]')).toHaveLength(0);
  });
});