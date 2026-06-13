/**
 * AnalyticsDashboard.test.tsx — Vitest tests for AnalyticsDashboard
 * S95-E1: Canvas Analytics Dashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AnalyticsDashboard } from '@/components/dds/AnalyticsDashboard';
import * as analyticsStore from '@/stores/analyticsStore';

const mockAnalytics = {
  views: { today: 12, week: 35, month: 120 },
  editCount: 8,
  uniqueUsers: 5,
  shareCount: 2,
  exportCount: 1,
  dailyTrend: [
    { date: '2026-06-07', views: 5, edits: 2 },
    { date: '2026-06-08', views: 3, edits: 1 },
    { date: '2026-06-09', views: 7, edits: 3 },
    { date: '2026-06-10', views: 2, edits: 0 },
    { date: '2026-06-11', views: 4, edits: 1 },
    { date: '2026-06-12', views: 6, edits: 2 },
    { date: '2026-06-13', views: 8, edits: 3 },
  ],
};

vi.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: vi.fn(),
}));

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithState = (state: Partial<ReturnType<typeof analyticsStore.useAnalyticsStore.getState>> = {}) => {
    const defaultState = {
      analytics: null,
      isLoading: false,
      error: null,
      range: '7d' as const,
      fetchAnalytics: vi.fn(),
      setRange: vi.fn(),
      exportCSV: vi.fn(),
    };
    (analyticsStore.useAnalyticsStore as ReturnType<typeof vi.fn>).mockImplementation((selector?: (s: typeof defaultState) => unknown) => {
      const fullState = { ...defaultState, ...state };
      return selector ? selector(fullState) : fullState;
    });
  };

  it('renders the dashboard title', () => {
    renderWithState();
    render(<AnalyticsDashboard canvasId="c1" />);
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders range selector with 3 buttons', () => {
    renderWithState();
    render(<AnalyticsDashboard canvasId="c1" />);
    const buttons = screen.getAllByRole('tab');
    expect(buttons).toHaveLength(3);
    expect(screen.getByText('7d')).toBeInTheDocument();
    expect(screen.getByText('30d')).toBeInTheDocument();
    expect(screen.getByText('90d')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithState({ isLoading: true });
    render(<AnalyticsDashboard canvasId="c1" />);
    expect(screen.getByText('Loading analytics…')).toBeInTheDocument();
  });

  it('shows error state', () => {
    renderWithState({ error: 'Failed to load' });
    render(<AnalyticsDashboard canvasId="c1" />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders stat cards when analytics data is present', () => {
    renderWithState({ analytics: mockAnalytics });
    render(<AnalyticsDashboard canvasId="c1" />);
    expect(screen.getByText('12')).toBeInTheDocument(); // views today
    expect(screen.getByText('35')).toBeInTheDocument(); // views week
    expect(screen.getByText('8')).toBeInTheDocument(); // edits
    expect(screen.getByText('5')).toBeInTheDocument(); // unique users
    expect(screen.getByText('2')).toBeInTheDocument(); // shares
    expect(screen.getByText('1')).toBeInTheDocument(); // exports
  });

  it('shows empty state when no analytics data', () => {
    renderWithState({ analytics: null, isLoading: false, error: null });
    render(<AnalyticsDashboard canvasId="c1" />);
    expect(screen.getByText('No analytics data available yet.')).toBeInTheDocument();
  });

  it('calls setRange when range button is clicked', () => {
    const mockSetRange = vi.fn();
    renderWithState({ setRange: mockSetRange });
    render(<AnalyticsDashboard canvasId="c1" />);
    fireEvent.click(screen.getByText('30d'));
    expect(mockSetRange).toHaveBeenCalledWith('30d');
  });

  it('renders SVG chart when analytics data exists', () => {
    renderWithState({ analytics: mockAnalytics });
    render(<AnalyticsDashboard canvasId="c1" />);
    const svg = screen.getByLabelText(/analytics trend chart/i);
    expect(svg).toBeInTheDocument();
  });

  it('export button is rendered and calls exportCSV', () => {
    const mockExportCSV = vi.fn();
    renderWithState({ analytics: mockAnalytics, exportCSV: mockExportCSV });
    render(<AnalyticsDashboard canvasId="c1" />);
    const btn = screen.getByText('Export CSV');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(mockExportCSV).toHaveBeenCalledWith('c1');
  });
});
