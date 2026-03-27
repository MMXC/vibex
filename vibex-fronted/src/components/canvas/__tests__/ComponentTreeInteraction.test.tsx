/**
 * Tests for ComponentTree interaction features (Epic 3)
 *
 * Tests focus on:
 * - F3.1: data-testid attributes on nodes and expand toggles
 * - F3.2: Click-to-jump opens window with correct URL
 * - F3.3: Hover adds 'hovered' class to node
 * - F3.4: Collapsed nodes show child count badge
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentTree } from '../ComponentTree';
import type { ComponentNode } from '@/lib/canvas/types';

// Mock useToast hook
jest.mock('@/components/ui/Toast', () => ({
  useToast: jest.fn(() => ({
    toasts: [],
    showToast: jest.fn(),
    hideToast: jest.fn(),
  })),
}));

// Mock canvasStore
jest.mock('@/lib/canvas/canvasStore', () => ({
  useCanvasStore: jest.fn((selector) => {
    const state = {
      componentNodes: mockNodes,
      addComponentNode: jest.fn(),
      editComponentNode: jest.fn(),
      deleteComponentNode: jest.fn(),
      confirmComponentNode: jest.fn(),
      setComponentNodes: jest.fn(),
      flowNodes: [],
      setPhase: jest.fn(),
    };
    return selector(state);
  }),
}));

const mockNodes: ComponentNode[] = [
  {
    nodeId: 'comp-1',
    flowId: 'flow-1',
    name: '首页组件',
    type: 'page',
    props: { layout: 'full-width' },
    api: { method: 'GET', path: '/api/home' },
    children: ['comp-1-child-1', 'comp-1-child-2', 'comp-1-child-3'],
    confirmed: false,
    status: 'pending',
  },
  {
    nodeId: 'comp-2',
    flowId: 'flow-1',
    name: '详情页组件',
    type: 'detail',
    props: { layout: 'container' },
    api: { method: 'GET', path: '/api/detail/:id' },
    children: [],
    confirmed: false,
    status: 'pending',
    previewUrl: 'https://example.com/preview/detail',
  },
  {
    nodeId: 'comp-3',
    flowId: 'flow-1',
    name: '表单组件',
    type: 'form',
    props: {},
    api: { method: 'POST', path: '/api/form' },
    children: [],
    confirmed: false,
    status: 'pending',
  },
];

describe('ComponentTree Epic3 — Interaction Features', () => {
  // Store the original window.open
  const originalOpen = window.open;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.open
    window.open = jest.fn();
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  describe('F3.1 — data-testid attributes', () => {
    it('renders component nodes with data-testid="component-node-{id}"', () => {
      render(<ComponentTree />);
      const node1 = screen.getByTestId('component-node-comp-1');
      const node2 = screen.getByTestId('component-node-comp-2');
      const node3 = screen.getByTestId('component-node-comp-3');
      expect(node1).toBeInTheDocument();
      expect(node2).toBeInTheDocument();
      expect(node3).toBeInTheDocument();
    });

    it('renders expand toggles with data-testid="expand-toggle-{id}"', () => {
      render(<ComponentTree />);
      const toggle1 = screen.getByTestId('expand-toggle-comp-1');
      const toggle2 = screen.getByTestId('expand-toggle-comp-2');
      expect(toggle1).toBeInTheDocument();
      expect(toggle2).toBeInTheDocument();
    });
  });

  describe('F3.2 — Click-to-jump navigation', () => {
    it('opens previewUrl when node is clicked', () => {
      render(<ComponentTree />);
      const node2 = screen.getByTestId('component-node-comp-2');
      fireEvent.click(node2);
      expect(window.open).toHaveBeenCalledWith(
        'https://example.com/preview/detail',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('opens vscode deep link when node has api.path but no previewUrl', () => {
      render(<ComponentTree />);
      const node1 = screen.getByTestId('component-node-comp-1');
      fireEvent.click(node1);
      expect(window.open).toHaveBeenCalledWith(
        'vscode://file/root/.openclaw/vibex/vibex-fronted/src/app/api-home',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('opens window when node has api.path even without previewUrl', () => {
      render(<ComponentTree />);
      // comp-3 has api.path '/api/form' — should open
      const node3 = screen.getByTestId('component-node-comp-3');
      fireEvent.click(node3);
      expect(window.open).toHaveBeenCalledWith(
        'vscode://file/root/.openclaw/vibex/vibex-fronted/src/app/api-form',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('F3.3 — Hover highlight', () => {
    it('adds "hovered" class when node is hovered', () => {
      render(<ComponentTree />);
      const node1 = screen.getByTestId('component-node-comp-1');
      expect(node1).not.toHaveClass('hovered');
      fireEvent.mouseEnter(node1);
      expect(node1).toHaveClass('hovered');
    });

    it('removes "hovered" class when mouse leaves', () => {
      render(<ComponentTree />);
      const node1 = screen.getByTestId('component-node-comp-1');
      fireEvent.mouseEnter(node1);
      expect(node1).toHaveClass('hovered');
      fireEvent.mouseLeave(node1);
      expect(node1).not.toHaveClass('hovered');
    });
  });

  describe('F3.4 — Subtree count badge', () => {
    it('shows child count in expand button when node has children', () => {
      render(<ComponentTree />);
      const toggle1 = screen.getByTestId('expand-toggle-comp-1');
      // Initially collapsed: should show "(3)"
      expect(toggle1).toHaveTextContent(/\(3\)/);
    });

    it('does not show child count when node has no children', () => {
      render(<ComponentTree />);
      const toggle2 = screen.getByTestId('expand-toggle-comp-2');
      // No children → no count badge
      expect(toggle2).not.toHaveTextContent(/\(\d+\)/);
    });

    it('updates expand button text when expanded', () => {
      render(<ComponentTree />);
      const toggle1 = screen.getByTestId('expand-toggle-comp-1');
      // Expand
      fireEvent.click(toggle1);
      // Expanded: shows "▲" with count removed
      expect(toggle1).toHaveTextContent('▲');
    });
  });
});
