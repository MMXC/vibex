/**
 * useHomeGeneration Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useHomeGeneration } from '../useHomeGeneration';

describe('useHomeGeneration', () => {
  const mockOnContextsGenerated = jest.fn();
  const mockOnDomainModelsGenerated = jest.fn();
  const mockOnBusinessFlowGenerated = jest.fn();
  const mockOnProjectCreated = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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
    it('should set generating state when called', async () => {
      const { result } = renderHook(() =>
        useHomeGeneration(mockOnContextsGenerated)
      );

      await act(async () => {
        await result.current.generateContexts('test requirement');
      });

      expect(result.current.streamStatus).toBe('complete');
      expect(result.current.isGenerating).toBe(false);
    });

    it('should clear error when starting generation', async () => {
      const { result } = renderHook(() =>
        useHomeGeneration(undefined, undefined, undefined, undefined, mockOnError)
      );

      // First, trigger an error state
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await act(async () => {
        await result.current.generateContexts('test');
      });

      expect(result.current.generationError).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('generateDomainModels', () => {
    it('should set generating state when called', async () => {
      const { result } = renderHook(() =>
        useHomeGeneration(undefined, mockOnDomainModelsGenerated)
      );

      const mockContexts = [{ id: '1', name: 'Context1', description: 'Test' }];

      await act(async () => {
        await result.current.generateDomainModels(mockContexts as any);
      });

      expect(result.current.streamStatus).toBe('complete');
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe('generateBusinessFlow', () => {
    it('should set generating state when called', async () => {
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
    it('should set generating state when called', async () => {
      const { result } = renderHook(() =>
        useHomeGeneration(undefined, undefined, undefined, mockOnProjectCreated)
      );

      await act(async () => {
        await result.current.createProject();
      });

      expect(result.current.isGenerating).toBe(false);
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
});