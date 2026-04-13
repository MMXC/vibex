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

  it('renders four tabs including prototype', () => {
    render(<TabBar />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
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

  // S1.1: accessibility — no tab is disabled regardless of phase
  it('S1.1: no tab is disabled regardless of phase', async () => {
    useContextStore.setState({ activeTree: 'context', phase: 'input' });
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');
    // All tabs accessible — no locked behavior
    tabs.forEach((tab) => {
      expect(tab).not.toHaveAttribute('aria-disabled', 'true');
      expect(tab).not.toHaveAttribute('disabled');
    });
  });

  it('S1.1: clicking any tab works regardless of current phase', async () => {
    useContextStore.setState({ activeTree: 'context', phase: 'input' });
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');

    // Flow tab (index 1) should have aria-selected=false before click
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

    // Click flow tab (should work even when phase='input' — no locked behavior)
    await act(async () => { fireEvent.click(tabs[1]); });

    // After click, flow tab should be selected
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  // --- Epic1 prototype tab tests ---

  it('prototype tab shows correct emoji 🚀', () => {
    render(<TabBar />);
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('prototype tab shows label 原型', () => {
    render(<TabBar />);
    expect(screen.getByText('原型')).toBeInTheDocument();
  });

  it('prototype tab is NOT locked regardless of current phase (AC-1.2.1)', () => {
    useContextStore.setState({ phase: 'input', activeTree: 'context' });
    render(<TabBar />);
    const prototypeTab = screen.getByText('原型').closest('[role="tab"]')!;
    expect(prototypeTab).not.toHaveAttribute('aria-disabled', 'true');
    expect(prototypeTab).not.toBeDisabled();
  });

  it('clicking prototype tab calls setPhase with prototype (AC-1.2.2)', async () => {
    const user = userEvent.setup();
    useContextStore.setState({ phase: 'component', activeTree: 'component' });
    render(<TabBar />);
    const prototypeTab = screen.getByText('原型').closest('button')!;
    await user.click(prototypeTab);
    expect(useContextStore.getState().phase).toBe('prototype');
  });

  it('prototype tab is active when phase === prototype (AC-1.2.3)', () => {
    useContextStore.setState({ phase: 'prototype', activeTree: 'context' });
    render(<TabBar />);
    const prototypeTab = screen.getByText('原型').closest('[role="tab"]')!;
    expect(prototypeTab).toHaveAttribute('aria-selected', 'true');
  });

  it('prototype tab shows queue count from sessionStore (AC-1.3.1)', () => {
    useSessionStore.setState({
      prototypeQueue: [
        { pageId: '1', componentId: 'c1', name: 'Page1', status: 'queued', progress: 0, retryCount: 0 } as PrototypePage,
        { pageId: '2', componentId: 'c2', name: 'Page2', status: 'done', progress: 100, retryCount: 0 } as PrototypePage,
      ],
    });
    render(<TabBar />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('prototype tab is inactive when phase !== prototype', () => {
    useContextStore.setState({ phase: 'context', activeTree: 'context' });
    render(<TabBar />);
    const prototypeTab = screen.getByText('原型').closest('[role="tab"]')!;
    expect(prototypeTab).toHaveAttribute('aria-selected', 'false');
  });
});
