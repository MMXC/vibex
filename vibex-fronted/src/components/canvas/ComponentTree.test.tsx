/**
 * ComponentTree.test.tsx
 *
 * Epic 2: E2 checkbox UX fix
 * - Checkbox before title, on same line
 * - No nodeTypeBadge (type shown via border color)
 * - Toggle via toggleNodeSelect()
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentTree } from './ComponentTree';
import type { ComponentNode } from '@/lib/canvas/types';

const mockCompNodes: ComponentNode[] = [
  { nodeId: 'comp-1', name: '首页', type: 'page', flowId: 'flow-1', props: {}, api: { method: 'GET', path: '/api/home', params: [] }, status: 'pending', children: [] },
  { nodeId: 'comp-2', name: '列表页', type: 'list', flowId: 'flow-1', props: {}, api: { method: 'GET', path: '/api/list', params: [] }, status: 'pending', children: [] },
  { nodeId: 'comp-3', name: '弹窗', type: 'modal', flowId: '__ungrouped__', props: {}, api: { method: 'POST', path: '/api/modal', params: [] }, status: 'pending', children: [] },
];

const mockFlowNodes = [
  { nodeId: 'flow-1', name: '患者管理', steps: [], status: 'pending' as const },
];
const mockSetPhase = jest.fn();
const mockToggleNodeSelect = jest.fn();
const mockSelectAllNodes = jest.fn();
const mockClearNodeSelection = jest.fn();
const mockDeleteSelectedNodes = jest.fn();
const mockSetComponentNodes = jest.fn();
const mockDeleteComponentNode = jest.fn();
const mockEditComponentNode = jest.fn();

// =============================================================================
// Mock canvasStore
// =============================================================================
jest.mock('@/lib/canvas/canvasStore', () => ({
  useCanvasStore: jest.fn((selector) => {
    const state = {
      componentNodes: mockCompNodes,
      flowNodes: mockFlowNodes,
      setPhase: mockSetPhase,
      addComponentNode: jest.fn(),
      editComponentNode: mockEditComponentNode,
      deleteComponentNode: mockDeleteComponentNode,
      setComponentNodes: mockSetComponentNodes,
      toggleNodeSelect: mockToggleNodeSelect,
      selectAllNodes: mockSelectAllNodes,
      clearNodeSelection: mockClearNodeSelection,
      deleteSelectedNodes: mockDeleteSelectedNodes,
      selectedNodeIds: { context: [] as string[], component: [] as string[], flow: [] as string[] },
      phase: 'component',
      activeTree: 'component',
      setActiveTree: jest.fn(),
      autoGenerateFlows: jest.fn(),
      loadExampleData: jest.fn(),
    };
    return selector(state);
  }),
}));

jest.mock('@/components/ui/Toast', () => ({
  useToast: jest.fn(() => ({ showToast: jest.fn() })),
}));

// =============================================================================
// Tests
// =============================================================================
describe('ComponentTree — Epic 2: E2 checkbox UX fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all component nodes', () => {
    render(<ComponentTree />);
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('列表页')).toBeInTheDocument();
    expect(screen.getByText('弹窗')).toBeInTheDocument();
  });

  // E2-AC1: Checkbox before title, inline (T4)
  it('checkbox is on same line as title (E2-AC1)', () => {
    render(<ComponentTree />);
    const nodeCard = screen.getByText('首页').closest('[data-node-id]');
    expect(nodeCard).toBeInTheDocument();
    // The card header should contain checkbox + title, check checkbox appears before title text
    const header = nodeCard?.querySelector('[class*="nodeCardHeader"]');
    expect(header).toBeInTheDocument();
    // Checkbox is inside header
    const checkbox = header?.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeInTheDocument();
    // Title (h4) is also in header
    const title = header?.querySelector('h4');
    expect(title).toBeInTheDocument();
  });

  // E2-AC2: No nodeTypeBadge (T5)
  it('has no nodeTypeBadge element (E2-AC2)', () => {
    render(<ComponentTree />);
    // nodeTypeBadge had text like 页面/列表/弹窗 — these should not appear as badges
    // Verify type text is NOT in badge form
    const badges = document.querySelectorAll('[class*="nodeTypeBadge"]');
    expect(badges).toHaveLength(0);
  });

  // E2-AC3: Toggle works (T5)
  it('clicking checkbox calls toggleNodeSelect (E2-AC3)', async () => {
    const user = userEvent.setup();
    render(<ComponentTree />);
    const firstCard = screen.getByText('首页').closest('[data-node-id]');
    const checkbox = firstCard?.querySelector('input[type="checkbox"]') as HTMLElement;
    expect(checkbox).toBeInTheDocument();
    await user.click(checkbox);
    expect(mockToggleNodeSelect).toHaveBeenCalledWith('component', 'comp-1');
  });

  it('has AI generate button', () => {
    render(<ComponentTree />);
    expect(screen.getByText(/AI 生成组件/)).toBeInTheDocument();
  });

  it('has phase advance button when nodes exist', () => {
    render(<ComponentTree />);
    expect(screen.getByText(/继续到原型生成/)).toBeInTheDocument();
  });
});
