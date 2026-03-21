/**
 * Theme Binding Integration Tests
 * Epic 3: API Data Binding — End-to-End Merge
 *
 * Verifies the complete merge strategy:
 * localStorage > API userPreferences > API default > system > default
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeWrapper } from '../../components/ThemeWrapper';
import { clearHomepageCache } from '../../services/homepageAPI';

// ── Mock Setup ───────────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
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

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }),
});

// ── Mock Fetch ───────────────────────────────────────────────────────────────

function setupFetchMock(
  data: unknown,
  ok = true,
  status = 200
) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
  });
}

// ── Test Component ──────────────────────────────────────────────────────────

function Consumer() {
  const { theme } = useTheme();
  return (
    <div>
      <span data-testid="mode">{theme.mode}</span>
      <span data-testid="resolved">{theme.resolved}</span>
    </div>
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
  clearHomepageCache();
  localStorageMock.getItem.mockReturnValue(null);
  setupFetchMock({ theme: 'light', userPreferences: {} });
});

describe('Theme Binding Integration', () => {
  describe('Merge Strategy: Priority Order', () => {
    it('localStorage > API userPreferences > API default', async () => {
      // Set localStorage to dark
      localStorageMock.getItem.mockReturnValueOnce(
        JSON.stringify({ mode: 'dark', timestamp: Date.now() })
      );

      // API returns light with userPreferences dark
      setupFetchMock({
        theme: 'light',
        userPreferences: { theme: 'dark' },
      });

      render(
        <ThemeWrapper>
          <Consumer />
        </ThemeWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('dark');
      });
    });

    it('API userPreferences overrides API default when no localStorage', async () => {
      setupFetchMock({
        theme: 'light',
        userPreferences: { theme: 'dark' },
      });

      render(
        <ThemeWrapper>
          <Consumer />
        </ThemeWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('dark');
      });
    });

    it('API default used when no localStorage and no userPreferences', async () => {
      setupFetchMock({ theme: 'dark' });

      render(
        <ThemeWrapper>
          <Consumer />
        </ThemeWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('dark');
      });
    });

    it('API failure falls back to system theme', async () => {
      setupFetchMock({}, false, 500);

      render(
        <ThemeWrapper>
          <Consumer />
        </ThemeWrapper>
      );

      await waitFor(() => {
        // System theme is light (matchMedia mocks false)
        expect(screen.getByTestId('resolved')).toHaveTextContent('light');
      });
    });
  });

  describe('localStorage Persistence', () => {
    it('loads theme from localStorage on mount', async () => {
      localStorageMock.getItem.mockReturnValueOnce(
        JSON.stringify({ mode: 'dark', timestamp: Date.now() })
      );
      setupFetchMock({ theme: 'light' });

      render(
        <ThemeWrapper>
          <Consumer />
        </ThemeWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('dark');
        expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
      });
    });

    it('saves resolved theme to localStorage', async () => {
      // Clear: localStorage returns null on first call (consumed by resolveMergedTheme)
      localStorageMock.getItem.mockReturnValueOnce(null);
      // After first call, subsequent calls also return null
      localStorageMock.getItem.mockReturnValue(null);
      setupFetchMock({ theme: 'dark' });

      render(
        <ThemeWrapper>
          <Consumer />
        </ThemeWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('dark');
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'vibex-theme',
          expect.stringContaining('"mode":"dark"')
        );
      });
    });
  });
});
