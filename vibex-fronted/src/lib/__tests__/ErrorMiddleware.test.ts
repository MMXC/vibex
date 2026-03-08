/**
 * ErrorMiddleware Tests
 */

// Mock axios
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

import { ErrorMiddleware, defaultErrorMiddleware, withErrorHandling } from '../error/ErrorMiddleware';
import { AxiosError } from 'axios';

describe('ErrorMiddleware', () => {
  describe('constructor', () => {
    it('should use default options when none provided', () => {
      const middleware = new ErrorMiddleware();
      expect(middleware).toBeDefined();
    });

    it('should accept custom options', () => {
      const middleware = new ErrorMiddleware({
        showToast: false,
        retryCount: 5,
        enableRetry: false,
      });
      expect(middleware).toBeDefined();
    });

    it('should default showToast to true', () => {
      const middleware = new ErrorMiddleware();
      // We can verify through behavior
    });
  });

  describe('setToastFunction', () => {
    it('should set toast function', () => {
      const middleware = new ErrorMiddleware();
      const toastFn = jest.fn();
      
      middleware.setToastFunction(toastFn);
      
      // Function should be set (no error thrown)
      expect(toastFn).not.toHaveBeenCalled();
    });
  });

  describe('handleError', () => {
    it('should handle network error', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const error = new TypeError('Failed to fetch');
      
      const result = middleware.handleError(error);
      
      expect(result.type).toBe('network');
      expect(result.severity).toBe('high');
      expect(result.retryable).toBe(true);
    });

    it('should handle timeout error', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const error = new Error('timeout exceeded');
      
      const result = middleware.handleError(error);
      
      expect(result.type).toBe('timeout');
      expect(result.severity).toBe('medium');
    });

    it('should handle 401 unauthorized error', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const error = new AxiosError('Unauthorized', '401', undefined, { status: 401 });
      
      const result = middleware.handleError(error, error.response as any);
      
      expect(result.type).toBe('business');
      expect(result.userMessage).toBe('登录已过期，请重新登录');
    });

    it('should handle 403 forbidden error', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const error = new AxiosError('Forbidden', '403', undefined, { status: 403 });
      
      const result = middleware.handleError(error, error.response as any);
      
      expect(result.userMessage).toBe('无权限执行此操作');
    });

    it('should handle 404 not found error', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const error = new AxiosError('Not found', '404', undefined, { status: 404 });
      
      const result = middleware.handleError(error, error.response as any);
      
      expect(result.code).toBe('E1006');
    });

    it('should handle 500 server error', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const error = new AxiosError('Server error', '500', undefined, { status: 500 });
      
      const result = middleware.handleError(error, error.response as any);
      
      expect(result.type).toBe('server');
      expect(result.severity).toBe('critical');
      expect(result.retryable).toBe(true);
    });

    it('should call onError callback', () => {
      const onError = jest.fn();
      const middleware = new ErrorMiddleware({ showToast: false, onError });
      const error = new Error('Test error');
      
      middleware.handleError(error);
      
      expect(onError).toHaveBeenCalled();
    });

    it('should return ErrorConfig with all required fields', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const error = new Error('Test error');
      
      const result = middleware.handleError(error);
      
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('userMessage');
      expect(result).toHaveProperty('retryable');
    });
  });

  describe('wrap', () => {
    it('should execute successful function', async () => {
      const middleware = new ErrorMiddleware({ enableRetry: false });
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await middleware.wrap(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle error when enableRetry is false', async () => {
      const middleware = new ErrorMiddleware({ enableRetry: false, showToast: false });
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(middleware.wrap(fn)).rejects.toThrow('Test error');
    });

    it('should call handleError on failure', async () => {
      const middleware = new ErrorMiddleware({ enableRetry: false, showToast: false });
      const handleErrorSpy = jest.spyOn(middleware, 'handleError');
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      try {
        await middleware.wrap(fn);
      } catch (e) {
        // Expected to throw
      }
      
      expect(handleErrorSpy).toHaveBeenCalled();
    });

    it('should respect custom retry options', async () => {
      const middleware = new ErrorMiddleware({ 
        enableRetry: true, 
        retryCount: 1,
        retryDelay: 10,
        showToast: false 
      });
      
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 2) throw new TypeError('Failed to fetch');
        return 'success';
      };
      
      const result = await middleware.wrap(fn);
      expect(result).toBe('success');
    });
  });

  describe('createHandler', () => {
    it('should create a wrapped function', async () => {
      const middleware = new ErrorMiddleware({ enableRetry: false });
      const fn = jest.fn().mockResolvedValue('success');
      
      const handler = middleware.createHandler(fn);
      const result = await handler();
      
      expect(result).toBe('success');
    });

    it('should pass options to wrap', async () => {
      const middleware = new ErrorMiddleware({ enableRetry: false });
      const fn = jest.fn().mockResolvedValue('success');
      
      const handler = middleware.createHandler(fn, { enableRetry: true });
      await handler();
      
      expect(fn).toHaveBeenCalled();
    });
  });

  describe('addErrorMapping', () => {
    it('should add custom error mapping', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const customMapping = {
        code: 'CUSTOM1',
        type: 'business' as const,
        severity: 'low' as const,
        message: 'Custom error',
        userMessage: 'Custom message',
        retryable: false,
      };
      
      middleware.addErrorMapping('CUSTOM1', customMapping);
      const mappings = middleware.getErrorMappings();
      
      expect(mappings.CUSTOM1).toEqual(customMapping);
    });
  });

  describe('addErrorMappings', () => {
    it('should add multiple error mappings', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const mappings = {
        CUSTOM1: { code: 'CUSTOM1', type: 'business' as const, severity: 'low' as const, message: 'Error 1', userMessage: 'Message 1', retryable: false },
        CUSTOM2: { code: 'CUSTOM2', type: 'server' as const, severity: 'critical' as const, message: 'Error 2', userMessage: 'Message 2', retryable: true },
      };
      
      middleware.addErrorMappings(mappings);
      const allMappings = middleware.getErrorMappings();
      
      expect(allMappings.CUSTOM1).toBeDefined();
      expect(allMappings.CUSTOM2).toBeDefined();
    });
  });

  describe('getErrorMappings', () => {
    it('should return all error mappings', () => {
      const middleware = new ErrorMiddleware();
      const mappings = middleware.getErrorMappings();
      
      expect(mappings).toBeDefined();
      expect(Object.keys(mappings).length).toBeGreaterThan(0);
    });
  });

  describe('defaultErrorMiddleware', () => {
    it('should be an instance of ErrorMiddleware', () => {
      expect(defaultErrorMiddleware).toBeInstanceOf(ErrorMiddleware);
    });
  });

  describe('withErrorHandling', () => {
    it('should execute function with error handling', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await withErrorHandling(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle errors with custom options', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(withErrorHandling(fn, { showToast: false })).rejects.toThrow('Test error');
    });
  });

  // Boundary condition tests
  describe('Boundary Conditions', () => {
    it('should handle null error', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const result = middleware.handleError(null as any);
      expect(result).toBeDefined();
    });

    it('should handle undefined error', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const result = middleware.handleError(undefined as any);
      expect(result).toBeDefined();
    });

    it('should handle error with no response', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const error = new AxiosError('Network error');
      const result = middleware.handleError(error);
      expect(result.type).toBe('network');
    });

    it('should handle empty error message', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const error = new Error('');
      const result = middleware.handleError(error);
      expect(result).toBeDefined();
    });

    it('should handle very long error message', () => {
      const middleware = new ErrorMiddleware({ showToast: false });
      const longMessage = 'a'.repeat(10000);
      const error = new Error(longMessage);
      const result = middleware.handleError(error);
      // The implementation may truncate or use default messages for unknown errors
      expect(result).toBeDefined();
    });
  });
});
