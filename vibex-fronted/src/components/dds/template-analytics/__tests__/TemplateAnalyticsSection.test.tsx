'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TemplateAnalyticsSection } from '../TemplateAnalyticsSection';

const mockFetch = vi.hoisted(() => vi.fn());

global.fetch = mockFetch;

const mockAnalytics = [
  {
    templateId: 'tpl-001',
    title: 'SaaS Product Template',
    views: 120,
    uses: 42,
    rating: 4.5,
  },
  {
    templateId: 'tpl-002',
    title: 'Ecommerce Template',
    views: 80,
    uses: 15,
    rating: 3.8,
  },
];

describe('TemplateAnalyticsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, analytics: mockAnalytics }),
    } as Response);
  });

  it('renders the section with title', async () => {
    render(<TemplateAnalyticsSection currentUserId="user-1" />);
    expect(screen.getByTestId('template-analytics-section')).toBeInTheDocument();
    expect(screen.getByText('模板数据分析')).toBeInTheDocument();
  });

  it('renders range tabs', async () => {
    render(<TemplateAnalyticsSection currentUserId="user-1" />);
    expect(screen.getByTestId('range-tab-7d')).toBeInTheDocument();
    expect(screen.getByTestId('range-tab-30d')).toBeInTheDocument();
    expect(screen.getByTestId('range-tab-90d')).toBeInTheDocument();
  });

  it('fetches analytics on mount', async () => {
    render(<TemplateAnalyticsSection currentUserId="user-1" />);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/templates/analytics?range=7d');
    });
  });

  it('displays analytics table with data', async () => {
    render(<TemplateAnalyticsSection currentUserId="user-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('row-tpl-001')).toBeInTheDocument();
      expect(screen.getByTestId('row-tpl-002')).toBeInTheDocument();
    });
    expect(screen.getByText('SaaS Product Template')).toBeInTheDocument();
    expect(screen.getByTestId('rating-tpl-001')).toHaveTextContent('4.5 ★');
  });

  it('switches range on tab click', async () => {
    render(<TemplateAnalyticsSection currentUserId="user-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('row-tpl-001')).toBeInTheDocument();
    });

    // Clear mocks for second call
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, analytics: [] }),
    } as Response);

    screen.getByTestId('range-tab-30d').click();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/templates/analytics?range=30d');
    });
  });

  it('shows empty state when no analytics', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, analytics: [] }),
    } as Response);

    render(<TemplateAnalyticsSection currentUserId="user-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-analytics')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ ok: false, error: 'Server error' }),
    } as Response);

    render(<TemplateAnalyticsSection currentUserId="user-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toHaveTextContent('Server error');
    });
  });

  it('shows loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // never resolves

    render(<TemplateAnalyticsSection currentUserId="user-1" />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('shows export button', async () => {
    render(<TemplateAnalyticsSection currentUserId="user-1" />);
    expect(screen.getByTestId('export-button')).toBeInTheDocument();
  });

  it('export button triggers download', async () => {
    // Verify the export button calls the export endpoint
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, analytics: mockAnalytics }),
    } as Response);

    render(<TemplateAnalyticsSection currentUserId="user-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('export-button')).toBeInTheDocument();
    });

    // Click export and verify fetch was called (with export URL or data URL)
    mockFetch.mockClear();
    screen.getByTestId('export-button').click();
    // Just verify no crash — export handler is async
    await new Promise((r) => setTimeout(r, 10));
    expect(mockFetch).toHaveBeenCalled();
  });

  it('displays summary stats', async () => {
    render(<TemplateAnalyticsSection currentUserId="user-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('stat-templates')).toHaveTextContent('2');
      expect(screen.getByTestId('stat-views')).toHaveTextContent('200'); // 120 + 80
      expect(screen.getByTestId('stat-uses')).toHaveTextContent('57'); // 42 + 15
      expect(screen.getByTestId('stat-avg-rating')).toHaveTextContent('4.2'); // (4.5+3.8)/2
    });
  });
});
