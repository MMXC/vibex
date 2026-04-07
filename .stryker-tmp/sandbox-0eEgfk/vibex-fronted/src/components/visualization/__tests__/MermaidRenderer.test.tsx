/**
 * Tests for MermaidRenderer component
 */
// @ts-nocheck


import React from 'react';
import { render, screen } from '@testing-library/react';
import { MermaidRenderer } from '../MermaidRenderer';
import type { MermaidVisualizationData } from '@/types/visualization';

// Mock the useMermaidVisualization hook
const mockUseMermaidVisualization = jest.fn();

jest.mock('@/hooks/useMermaidVisualization', () => ({
  useMermaidVisualization: (...args: unknown[]) =>
    mockUseMermaidVisualization(...args),
}));

function makeMermaidData(raw: string): MermaidVisualizationData {
  return { type: 'mermaid', raw };
}

function mockHook(overrides: Partial<{
  svg: string;
  isRendering: boolean;
  error: string | null;
  nodeInfo: Array<{ id: string; label: string; type: string }>;
}>) {
  mockUseMermaidVisualization.mockReturnValue({
    svg: '',
    isRendering: false,
    error: null,
    code: '',
    rerender: jest.fn(),
    clear: jest.fn(),
    nodeInfo: [],
    clickNode: jest.fn(),
    ...overrides,
  });
}

describe('MermaidRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----- Normal rendering -----

  it('should render SVG when data is provided and rendering succeeds', () => {
    const svg = '<svg><rect/></svg>';
    mockHook({ svg, isRendering: false, error: null });

    render(<MermaidRenderer data={makeMermaidData('graph TD; A-->B')} />);

    const container = screen.getByTestId('mermaid-renderer');
    expect(container).toBeInTheDocument();
    expect(container.querySelector('.svgWrapper')?.innerHTML).toContain('<svg>');
  });

  it('should call hook with the raw code string', () => {
    mockHook({ svg: '', isRendering: false, error: null });

    render(<MermaidRenderer data={makeMermaidData('graph TD; A-->B')} />);

    expect(mockUseMermaidVisualization).toHaveBeenCalledWith('graph TD; A-->B');
  });

  it('should pass className to container', () => {
    mockHook({ svg: '<svg/>', isRendering: false, error: null });

    render(<MermaidRenderer data={makeMermaidData('graph TD; A-->B')} className="my-class" />);

    const container = screen.getByTestId('mermaid-renderer');
    expect(container).toHaveClass('my-class');
  });

  // ----- Error state -----

  it('should render error state when hook reports an error', () => {
    mockHook({ svg: '', isRendering: false, error: 'Syntax error in diagram' });

    render(<MermaidRenderer data={makeMermaidData('invalid mermaid')} />);

    expect(screen.getByTestId('mermaid-error')).toBeInTheDocument();
    expect(screen.getByText('Syntax error in diagram')).toBeInTheDocument();
  });

  // ----- Loading state -----

  it('should render loading skeleton when hook reports isRendering=true', () => {
    mockHook({ svg: '', isRendering: true, error: null });

    render(<MermaidRenderer data={makeMermaidData('graph TD; A-->B')} />);

    expect(screen.getByTestId('mermaid-loading')).toBeInTheDocument();
    expect(screen.getByTestId('mermaid-skeleton')).toBeInTheDocument();
  });

  // ----- Empty / null data -----

  it('should render empty state when data is null', () => {
    mockHook({});

    render(<MermaidRenderer data={null} />);

    expect(screen.getByTestId('mermaid-empty')).toBeInTheDocument();
    expect(screen.getByText('No mermaid data')).toBeInTheDocument();
  });

  it('should render empty state when data is undefined', () => {
    mockHook({});

    render(<MermaidRenderer data={undefined} />);

    expect(screen.getByTestId('mermaid-empty')).toBeInTheDocument();
  });

  it('should render empty state when data type is mermaid but code is empty', () => {
    mockHook({ svg: '', isRendering: false, error: null });

    render(<MermaidRenderer data={makeMermaidData('')} />);

    expect(screen.getByTestId('mermaid-empty')).toBeInTheDocument();
  });
});
