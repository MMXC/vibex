/**
 * React Query Hooks Tests: DDD
 * Tests useBoundedContexts, useDomainModels, useBusinessFlowQuery, useDDDAnalysis
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useBoundedContexts, useDomainModels, useBusinessFlowQuery, useDDDAnalysis } from '@/hooks/queries/useDDD';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useBoundedContexts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch bounded contexts', async () => {
    const mockData = { boundedContexts: [{ id: 'ctx-1', name: 'Test Context' }] };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(
      () => useBoundedContexts('test requirement'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('should not fetch when requirement is empty', () => {
    const { result } = renderHook(
      () => useBoundedContexts(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('useDomainModels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch domain models', async () => {
    const mockData = { domainModels: [{ id: 'dm-1', name: 'Test Model' }] };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const contexts = [{ id: 'ctx-1', name: 'Test' }];

    const { result } = renderHook(
      () => useDomainModels(contexts, 'test requirement'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('should not fetch when contexts is empty', () => {
    const { result } = renderHook(
      () => useDomainModels([]),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
  });
});

describe('useBusinessFlowQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch business flow', async () => {
    const mockData = { businessFlow: { id: 'flow-1', name: 'Test Flow' } };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const models = [{ id: 'dm-1', name: 'Test' }];

    const { result } = renderHook(
      () => useBusinessFlowQuery(models),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useDDDAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide combined query results', () => {
    const { result } = renderHook(
      () => useDDDAnalysis('test requirement'),
      { wrapper: createWrapper() }
    );

    expect(result.current.contexts).toBeDefined();
    expect(result.current.domainModels).toBeDefined();
    expect(result.current.businessFlow).toBeDefined();
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
  });
});
