/**
 * Tests for CardTreeError component (Epic 4)
 */
// @ts-nocheck


import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardTreeError } from '../CardTreeError';

jest.mock('../CardTree.module.css', () => ({
  error: 'error',
  errorIcon: 'errorIcon',
  errorText: 'errorText',
  retryButton: 'retryButton',
}));

describe('CardTreeError', () => {
  describe('Rendering', () => {
    it('should render error container with correct data-testid', () => {
      render(<CardTreeError message="Network error" onRetry={jest.fn()} />);
      expect(screen.queryByTestId('cardtree-error')).toBeTruthy();
    });

    it('should display the error message', () => {
      render(<CardTreeError message="Failed to load data" onRetry={jest.fn()} />);
      expect(screen.queryByTestId('error-message')).toBeTruthy();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('should display retry button', () => {
      render(<CardTreeError message="Error" onRetry={jest.fn()} />);
      expect(screen.queryByTestId('retry-button')).toBeTruthy();
      expect(screen.getByRole('button', { name: '重试' })).toBeTruthy();
    });

    it('should have role alert for accessibility', () => {
      render(<CardTreeError message="Error" onRetry={jest.fn()} />);
      expect(screen.queryByRole('alert')).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    it('should call onRetry when retry button is clicked', () => {
      const onRetry = jest.fn();
      render(<CardTreeError message="Network error" onRetry={onRetry} />);

      fireEvent.click(screen.getByTestId('retry-button'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry multiple times for multiple clicks', () => {
      const onRetry = jest.fn();
      render(<CardTreeError message="Error" onRetry={onRetry} />);

      fireEvent.click(screen.getByTestId('retry-button'));
      fireEvent.click(screen.getByTestId('retry-button'));
      expect(onRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe('Timeout Error', () => {
    it('should display timeout-specific message', () => {
      render(<CardTreeError message="请求超时（10秒）" onRetry={jest.fn()} />);
      expect(screen.getByText('请求超时（10秒）')).toBeInTheDocument();
    });
  });

  describe('Custom Class', () => {
    it('should apply custom class name', () => {
      const { container } = render(
        <CardTreeError message="Error" onRetry={jest.fn()} className="custom-error" />
      );
      expect(container.firstChild).toHaveClass('error');
    });
  });
});
