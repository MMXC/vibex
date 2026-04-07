/**
 * Tests for useProjectTree hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjectTree } from '@/hooks/useProjectTree';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProjectTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return mock data when projectId is null (feature flag off)', () => {
    const { result } = renderHook(() => useProjectTree({ projectId: null }), {
      wrapper: createWrapper(),
    });

    // Feature flag is off by default, so mock data is returned
    expect(result.current.isMockData).toBe(true);
    expect(result.current.data).not.toBeNull();
  });

  it('should handle null projectId gracefully', () => {
    const { result } = renderHook(() => useProjectTree({ projectId: null }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.featureEnabled).toBe(false);
  });

  it('should have correct return shape', () => {
    const { result } = renderHook(() => useProjectTree({ projectId: null }), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('featureEnabled');
    expect(result.current).toHaveProperty('isMockData');
    expect(result.current).toHaveProperty('refetch');
  });

  it('should use mock data when API fails and useMockOnError is true', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(
      () => useProjectTree({ projectId: 'proj-123', useMockOnError: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isMockData).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.nodes).toBeInstanceOf(Array);
  });
});
