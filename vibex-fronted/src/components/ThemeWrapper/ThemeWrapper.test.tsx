/**
 * ThemeWrapper Component Tests
 * Epic 3: FOUT Prevention + API Data Binding
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeWrapper, useThemeWrapper } from '../ThemeWrapper';
import { clearHomepageCache } from '../../services/homepageAPI';

// Mock fetch
const mockFetch = vi.fn();
const originalFetch = global.fetch;
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  clearHomepageCache();
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ theme: 'dark' }),
  });
});

function TestConsumer() {
  const ctx = useThemeWrapper();
  return (
    <div>
      <span data-testid="loading">{String(ctx.isLoading)}</span>
      <span data-testid="has-data">{String(ctx.homepageData !== null)}</span>
      <button data-testid="clear" onClick={ctx.clearCache}>
        Clear
      </button>
    </div>
  );
}

describe('ThemeWrapper', () => {
  it('renders children immediately', () => {
    render(
      <ThemeWrapper>
        <div data-testid="child">Child Content</div>
      </ThemeWrapper>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('starts with isLoading true', async () => {
    render(
      <ThemeWrapper>
        <TestConsumer />
      </ThemeWrapper>
    );
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });

  it('sets isLoading false after fetch completes', async () => {
    render(
      <ThemeWrapper>
        <TestConsumer />
      </ThemeWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('populates homepageData after fetch', async () => {
    render(
      <ThemeWrapper>
        <TestConsumer />
      </ThemeWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('has-data')).toHaveTextContent('true');
    });
  });

  it('calls onApiDataLoaded callback', async () => {
    const onLoaded = vi.fn();
    render(
      <ThemeWrapper onApiDataLoaded={onLoaded}>
        <TestConsumer />
      </ThemeWrapper>
    );

    await waitFor(() => {
      expect(onLoaded).toHaveBeenCalled();
    });
    expect(onLoaded.mock.calls[0][0]).toEqual({ theme: 'dark' });
  });

  it('clearCache removes cached data and resets loading', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ theme: 'dark' }),
    });

    render(
      <ThemeWrapper>
        <TestConsumer />
      </ThemeWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('has-data')).toHaveTextContent('true');
    });

    // Click clear - homepageData should be cleared (null)
    await act(async () => {
      screen.getByTestId('clear').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('has-data')).toHaveTextContent('false');
    });
  });

  it('returns null homepageData on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    render(
      <ThemeWrapper>
        <TestConsumer />
      </ThemeWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('has-data')).toHaveTextContent('false');
  });
});

afterAll(() => {
  global.fetch = originalFetch ?? (global.fetch as typeof global.fetch);
});
