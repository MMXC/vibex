/**
 * ProtoFlowCanvas — Unit Tests
 * Epic1: E1-U2
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProtoFlowCanvas } from '../ProtoFlowCanvas';
import { usePrototypeStore } from '@/stores/prototypeStore';

// ============================================
// Mock @xyflow/react
// ============================================

// ============================================
// Mock @xyflow/react
// ============================================

vi.mock('@xyflow/react', () => {
  const ReactFlowProvider = vi.fn(({ children }: any) => <div>{children}</div>);

  const ReactFlow = vi.fn((props: any) => (
    <div data-testid="react-flow" data-nodes={props.nodes?.length} data-edges={props.edges?.length}>
      {/* Simulate drag-over */}
      <div
        data-testid="rf-dropzone"
        onDragOver={(e: any) => props.onDragOver?.(e)}
        onDrop={(e: any) => props.onDrop?.(e)}
      />
      {props.children}
    </div>
  ));

  const Background = vi.fn(() => <div data-testid="rf-background" />);
  const Controls = vi.fn(() => <div data-testid="rf-controls" />);
  const MiniMap = vi.fn(() => <div data-testid="rf-minimap" />);

  return {
    ReactFlow,
    ReactFlowProvider,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant: { Lines: 'lines', Dots: 'dots', Cross: 'cross' },
    useNodesState: vi.fn((init) => {
      const { useState } = require('react');
      return useState(init);
    }),
    useEdgesState: vi.fn((init) => {
      const { useState } = require('react');
      return useState(init);
    }),
    applyNodeChanges: vi.fn((changes, nodes) => nodes),
    applyEdgeChanges: vi.fn((changes, edges) => edges),
  };
});

// ============================================
// Mock PresenceAvatars
// ============================================

vi.mock('@/components/canvas/Presence/PresenceAvatars', () => ({
  // null canvasId → Firebase not configured → renders null, but container div in ProtoFlowCanvas still exists
  PresenceAvatars: vi.fn(({ canvasId }: { canvasId: string | null }) => {
    if (!canvasId) return null;
    return <div data-testid="presence-avatars-inner">mock avatars</div>;
  }),
}));

vi.mock('@/lib/firebase/presence', () => ({
  usePresence: vi.fn(() => ({
    others: [],
    updateCursor: vi.fn(),
    isAvailable: false,
    isConnected: false,
  })),
}));


// ============================================
// Tests
// ============================================

describe('ProtoFlowCanvas', () => {
  beforeEach(() => {
    usePrototypeStore.setState({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      pages: [{ id: 'page-1', name: '首页', route: '/' }],
    });
    vi.clearAllMocks();
    cleanup();
  });

  it('renders ReactFlow container', () => {
    render(<ProtoFlowCanvas />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('renders Background component', () => {
    render(<ProtoFlowCanvas />);
    expect(screen.getByTestId('rf-background')).toBeInTheDocument();
  });

  it('renders Controls component', () => {
    render(<ProtoFlowCanvas />);
    expect(screen.getByTestId('rf-controls')).toBeInTheDocument();
  });

  it('renders MiniMap component', () => {
    render(<ProtoFlowCanvas />);
    expect(screen.getByTestId('rf-minimap')).toBeInTheDocument();
  });

  // E1-U2: Empty canvas shows hint
  it('shows empty state hint when no nodes', () => {
    render(<ProtoFlowCanvas />);
    expect(screen.getByText('从左侧拖拽组件到画布')).toBeInTheDocument();
  });

  // E1-U2: Adding a node hides empty hint
  it('hides empty hint when nodes exist', () => {
    const { addNode } = usePrototypeStore.getState();
    addNode({ id: 'c1', type: 'button', name: 'Button', props: {} }, { x: 100, y: 100 });
    render(<ProtoFlowCanvas />);
    expect(screen.queryByText('从左侧拖拽组件到画布')).not.toBeInTheDocument();
  });

  // E1-U2: Canvas displays empty state when no nodes exist
  it('shows empty hint when canvas has no nodes', () => {
    render(<ProtoFlowCanvas />);
    expect(screen.getByText('从左侧拖拽组件到画布')).toBeInTheDocument();
  });

  // E1-U2: Adding nodes hides empty hint
  it('hides empty hint when nodes exist', () => {
    act(() => {
      usePrototypeStore.getState().addNode(
        { id: 'c1', type: 'button', name: 'Button', props: {} },
        { x: 0, y: 0 }
      );
    });
    render(<ProtoFlowCanvas />);
    expect(screen.queryByText('从左侧拖拽组件到画布')).not.toBeInTheDocument();
  });

  // E05: Firebase 未配置时无 console.error
  it('does not throw console.error when Firebase is not configured', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ProtoFlowCanvas />);
    // PresenceAvatars with null canvasId → isAvailable=false → renders null
    // No error should be thrown
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // E05: PresenceAvatars container exists
  it('renders presence-avatars container', () => {
    render(<ProtoFlowCanvas />);
    expect(screen.getByTestId('presence-avatars')).toBeInTheDocument();
  });
});
