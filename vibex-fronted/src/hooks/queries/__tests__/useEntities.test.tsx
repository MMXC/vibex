/**
 * React Query Hooks Tests: Domain Entities
 * Tests useDomainEntities, useDomainEntity
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useDomainEntities, useDomainEntity } from '@/hooks/queries/useEntities';
import { domainEntityApi } from '@/services/api/modules/domain-entity';

// Mock the API module
vi.mock('@/services/api/modules/domain-entity', () => ({
  domainEntityApi: {
    getDomainEntities: vi.fn(),
    getDomainEntity: vi.fn(),
  },
}));

const mockDomainEntityApi = domainEntityApi as anyed<typeof domainEntityApi>;

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

describe('useDomainEntities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch domain entities for a requirement', async () => {
    const mockEntities = [
      { id: 'entity-1', name: 'Entity 1', type: 'domain' as const },
      { id: 'entity-2', name: 'Entity 2', type: 'service' as const },
    ];
    
    mockDomainEntityApi.getDomainEntities.mockResolvedValue(mockEntities);

    const { result } = renderHook(
      () => useDomainEntities('req-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(mockDomainEntityApi.getDomainEntities).toHaveBeenCalledWith('req-1');
    expect(result.current.data).toEqual(mockEntities);
  });

  it('should not fetch when requirementId is empty', async () => {
    const { result } = renderHook(
      () => useDomainEntities(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockDomainEntityApi.getDomainEntities).not.toHaveBeenCalled();
  });

  it('should handle error state', async () => {
    mockDomainEntityApi.getDomainEntities.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useDomainEntities('req-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    
    expect(result.current.error).toBeDefined();
  });

  it('should pass custom options', async () => {
    const mockEntities = [{ id: 'entity-1', name: 'Entity 1', type: 'domain' as const }];
    mockDomainEntityApi.getDomainEntities.mockResolvedValue(mockEntities);

    const { result } = renderHook(
      () => useDomainEntities('req-1', { staleTime: 1000 * 60 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockEntities);
  });
});

describe('useDomainEntity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch single domain entity', async () => {
    const mockEntity = { id: 'entity-1', name: 'Entity 1', type: 'domain' as const };
    mockDomainEntityApi.getDomainEntity.mockResolvedValue(mockEntity);

    const { result } = renderHook(
      () => useDomainEntity('entity-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(mockDomainEntityApi.getDomainEntity).toHaveBeenCalledWith('entity-1');
    expect(result.current.data).toEqual(mockEntity);
  });

  it('should not fetch when entityId is empty', async () => {
    const { result } = renderHook(
      () => useDomainEntity(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockDomainEntityApi.getDomainEntity).not.toHaveBeenCalled();
  });

  it('should handle error state', async () => {
    mockDomainEntityApi.getDomainEntity.mockRejectedValue(new Error('Entity not found'));

    const { result } = renderHook(
      () => useDomainEntity('entity-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('should pass custom options', async () => {
    const mockEntity = { id: 'entity-1', name: 'Entity 1', type: 'domain' as const };
    mockDomainEntityApi.getDomainEntity.mockResolvedValue(mockEntity);

    const { result } = renderHook(
      () => useDomainEntity('entity-1', { enabled: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockEntity);
  });
});
