/**
 * useApiCall Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApiCall } from '@/hooks/useApiCall';
import React from 'react';

// Create a wrapper with QueryClientProvider
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

// Mock the error modules
vi.mock('@/lib/error/ErrorCodeMapper', () => ({
  defaultErrorMapper: {
    mapCode: vi.fn((code: string) => {
      const map: Record<string, { code: string; type: string; severity: string; message: string; userMessage: string; retryable: boolean }> = {
        'E1001': { code: 'E1001', type: 'network', severity: 'high', message: '网络错误', userMessage: '网络连接失败', retryable: true },
        'E1002': { code: 'E1002', type: 'timeout', severity: 'medium', message: '超时', userMessage: '请求超时', retryable: true },
      };
      return map[code] || null;
    }),
    mapStatus: vi.fn((status: number) => null),
  },
}));

vi.mock('@/lib/error/RetryHandler', () => ({
  defaultRetryHandler: {
    execute: vi.fn(async (fn: () => Promise<unknown>) => fn()),
  },
}));

// Mock Toast
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useApiCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() =>
        useApiCall({
          apiFn: async () => 'test',
        })
      , { wrapper: Wrapper });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.execute).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.setData).toBe('function');
    });
  });

  describe('API function execution', () => {
    it('should execute API call successfully', async () => {
      const mockApiFn = vi.fn().mockResolvedValue('test data');
      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useApiCall({
          apiFn: mockApiFn,
          onSuccess,
        })
      , { wrapper: Wrapper });

      await act(async () => {
        await result.current.execute();
      });

      expect(mockApiFn).toHaveBeenCalledTimes(1);
      expect(result.current.data).toBe('test data');
      expect(onSuccess).toHaveBeenCalledWith('test data');
    });

    it('should handle API error', async () => {
      const mockApiFn = vi.fn().mockRejectedValue(new Error('API Error'));
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useApiCall({
          apiFn: mockApiFn,
          onError,
          showToast: false,
        })
      , { wrapper: Wrapper });

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).not.toBeNull();
      expect(onError).toHaveBeenCalled();
    });

    it('should return null on error', async () => {
      const mockApiFn = vi.fn().mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() =>
        useApiCall({
          apiFn: mockApiFn,
          showToast: false,
        })
      , { wrapper: Wrapper });

      const returnValue = await act(async () => {
        return await result.current.execute();
      });

      expect(returnValue).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state', async () => {
      const mockApiFn = vi.fn().mockResolvedValue('test data');

      const { result } = renderHook(() =>
        useApiCall({
          apiFn: mockApiFn,
        })
      , { wrapper: Wrapper });

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('setData', () => {
    it('should allow direct data setting', () => {
      const { result } = renderHook(() =>
        useApiCall({
          apiFn: async () => 'test',
        })
      , { wrapper: Wrapper });

      act(() => {
        result.current.setData('manual data');
      });

      expect(result.current.data).toBe('manual data');
    });
  });

  describe('retry mechanism', () => {
    it('should use retry handler when enabled', async () => {
      const { defaultRetryHandler } = require('@/lib/error/RetryHandler');
      
      const mockApiFn = vi.fn().mockResolvedValue('data');

      const { result } = renderHook(() =>
        useApiCall({
          apiFn: mockApiFn,
          enableRetry: true,
          retryCount: 5,
        })
      , { wrapper: Wrapper });

      await act(async () => {
        await result.current.execute();
      });

      expect(defaultRetryHandler.execute).toHaveBeenCalled();
    });

    it('should not use retry handler when disabled', async () => {
      const { defaultRetryHandler } = require('@/lib/error/RetryHandler');
      
      const mockApiFn = vi.fn().mockResolvedValue('data');

      const { result } = renderHook(() =>
        useApiCall({
          apiFn: mockApiFn,
          enableRetry: false,
        })
      , { wrapper: Wrapper });

      await act(async () => {
        await result.current.execute();
      });

      expect(defaultRetryHandler.execute).not.toHaveBeenCalled();
    });
  });
});