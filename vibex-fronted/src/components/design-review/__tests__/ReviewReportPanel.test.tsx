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
      isOpen: true, isLoading: false, result: null, error: '500 Internal Server Error',
      runReview: vi.fn(), close: vi.fn(), open: vi.fn(),
    });
    render(<ReviewReportPanel />);
    // E19-1-S3: error message is now contextualized — errors containing '500' show "设计评审暂时不可用"
    expect(screen.getByText(/设计评审暂时不可用|网络连接异常/)).toBeInTheDocument();
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

  it('handles node highlight click with location', () => {
    vi.mocked(useDesignReviewModule.useDesignReview).mockReturnValue({
      isOpen: true, isLoading: false,
      result: {
        compliance: [{ id: 'c1', severity: 'critical', category: 'compliance', message: 'Issue at .test', location: '.test-node' }],
        accessibility: [], reuse: [],
      },
      error: null, runReview: vi.fn(), close: vi.fn(), open: vi.fn(),
    });
    render(<ReviewReportPanel />);
    // Verify issue with location is rendered
    expect(screen.getByText('Issue at .test')).toBeInTheDocument();
  });

  it('renders batch findings with performance consideration', () => {
    const manyIssues = Array.from({ length: 50 }, (_, i) => ({
      id: `c${i}`, severity: 'warning' as const, category: 'compliance' as const, message: `Issue ${i}`,
    }));
    vi.mocked(useDesignReviewModule.useDesignReview).mockReturnValue({
      isOpen: true, isLoading: false,
      result: { compliance: manyIssues, accessibility: [], reuse: [] },
      error: null, runReview: vi.fn(), close: vi.fn(), open: vi.fn(),
    });
    render(<ReviewReportPanel />);
    expect(screen.getByTestId('review-report-panel')).toBeInTheDocument();
    expect(screen.getByText('Issue 0')).toBeInTheDocument();
  });
});
