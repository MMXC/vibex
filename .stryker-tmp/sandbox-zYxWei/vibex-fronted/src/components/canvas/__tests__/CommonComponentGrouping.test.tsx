/**
 * E2: Common Component Grouping Tests
 *
 * Tests for Epic E2: 通用组件独立分组并置顶
 * - F2.1: Common component data model (isCommon inference)
 * - F2.2: Common component dashed border style
 *
 * Key constraints:
 * - Must not delete existing tests
 * - Must not modify ComponentNode core fields
 * - Must not modify canvasStore core slice
 */
// @ts-nocheck


import { render, screen } from '@testing-library/react';
import { ComponentTree } from '../ComponentTree';
import type { ComponentNode, BusinessFlowNode } from '@/lib/canvas/types';

// Mock useToast hook
jest.mock('@/components/ui/Toast', () => ({
  useToast: jest.fn(() => ({
    toasts: [],
    showToast: jest.fn(),
    hideToast: jest.fn(),
  })),
}));

// Mock canvasStore with both common and page-specific components
jest.mock('@/lib/canvas/canvasStore', () => ({
  useCanvasStore: jest.fn((selector) => {
    const state = {
      componentNodes: mockComponentNodes,
      addComponentNode: jest.fn(),
      editComponentNode: jest.fn(),
      deleteComponentNode: jest.fn(),
      setComponentNodes: jest.fn(),
      flowNodes: mockFlowNodes,
      setPhase: jest.fn(),
      // F3-F10: Multi-select state (required by ComponentTree)
      selectedNodeIds: { context: [], flow: [], component: [] },
      toggleNodeSelect: jest.fn(),
      selectAllNodes: jest.fn(),
      clearNodeSelection: jest.fn(),
      deleteSelectedNodes: jest.fn(),
    };
    return selector(state);
  }),
}));

// Mock flow nodes for page labels
const mockFlowNodes: BusinessFlowNode[] = [
  {
    nodeId: 'flow-1',
    contextId: 'ctx-1',
    name: '用户登录流程',
    steps: [],
    isActive: true,
    status: 'confirmed',
    children: [],
  },
  {
    nodeId: 'flow-2',
    contextId: 'ctx-1',
    name: '订单管理流程',
    steps: [],
    isActive: true,
    status: 'confirmed',
    children: [],
  },
];

// Mock component nodes: mix of common and page-specific
const mockComponentNodes: ComponentNode[] = [
  // Common components (flowId = 'mock'/'manual'/empty)
  {
    nodeId: 'comp-common-1',
    flowId: 'mock',
    name: '通用弹窗',
    type: 'modal',
    props: { size: 'md' },
    api: { method: 'GET', path: '/api/modal' },
    children: [],
    isActive: false,
    status: 'pending',
  },
  {
    nodeId: 'comp-common-2',
    flowId: 'manual',
    name: '表单验证组件',
    type: 'form',
    props: {},
    api: { method: 'POST', path: '/api/form' },
    children: [],
    isActive: false,
    status: 'pending',
  },
  {
    nodeId: 'comp-common-3',
    flowId: '',
    name: '空flowId组件',
    type: 'modal',
    props: {},
    api: { method: 'GET', path: '/api/common' },
    children: [],
    isActive: false,
    status: 'pending',
  },
  // Page-specific components
  {
    nodeId: 'comp-page-1',
    flowId: 'flow-1',
    name: '登录表单',
    type: 'form',
    props: { layout: 'full-width' },
    api: { method: 'POST', path: '/api/login' },
    children: [],
    isActive: false,
    status: 'pending',
  },
  {
    nodeId: 'comp-page-2',
    flowId: 'flow-1',
    name: '登录按钮',
    type: 'detail',
    props: {},
    api: { method: 'GET', path: '/api/login' },
    children: [],
    isActive: false,
    status: 'pending',
  },
  {
    nodeId: 'comp-page-3',
    flowId: 'flow-2',
    name: '订单列表',
    type: 'list',
    props: { layout: 'container' },
    api: { method: 'GET', path: '/api/orders' },
    children: [],
    isActive: false,
    status: 'pending',
  },
];

