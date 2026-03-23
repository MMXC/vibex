/**
 * Tests for CardTreeNode component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardTreeNode } from '../CardTreeNode';
import type { CardTreeNodeProps } from '../CardTreeNode';

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
    render(<CardTreeNode {...defaultProps} />);
    expect(screen.getByText('需求录入')).toBeInTheDocument();
  });

  it('should render checkbox children', () => {
    render(<CardTreeNode {...defaultProps} />);
    expect(screen.getByText('填写需求')).toBeInTheDocument();
    expect(screen.getByText('提交分析')).toBeInTheDocument();
  });

  it('should render status badge', () => {
    render(<CardTreeNode {...defaultProps} />);
    expect(screen.getByText('待处理')).toBeInTheDocument();
  });

  it('should show in-progress status badge', () => {
    render(<CardTreeNode {...defaultProps} data={{ ...defaultProps.data, status: 'in-progress' }} />);
    expect(screen.getByText('进行中')).toBeInTheDocument();
  });

  it('should show done status badge', () => {
    render(<CardTreeNode {...defaultProps} data={{ ...defaultProps.data, status: 'done' }} />);
    expect(screen.getByText('完成')).toBeInTheDocument();
  });

  it('should show error status badge', () => {
    render(<CardTreeNode {...defaultProps} data={{ ...defaultProps.data, status: 'error' }} />);
    expect(screen.getByText('错误')).toBeInTheDocument();
  });

  it('should render empty message when no children', () => {
    render(<CardTreeNode {...defaultProps} data={{ ...defaultProps.data, children: [] }} />);
    expect(screen.getByText('暂无子操作')).toBeInTheDocument();
  });

  it('should show selected state', () => {
    const { container } = render(<CardTreeNode {...defaultProps} selected />);
    const card = container.querySelector('[data-testid="cardtree-node"]');
    expect(card).toBeTruthy();
  });

  it('should render icon when provided', () => {
    render(<CardTreeNode {...defaultProps} data={{ ...defaultProps.data, icon: '📥' }} />);
    expect(screen.getByText('📥')).toBeInTheDocument();
  });

  it('should render description in footer', () => {
    render(<CardTreeNode {...defaultProps} data={{ ...defaultProps.data, description: '测试描述' }} />);
    expect(screen.getByText('测试描述')).toBeInTheDocument();
  });

  it('should render checkboxes', () => {
    render(<CardTreeNode {...defaultProps} />);
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
});
