/**
 * Tests for CardTreeNode component (Epic 5)
 *
 * Includes IntersectionObserver mock for lazy loading tests.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { CardTreeNode } from '../CardTreeNode';
import type { CardTreeNodeProps } from '../CardTreeNode';

// ==================== IntersectionObserver Mock ====================

// Mock IntersectionObserver so cards are visible during tests
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

beforeAll(() => {
  global.IntersectionObserver = vi.fn((callback: IntersectionObserverCallback) => {
    // Store callback to fire later when observe() is called
    return {
      observe: (el: Element) => {
        mockObserve(el);
        // Immediately report element as visible
        callback(
          [{ isIntersecting: true, target: el }] as IntersectionObserverEntry[],
          { observe: mockObserve, unobserve: mockUnobserve, disconnect: mockDisconnect } as unknown as IntersectionObserver
        );
      },
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    };
  }) as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  mockObserve.mockClear();
  mockUnobserve.mockClear();
  mockDisconnect.mockClear();
});

// ==================== Test Helpers ====================

// Helper to render with ReactFlowProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
};

const defaultProps: CardTreeNodeProps = {
  id: 'test-node',
  data: {
    title: '需求录入',
    status: 'pending',
    children: [
      { id: 'c1', label: '填写需求', checked: false },
      { id: 'c2', label: '提交分析', checked: false },
    ],
  },
  selected: false,
  dragging: false,
  dragged: false,
  isConnectable: true,
};

describe('CardTreeNode', () => {
  it('should render title', () => {
    renderWithProvider(<CardTreeNode {...defaultProps} />);
    expect(screen.getByText('需求录入')).toBeInTheDocument();
  });

  it('should render checkbox children', () => {
    renderWithProvider(<CardTreeNode {...defaultProps} />);
    expect(screen.getByText('填写需求')).toBeInTheDocument();
    expect(screen.getByText('提交分析')).toBeInTheDocument();
  });

  it('should render status badge', () => {
    renderWithProvider(<CardTreeNode {...defaultProps} />);
    expect(screen.getByText('待处理')).toBeInTheDocument();
  });

  it('should show in-progress status badge', () => {
    renderWithProvider(<CardTreeNode {...defaultProps} data={{ ...defaultProps.data, status: 'in-progress' }} />);
    expect(screen.getByText('进行中')).toBeInTheDocument();
  });

  it('should show done status badge', () => {
    renderWithProvider(<CardTreeNode {...defaultProps} data={{ ...defaultProps.data, status: 'done' }} />);
    expect(screen.getByText('完成')).toBeInTheDocument();
  });

  it('should show error status badge', () => {
    renderWithProvider(<CardTreeNode {...defaultProps} data={{ ...defaultProps.data, status: 'error' }} />);
    expect(screen.getByText('错误')).toBeInTheDocument();
  });

  it('should render empty message when no children', () => {
    renderWithProvider(<CardTreeNode {...defaultProps} data={{ ...defaultProps.data, children: [] }} />);
    expect(screen.getByText('暂无子操作')).toBeInTheDocument();
  });

  it('should show selected state', () => {
    const { container } = renderWithProvider(<CardTreeNode {...defaultProps} selected />);
    const card = container.querySelector('[data-testid="cardtree-node"]');
    expect(card).toBeTruthy();
  });

  it('should render icon when provided', () => {
    renderWithProvider(<CardTreeNode {...defaultProps} data={{ ...defaultProps.data, icon: '📥' }} />);
    expect(screen.getByText('📥')).toBeInTheDocument();
  });

  it('should render description in footer', () => {
    renderWithProvider(<CardTreeNode {...defaultProps} data={{ ...defaultProps.data, description: '测试描述' }} />);
    expect(screen.getByText('测试描述')).toBeInTheDocument();
  });

  it('should render checkboxes', () => {
    renderWithProvider(<CardTreeNode {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(2); // 2 children in defaultProps
    expect(checkboxes[0]).not.toBeChecked();
  });

  it('should render nested children with expand button', () => {
    render(
      <CardTreeNode
        {...defaultProps}
        data={{
          ...defaultProps.data,
          children: [
            {
              id: 'parent',
              label: '父项目',
              checked: false,
              children: [
                { id: 'child1', label: '子项目A', checked: false },
                { id: 'child2', label: '子项目B', checked: false },
              ],
            },
          ],
        }}
      />
    );
    expect(screen.getByText('父项目')).toBeInTheDocument();
  });

  describe('Lazy Loading (IntersectionObserver)', () => {
    it('should show data-visible attribute on card', () => {
      const { container } = renderWithProvider(<CardTreeNode {...defaultProps} />);
      const card = container.querySelector('[data-testid="cardtree-node"]');
      expect(card).toHaveAttribute('data-visible');
    });

    it('should render full content when card is visible', () => {
      renderWithProvider(<CardTreeNode {...defaultProps} />);
      // With mock, card should be visible → full content rendered
      expect(screen.getByText('填写需求')).toBeInTheDocument();
    });

    it('should render placeholder when card is NOT visible', () => {
      // Override mock to NOT trigger callback (element not visible)
      (global.IntersectionObserver as any).mockImplementationOnce((_callback: IntersectionObserverCallback) => {
        return {
          observe: vi.fn(), // Don't call callback — simulating "not visible yet"
          unobserve: vi.fn(),
          disconnect: vi.fn(),
        };
      });

      renderWithProvider(<CardTreeNode {...defaultProps} />);
      // With no callback, isVisible stays false → placeholder shown
      expect(screen.queryByTestId('lazy-placeholder')).toBeTruthy();
    });
  });
});