describe('E2: Common Component Grouping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('F2.1: Common component data model', () => {
    it('renders common components at the top of the list', () => {
      render(<ComponentTree />);

      // Get all group wrappers
      const groups = screen.getAllByRole('group');

      // First group should be the common components group
      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0]).toHaveAttribute('data-is-common', 'true');
    });

    it('renders common components with isCommon="true" attribute', () => {
      render(<ComponentTree />);

      // Find the common group wrapper
      const commonGroup = screen.getByRole('group', { name: /通用组件/ });
      expect(commonGroup).toHaveAttribute('data-is-common', 'true');
    });

    it('renders page-specific components in separate groups', () => {
      render(<ComponentTree />);

      // Find page-specific groups
      const commonGroup = screen.getByRole('group', { name: /通用组件/ });
      const allGroups = screen.getAllByRole('group');

      // Should have at least 3 groups: 1 common + 2 page-specific (flow-1, flow-2)
      expect(allGroups.length).toBeGreaterThanOrEqual(3);

      // Non-common groups should have isCommon="false"
      allGroups.forEach((group) => {
        if (group !== commonGroup) {
          expect(group).toHaveAttribute('data-is-common', 'false');
        }
      });
    });

    it('renders common group label with distinct text', () => {
      render(<ComponentTree />);

      // Common group label should contain the wrench emoji and text
      const commonLabel = screen.getByText(/🔧 通用组件/);
      expect(commonLabel).toBeInTheDocument();
    });

    it('shows correct count of common components', () => {
      render(<ComponentTree />);

      // Common group should show (3) for 3 common components
      // The label and count are in separate elements, so check both
      const commonLabel = screen.getByText(/🔧 通用组件/);
      expect(commonLabel).toBeInTheDocument();
      // Check the count (3) is in a sibling element
      const count = screen.getByText(/\(3\)/);
      expect(count).toBeInTheDocument();
    });

    it('renders modal type components as common', () => {
      render(<ComponentTree />);

      // Find the modal component in common group
      const modalComponent = screen.getByTestId('component-node-comp-common-1');
      expect(modalComponent).toBeInTheDocument();

      // The modal should be in the common group
      const commonGroup = screen.getByRole('group', { name: /通用组件/ });
      expect(commonGroup).toContainElement(modalComponent);
    });

    it('renders components with flowId=mock as common', () => {
      render(<ComponentTree />);

      // Component with flowId='mock' should be in common group
      const commonGroup = screen.getByRole('group', { name: /通用组件/ });
      const mockComponent = screen.getByTestId('component-node-comp-common-1');
      expect(commonGroup).toContainElement(mockComponent);
    });

    it('renders components with flowId=manual as common', () => {
      render(<ComponentTree />);

      // Component with flowId='manual' should be in common group
      const commonGroup = screen.getByRole('group', { name: /通用组件/ });
      const manualComponent = screen.getByTestId('component-node-comp-common-2');
      expect(commonGroup).toContainElement(manualComponent);
    });

    it('renders page-specific components in their own groups', () => {
      render(<ComponentTree />);

      // Find flow-1 group
      const flow1Group = screen.getByRole('group', { name: /📄 用户登录流程/ });
      expect(flow1Group).toBeInTheDocument();

      // Find flow-2 group
      const flow2Group = screen.getByRole('group', { name: /📄 订单管理流程/ });
      expect(flow2Group).toBeInTheDocument();
    });
  });

  describe('F2.2: Common component dashed border style', () => {
    it('applies data-is-common attribute to group wrapper for CSS styling', () => {
      render(<ComponentTree />);

      const commonGroup = screen.getByRole('group', { name: /通用组件/ });
      expect(commonGroup).toHaveAttribute('data-is-common', 'true');
    });

    it('applies data-is-common attribute to group label for CSS styling', () => {
      render(<ComponentTree />);

      const commonLabel = screen.getByText(/🔧 通用组件/);
      expect(commonLabel).toHaveAttribute('data-is-common', 'true');
    });

    it('common group label has distinct styling attributes', () => {
      render(<ComponentTree />);

      const commonLabel = screen.getByText(/🔧 通用组件/);
      // Should have data-is-common="true" for CSS targeting
      expect(commonLabel).toHaveAttribute('data-is-common', 'true');

      // Should have data-group-label attribute
      expect(commonLabel).toHaveAttribute('data-group-label');
    });

    it('non-common groups have isCommon="false" for CSS styling', () => {
      render(<ComponentTree />);

      const flow1Group = screen.getByRole('group', { name: /📄 用户登录流程/ });
      expect(flow1Group).toHaveAttribute('data-is-common', 'false');

      const flow2Group = screen.getByRole('group', { name: /📄 订单管理流程/ });
      expect(flow2Group).toHaveAttribute('data-is-common', 'false');
    });
  });

  describe('Edge cases', () => {
    it('handles empty component list gracefully', () => {
      // Test the groupByFlowId function directly with empty nodes
      const { groupByFlowId } = require('../ComponentTree');
      const emptyNodes: ComponentNode[] = [];
      const groups = groupByFlowId(emptyNodes, []);
      
      // Empty nodes should produce empty groups
      expect(groups.length).toBe(0);
    });

    it('handles all common components (no page-specific)', () => {
      // Test the groupByFlowId function directly with common-only nodes
      const { groupByFlowId } = require('../ComponentTree');
      const commonOnlyNodes: ComponentNode[] = [
        {
          nodeId: 'comp-1',
          flowId: 'mock',
          name: '通用弹窗',
          type: 'modal',
          props: {},
          api: { method: 'GET', path: '/api/modal' },
          children: [],
          isActive: false,
          status: 'pending',
        },
      ];
      const groups = groupByFlowId(commonOnlyNodes, []);
      
      // Should produce exactly one common group
      expect(groups.length).toBe(1);
      expect(groups[0].isCommon).toBe(true);
    });

    it('handles all page-specific components (no common)', () => {
      // Test the groupByFlowId function directly with page-only nodes
      const { groupByFlowId } = require('../ComponentTree');
      const pageOnlyNodes: ComponentNode[] = [
        {
          nodeId: 'comp-1',
          flowId: 'flow-1',
          name: '登录页面',
          type: 'page',
          props: {},
          api: { method: 'GET', path: '/api/login' },
          children: [],
          isActive: false,
          status: 'pending',
        },
      ];
      const groups = groupByFlowId(pageOnlyNodes, mockFlowNodes);
      
      // Should produce exactly one page group, no common group
      expect(groups.length).toBe(1);
      expect(groups[0].isCommon).toBe(false);
      expect(groups[0].label).toContain('用户登录流程');
    });
  });
});
