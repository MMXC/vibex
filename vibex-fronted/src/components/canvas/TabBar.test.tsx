/**
 * TabBar.test.tsx
 * Epic: canvas-three-tree-unification | Epic1: Tab 切换器 + 废除 phase
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabBar } from './TabBar';
import { useCanvasStore } from '@/lib/canvas/canvasStore';

describe('TabBar', () => {
  beforeEach(() => {
    // Reset store to known state
    useCanvasStore.setState({
      activeTree: 'context',
      contextNodes: [],
      flowNodes: [],
      componentNodes: [],
    });
  });

  it('renders three tabs', () => {
    render(<TabBar />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('shows correct tab labels', () => {
    render(<TabBar />);
    expect(screen.getByText('上下文')).toBeInTheDocument();
    expect(screen.getByText('流程')).toBeInTheDocument();
    expect(screen.getByText('组件')).toBeInTheDocument();
  });

  it('sets the first tab as active by default', () => {
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('clicking a tab updates activeTree in store', () => {
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');

    // Click "流程" tab
    fireEvent.click(tabs[1]);
    expect(useCanvasStore.getState().activeTree).toBe('flow');

    // Click "组件" tab
    fireEvent.click(tabs[2]);
    expect(useCanvasStore.getState().activeTree).toBe('component');
  });

  it('updates aria-selected on tab click', () => {
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');

    fireEvent.click(tabs[1]); // Click "流程"
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('shows node counts when nodes exist', () => {
    useCanvasStore.setState({
      contextNodes: [{ id: '1', name: 'Ctx1' } as never],
      flowNodes: [{ id: '2' }, { id: '3' }] as never[],
      componentNodes: [] as never[],
    });

    render(<TabBar />);
    expect(screen.getByText('1')).toBeInTheDocument(); // context count
    expect(screen.getByText('2')).toBeInTheDocument(); // flow count
  });

  it('calls onTabChange callback when tab is clicked', () => {
    const onTabChange = jest.fn();
    render(<TabBar onTabChange={onTabChange} />);
    const tabs = screen.getAllByRole('tab');

    fireEvent.click(tabs[1]);
    expect(onTabChange).toHaveBeenCalledWith('flow');
  });
});
