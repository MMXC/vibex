/**
 * PerformanceMonitor.test.tsx — S81-E3
 * 画布性能监控面板测试
 *
 * Covers:
 * - E3.2: Collapsed state (click header to toggle)
 * - E3.3: Node count and edge count displayed
 * - E3.3: Metrics hidden when collapsed
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PerformanceMonitor } from '../PerformanceMonitor';

// Stable mock module-level functions
const _mockGetNodes = vi.fn<() => any[]>().mockReturnValue([]);
const _mockGetEdges = vi.fn<() => any[]>().mockReturnValue([]);

let _getNodesCallCount = 0;
let _getEdgesCallCount = 0;

vi.mock('@xyflow/react', () => {
  return {
    useReactFlow: vi.fn(() => ({
      getNodes: (...args: any[]) => { _getEdgesCallCount++; return _mockGetNodes(...args); },
      getEdges: (...args: any[]) => { _getNodesCallCount++; return _mockGetEdges(...args); },
    })),
  };
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset return values BEFORE each render
    _mockGetNodes.mockReturnValue([]);
    _mockGetEdges.mockReturnValue([]);
    _getNodesCallCount = 0;
    _getEdgesCallCount = 0;
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderMonitor = () => render(<PerformanceMonitor />);

  it('renders header with "性能监控" label', () => {
    renderMonitor();
    expect(screen.getByText('性能监控')).toBeInTheDocument();
  });

  it('renders FPS, node, edge labels', () => {
    renderMonitor();
    expect(screen.getByText('FPS')).toBeInTheDocument();
    expect(screen.getByText('节点')).toBeInTheDocument();
    expect(screen.getByText('连线')).toBeInTheDocument();
  });

  it('metrics section is visible by default (not collapsed)', () => {
    renderMonitor();
    expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
  });

  it('data-testid=performance-monitor is rendered', () => {
    renderMonitor();
    expect(screen.getByTestId('performance-monitor')).toBeInTheDocument();
  });

  it('clicking header collapses metrics section (aria-expanded changes)', () => {
    renderMonitor();
    const headerBtn = screen.getByRole('button', { name: /性能监控/i });
    expect(headerBtn).toHaveAttribute('aria-expanded', 'true');

    // Collapse
    fireEvent.click(headerBtn);
    expect(headerBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('performance-metrics')).not.toBeInTheDocument();
  });

  it('clicking collapsed header expands metrics section', () => {
    renderMonitor();
    const headerBtn = screen.getByRole('button', { name: /性能监控/i });

    // Collapse
    fireEvent.click(headerBtn);
    expect(screen.queryByTestId('performance-metrics')).not.toBeInTheDocument();

    // Expand back
    fireEvent.click(headerBtn);
    expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
  });

  it('displays node count from getNodes()', () => {
    // Override BEFORE render
    _mockGetNodes.mockReturnValue([{ id: '1' }, { id: '2' }, { id: '3' }]);
    renderMonitor();
    expect(screen.getByTestId('perf-node-value')).toHaveTextContent('3');
  });

  it('displays edge count from getEdges()', () => {
    _mockGetEdges.mockReturnValue([{ id: 'e1' }, { id: 'e2' }]);
    renderMonitor();
    expect(screen.getByTestId('perf-edge-value')).toHaveTextContent('2');
  });

  it('displays 0 nodes when canvas is empty', () => {
    renderMonitor();
    expect(screen.getByTestId('perf-node-value')).toHaveTextContent('0');
  });

  it('displays 0 edges when canvas has no connections', () => {
    renderMonitor();
    expect(screen.getByTestId('perf-edge-value')).toHaveTextContent('0');
  });
});
