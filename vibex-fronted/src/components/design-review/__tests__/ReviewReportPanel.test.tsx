import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ReviewReportPanel } from '../ReviewReportPanel';
import * as useDesignReviewModule from '@/hooks/useDesignReview';

// Mock useDesignReview hook
vi.mock('@/hooks/useDesignReview', () => ({
  useDesignReview: vi.fn(() => ({
    isOpen: true,
    isLoading: false,
    result: {
      compliance: [
        { id: 'c1', severity: 'critical', category: 'compliance', message: 'Test compliance issue', location: '.test' },
        { id: 'c2', severity: 'warning', category: 'compliance', message: 'Test warning', location: '.warn' },
      ],
      accessibility: [
        { id: 'a1', severity: 'info', category: 'accessibility', message: 'Test a11y issue', location: '.a11y' },
      ],
      reuse: [
        { id: 'r1', message: 'Test recommendation', priority: 'high' },
      ],
    },
    error: null,
    runReview: vi.fn(),
    close: vi.fn(),
    open: vi.fn(),
  })),
}));

describe('ReviewReportPanel', () => {
  it('renders panel when isOpen is true', () => {
    render(<ReviewReportPanel />);
    expect(screen.getByTestId('review-report-panel')).toBeInTheDocument();
  });

  it('renders Compliance tab with issues', () => {
    render(<ReviewReportPanel />);
    expect(screen.getByTestId('tab-compliance')).toBeInTheDocument();
    expect(screen.getByText('Test compliance issue')).toBeInTheDocument();
  });

  it('renders critical badge on critical issues', () => {
    render(<ReviewReportPanel />);
    expect(screen.getByTestId('badge-critical')).toBeInTheDocument();
    expect(screen.getByTestId('badge-warning')).toBeInTheDocument();
  });

  it('switches to Accessibility tab', () => {
    render(<ReviewReportPanel />);
    fireEvent.click(screen.getByTestId('tab-accessibility'));
    expect(screen.getByTestId('tab-accessibility')).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to Reuse tab', () => {
    render(<ReviewReportPanel />);
    fireEvent.click(screen.getByTestId('tab-reuse'));
    expect(screen.getByTestId('tab-reuse')).toHaveAttribute('aria-selected', 'true');
  });

  it('renders loading state', () => {
    vi.mocked(useDesignReviewModule.useDesignReview).mockReturnValue({
      isOpen: true, isLoading: true, result: null, error: null,
      runReview: vi.fn(), close: vi.fn(), open: vi.fn(),
    });
    render(<ReviewReportPanel />);
    expect(screen.getByTestId('panel-loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.mocked(useDesignReviewModule.useDesignReview).mockReturnValue({
      isOpen: true, isLoading: false, result: null, error: 'Test error',
      runReview: vi.fn(), close: vi.fn(), open: vi.fn(),
    });
    render(<ReviewReportPanel />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders empty state when no issues', () => {
    vi.mocked(useDesignReviewModule.useDesignReview).mockReturnValue({
      isOpen: true, isLoading: false,
      result: { compliance: [], accessibility: [], reuse: [] },
      error: null, runReview: vi.fn(), close: vi.fn(), open: vi.fn(),
    });
    render(<ReviewReportPanel />);
    fireEvent.click(screen.getByTestId('tab-accessibility'));
    expect(screen.getByTestId('empty-accessibility')).toBeInTheDocument();
  });
});
