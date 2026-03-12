/**
 * React Query Hooks Tests: Requirements
 * Tests useRequirements, useRequirement, useAnalysisResult
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useRequirements, useRequirement, useAnalysisResult } from '@/hooks/queries/useRequirements';
import { requirementApi } from '@/services/api/modules/requirement';

// Mock the API module
jest.mock('@/services/api/modules/requirement', () => ({
  requirementApi: {
    getRequirements: jest.fn(),
    getRequirement: jest.fn(),
    getAnalysisResult: jest.fn(),
  },
}));

const mockRequirementApi = requirementApi as jest.Mocked<typeof requirementApi>;

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

describe('useRequirements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch requirements for a user', async () => {
    const mockRequirements = [
      { id: 'req-1', userId: 'user-1', content: 'Requirement 1', status: 'completed' as const },
      { id: 'req-2', userId: 'user-1', content: 'Requirement 2', status: 'draft' as const },
    ];
    
    mockRequirementApi.getRequirements.mockResolvedValue(mockRequirements);

    const { result } = renderHook(
      () => useRequirements('user-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(mockRequirementApi.getRequirements).toHaveBeenCalledWith('user-1');
    expect(result.current.data).toEqual(mockRequirements);
  });

  it('should not fetch when userId is empty', async () => {
    const { result } = renderHook(
      () => useRequirements(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockRequirementApi.getRequirements).not.toHaveBeenCalled();
  });

  it('should handle error state', async () => {
    mockRequirementApi.getRequirements.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useRequirements('user-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    
    expect(result.current.error).toBeDefined();
  });

  it('should pass custom options', async () => {
    const mockRequirements = [{ id: 'req-1', userId: 'user-1', content: 'Test', status: 'completed' as const }];
    mockRequirementApi.getRequirements.mockResolvedValue(mockRequirements);

    const { result } = renderHook(
      () => useRequirements('user-1', { staleTime: 1000 * 60 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockRequirements);
  });
});

describe('useRequirement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch single requirement', async () => {
    const mockRequirement = { id: 'req-1', userId: 'user-1', content: 'Requirement 1', status: 'completed' as const };
    mockRequirementApi.getRequirement.mockResolvedValue(mockRequirement);

    const { result } = renderHook(
      () => useRequirement('req-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(mockRequirementApi.getRequirement).toHaveBeenCalledWith('req-1');
    expect(result.current.data).toEqual(mockRequirement);
  });

  it('should not fetch when requirementId is empty', async () => {
    const { result } = renderHook(
      () => useRequirement(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockRequirementApi.getRequirement).not.toHaveBeenCalled();
  });

  it('should handle error state', async () => {
    mockRequirementApi.getRequirement.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(
      () => useRequirement('req-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useAnalysisResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch analysis result for a requirement', async () => {
    const mockAnalysisResult = { summary: 'Test analysis', entities: [] };
    mockRequirementApi.getAnalysisResult.mockResolvedValue(mockAnalysisResult);

    const { result } = renderHook(
      () => useAnalysisResult('req-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(mockRequirementApi.getAnalysisResult).toHaveBeenCalledWith('req-1');
    expect(result.current.data).toEqual(mockAnalysisResult);
  });

  it('should not fetch when requirementId is empty', async () => {
    const { result } = renderHook(
      () => useAnalysisResult(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockRequirementApi.getAnalysisResult).not.toHaveBeenCalled();
  });

  it('should handle error state', async () => {
    mockRequirementApi.getAnalysisResult.mockRejectedValue(new Error('Analysis failed'));

    const { result } = renderHook(
      () => useAnalysisResult('req-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
