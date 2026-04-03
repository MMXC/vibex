/**
 * React Query Hooks Tests: Flows
 * Tests useFlow
 */
// @ts-nocheck


import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useFlow } from '@/hooks/queries/useFlows';
import { flowApi } from '@/services/api/modules/flow';

// Mock the API module
jest.mock('@/services/api/modules/flow', () => ({
  flowApi: {
    getFlow: jest.fn(),
  },
}));

const mockFlowApi = flowApi as jest.Mocked<typeof flowApi>;

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

describe('useFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch flow by ID', async () => {
    const mockFlow = {
      id: 'flow-1',
      name: 'Test Flow',
      nodes: [],
      edges: [],
    };
    
    mockFlowApi.getFlow.mockResolvedValue(mockFlow);

    const { result } = renderHook(
      () => useFlow('flow-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(mockFlowApi.getFlow).toHaveBeenCalledWith('flow-1');
    expect(result.current.data).toEqual(mockFlow);
  });

  it('should not fetch when flowId is empty', async () => {
    const { result } = renderHook(
      () => useFlow(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockFlowApi.getFlow).not.toHaveBeenCalled();
  });

  it('should handle error state', async () => {
    mockFlowApi.getFlow.mockRejectedValue(new Error('Flow not found'));

    const { result } = renderHook(
      () => useFlow('flow-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    
    expect(result.current.error).toBeDefined();
  });

  it('should pass custom options', async () => {
    const mockFlow = { id: 'flow-1', name: 'Test', nodes: [], edges: [] };
    mockFlowApi.getFlow.mockResolvedValue(mockFlow);

    const { result } = renderHook(
      () => useFlow('flow-1', { staleTime: 5000 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockFlow);
  });

  it('should handle loading state', () => {
    mockFlowApi.getFlow.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(
      () => useFlow('flow-1'),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isFetching).toBe(true);
  });
});
