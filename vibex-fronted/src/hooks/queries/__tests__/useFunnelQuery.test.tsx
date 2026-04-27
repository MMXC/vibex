/**
 * useFunnelQuery — Unit tests
 * E4-US-E4.2: Analytics API
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFunnelQuery } from '../useFunnelQuery';

const mockFunnelResponse = {
  funnel: [
    { name: 'Canvas访问', count: 1000, rate: 1.0 },
    { name: '开始建模', count: 600, rate: 0.6 },
  ],
  summary: { totalUsers: 1000, completedCount: 150, avgCompletionTime: '2.5天' },
  generatedAt: '2026-04-27T00:00:00.000Z',
};

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('useFunnelQuery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls /api/analytics/funnel with 7d default', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockFunnelResponse });
    global.fetch = mockFetch;
    const Wrapper = makeWrapper();
    const { result } = renderHook(() => useFunnelQuery('7d'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/analytics/funnel?range=7d');
  });

  it('calls /api/analytics/funnel with 30d range', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockFunnelResponse });
    global.fetch = mockFetch;
    const Wrapper = makeWrapper();
    const { result } = renderHook(() => useFunnelQuery('30d'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/analytics/funnel?range=30d');
  });

  it('returns funnel data on success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockFunnelResponse });
    global.fetch = mockFetch;
    const Wrapper = makeWrapper();
    const { result } = renderHook(() => useFunnelQuery('7d'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });
    expect(result.current.data?.funnel).toHaveLength(2);
    expect(result.current.data?.summary.totalUsers).toBe(1000);
  });
});
