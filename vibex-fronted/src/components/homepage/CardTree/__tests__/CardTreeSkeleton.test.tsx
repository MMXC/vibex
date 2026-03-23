/**
 * Tests for CardTreeSkeleton component (Epic 2)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CardTreeSkeleton } from '../CardTreeSkeleton';

describe('CardTreeSkeleton', () => {
  it('should render with default count of 3 cards', () => {
    render(<CardTreeSkeleton />);
    const cards = screen.queryAllByTestId('skeleton-card');
    expect(cards.length).toBe(3);
  });

  it('should render with custom count', () => {
    render(<CardTreeSkeleton count={5} />);
    const cards = screen.queryAllByTestId('skeleton-card');
    expect(cards.length).toBe(5);
  });

  it('should render with count of 1', () => {
    render(<CardTreeSkeleton count={1} />);
    const cards = screen.queryAllByTestId('skeleton-card');
    expect(cards.length).toBe(1);
  });

  it('should have data-testid', () => {
    render(<CardTreeSkeleton data-testid="custom-skeleton" />);
    expect(screen.queryByTestId('custom-skeleton')).toBeTruthy();
  });

  it('should have default data-testid', () => {
    render(<CardTreeSkeleton />);
    expect(screen.queryByTestId('cardtree-skeleton')).toBeTruthy();
  });
});
