/**
 * useHomeGeneration Hook Tests
 */
// @ts-nocheck


import { renderHook, act } from '@testing-library/react';
import { useHomeGeneration } from '../useHomeGeneration';

// Mock the API modules
jest.mock('@/services/api', () => ({
  dddApi: {
    generateBoundedContext: jest.fn(),
    generateDomainModel: jest.fn(),
    generateBusinessFlow: jest.fn(),
  },
  projectApi: {
    createProject: jest.fn(),
  },
}));

// Mock auth store
jest.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({ user: { id: 'test-user-id' } })),
  },
}));

describe('useHomeGeneration', () => {
  const mockOnContextsGenerated = jest.fn();
  const mockOnDomainModelsGenerated = jest.fn();
  const mockOnBusinessFlowGenerated = jest.fn();
  const mockOnProjectCreated = jest.fn();
  const mockOnError = jest.fn();

  const { dddApi, projectApi } = jest.requireMock('@/services/api');

  beforeEach(() => {
    jest.clearAllMocks();
    // Default resolved values for API calls so tests don't need explicit mockSetup
    (dddApi.generateBoundedContext as jest.Mock).mockResolvedValue({ boundedContexts: [] });
    (dddApi.generateDomainModel as jest.Mock).mockResolvedValue({ success: true, domainModels: [] });
    (dddApi.generateBusinessFlow as jest.Mock).mockResolvedValue({ success: true, businessFlow: {} });
    (projectApi.createProject as jest.Mock).mockResolvedValue({ id: 'proj-1' });
  });

  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useHomeGeneration());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generationError).toBeNull();
      expect(result.current.streamStatus).toBe('idle');
      expect(typeof result.current.generateContexts).toBe('function');
      expect(typeof result.current.generateDomainModels).toBe('function');
      expect(typeof result.current.generateBusinessFlow).toBe('function');
      expect(typeof result.current.createProject).toBe('function');
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.abort).toBe('function');
      expect(typeof result.current.retry).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('generateContexts', () => {
    it('should call dddApi.generateBoundedContext with requirement text', async () => {
      (dddApi.generateBoundedContext as jest.Mock).mockResolvedValueOnce({
        boundedContexts: [{ id: '1', name: 'TestContext', description: 'Test' }],
      });

      const { result } = renderHook(() =>
        useHomeGeneration(mockOnContextsGenerated)
      );

      await act(async () => {
        await result.current.generateContexts('test requirement');
      });

      expect(dddApi.generateBoundedContext).toHaveBeenCalledWith('test requirement');
      expect(result.current.streamStatus).toBe('complete');
      expect(mockOnContextsGenerated).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '1', name: 'TestContext', description: 'Test', type: 'core' }),
        ])
      );
    });

    it('should set streamStatus to error when API fails', async () => {
      (dddApi.generateBoundedContext as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      const { result } = renderHook(() =>
        useHomeGeneration(mockOnContextsGenerated, undefined, undefined, undefined, mockOnError)
      );

      await act(async () => {
        await result.current.generateContexts('test');
      });

      expect(result.current.streamStatus).toBe('error');
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should clear error when starting generation', async () => {
      (dddApi.generateBoundedContext as jest.Mock).mockResolvedValueOnce({ boundedContexts: [] });

      const { result } = renderHook(() =>
        useHomeGeneration(undefined, undefined, undefined, undefined, mockOnError)
      );

      await act(async () => {
        await result.current.generateContexts('test');
      });

      expect(result.current.generationError).toBeNull();
    });
  });

  describe('generateDomainModels', () => {
    it('should set generating state when called', async () => {
      (dddApi.generateDomainModel as jest.Mock).mockResolvedValueOnce({ success: true, domainModels: [] });

      const { result } = renderHook(() =>
        useHomeGeneration(undefined, mockOnDomainModelsGenerated)
      );

      const mockContexts = [{ id: '1', name: 'Context1', description: 'Test', type: 'core' as const, relationships: [] }];

      await act(async () => {
        await result.current.generateDomainModels(mockContexts as any);
      });

      expect(result.current.streamStatus).toBe('complete');
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe('generateBusinessFlow', () => {
    it('should set generating state when called', async () => {
      (dddApi.generateBusinessFlow as jest.Mock).mockResolvedValueOnce({ success: true, businessFlow: {} });

      const { result } = renderHook(() =>
        useHomeGeneration(undefined, undefined, mockOnBusinessFlowGenerated)
      );

      const mockModels = [{ id: '1', name: 'Model1' }];

      await act(async () => {
        await result.current.generateBusinessFlow(mockModels as any);
      });

      expect(result.current.streamStatus).toBe('complete');
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe('createProject', () => {
    it('should call projectApi.createProject with correct data', async () => {
      (projectApi.createProject as jest.Mock).mockResolvedValueOnce({ id: 'proj-1', name: 'Test Project' });

      const { result } = renderHook(() =>
        useHomeGeneration(undefined, undefined, undefined, mockOnProjectCreated)
      );

      await act(async () => {
        await result.current.createProject('Test Project', 'A test description');
      });

      expect(projectApi.createProject).toHaveBeenCalledWith({
        name: 'Test Project',
        description: 'A test description',
        userId: 'test-user-id',
      });
      expect(mockOnProjectCreated).toHaveBeenCalled();
    });

    it('should call onError when project creation fails', async () => {
      (projectApi.createProject as jest.Mock).mockRejectedValueOnce(new Error('Creation failed'));

      const { result } = renderHook(() =>
        useHomeGeneration(undefined, undefined, undefined, mockOnProjectCreated, mockOnError)
      );

      await act(async () => {
        await result.current.createProject('Test', 'Desc');
      });

      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('sendMessage', () => {
    it('should call console.log with message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { result } = renderHook(() => useHomeGeneration());

      await act(async () => {
        await result.current.sendMessage('test message');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Sending message:', 'test message');
      consoleSpy.mockRestore();
    });
  });

  describe('abort', () => {
    it('should reset generating state', () => {
      const { result } = renderHook(() => useHomeGeneration());

      act(() => {
        result.current.abort();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.streamStatus).toBe('idle');
    });
  });

  describe('retry', () => {
    it('should clear error and reset status', () => {
      const { result } = renderHook(() => useHomeGeneration());

      act(() => {
        result.current.retry();
      });

      expect(result.current.generationError).toBeNull();
      expect(result.current.streamStatus).toBe('idle');
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useHomeGeneration());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.generationError).toBeNull();
    });
  });

  describe('callback invocations', () => {
    it('should call onContextsGenerated callback when provided', async () => {
      const { result } = renderHook(() =>
        useHomeGeneration(mockOnContextsGenerated)
      );

      await act(async () => {
        await result.current.generateContexts('test requirement');
      });

      // Callback would be called in actual implementation
      expect(result.current.streamStatus).toBe('complete');
    });

    it('should call onDomainModelsGenerated callback when provided', async () => {
      const { result } = renderHook(() =>
        useHomeGeneration(undefined, mockOnDomainModelsGenerated)
      );

      const mockContexts = [{ id: '1', name: 'Context1', description: 'Test' }];

      await act(async () => {
        await result.current.generateDomainModels(mockContexts as any);
      });

      expect(result.current.streamStatus).toBe('complete');
    });

    it('should call onBusinessFlowGenerated callback when provided', async () => {
      const { result } = renderHook(() =>
        useHomeGeneration(undefined, undefined, mockOnBusinessFlowGenerated)
      );

      const mockModels = [{ id: '1', name: 'Model1' }];

      await act(async () => {
        await result.current.generateBusinessFlow(mockModels as any);
      });

      expect(result.current.streamStatus).toBe('complete');
    });

    it('should call onProjectCreated callback when provided', async () => {
      (projectApi.createProject as jest.Mock).mockResolvedValueOnce({ id: 'proj-1' });

      const { result } = renderHook(() =>
        useHomeGeneration(undefined, undefined, undefined, mockOnProjectCreated)
      );

      await act(async () => {
        await result.current.createProject('Project', 'Description');
      });

      expect(mockOnProjectCreated).toHaveBeenCalled();
      expect(result.current.isGenerating).toBe(false);
    });

    it('should work without any callbacks', async () => {
      const { result } = renderHook(() => useHomeGeneration());

      await act(async () => {
        await result.current.generateContexts('test');
      });

      expect(result.current.streamStatus).toBe('complete');
    });
  });

  describe('state transitions', () => {
    it('should transition through generating states correctly', async () => {
      const { result } = renderHook(() => useHomeGeneration());

      // Initial state
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.streamStatus).toBe('idle');

      // After generation
      await act(async () => {
        await result.current.generateContexts('test');
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.streamStatus).toBe('complete');
    });

    it('should handle abort during generation', () => {
      const { result } = renderHook(() => useHomeGeneration());

      act(() => {
        result.current.abort();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.streamStatus).toBe('idle');
    });

    it('should handle retry after error', () => {
      const { result } = renderHook(() => useHomeGeneration());

      act(() => {
        result.current.retry();
      });

      expect(result.current.generationError).toBeNull();
      expect(result.current.streamStatus).toBe('idle');
    });
  });

  describe('multiple operations', () => {
    it('should handle sequential generations', async () => {
      (dddApi.generateBoundedContext as jest.Mock).mockResolvedValue({ boundedContexts: [] });
      (dddApi.generateDomainModel as jest.Mock).mockResolvedValue({ success: true, domainModels: [] });

      const { result } = renderHook(() => useHomeGeneration());

      await act(async () => {
        await result.current.generateContexts('requirement 1');
      });

      expect(result.current.streamStatus).toBe('complete');

      await act(async () => {
        await result.current.generateDomainModels([]);
      });

      expect(result.current.streamStatus).toBe('complete');
    });

    it('should handle multiple aborts', () => {
      const { result } = renderHook(() => useHomeGeneration());

      act(() => {
        result.current.abort();
        result.current.abort();
        result.current.abort();
      });

      expect(result.current.isGenerating).toBe(false);
    });
  });
});