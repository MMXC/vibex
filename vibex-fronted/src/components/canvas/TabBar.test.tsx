import { vi } from 'vitest';
/**
 * TabBar.test.tsx
 * Epic: canvas-three-tree-unification | Epic1: Tab 切换器 + 废除 phase
 */

import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabBar } from './TabBar';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import type { PrototypePage } from '@/lib/canvas/types';

describe('TabBar', () => {
  beforeEach(() => {
    // Reset stores — use the correct store (contextStore, not canvasStore)
    useContextStore.setState({
      activeTree: 'context',
      phase: 'component', // 'component' unlocks all tabs
      contextNodes: [],
    });
    useFlowStore.setState({ flowNodes: [] });
    useComponentStore.setState({ componentNodes: [] });
  });

  // Phase='component' → 3 tabs (context, flow, component); prototype requires phase='prototype'
  it('renders three tree tabs in component phase (E4: prototype tab requires prototype phase)', () => {
    render(<TabBar />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(screen.getByText('上下文')).toBeInTheDocument();
    expect(screen.getByText('流程')).toBeInTheDocument();
    expect(screen.getByText('组件')).toBeInTheDocument();
  });

  it('shows all 4 tabs in prototype phase', () => {
    useContextStore.setState({ phase: 'prototype', activeTree: null });
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
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

  it('clicking flow tab updates activeTree in store', async () => {
    const user = userEvent.setup();
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');

    // Click "流程" tab (index 1) — unlocked with phase='component'
    await user.click(tabs[1]);
    expect(useContextStore.getState().activeTree).toBe('flow');
  });

  it('clicking component tab updates activeTree in store', async () => {
    const user = userEvent.setup();
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');

    // Click "组件" tab (index 2) — unlocked with phase='component'
    await user.click(tabs[2]);
    expect(useContextStore.getState().activeTree).toBe('component');
  });

  it('updates aria-selected on tab click', async () => {
    const user = userEvent.setup();
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');

    await user.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('shows node counts when nodes exist', () => {
    useContextStore.setState({
      contextNodes: [{ id: '1', name: 'Ctx1' } as never],
    });
    useFlowStore.setState({ flowNodes: [{ id: '2' }, { id: '3' }] as never[] });
    useComponentStore.setState({ componentNodes: [] as never[] });

    render(<TabBar />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onTabChange callback when unlocked tab is clicked', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<TabBar onTabChange={onTabChange} />);
    const tabs = screen.getAllByRole('tab');

    await user.click(tabs[1]);
    expect(onTabChange).toHaveBeenCalledWith('flow');
  });

  it('S1.1: clicking flow tab in any phase updates activeTree', async () => {
    const user = userEvent.setup();
    useContextStore.setState({ activeTree: 'context', phase: 'input' });
    render(<TabBar />);
    // In input phase only context tab is visible
    const contextTab = screen.getByText('上下文').closest('[role="tab"]')!;
    expect(contextTab).toHaveAttribute('aria-selected', 'true');
  });

  // --- Epic1 prototype tab tests ---

  it('prototype tab is active when phase === prototype (AC-1.2.3)', () => {
    useContextStore.setState({ phase: 'prototype', activeTree: null });
    render(<TabBar />);
    const prototypeTab = screen.getByText('原型').closest('[role="tab"]')!;
    expect(prototypeTab).toHaveAttribute('aria-selected', 'true');
  });

  it('prototype tab hidden in component phase (E4: phase-gated visibility)', () => {
    useContextStore.setState({ phase: 'component', activeTree: 'component' });
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(screen.queryByText('原型')).not.toBeInTheDocument();
  });
});
