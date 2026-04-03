/**
 * RetryHandler Tests
 */
// @ts-nocheck


// Mock axios for ErrorClassifier dependency
jest.mock('axios', () => {
  class MockAxiosError extends Error {
    code?: string;
    response?: { status?: number; data?: any };
    isAxiosError: boolean = true;
    config: any = {};
    request: any = {};

    constructor(message: string, code?: string, config?: any, response?: { status?: number; data?: any }) {
      super(message);
      this.name = 'AxiosError';
      this.code = code;
      this.config = config;
      this.response = response;
    }
  }
  
  return {
    __esModule: true,
    AxiosError: MockAxiosError,
  };
});

import { RetryHandler, DEFAULT_RETRY_OPTIONS } from '../error/RetryHandler';
import { AxiosError } from 'axios';

describe('RetryHandler', () => {
  describe('constructor', () => {
    it('should use default options when no options provided', () => {
      const handler = new RetryHandler();
      expect(handler.getOptions()).toEqual(DEFAULT_RETRY_OPTIONS);
    });

    it('should merge custom options with defaults', () => {
      const handler = new RetryHandler({ maxRetries: 5 });
      expect(handler.getOptions().maxRetries).toBe(5);
      expect(handler.getOptions().baseDelay).toBe(DEFAULT_RETRY_OPTIONS.baseDelay);
    });

    it('should have exponential as default backoff', () => {
      const handler = new RetryHandler();
      expect(handler.getOptions().backoff).toBe('exponential');
    });
  });

  describe('setOptions', () => {
    it('should update options', () => {
      const handler = new RetryHandler();
      handler.setOptions({ maxRetries: 10 });
      expect(handler.getOptions().maxRetries).toBe(10);
    });

    it('should update backoff algorithm', () => {
      const handler = new RetryHandler();
      handler.setOptions({ backoff: 'linear' });
      expect(handler.getOptions().backoff).toBe('linear');
    });

    it('should update jitter setting', () => {
      const handler = new RetryHandler();
      handler.setOptions({ jitter: false });
      expect(handler.getOptions().jitter).toBe(false);
    });
  });

  describe('execute', () => {
    it('should succeed on first attempt', async () => {
      const handler = new RetryHandler({ maxRetries: 3 });
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await handler.execute(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry non-retryable errors (400)', async () => {
      const handler = new RetryHandler({ maxRetries: 3, baseDelay: 10 });
      const error = new AxiosError('Bad request', '400', undefined, { status: 400 });
      const fn = jest.fn().mockRejectedValue(error);
      
      await expect(handler.execute(fn)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1); // No retries for 400
    });

    it('should retry network errors', async () => {
      const handler = new RetryHandler({ maxRetries: 1, baseDelay: 10 });
      const error = new TypeError('Failed to fetch');
      
      let callCount = 0;
      const fn = async () => {
        callCount++;
        if (callCount === 1) throw error;
        return 'success';
      };
      
      const result = await handler.execute(fn);
      expect(result).toBe('success');
    });

    it('should retry timeout errors', async () => {
      const handler = new RetryHandler({ maxRetries: 1, baseDelay: 10 });
      
      let callCount = 0;
      const fn = async () => {
        callCount++;
        if (callCount === 1) throw new Error('timeout exceeded');
        return 'success';
      };
      
      const result = await handler.execute(fn);
      expect(result).toBe('success');
    });

    it('should retry server errors (5xx)', async () => {
      const handler = new RetryHandler({ maxRetries: 1, baseDelay: 10 });
      const error = new AxiosError('Server error', '500', undefined, { status: 500 });
      
      let callCount = 0;
      const fn = async () => {
        callCount++;
        if (callCount === 1) throw error;
        return 'success';
      };
      
      const result = await handler.execute(fn);
      expect(result).toBe('success');
    });

    it('should use custom shouldRetry function', async () => {
      const handler = new RetryHandler({ maxRetries: 1, baseDelay: 10 });
      const shouldRetry = jest.fn().mockReturnValue(true);
      
      let callCount = 0;
      const fn = async () => {
        callCount++;
        if (callCount === 1) throw new Error('Custom retry');
        return 'success';
      };
      
      const result = await handler.execute(fn, { shouldRetry });
      expect(result).toBe('success');
      expect(shouldRetry).toHaveBeenCalled();
    });

    it('should not retry when shouldRetry returns false', async () => {
      const handler = new RetryHandler({ maxRetries: 3, baseDelay: 10 });
      const shouldRetry = jest.fn().mockReturnValue(false);
      const fn = jest.fn().mockRejectedValue(new Error('No retry'));
      
      await expect(handler.execute(fn, { shouldRetry })).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('withRetry', () => {
    it('should create handler with options', () => {
      const handler = RetryHandler.withRetry(Promise.resolve('test'), { maxRetries: 5 });
      expect(handler).toBeInstanceOf(Promise);
    });
  });

  describe('withoutRetry', () => {
    it('should return promise without retry wrapper', async () => {
      const promise = Promise.resolve('Success');
      const result = await RetryHandler.withoutRetry(promise);
      expect(result).toBe('Success');
    });

    it('should propagate rejection', async () => {
      const promise = Promise.reject(new Error('Fail'));
      
      await expect(RetryHandler.withoutRetry(promise)).rejects.toThrow('Fail');
    });
  });

  describe('DEFAULT_RETRY_OPTIONS', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_RETRY_OPTIONS.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_OPTIONS.baseDelay).toBe(1000);
      expect(DEFAULT_RETRY_OPTIONS.maxDelay).toBe(10000);
      expect(DEFAULT_RETRY_OPTIONS.backoff).toBe('exponential');
      expect(DEFAULT_RETRY_OPTIONS.jitter).toBe(true);
    });
  });

  // Boundary condition tests
  describe('Boundary Conditions', () => {
    it('should handle zero maxRetries', async () => {
      const handler = new RetryHandler({ maxRetries: 0, baseDelay: 10 });
      const fn = jest.fn().mockRejectedValue(new Error('Fail'));
      
      await expect(handler.execute(fn)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle very large maxRetries', async () => {
      const handler = new RetryHandler({ maxRetries: 100, baseDelay: 10 });
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await handler.execute(fn);
      expect(result).toBe('success');
    });

    it('should handle synchronous function that returns value', async () => {
      const handler = new RetryHandler({ maxRetries: 1, baseDelay: 10 });
      const fn = jest.fn().mockReturnValue('sync success');
      
      const result = await handler.execute(fn);
      expect(result).toBe('sync success');
    });

    it('should handle different backoff options', () => {
      const exp = new RetryHandler({ backoff: 'exponential' });
      expect(exp.getOptions().backoff).toBe('exponential');

      const lin = new RetryHandler({ backoff: 'linear' });
      expect(lin.getOptions().backoff).toBe('linear');

      const fix = new RetryHandler({ backoff: 'fixed' });
      expect(fix.getOptions().backoff).toBe('fixed');
    });
  });
});
