/**
 * Tests for FlowRenderer component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FlowRenderer } from '../FlowRenderer';
import type { FlowVisualizationRaw } from '@/types/visualization';

// Mock FlowEditor to avoid ReactFlow rendering in tests
jest.mock('@/components/ui/FlowEditor', () => ({
  __esModule: true,
  default: jest.fn(({ initialNodes, initialEdges, showMiniMap, ...props }) => (
    <div data-testid="mock-flow-editor">
      <span data-testid="mock-node-count">{initialNodes?.length ?? 0}</span>
      <span data-testid="mock-edge-count">{initialEdges?.length ?? 0}</span>
      <span data-testid="mock-minimap">{String(showMiniMap ?? true)}</span>
      <span data-testid="mock-props">{JSON.stringify(Object.keys(props))}</span>
    </div>
  )),
}));

// Mock visualizationStore to isolate FlowRenderer — returns empty by default
jest.mock('@/stores/visualizationStore', () => ({
  useVisualizationStore: jest.fn(() => ({
    visualizationData: null,
    options: {
      zoom: 1,
      selectedNodeId: null,
      searchQuery: '',
      showMinimap: true,
    },
    setOption: jest.fn(),
  })),
}));

describe('FlowRenderer', () => {
  const minimalData: FlowVisualizationRaw = {
    nodes: [
      { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      { id: 'n2', position: { x: 100, y: 100 }, data: { label: 'End' } },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state when data is null', () => {
    render(<FlowRenderer data={null as unknown as FlowVisualizationRaw} />);
    expect(screen.getByText(/No flow data/i)).toBeInTheDocument();
  });

  it('should render empty state when nodes and edges are empty', () => {
    render(<FlowRenderer data={{ nodes: [], edges: [] }} />);
    expect(screen.getByText(/Empty flow/i)).toBeInTheDocument();
  });

  it('should render flow editor when data is provided', () => {
    render(<FlowRenderer data={minimalData} />);
    expect(screen.getByTestId('mock-flow-editor')).toBeInTheDocument();
  });

  it('should pass correct node and edge counts to FlowEditor', () => {
    render(<FlowRenderer data={minimalData} />);
    expect(screen.getByTestId('mock-node-count').textContent).toBe('2');
    expect(screen.getByTestId('mock-edge-count').textContent).toBe('1');
  });

  it('should apply className prop', () => {
    render(<FlowRenderer data={minimalData} className="my-flow" />);
    const container = screen.getByTestId('flow-renderer');
    expect(container).toHaveClass('my-flow');
  });

  it('should override showMinimap from prop', () => {
    render(<FlowRenderer data={minimalData} showMinimap={false} />);
    expect(screen.getByTestId('mock-minimap').textContent).toBe('false');
  });

  it('should pass onNodeClick prop', () => {
    const onNodeClick = jest.fn();
    render(<FlowRenderer data={minimalData} onNodeClick={onNodeClick} />);
    // The prop should be passed (FlowEditor mock captures it)
    const propsEl = screen.getByTestId('mock-props');
    expect(propsEl.textContent).toContain('onNodeClick');
  });

  it('should pass onInit prop', () => {
    const onInit = jest.fn();
    render(<FlowRenderer data={minimalData} onInit={onInit} />);
    const propsEl = screen.getByTestId('mock-props');
    expect(propsEl.textContent).toContain('onInit');
  });

  it('should pass onConnect prop', () => {
    const onConnect = jest.fn();
    render(<FlowRenderer data={minimalData} onConnect={onConnect} />);
    const propsEl = screen.getByTestId('mock-props');
    expect(propsEl.textContent).toContain('onConnect');
  });
});
