/**
 * React Query Hooks Tests: Projects
 * Tests useProjects, useProject, useDeletedProjects, useProjectRole
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useProjects, useProject, useDeletedProjects, useProjectRole } from '@/hooks/queries/useProjects';
import { projectApi } from '@/services/api/modules/project';

// Mock the API module
vi.mock('@/services/api/modules/project', () => ({
  projectApi: {
    getProjects: vi.fn(),
    getProject: vi.fn(),
    getDeletedProjects: vi.fn(),
    getProjectRole: vi.fn(),
  },
}));

const mockProjectApi = projectApi as anyed<typeof projectApi>;

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

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch projects for a user', async () => {
    const mockProjects = [
      { id: 'proj-1', name: 'Project 1', userId: 'user-1' },
      { id: 'proj-2', name: 'Project 2', userId: 'user-1' },
    ];
    
    mockProjectApi.getProjects.mockResolvedValue(mockProjects);

    const { result } = renderHook(
      () => useProjects({ userId: 'user-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(mockProjectApi.getProjects).toHaveBeenCalledWith('user-1');
    expect(result.current.data).toEqual(mockProjects);
  });

  it('should not fetch when userId is empty', async () => {
    const { result } = renderHook(
      () => useProjects({ userId: '' }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockProjectApi.getProjects).not.toHaveBeenCalled();
  });

  it('should apply custom filters', async () => {
    const mockProjects = [{ id: 'proj-1', name: 'Project 1', userId: 'user-1' }];
    mockProjectApi.getProjects.mockResolvedValue(mockProjects);

    const filters = { status: 'active' as const, search: 'test' };
    
    const { result } = renderHook(
      () => useProjects({ userId: 'user-1', filters }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toEqual(mockProjects);
  });

  it('should handle error state', async () => {
    mockProjectApi.getProjects.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useProjects({ userId: 'user-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    
    expect(result.current.error).toBeDefined();
  });
});

describe('useProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch single project', async () => {
    const mockProject = { id: 'proj-1', name: 'Project 1', userId: 'user-1' };
    mockProjectApi.getProject.mockResolvedValue(mockProject);

    const { result } = renderHook(
      () => useProject('proj-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(mockProjectApi.getProject).toHaveBeenCalledWith('proj-1');
    expect(result.current.data).toEqual(mockProject);
  });

  it('should not fetch when projectId is empty', async () => {
    const { result } = renderHook(
      () => useProject(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockProjectApi.getProject).not.toHaveBeenCalled();
  });
});

describe('useDeletedProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch deleted projects', async () => {
    const mockDeletedProjects = [
      { id: 'proj-1', name: 'Deleted Project', userId: 'user-1' },
    ];
    mockProjectApi.getDeletedProjects.mockResolvedValue(mockDeletedProjects);

    const { result } = renderHook(
      () => useDeletedProjects(),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(mockProjectApi.getDeletedProjects).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockDeletedProjects);
  });
});

describe('useProjectRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch project role', async () => {
    const mockRole = { role: 'owner' as const };
    mockProjectApi.getProjectRole.mockResolvedValue(mockRole);

    const { result } = renderHook(
      () => useProjectRole('proj-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(mockProjectApi.getProjectRole).toHaveBeenCalledWith('proj-1');
    expect(result.current.data).toEqual(mockRole);
  });

  it('should not fetch when projectId is empty', async () => {
    const { result } = renderHook(
      () => useProjectRole(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockProjectApi.getProjectRole).not.toHaveBeenCalled();
  });
});
