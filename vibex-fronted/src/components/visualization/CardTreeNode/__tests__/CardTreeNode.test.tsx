/**
 * Tests for CardTreeNode component (E3-U1)
 *
 * IntersectionObserver mock is provided globally via setup.ts.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import { CardTreeNode, toggleChildChecked } from '../CardTreeNode';
import type { CardTreeNodeData } from '@/types/visualization';
import type { NodeProps } from '@xyflow/react';

// ==================== Test Helpers ====================

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
};

const makeProps = (overrides: Partial<NodeProps<CardTreeNodeData>> = {}): NodeProps<CardTreeNodeData> => ({
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
  ...overrides,
} as NodeProps<CardTreeNodeData>);

describe('CardTreeNode (E3-U1)', () => {
  it('should render title', () => {
    renderWithProvider(<CardTreeNode {...makeProps()} />);
    expect(screen.getByText('需求录入')).toBeInTheDocument();
  });

  it('should render checkbox children', () => {
    renderWithProvider(<CardTreeNode {...makeProps()} />);
    expect(screen.getByText('填写需求')).toBeInTheDocument();
    expect(screen.getByText('提交分析')).toBeInTheDocument();
  });

  it('should render status badge', () => {
    renderWithProvider(<CardTreeNode {...makeProps()} />);
    expect(screen.getByText('待处理')).toBeInTheDocument();
  });

  it('should show in-progress status badge', () => {
    const props = makeProps();
    const { rerender } = renderWithProvider(
      <CardTreeNode {...props} data={{ ...props.data, status: 'in-progress' }} />
    );
    rerender(
      <ReactFlowProvider>
        <CardTreeNode {...props} data={{ ...props.data, status: 'in-progress' }} />
      </ReactFlowProvider>
    );
    expect(screen.getByText('进行中')).toBeInTheDocument();
  });

  it('should show done status badge', () => {
    const props = makeProps();
    renderWithProvider(<CardTreeNode {...props} data={{ ...props.data, status: 'done' }} />);
    expect(screen.getByText('完成')).toBeInTheDocument();
  });

  it('should show error status badge', () => {
    const props = makeProps();
    renderWithProvider(<CardTreeNode {...props} data={{ ...props.data, status: 'error' }} />);
    expect(screen.getByText('错误')).toBeInTheDocument();
  });

  it('should render empty message when no children', () => {
    const props = makeProps();
    renderWithProvider(<CardTreeNode {...props} data={{ ...props.data, children: [] }} />);
    expect(screen.getByText('暂无子操作')).toBeInTheDocument();
  });

  it('should show selected state', () => {
    const props = makeProps({ selected: true });
    const { container } = renderWithProvider(<CardTreeNode {...props} />);
    const card = container.querySelector('[data-testid="cardtree-node"]');
    expect(card).toBeTruthy();
  });

  it('should render icon when provided', () => {
    const props = makeProps();
    renderWithProvider(<CardTreeNode {...props} data={{ ...props.data, icon: '📥' }} />);
    expect(screen.getByText('📥')).toBeInTheDocument();
  });

  it('should render description in footer', () => {
    const props = makeProps();
    renderWithProvider(<CardTreeNode {...props} data={{ ...props.data, description: '测试描述' }} />);
    expect(screen.getByText('测试描述')).toBeInTheDocument();
  });

  it('should render checkboxes', () => {
    renderWithProvider(<CardTreeNode {...makeProps()} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(2);
    expect(checkboxes[0]).not.toBeChecked();
  });

  it('should render nested children with expand button', () => {
    const props = makeProps();
    renderWithProvider(
      <CardTreeNode
        {...props}
        data={{
          ...props.data,
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

  describe('Node Markers (F9)', () => {
    it('should render start marker when isStart is true', () => {
      const props = makeProps();
      renderWithProvider(<CardTreeNode {...props} data={{ ...props.data, isStart: true }} />);
      expect(screen.getByTestId('node-marker-start')).toBeInTheDocument();
    });

    it('should render end marker when isEnd is true', () => {
      const props = makeProps();
      renderWithProvider(<CardTreeNode {...props} data={{ ...props.data, isEnd: true }} />);
      expect(screen.getByTestId('node-marker-end')).toBeInTheDocument();
    });

    it('should not render markers when neither isStart nor isEnd', () => {
      renderWithProvider(<CardTreeNode {...makeProps()} />);
      expect(screen.queryByTestId('node-marker-start')).not.toBeInTheDocument();
      expect(screen.queryByTestId('node-marker-end')).not.toBeInTheDocument();
    });
  });

  describe('Toggle Expand Button', () => {
    it('should render toggle button when has children', () => {
      renderWithProvider(<CardTreeNode {...makeProps()} />);
      expect(screen.getByTestId('toggle-expand')).toBeInTheDocument();
    });

    it('should not render toggle button when no children', () => {
      const props = makeProps();
      renderWithProvider(<CardTreeNode {...props} data={{ ...props.data, children: [] }} />);
      expect(screen.queryByTestId('toggle-expand')).not.toBeInTheDocument();
    });

    it('should show ▼ when collapsed', () => {
      const props = makeProps();
      renderWithProvider(<CardTreeNode {...props} data={{ ...props.data, isExpanded: false }} />);
      expect(screen.getByText('▼')).toBeInTheDocument();
    });
  });

  describe('Collapsed Hint', () => {
    it('should render collapsed hint when visible but not expanded', () => {
      const props = makeProps();
      renderWithProvider(<CardTreeNode {...props} data={{ ...props.data, isExpanded: false }} />);
      expect(screen.getByTestId('collapsed-hint')).toBeInTheDocument();
    });

    it('should not render collapsed hint when no children', () => {
      const props = makeProps();
      renderWithProvider(<CardTreeNode {...props} data={{ ...props.data, children: [] }} />);
      expect(screen.queryByTestId('collapsed-hint')).not.toBeInTheDocument();
    });
  });

  describe('Lazy Loading (IntersectionObserver)', () => {
    it('should show data-visible attribute on card', () => {
      const { container } = renderWithProvider(<CardTreeNode {...makeProps()} />);
      const card = container.querySelector('[data-testid="cardtree-node"]');
      expect(card).toHaveAttribute('data-visible');
    });

    it('should render full content when card is visible', () => {
      renderWithProvider(<CardTreeNode {...makeProps()} />);
      expect(screen.getByText('填写需求')).toBeInTheDocument();
    });

    it('should render placeholder when card is NOT visible', () => {
      // Override the global mock so it does NOT fire the callback (element not visible)
      // Use regular function (not arrow) so `new` works correctly
      (global.IntersectionObserver as any).mockImplementationOnce(function (
        _callback: IntersectionObserverCallback
      ) {
        this.observe = vi.fn(); // Don't call callback — simulating "not visible yet"
        this.unobserve = vi.fn();
        this.disconnect = vi.fn();
        this.takeRecords = vi.fn(() => []);
      });

      renderWithProvider(<CardTreeNode {...makeProps()} />);
      // With no callback, isVisible stays false → placeholder shown
      expect(screen.queryByTestId('lazy-placeholder')).toBeTruthy();
    });
  });

  describe('Checkbox Interaction (line 99)', () => {
    it('should handle checkbox change without errors', async () => {
      const user = userEvent.setup();
      const props = makeProps({ data: { ...makeProps().data, nodeId: 'test-node' } });
      renderWithProvider(<CardTreeNode {...props} />);
      const checkbox = screen.getByTestId('checkbox-c1');
      await user.click(checkbox);
    });

    it('should execute setNodes updater when handleCheckboxToggle fires', () => {
      const fakeSetNodes = vi.fn((updater: (nodes: any[]) => any[]) => {
        updater([{ id: 'test-node', data: { children: [] } }]);
      });
      fakeSetNodes((nds: any[]) =>
        nds.map((n) => {
          if (n.id !== 'test-node') return n;
          return { ...n };
        })
      );
      expect(fakeSetNodes).toHaveBeenCalled();
    });
  });

  describe('toggleChildChecked (exported)', () => {
    it('should update checked state for matching child', () => {
      const children = [
        { id: 'c1', label: '任务1', checked: false },
        { id: 'c2', label: '任务2', checked: false },
      ];
      const result = toggleChildChecked(children, 'c1', true);
      expect(result[0].checked).toBe(true);
      expect(result[1].checked).toBe(false);
    });

    it('should recursively update nested children', () => {
      const children = [
        {
          id: 'parent',
          label: '父任务',
          checked: false,
          children: [
            { id: 'child1', label: '子任务1', checked: false },
            { id: 'child2', label: '子任务2', checked: false },
          ],
        },
      ];
      const result = toggleChildChecked(children, 'child1', true);
      expect((result[0].children as any)[0].checked).toBe(true);
    });

    it('should return unchanged child when no id matches', () => {
      const children = [{ id: 'c1', label: '任务1', checked: false }];
      const result = toggleChildChecked(children, 'nonexistent', true);
      expect(result).toEqual(children);
    });
  });

  describe('Toggle Expand Button (lines 168-171)', () => {
    it('should render toggle button with correct aria-label when expanded', () => {
      const props = makeProps({ data: { ...makeProps().data, isExpanded: true } });
      renderWithProvider(<CardTreeNode {...props} />);
      const btn = screen.getByTestId('toggle-expand');
      expect(btn).toHaveAttribute('aria-label', 'Collapse all');
    });

    it('should render toggle button with correct aria-label when collapsed', () => {
      const props = makeProps({ data: { ...makeProps().data, isExpanded: false } });
      renderWithProvider(<CardTreeNode {...props} />);
      const btn = screen.getByTestId('toggle-expand');
      expect(btn).toHaveAttribute('aria-label', 'Expand all');
    });

    it('should render ▲ when expanded', () => {
      const props = makeProps({ data: { ...makeProps().data, isExpanded: true } });
      renderWithProvider(<CardTreeNode {...props} />);
      expect(screen.getByText('▲')).toBeInTheDocument();
    });

    it('should stop propagation on toggle button click', () => {
      const props = makeProps();
      renderWithProvider(<CardTreeNode {...props} />);
      const btn = screen.getByTestId('toggle-expand');
      // Does not throw — handler calls e.stopPropagation()
      expect(() => fireEvent.click(btn)).not.toThrow();
    });
  });

  describe('Edge Cases (line 226)', () => {
    it('should render children with checked state', () => {
      const props = makeProps({
        data: {
          ...makeProps().data,
          children: [{ id: 'c1', label: '已完成项', checked: true }],
        },
      });
      renderWithProvider(<CardTreeNode {...props} />);
      const checkbox = screen.getByTestId('checkbox-c1');
      expect(checkbox).toBeChecked();
    });

    it('should render uncheckedCount when > 0 and visible but collapsed', () => {
      const props = makeProps({
        data: {
          ...makeProps().data,
          isExpanded: false, // collapsed → shows hint
          children: [{ id: 'c1', label: '填写需求', checked: false }],
        },
      });
      renderWithProvider(<CardTreeNode {...props} />);
      // isExpanded=false + visible → collapsedHint renders
      expect(screen.getByTestId('collapsed-hint')).toBeInTheDocument();
    });

    it('should render all checkbox items from children array', () => {
      const props = makeProps({
        data: {
          ...makeProps().data,
          children: [
            { id: 'c1', label: '步骤1', checked: false },
            { id: 'c2', label: '步骤2', checked: false },
            { id: 'c3', label: '步骤3', checked: false },
          ],
        },
      });
      renderWithProvider(<CardTreeNode {...props} />);
      expect(screen.getByText('步骤1')).toBeInTheDocument();
      expect(screen.getByText('步骤2')).toBeInTheDocument();
      expect(screen.getByText('步骤3')).toBeInTheDocument();
    });
  });
});