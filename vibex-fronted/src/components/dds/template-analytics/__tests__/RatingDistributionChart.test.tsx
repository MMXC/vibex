'use client';

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RatingDistributionChart } from '../RatingDistributionChart';

describe('RatingDistributionChart', () => {
  it('renders chart container', () => {
    render(<RatingDistributionChart distribution={{}} />);
    expect(screen.getByTestId('rating-distribution-chart')).toBeInTheDocument();
  });

  it('shows empty state when no distribution', () => {
    render(<RatingDistributionChart distribution={{}} />);
    expect(screen.getByTestId('no-ratings')).toBeInTheDocument();
    expect(screen.getByTestId('no-ratings')).toHaveTextContent('暂无评分数据');
  });

  it('renders legend for each star level', () => {
    render(<RatingDistributionChart distribution={{ 1: 2, 2: 3, 3: 5, 4: 10, 5: 20 }} />);
    expect(screen.getByTestId('legend-star-1')).toBeInTheDocument();
    expect(screen.getByTestId('legend-star-5')).toBeInTheDocument();
  });

  it('shows correct percentages', () => {
    // 5-star: 20, 4-star: 10, 3-star: 5, 2-star: 3, 1-star: 2 → total 40
    // 5-star: 50%, 4-star: 25%, 3-star: 12%, 2-star: 8%, 1-star: 5%
    render(<RatingDistributionChart distribution={{ 1: 2, 2: 3, 3: 5, 4: 10, 5: 20 }} />);

    // 5-star: 20/40 = 50%
    expect(screen.getByTestId('pct-star-5')).toHaveTextContent('50%');
    // 4-star: 10/40 = 25%
    expect(screen.getByTestId('pct-star-4')).toHaveTextContent('25%');
    // 3-star: 5/40 = 12% (rounded)
    expect(screen.getByTestId('pct-star-3')).toHaveTextContent('13%');
    // 2-star: 3/40 = 7% (rounded)
    expect(screen.getByTestId('pct-star-2')).toHaveTextContent('8%');
    // 1-star: 2/40 = 5%
    expect(screen.getByTestId('pct-star-1')).toHaveTextContent('5%');
  });

  it('renders donut chart element', () => {
    render(<RatingDistributionChart distribution={{ 5: 10 }} />);
    expect(screen.getByTestId('donut-chart')).toBeInTheDocument();
  });

  it('handles missing star ratings gracefully', () => {
    render(<RatingDistributionChart distribution={{ 5: 10, 1: 5 }} />);
    expect(screen.getByTestId('pct-star-5')).toHaveTextContent('67%');
    expect(screen.getByTestId('pct-star-1')).toHaveTextContent('33%');
  });
});
