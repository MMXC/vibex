import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

// Test component that uses useToast hook
const TestComponent = () => {
  const { showToast, hideToast, toasts } = useToast();
  
  return (
    <div>
      <button 
        onClick={() => showToast('Success message', 'success')} 
        data-testid="success-btn"
      >
        Success
      </button>
      <button 
        onClick={() => showToast('Error message', 'error')} 
        data-testid="error-btn"
      >
        Error
      </button>
      <button 
        onClick={() => showToast('Warning message', 'warning')} 
        data-testid="warning-btn"
      >
        Warning
      </button>
      <button 
        onClick={() => showToast('Info message', 'info')} 
        data-testid="info-btn"
      >
        Info
      </button>
      <button 
        onClick={() => showToast('Custom duration', 'info', 1000)} 
        data-testid="custom-btn"
      >
        Custom
      </button>
      <div data-testid="toast-count">{toasts.length}</div>
    </div>
  );
};

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('ToastProvider', () => {
    it('renders children', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child</div>
        </ToastProvider>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('useToast', () => {
    it('throws when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<TestComponent />)).toThrow('useToast must be used within ToastProvider');
      consoleError.mockRestore();
    });

    it('provides showToast function', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      expect(screen.getByTestId('success-btn')).toBeInTheDocument();
    });
  });

  describe('Toast display', () => {
    it('shows success toast', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('success-btn'));
      });
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('shows error toast', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('error-btn'));
      });
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('shows warning toast', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('warning-btn'));
      });
      
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    it('shows info toast', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('info-btn'));
      });
      
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('auto-hides after duration', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('success-btn'));
      });
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
      
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });

    it('custom duration works', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('custom-btn'));
      });
      
      expect(screen.getByText('Custom duration')).toBeInTheDocument();
      
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(screen.queryByText('Custom duration')).not.toBeInTheDocument();
    });

    it('updates toast count', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('success-btn'));
      });
      
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    });
  });
});