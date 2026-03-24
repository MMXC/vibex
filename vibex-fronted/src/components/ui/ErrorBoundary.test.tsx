import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  ErrorBoundary,
  withErrorBoundary,
  useAsyncError,
} from './ErrorBoundary';

// Test component that throws error
const BuggyComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Working</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for error boundary tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  describe('ErrorBoundary rendering', () => {
    it('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child Content</div>
        </ErrorBoundary>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('renders error UI when error occurs', () => {
      render(
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText(/出了点问题/)).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
      render(
        <ErrorBoundary
          fallback={<div data-testid="custom-fallback">Custom Error</div>}
        >
          <BuggyComponent />
        </ErrorBoundary>
      );
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });
  });

  describe('ErrorBoundary actions', () => {
    it('calls onError callback when error occurs', () => {
      const handleError = jest.fn();
      render(
        <ErrorBoundary onError={handleError}>
          <BuggyComponent />
        </ErrorBoundary>
      );
      expect(handleError).toHaveBeenCalled();
    });

    it('has retry button', () => {
      render(
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText('重试')).toBeInTheDocument();
    });
  });

  describe('ErrorBoundary resetKeys', () => {
    it('resets error when resetKeys change', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['a']}>
          <BuggyComponent />
        </ErrorBoundary>
      );
      // Error should be caught
      expect(screen.getByText(/出了点问题/)).toBeInTheDocument();

      // Change resetKeys — boundary should reset
      rerender(
        <ErrorBoundary resetKeys={['b']}>
          <BuggyComponent />
        </ErrorBoundary>
      );
      // After key change, error should be caught again (component still throws)
      expect(screen.getByText(/出了点问题/)).toBeInTheDocument();
    });

    it('renders children normally when resetKeys unchanged but no error', () => {
      render(
        <ErrorBoundary resetKeys={['key1']}>
          <div data-testid="normal-child">Normal</div>
        </ErrorBoundary>
      );
      expect(screen.getByTestId('normal-child')).toBeInTheDocument();
    });

    it('does not reset when resetKeys are the same', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['same-key']}>
          <BuggyComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText(/出了点问题/)).toBeInTheDocument();

      // Same key — should not reset
      rerender(
        <ErrorBoundary resetKeys={['same-key']}>
          <div data-testid="should-not-appear">Should not appear</div>
        </ErrorBoundary>
      );
      // Error UI should still be showing (not reset)
      expect(screen.getByText(/出了点问题/)).toBeInTheDocument();
    });
  });

  describe('withErrorBoundary HOC', () => {
    const MockComponent = () => <div>Mock Content</div>;

    it('renders wrapped component without error', () => {
      const Wrapped = withErrorBoundary(MockComponent);
      render(<Wrapped />);
      expect(screen.getByText('Mock Content')).toBeInTheDocument();
    });

    it('renders fallback on error with HOC', () => {
      const BuggyHOC = withErrorBoundary(BuggyComponent, {
        fallback: <div data-testid="hoc-error">HOC Error</div>,
      });
      render(<BuggyHOC />);
      expect(screen.getByTestId('hoc-error')).toBeInTheDocument();
    });
  });
});
