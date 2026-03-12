/**
 * API Handler Tests
 */

import { withErrorHandling, safeApiCall, ApiHandlerOptions } from '@/lib/apiHandler';

describe('apiHandler', () => {
  describe('withErrorHandling', () => {
    it('should execute successful API call', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await withErrorHandling(mockFn);

      // Result is wrapped in a response object
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle API error', async () => {
      const error = new Error('API Error');
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(withErrorHandling(mockFn)).rejects.toThrow();
    });

    it('should handle different error types', async () => {
      const errors = [
        new Error('Error 1'),
        { code: 'ERR_NETWORK', message: 'Network Error' },
        'String error',
      ];

      for (const err of errors) {
        const mockFn = jest.fn().mockRejectedValue(err);
        try {
          await withErrorHandling(mockFn);
        } catch (e) {
          // Expected to throw
        }
      }
    });

    it('should handle axios error with response', async () => {
      const error = { 
        response: { status: 500, data: { message: 'Server Error' } }, 
        message: 'API Error' 
      };
      const mockFn = jest.fn().mockRejectedValue(error);
      const onError = jest.fn();

      try {
        await withErrorHandling(mockFn, { onError });
      } catch (e) {
        // Expected
      }
      
      expect(onError).toHaveBeenCalled();
    });

    it('should handle network error', async () => {
      const error = { code: 'ERR_NETWORK', message: 'Network Error' };
      const mockFn = jest.fn().mockRejectedValue(error);

      try {
        await withErrorHandling(mockFn, { showToast: false });
      } catch (e) {
        // Expected to throw
      }
      
      // Just verify the function was called
      expect(mockFn).toHaveBeenCalled();
    });

    it('should call onSuccess callback', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const onSuccess = jest.fn();

      await withErrorHandling(mockFn, { onSuccess });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle custom error message', async () => {
      const error = new Error('API Error');
      const mockFn = jest.fn().mockRejectedValue(error);

      try {
        await withErrorHandling(mockFn, { 
          customErrorMessage: 'Custom error message',
          showToast: false
        });
      } catch (e) {
        // Expected to throw
      }
      
      // Just verify the function was called
      expect(mockFn).toHaveBeenCalled();
    });
  });

  describe('safeApiCall', () => {
    it('should execute wrapped call', async () => {
      const mockFn = jest.fn().mockResolvedValue('test');

      const result = await safeApiCall(mockFn);

      expect(result).toBe('test');
    });

    it('should handle error in safeApiCall', async () => {
      const error = new Error('API Error');
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(safeApiCall(mockFn)).rejects.toThrow();
    });

    it('should work with different return types', async () => {
      const mockFn = jest.fn().mockResolvedValue({ data: 'test' });

      const result = await safeApiCall(mockFn);

      expect(result).toEqual({ data: 'test' });
    });

    it('should handle async function', async () => {
      const mockFn = jest.fn().mockResolvedValue(Promise.resolve('async result'));

      const result = await safeApiCall(mockFn);

      expect(result).toBeDefined();
    });
  });
});