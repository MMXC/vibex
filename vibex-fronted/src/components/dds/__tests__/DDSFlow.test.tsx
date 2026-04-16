/**
 * DDSFlow Unit Tests
 * Epic 2b: ReactFlow集成
 *
 * Tests the existing DDSFlow component which:
 * - Provides ReactFlowProvider
 * - Syncs store → ReactFlow via useDDSCanvasFlow
 * - Renders CardRenderer as nodeTypes
 * - Handles node click → onSelectCard
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// ============================================
// Mock @xyflow/react
// ============================================

vi.mock('@xyflow/react', () => {
  const ReactFlowProvider = vi.fn(({ children }: any) => (
    <div data-testid="rf-provider">{children}</div>
  ));

  const ReactFlow = vi.fn((props: any) => (
    <div data-testid="react-flow" data-nodes={props.nodes?.length} data-edges={props.edges?.length}>
      {props.children}
    </div>
  ));

  return {
    ReactFlow,
    ReactFlowProvider,
    Background: vi.fn(() => <div data-testid="rf-background" />),
    Controls: vi.fn(() => <div data-testid="rf-controls" />),
    MiniMap: vi.fn(() => <div data-testid="rf-minimap" />),
    useReactFlow: vi.fn(() => ({
      getNodes: () => [],
      getEdges: () => [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      project: vi.fn((pos: any) => pos),
    })),
    BackgroundVariant: { Lines: 'lines', Dots: 'dots', Cross: 'cross' },
  };
});

// ============================================
// Mock stores/hooks
// ============================================

const mockCards = [
  {
    id: 'card-1',
    type: 'flow' as const,
    chapter: 'flow' as const,
    title: 'User Login',
    data: {
      stepId: 'step-1',
      stepName: 'User Login',
      description: 'User enters credentials',
      flowType: 'user_action' as const,
      inputs: [],
      outputs: [],
      conditions: [],
      systemPrompt: '',
      llmConfig: {},
    },
    position: { x: 100, y: 200 },
    createdAt: '2026-04-16T00:00:00.000Z',
  },
];

const mockEdges = [
  { id: 'edge-1', source: 'card-1', target: 'card-2', label: 'submit' },
];

vi.mock('@/hooks/dds/useDDSCanvasFlow', () => ({
  useDDSCanvasFlow: vi.fn((chapter: string, initNodes?: any[], initEdges?: any[]) => ({
    nodes: initNodes ?? mockCards.map((c) => ({
      id: c.id,
      type: 'flow-step',
      position: c.position ?? { x: 0, y: 0 },
      data: { card: c },
    })),
    edges: initEdges ?? mockEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: 'smoothstep',
      animated: true,
    })),
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onConnect: vi.fn(),
    setNodes: vi.fn(),
    setEdges: vi.fn(),
  })),
}));

vi.mock('@/components/dds/cards', () => ({
  CardRenderer: vi.fn(({ card }: any) => (
    <div data-testid="card-renderer" data-card-id={card?.id}>
      {card?.title ?? 'Card'}
    </div>
  )),
}));

// ============================================
// Import component under test
// ============================================

import DDSFlow from '../DDSFlow';

describe('DDSFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders ReactFlow canvas', () => {
    render(<DDSFlow chapter="flow" />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('renders Background, Controls, MiniMap', () => {
    render(<DDSFlow chapter="flow" />);
    expect(screen.getByTestId('rf-background')).toBeInTheDocument();
    expect(screen.getByTestId('rf-controls')).toBeInTheDocument();
    expect(screen.getByTestId('rf-minimap')).toBeInTheDocument();
  });

  it('wraps in ReactFlowProvider', () => {
    render(<DDSFlow chapter="flow" />);
    expect(screen.getByTestId('rf-provider')).toBeInTheDocument();
  });

  it('passes nodes to ReactFlow', () => {
    render(<DDSFlow chapter="flow" />);
    expect(screen.getByTestId('react-flow')).toHaveAttribute('data-nodes', '1');
  });

  it('passes edges to ReactFlow', () => {
    render(<DDSFlow chapter="flow" />);
    expect(screen.getByTestId('react-flow')).toHaveAttribute('data-edges', '1');
  });

  it('accepts initialNodes override', () => {
    const customNodes = [{ id: 'custom', type: 'flow-step', position: { x: 0, y: 0 }, data: { card: mockCards[0] } }];
    render(<DDSFlow chapter="flow" initialNodes={customNodes} />);
    expect(screen.getByTestId('react-flow')).toHaveAttribute('data-nodes', '1');
  });

  it('accepts chapter prop', () => {
    render(<DDSFlow chapter="requirement" />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('accepts onSelectCard callback', () => {
    const handleSelect = vi.fn();
    render(<DDSFlow chapter="flow" onSelectCard={handleSelect} />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });
});
