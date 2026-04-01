import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import AppErrorBoundary from './AppErrorBoundary';

describe('AppErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <AppErrorBoundary>
        <div>正常内容</div>
      </AppErrorBoundary>
    );
    expect(screen.getByText('正常内容')).toBeVisible();
  });

  it('shows error fallback on error', () => {
    const ThrowError = () => { throw new Error('Test error'); };
    render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );
    expect(screen.getByTestId('error-fallback')).toBeVisible();
    expect(screen.getByText('Something went wrong')).toBeVisible();
  });

  it('has reset button that clears error', () => {
    const onReset = jest.fn();
    const ThrowError = () => { throw new Error('Test error'); };
    render(
      <AppErrorBoundary onReset={onReset}>
        <ThrowError />
      </AppErrorBoundary>
    );
    fireEvent.click(screen.getByText('Try Again'));
    expect(onReset).toHaveBeenCalled();
  });
});
