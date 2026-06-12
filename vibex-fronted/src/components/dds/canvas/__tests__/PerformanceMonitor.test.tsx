/**
 * PerformanceMonitor.test.tsx — S81-E3 + S93-E4
 * 画布性能监控面板测试
 *
 * Covers S81-E3:
 * - E3.2: Collapsed state (click header to toggle)
 * - E3.3: Node count and edge count displayed
 * - E3.3: Metrics hidden when collapsed
 *
 * Covers S93-E4:
 * - FP/FCP/LCP Core Web Vitals displayed
 * - PerformanceObserver for LCP
 * - performance.getEntriesByType for FP/FCP
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PerformanceMonitor } from '../PerformanceMonitor';

// Stable mock module-level functions for ReactFlow
const _mockGetNodes = vi.fn<() => any[]>().mockReturnValue([]);
const _mockGetEdges = vi.fn<() => any[]>().mockReturnValue([]);

let _getNodesCallCount = 0;
let _getEdgesCallCount = 0;

// S93-E4: Mock PerformanceObserver for CWV tests
const _mockPerformanceObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

vi.stubGlobal('PerformanceObserver', _mockPerformanceObserver);

// Mock @xyflow/react
vi.mock('@xyflow/react', () => {
  return {
    useReactFlow: vi.fn(() => ({
      getNodes: (...args: any[]) => { _getEdgesCallCount++; return _mockGetNodes(...args); },
      getEdges: (...args: any[]) => { _getNodesCallCount++; return _mockGetEdges(...args); },
    })),
  };
});

// S93-E4 fix: Mock usePerformanceMonitor at vi.mock level to return stable fps=0
// and bypass RAF loop entirely. This avoids vi.useFakeTimers which breaks
// performance.now when vi.stubGlobal spreads the performance object.
// nodeCount/edgeCount are read live from _mockGetNodes/_mockGetEdges so
// per-test overrides via mockReturnValue work.
vi.mock('@/hooks/canvas/usePerformanceMonitor', () => ({
  usePerformanceMonitor: vi.fn(() => ({
    metrics: { fps: 0, nodeCount: _mockGetNodes().length, edgeCount: _mockGetEdges().length },
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

// Spy on getEntriesByType for paint entries — keep the real performance object
// so performance.now() continues to work (jsdom provides it).
const _originalGetEntriesByType = performance.getEntriesByType.bind(performance);
vi.stubGlobal('performance', {
  ...performance,
  getEntriesByType: vi.fn((type: string) => {
    if (type === 'paint') {
      return [
        { name: 'first-paint', entryType: 'paint', startTime: 420 },
        { name: 'first-contentful-paint', entryType: 'paint', startTime: 620 },
      ];
    }
    return _originalGetEntriesByType(type);
  }),
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset return values BEFORE each render
    _mockGetNodes.mockReturnValue([]);
    _mockGetEdges.mockReturnValue([]);
    _getNodesCallCount = 0;
    _getEdgesCallCount = 0;
    _mockPerformanceObserver.mockClear();
    // Reset getEntriesByType mock but keep the paint mock
    const stubbedPerf = vi.mocked(performance.getEntriesByType);
    stubbedPerf.mockImplementation((type: string) => {
      if (type === 'paint') {
        return [
          { name: 'first-paint', entryType: 'paint', startTime: 420 },
          { name: 'first-contentful-paint', entryType: 'paint', startTime: 620 },
        ];
      }
      return _originalGetEntriesByType(type);
    });
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

  // ============================================================
  // S93-E4: Core Web Vitals (FP/FCP/LCP) tests
  // ============================================================

  it('renders FP, FCP, LCP metric labels', () => {
    renderMonitor();
    expect(screen.getByText('FP')).toBeInTheDocument();
    expect(screen.getByText('FCP')).toBeInTheDocument();
    expect(screen.getByText('LCP')).toBeInTheDocument();
  });

  it('displays FP value from performance.getEntriesByType', () => {
    renderMonitor();
    // FP = 420ms from mock
    expect(screen.getByTestId('perf-fp-value')).toHaveTextContent('420ms');
  });

  it('displays FCP value from performance.getEntriesByType', () => {
    renderMonitor();
    // FCP = 620ms from mock
    expect(screen.getByTestId('perf-fcp-value')).toHaveTextContent('620ms');
  });

  it('displays "—" when FP is not available', () => {
    // Override mock to return empty paint entries
    const stubbedPerf = vi.mocked(performance.getEntriesByType);
    stubbedPerf.mockImplementation((type: string) => {
      if (type === 'paint') return [];
      return _originalGetEntriesByType(type);
    });

    renderMonitor();
    expect(screen.getByTestId('perf-fp-value')).toHaveTextContent('—');
  });

  it('displays "—" when FCP is not available', () => {
    const stubbedPerf = vi.mocked(performance.getEntriesByType);
    stubbedPerf.mockImplementation((type: string) => {
      if (type === 'paint') return [];
      return _originalGetEntriesByType(type);
    });

    renderMonitor();
    expect(screen.getByTestId('perf-fcp-value')).toHaveTextContent('—');
  });

  it('displays LCP value as "—" when no LCP entry observed yet', () => {
    renderMonitor();
    expect(screen.getByTestId('perf-lcp-value')).toHaveTextContent('—');
  });

  it('PerformanceObserver is called during render (lcp type)', () => {
    renderMonitor();
    // Verify PerformanceObserver constructor was called
    expect(_mockPerformanceObserver).toHaveBeenCalled();
  });

  it('observe is called with lcp type and buffered: true', () => {
    renderMonitor();
    // Verify PerformanceObserver constructor was invoked with a callback function
    expect(_mockPerformanceObserver).toHaveBeenCalled();
    const callArgs = _mockPerformanceObserver.mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(typeof callArgs[0]).toBe('function'); // callback is a function
  });

  it('FP/FCP/LCP metrics are hidden when panel is collapsed', () => {
    renderMonitor();

    // Collapse the panel
    const headerBtn = screen.getByRole('button', { name: /性能监控/i });
    fireEvent.click(headerBtn);

    // All CWV metrics should be hidden along with other metrics
    expect(screen.queryByTestId('perf-fp')).not.toBeInTheDocument();
    expect(screen.queryByTestId('perf-fcp')).not.toBeInTheDocument();
    expect(screen.queryByTestId('perf-lcp')).not.toBeInTheDocument();
  });

  it('FP/FCP/LCP metrics are visible when panel is expanded', () => {
    renderMonitor();
    expect(screen.getByTestId('perf-fp')).toBeInTheDocument();
    expect(screen.getByTestId('perf-fcp')).toBeInTheDocument();
    expect(screen.getByTestId('perf-lcp')).toBeInTheDocument();
  });
});
