/**
 * AnalyticsWidget — Vitest + Testing Library tests
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AnalyticsWidget } from './AnalyticsWidget';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const MOCK_SUCCESS_DATA = {
  success: true,
  data: {
    page_view: [
      { date: '2026-04-20', count: 120 },
      { date: '2026-04-21', count: 145 },
      { date: '2026-04-22', count: 132 },
      { date: '2026-04-23', count: 180 },
      { date: '2026-04-24', count: 210 },
    ],
    canvas_open: [
      { date: '2026-04-20', count: 40 },
      { date: '2026-04-21', count: 55 },
      { date: '2026-04-22', count: 48 },
      { date: '2026-04-23', count: 70 },
      { date: '2026-04-24', count: 85 },
    ],
    component_create: [
      { date: '2026-04-20', count: 10 },
      { date: '2026-04-21', count: 15 },
      { date: '2026-04-22', count: 12 },
      { date: '2026-04-23', count: 20 },
      { date: '2026-04-24', count: 25 },
    ],
    delivery_export: [
      { date: '2026-04-20', count: 5 },
      { date: '2026-04-21', count: 8 },
      { date: '2026-04-22', count: 6 },
      { date: '2026-04-23', count: 12 },
      { date: '2026-04-24', count: 15 },
    ],
  },
  meta: {
    start_date: '2026-04-20',
    end_date: '2026-04-24',
    total_days: 5,
  },
};


const MOCK_EMPTY_DATA = {
  success: true,
  data: {
    page_view: [],
    canvas_open: [],
    component_create: [],
    delivery_export: [],
  },
  meta: {
    start_date: '2026-04-20',
    end_date: '2026-04-24',
    total_days: 5,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AnalyticsWidget', () => {
  // ── Loading State ────────────────────────────────────────
  it('renders skeleton while loading', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));
    render(<AnalyticsWidget />);

    // Immediately after render, component transitions to loading state
    // The skeleton may be visible synchronously before fetch resolves
    await waitFor(() => {
      // After microtask queue flush, should be in loading state
    });
    // Skeleton testid should exist while loading
    expect(screen.queryByTestId('analytics-skeleton')).toBeTruthy();
  });

  it('renders skeleton with correct testid during loading', () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_SUCCESS_DATA), { status: 200 })
    );
    render(<AnalyticsWidget />);
    // Skeleton is shown synchronously before fetch resolves
    const skeleton = screen.getByTestId('analytics-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  // ── Success State ────────────────────────────────────────
  it('renders chart and metric cards on success', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_SUCCESS_DATA), { status: 200 })
    );

    render(<AnalyticsWidget />);

    await waitFor(() => {
      expect(screen.queryByTestId('analytics-skeleton')).toBeNull();
    });

    // SVG chart rendered
    expect(document.querySelector('svg')).toBeInTheDocument();

    // 4 metric cards present with expected values
    expect(screen.getAllByText('85').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('25').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(1);
  });

  it('renders correct metric values in success state', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_SUCCESS_DATA), { status: 200 })
    );

    render(<AnalyticsWidget />);

    await waitFor(() => {
      expect(screen.queryByTestId('analytics-skeleton')).toBeNull();
    });

    // Metric values are in spans with _metricValue class
    const metricValues = screen.getAllByText('210');
    expect(metricValues.length).toBeGreaterThanOrEqual(1);

    // Latest values rendered: page_view=210, canvas_open=85, component_create=25, delivery_export=15
    // Use getAllBy for values that appear in both chart labels and metric cards
    expect(screen.getAllByText('210').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('85').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('25').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(1);
  });

  // ── Empty State ─────────────────────────────────────────
  it('renders empty state when no data', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_EMPTY_DATA), { status: 200 })
    );

    render(<AnalyticsWidget />);

    await waitFor(() => {
      expect(screen.queryByTestId('analytics-skeleton')).toBeNull();
    });

    expect(screen.getByTestId('analytics-empty')).toBeInTheDocument();
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  // ── Error State ─────────────────────────────────────────
  it('renders error state on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<AnalyticsWidget />);

    await waitFor(() => {
      expect(screen.queryByTestId('analytics-skeleton')).toBeNull();
    });

    expect(screen.getByTestId('analytics-error')).toBeInTheDocument();
    expect(screen.getByText(/加载失败/)).toBeInTheDocument();
  });

  it('renders error state on non-ok HTTP response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
    );

    render(<AnalyticsWidget />);

    await waitFor(() => {
      expect(screen.queryByTestId('analytics-skeleton')).toBeNull();
    });

    expect(screen.getByTestId('analytics-error')).toBeInTheDocument();
  });

  // ── Retry ────────────────────────────────────────────────
  it('retries fetch on retry button click', async () => {
    // First call fails
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    // Second call succeeds
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_SUCCESS_DATA), { status: 200 })
    );

    render(<AnalyticsWidget />);

    await waitFor(() => {
      expect(screen.getByTestId('analytics-error')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: '重试' });
    await userEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('analytics-error')).toBeNull();
    });

    // Should show success (SVG chart)
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  // ── Widget Header ───────────────────────────────────────
  it('renders widget header with title and legend', () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_SUCCESS_DATA), { status: 200 })
    );

    render(<AnalyticsWidget />);

    // Title with emoji is split across elements; use getAllByText for flexible matching
    const titleEls = screen.getAllByText(/数据分析/);
    expect(titleEls.length).toBeGreaterThanOrEqual(1);

    // Legend items visible
    const legendLabels = screen.getAllByText(/页面浏览/);
    expect(legendLabels.length).toBeGreaterThanOrEqual(1);
  });
});
