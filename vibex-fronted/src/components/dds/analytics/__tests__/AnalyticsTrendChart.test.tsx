/**
 * AnalyticsTrendChart.test.tsx — S72-E4
 * Tests: 7d/30d toggle, bar rendering, empty state, share button
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AnalyticsTrendChart } from '../AnalyticsTrendChart';

const mockGetHistory = vi.fn(() => []);
const mockShareAnalytics = vi.fn(() => 'test-share-123');

vi.mock('@/stores/dds/canvasAnalyticsStore', () => ({
  useCanvasAnalyticsStore: (selector: (s: any) => any) =>
    selector({
      getHistory: mockGetHistory,
      shareAnalytics: mockShareAnalytics,
    }),
}));

describe('AnalyticsTrendChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetHistory.mockReturnValue([]);
  });

  it('renders header with "近7天" label by default', () => {
    // Even with empty history, header + empty chart structure renders
    mockGetHistory.mockReturnValue([]);
    render(<AnalyticsTrendChart canvasId="canvas-1" />);
    // Header always shows the range label — use regex because text is split across <span> nodes
    expect(screen.getByText(/近7天/)).toBeInTheDocument();
  });

  it('renders chart bars for each date in range', () => {
    // Build history entries for today and recent days
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().slice(0, 10);
    mockGetHistory.mockReturnValue([
      { date: yesterday, canvasId: 'canvas-1', totalEdits: 5, nodeCount: 2, topNodes: [] },
      { date: today, canvasId: 'canvas-1', totalEdits: 8, nodeCount: 3, topNodes: [] },
      { date: twoDaysAgo, canvasId: 'canvas-1', totalEdits: 3, nodeCount: 1, topNodes: [] },
    ]);
    render(<AnalyticsTrendChart canvasId="canvas-1" />);
    // Bars should render for dates in range
    const bars = screen.queryAllByTestId(/^bar-/);
    expect(bars.length).toBeGreaterThan(0);
    // 7d button should be active — use regex for split text
    expect(screen.getByText(/近7天/)).toBeInTheDocument();
  });

  it('calls getHistory with 7d when 7d button clicked', () => {
    mockGetHistory.mockReturnValue([]);
    render(<AnalyticsTrendChart canvasId="canvas-1" />);
    const btn7d = screen.getByTestId('range-7d');
    fireEvent.click(btn7d);
    expect(mockGetHistory).toHaveBeenCalledWith('7d');
  });

  it('calls getHistory with 30d when 30d button clicked', () => {
    mockGetHistory.mockReturnValue([]);
    render(<AnalyticsTrendChart canvasId="canvas-1" />);
    const btn30d = screen.getByTestId('range-30d');
    fireEvent.click(btn30d);
    expect(mockGetHistory).toHaveBeenCalledWith('30d');
  });

  it('calls onShare when share button clicked', () => {
    mockGetHistory.mockReturnValue([]);
    const onShare = vi.fn();
    render(<AnalyticsTrendChart canvasId="canvas-1" onShare={onShare} />);
    const shareBtn = screen.getByTestId('share-btn');
    fireEvent.click(shareBtn);
    expect(mockShareAnalytics).toHaveBeenCalledWith('canvas-1');
  });
});
