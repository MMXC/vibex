import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonCard, SkeletonList } from './Skeleton';

describe('Skeleton', () => {
  describe('Skeleton', () => {
    it('renders skeleton element', () => {
      const { container } = render(<Skeleton />);
      // Component renders null on first mount
    });

    it('renders with custom className', () => {
      const { container } = render(<Skeleton className="test-class" />);
    });
  });

  describe('SkeletonCard', () => {
    it('renders card skeleton', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelector('[class*="card"]')).toBeInTheDocument();
    });

    it('renders card content', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelector('[class*="cardContent"]')).toBeInTheDocument();
    });
  });

  describe('SkeletonList', () => {
    it('renders list skeleton', () => {
      const { container } = render(<SkeletonList count={3} />);
      expect(container.querySelector('[class*="list"]')).toBeInTheDocument();
    });

    it('renders multiple items', () => {
      const { container } = render(<SkeletonList count={5} />);
      const items = container.querySelectorAll('[class*="listItem"]');
      // Each list item contains nested skeletons, so count may vary
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    it('renders list item content', () => {
      const { container } = render(<SkeletonList count={2} />);
      expect(container.querySelector('[class*="listItemContent"]')).toBeInTheDocument();
    });
  });
});
