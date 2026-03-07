/**
 * useApiCall Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useApiCall } from '@/hooks/useApiCall';

// Mock the error modules
jest.mock('@/lib/error/ErrorCodeMapper', () => ({
  defaultErrorMapper: {
    mapCode: jest.fn((code: string) => {
      const map: Record<string, { code: string; type: string; severity: string; message: string; userMessage: string; retryable: boolean }> = {
        'E1001': { code: 'E1001', type: 'network', severity: 'high', message: '网络错误', userMessage: '网络连接失败', retryable: true },
        'E1002': { code: 'E1002', type: 'timeout', severity: 'medium', message: '超时', userMessage: '请求超时', retryable: true },
      };
      return map[code] || null;
    }),
    mapStatus: jest.fn((status: number) => null),
  },
}));

jest.mock('@/lib/error/RetryHandler', () => ({
  defaultRetryHandler: {
    execute: jest.fn(async (fn: () => Promise<unknown>) => fn()),
  },
}));

// Mock Toast
jest.mock('@/components/ui/Toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('useApiCall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() =>
        useApiCall({
          apiFn: async () => 'test',
        })
      );

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
      const mockApiFn = jest.fn().mockResolvedValue('test data');
      const onSuccess = jest.fn();

      const { result } = renderHook(() =>
        useApiCall({
          apiFn: mockApiFn,
          onSuccess,
        })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(mockApiFn).toHaveBeenCalledTimes(1);
      expect(result.current.data).toBe('test data');
      expect(onSuccess).toHaveBeenCalledWith('test data');
    });

    it('should handle API error', async () => {
      const mockApiFn = jest.fn().mockRejectedValue(new Error('API Error'));
      const onError = jest.fn();

      const { result } = renderHook(() =>
        useApiCall({
          apiFn: mockApiFn,
          onError,
          showToast: false,
        })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).not.toBeNull();
      expect(onError).toHaveBeenCalled();
    });

    it('should return null on error', async () => {
      const mockApiFn = jest.fn().mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() =>
        useApiCall({
          apiFn: mockApiFn,
          showToast: false,
        })
      );

      const returnValue = await act(async () => {
        return await result.current.execute();
      });

      expect(returnValue).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state', async () => {
      const mockApiFn = jest.fn().mockResolvedValue('test data');

      const { result } = renderHook(() =>
        useApiCall({
          apiFn: mockApiFn,
        })
      );

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
      );

      act(() => {
        result.current.setData('manual data');
      });

      expect(result.current.data).toBe('manual data');
    });
  });

  describe('retry mechanism', () => {
    it('should use retry handler when enabled', async () => {
      const { defaultRetryHandler } = require('@/lib/error/RetryHandler');
      
      const mockApiFn = jest.fn().mockResolvedValue('data');

      const { result } = renderHook(() =>
        useApiCall({
          apiFn: mockApiFn,
          enableRetry: true,
          retryCount: 5,
        })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(defaultRetryHandler.execute).toHaveBeenCalled();
    });

    it('should not use retry handler when disabled', async () => {
      const { defaultRetryHandler } = require('@/lib/error/RetryHandler');
      
      const mockApiFn = jest.fn().mockResolvedValue('data');

      const { result } = renderHook(() =>
        useApiCall({
          apiFn: mockApiFn,
          enableRetry: false,
        })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(defaultRetryHandler.execute).not.toHaveBeenCalled();
    });
  });
});
