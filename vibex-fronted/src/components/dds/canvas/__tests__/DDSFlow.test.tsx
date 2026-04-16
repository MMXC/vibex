/**
 * DDSFlow (canvas) Unit Tests
 * Epic 2b: ReactFlow集成
 *
 * Tests canvas/DDSFlow.tsx which:
 * - Provides ReactFlowProvider
 * - Renders cards as ReactFlow nodes per chapter
 * - useDDSCanvasFlow hook for store ↔ view sync
 * - Background / Controls / MiniMap
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
    Background: vi.fn(() => <div data-testid="rf-bg" />),
    Controls: vi.fn(() => <div data-testid="rf-controls" />),
    MiniMap: vi.fn(() => <div data-testid="rf-minimap" />),
    useReactFlow: vi.fn(() => ({ fitView: vi.fn() })),
    BackgroundVariant: { Lines: 'lines', Dots: 'dots', Cross: 'cross' },
  };
});

// ============================================
// Mock hooks/services
// ============================================

const mockNodes = [
  {
    id: 'card-1',
    type: 'requirement',
    position: { x: 0, y: 0 },
    data: { card: { id: 'card-1', type: 'requirement', chapter: 'requirement' } },
  },
];

const mockEdges = [
  { id: 'edge-1', source: 'card-1', target: 'card-2', type: 'smoothstep', animated: false },
];

vi.mock('@/hooks/dds/useDDSCanvasFlow', () => ({
  useDDSCanvasFlow: vi.fn(() => ({
    nodes: mockNodes,
    edges: mockEdges,
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onConnect: vi.fn(),
  })),
}));

vi.mock('@/components/dds/cards/CardRenderer', () => ({
  default: vi.fn(({ card }: any) => (
    <div data-testid="card-renderer" data-card-id={card?.id}>
      {card?.title ?? 'Card'}
    </div>
  )),
}));

// ============================================
// Import after mocks
// ============================================

import DDSFlow from '../DDSFlow';

describe('DDSFlow (canvas)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders ReactFlowProvider', () => {
    render(<DDSFlow chapter="requirement" />);
    expect(screen.getByTestId('rf-provider')).toBeInTheDocument();
  });

  it('renders ReactFlow canvas', () => {
    render(<DDSFlow chapter="requirement" />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('passes nodes to ReactFlow', () => {
    render(<DDSFlow chapter="requirement" />);
    expect(screen.getByTestId('react-flow')).toHaveAttribute('data-nodes', '1');
  });

  it('passes edges to ReactFlow', () => {
    render(<DDSFlow chapter="requirement" />);
    expect(screen.getByTestId('react-flow')).toHaveAttribute('data-edges', '1');
  });

  it('renders Background, Controls, MiniMap', () => {
    render(<DDSFlow chapter="requirement" />);
    expect(screen.getByTestId('rf-bg')).toBeInTheDocument();
    expect(screen.getByTestId('rf-controls')).toBeInTheDocument();
    expect(screen.getByTestId('rf-minimap')).toBeInTheDocument();
  });

  it('renders for different chapters', () => {
    const { rerender } = render(<DDSFlow chapter="requirement" />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();

    rerender(<DDSFlow chapter="context" />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();

    rerender(<DDSFlow chapter="flow" />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(<DDSFlow chapter="requirement" className="my-custom-class" />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('accepts onSelectCard callback', () => {
    const handleSelect = vi.fn();
    render(<DDSFlow chapter="requirement" onSelectCard={handleSelect} />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });
});
