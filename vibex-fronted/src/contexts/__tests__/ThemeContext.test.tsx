/**
 * ThemeContext Tests
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
    getStore: () => store,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }),
});

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

function TestConsumer() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="mode">{theme.mode}</span>
      <span data-testid="resolved">{theme.resolved}</span>
      <button onClick={toggleTheme} data-testid="toggle">
        Toggle
      </button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Set Light
      </button>
    </div>
  );
}

describe('ThemeContext', () => {
  describe('Provider', () => {
    it('renders children', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );
      expect(screen.getByTestId('mode')).toBeInTheDocument();
    });

    it('defaults to system mode with light resolved', () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );
      expect(screen.getByTestId('mode')).toHaveTextContent('system');
      expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    });

    it('uses stored preference from localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ mode: 'dark', timestamp: Date.now() }));
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );
      expect(screen.getByTestId('mode')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    });

    it('respects defaultMode prop', () => {
      render(
        <ThemeProvider defaultMode="dark">
          <TestConsumer />
        </ThemeProvider>
      );
      expect(screen.getByTestId('mode')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    });
  });

  describe('toggleTheme', () => {
    it('toggles from light to dark', async () => {
      render(
        <ThemeProvider defaultMode="light">
          <TestConsumer />
        </ThemeProvider>
      );
      expect(screen.getByTestId('resolved')).toHaveTextContent('light');

      await act(async () => {
        screen.getByTestId('toggle').click();
      });

      expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    });

    it('toggles from dark to light', async () => {
      render(
        <ThemeProvider defaultMode="dark">
          <TestConsumer />
        </ThemeProvider>
      );
      expect(screen.getByTestId('resolved')).toHaveTextContent('dark');

      await act(async () => {
        screen.getByTestId('toggle').click();
      });

      expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    });
  });

  describe('setTheme', () => {
    it('sets mode to dark and persists to localStorage', async () => {
      render(
        <ThemeProvider defaultMode="light">
          <TestConsumer />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByTestId('set-dark').click();
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });
});
