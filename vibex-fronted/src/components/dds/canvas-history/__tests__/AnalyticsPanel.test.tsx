/**
 * AnalyticsPanel.test.tsx — S71-E4
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalyticsPanel from '../AnalyticsPanel';

// Mock state for the analytics store
const mockEditingStats = {
  'canvas-1': {
    totalEdits: 5,
    lastEdit: 1700000000000,
    nodeEdits: { 'node-a': 3, 'node-b': 2 },
  },
};

// Create a mock store that acts like Zustand (with getState method)
const mockStoreState = {
  editingStats: mockEditingStats,
  getStats: (canvasId: string) =>
    mockEditingStats[canvasId] ?? { totalEdits: 0, lastEdit: 0, nodeEdits: {} },
  getTopNodes: (canvasId: string, limit = 5) => {
    const stats = mockStoreState.getStats(canvasId);
    return Object.entries(stats.nodeEdits ?? {})
      .map(([nodeId, count]) => ({ nodeId, editCount: count as number }))
      .sort((a, b) => b.editCount - a.editCount)
      .slice(0, limit);
  },
  exportAnalytics: (canvasId: string) =>
    `canvasId,nodeId,editCount\n${canvasId},node-a,3\n${canvasId},node-b,2\n,totalEdits,5`,
  clearStats: () => {},
};

// Add getState method (required by Zustand mock pattern)
mockStoreState.getStats = mockStoreState.getStats.bind(mockStoreState);
mockStoreState.getTopNodes = mockStoreState.getTopNodes.bind(mockStoreState);
mockStoreState.exportAnalytics = mockStoreState.exportAnalytics.bind(mockStoreState);

vi.mock('@/stores/dds/canvasAnalyticsStore', () => ({
  useCanvasAnalyticsStore: (selector?: (s: typeof mockStoreState) => unknown) => {
    if (selector) {
      return selector(mockStoreState as any);
    }
    return mockStoreState;
  },
}));

describe('AnalyticsPanel', () => {
  it('renders total edit count', () => {
    render(<AnalyticsPanel canvasId="canvas-1" />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('总编辑次数')).toBeInTheDocument();
  });

  it('renders top nodes list sorted by edit count', () => {
    render(<AnalyticsPanel canvasId="canvas-1" />);
    expect(screen.getByText('node-a')).toBeInTheDocument();
    expect(screen.getByText('node-b')).toBeInTheDocument();
    expect(screen.getByText('3 次')).toBeInTheDocument();
    expect(screen.getByText('2 次')).toBeInTheDocument();
  });

  it('shows #1 rank for most-edited node', () => {
    render(<AnalyticsPanel canvasId="canvas-1" />);
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<AnalyticsPanel canvasId="unknown-canvas" />);
    expect(screen.getByText('暂无编辑数据')).toBeInTheDocument();
  });
});
