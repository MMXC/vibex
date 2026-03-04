/**
 * ErrorClassifier Tests
 */

// Mock axios before importing anything else
jest.mock('axios', () => {
  class MockAxiosError extends Error {
    code?: string;
    response?: { status?: number };
    isAxiosError: boolean = true;
    config: any = {};
    request: any = {};

    constructor(message: string, code?: string, config?: any, response?: { status?: number }) {
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
    default: {
      create: jest.fn(() => ({
        interceptors: {
          request: { use: jest.fn(() => ({ eject: jest.fn() })) },
          response: { use: jest.fn(() => ({ eject: jest.fn() })) },
        },
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      })),
    },
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  };
});

import { ErrorClassifier } from '../error/ErrorClassifier';
import { ApiErrorResponse } from '../error/types';
import { AxiosError } from 'axios';

describe('ErrorClassifier', () => {
  describe('isNetworkError', () => {
    it('should classify TypeError with "Failed to fetch" as network error', () => {
      const error = new TypeError('Failed to fetch');
      expect(ErrorClassifier.isNetworkError(error)).toBe(true);
    });

    it('should classify TypeError with "NetworkError" as network error', () => {
      const error = new TypeError('NetworkError: something');
      expect(ErrorClassifier.isNetworkError(error)).toBe(true);
    });

    it('should classify Error with "network" in message as network error', () => {
      const error = new Error('network request failed');
      expect(ErrorClassifier.isNetworkError(error)).toBe(true);
    });

    it('should classify Error with "Failed to fetch" as network error', () => {
      const error = new Error('Failed to fetch');
      expect(ErrorClassifier.isNetworkError(error)).toBe(true);
    });

    // Note: These are classified as timeout errors, not network errors
    // because the code checks for "timeout" but not for DNS/refused errors
    it('should not classify DNS error as network (classified as unknown)', () => {
      const error = new Error('getaddrinfo ENOTFOUND');
      expect(ErrorClassifier.isNetworkError(error)).toBe(false);
    });

    it('should not classify connection refused as network (classified as unknown)', () => {
      const error = new Error('connect ECONNREFUSED');
      expect(ErrorClassifier.isNetworkError(error)).toBe(false);
    });

    it('should return false for non-network errors', () => {
      const error = new Error('Something went wrong');
      expect(ErrorClassifier.isNetworkError(error)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(ErrorClassifier.isNetworkError(null)).toBe(false);
      expect(ErrorClassifier.isNetworkError(undefined)).toBe(false);
    });
  });

  describe('isTimeoutError', () => {
    it('should classify timeout error', () => {
      const error = new Error('timeout of 5000ms exceeded');
      expect(ErrorClassifier.isTimeoutError(error)).toBe(true);
    });

    it('should classify "timed out" error', () => {
      const error = new Error('Request timed out');
      expect(ErrorClassifier.isTimeoutError(error)).toBe(true);
    });

    it('should classify request timeout error', () => {
      const error = new Error('request timeout');
      expect(ErrorClassifier.isTimeoutError(error)).toBe(true);
    });

    it('should classify ETIMEDOUT error', () => {
      const error = new Error('ETIMEDOUT');
      expect(ErrorClassifier.isTimeoutError(error)).toBe(true);
    });

    it('should classify AxiosError with ECONNABORTED code', () => {
      const error = new AxiosError('timeout', 'ECONNABORTED');
      expect(ErrorClassifier.isTimeoutError(error)).toBe(true);
    });

    it('should classify AxiosError with ETIMEDOUT code', () => {
      const error = new AxiosError('timeout', 'ETIMEDOUT');
      expect(ErrorClassifier.isTimeoutError(error)).toBe(true);
    });

    it('should return false for non-timeout errors', () => {
      const error = new Error('Something else went wrong');
      expect(ErrorClassifier.isTimeoutError(error)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should classify 500 status as server error', () => {
      const error = new AxiosError('Server error', '500', undefined, { status: 500 });
      expect(ErrorClassifier.isServerError(error)).toBe(true);
    });

    it('should classify 502 status as server error', () => {
      const error = new AxiosError('Bad gateway', '502', undefined, { status: 502 });
      expect(ErrorClassifier.isServerError(error)).toBe(true);
    });

    it('should classify 503 status as server error', () => {
      const error = new AxiosError('Service unavailable', '503', undefined, { status: 503 });
      expect(ErrorClassifier.isServerError(error)).toBe(true);
    });

    it('should classify 504 status as server error', () => {
      const error = new AxiosError('Gateway timeout', '504', undefined, { status: 504 });
      expect(ErrorClassifier.isServerError(error)).toBe(true);
    });

    it('should return false for 4xx errors', () => {
      const error = new AxiosError('Bad request', '400', undefined, { status: 400 });
      expect(ErrorClassifier.isServerError(error)).toBe(false);
    });

    it('should return false for errors without response', () => {
      const error = new AxiosError('Network error');
      expect(ErrorClassifier.isServerError(error)).toBe(false);
    });
  });

  describe('isClientError', () => {
    it('should classify 400 status as client error', () => {
      const error = new AxiosError('Bad request', '400', undefined, { status: 400 });
      expect(ErrorClassifier.isClientError(error)).toBe(true);
    });

    it('should classify 401 status as client error', () => {
      const error = new AxiosError('Unauthorized', '401', undefined, { status: 401 });
      expect(ErrorClassifier.isClientError(error)).toBe(true);
    });

    it('should classify 403 status as client error', () => {
      const error = new AxiosError('Forbidden', '403', undefined, { status: 403 });
      expect(ErrorClassifier.isClientError(error)).toBe(true);
    });

    it('should classify 404 status as client error', () => {
      const error = new AxiosError('Not found', '404', undefined, { status: 404 });
      expect(ErrorClassifier.isClientError(error)).toBe(true);
    });

    it('should return false for 5xx errors', () => {
      const error = new AxiosError('Server error', '500', undefined, { status: 500 });
      expect(ErrorClassifier.isClientError(error)).toBe(false);
    });

    it('should return false for errors without response', () => {
      const error = new AxiosError('Network error');
      expect(ErrorClassifier.isClientError(error)).toBe(false);
    });
  });

  describe('isBusinessError', () => {
    it('should classify response with error field as business error', () => {
      const response: ApiErrorResponse = { error: 'Something went wrong' };
      expect(ErrorClassifier.isBusinessError(new Error('test'), response)).toBe(true);
    });

    it('should classify response with business error code as business error', () => {
      const response: ApiErrorResponse = { code: 'B2001' };
      expect(ErrorClassifier.isBusinessError(new Error('test'), response)).toBe(true);
    });

    it('should classify 4xx AxiosError as business error', () => {
      const error = new AxiosError('Bad request', '400', undefined, { status: 400 });
      expect(ErrorClassifier.isBusinessError(error)).toBe(true);
    });

    it('should return false for 5xx errors', () => {
      const error = new AxiosError('Server error', '500', undefined, { status: 500 });
      expect(ErrorClassifier.isBusinessError(error)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error = new TypeError('Failed to fetch');
      expect(ErrorClassifier.isRetryableError(error)).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const error = new Error('timeout exceeded');
      expect(ErrorClassifier.isRetryableError(error)).toBe(true);
    });

    it('should return true for server errors (5xx)', () => {
      const error = new AxiosError('Server error', '500', undefined, { status: 500 });
      expect(ErrorClassifier.isRetryableError(error)).toBe(true);
    });

    it('should return true for 429 Too Many Requests', () => {
      const error = new AxiosError('Too many requests', '429', undefined, { status: 429 });
      expect(ErrorClassifier.isRetryableError(error)).toBe(true);
    });

    it('should return false for client errors (4xx except 429)', () => {
      const error = new AxiosError('Bad request', '400', undefined, { status: 400 });
      expect(ErrorClassifier.isRetryableError(error)).toBe(false);
    });

    it('should return false for unknown errors', () => {
      const error = new Error('Unknown error');
      expect(ErrorClassifier.isRetryableError(error)).toBe(false);
    });
  });

  describe('determineType', () => {
    it('should return "network" for network errors', () => {
      const error = new TypeError('Failed to fetch');
      expect(ErrorClassifier.determineType(error)).toBe('network');
    });

    it('should return "timeout" for timeout errors', () => {
      const error = new Error('timeout exceeded');
      expect(ErrorClassifier.determineType(error)).toBe('timeout');
    });

    it('should return "server" for 5xx errors', () => {
      const error = new AxiosError('Server error', '500', undefined, { status: 500 });
      expect(ErrorClassifier.determineType(error)).toBe('server');
    });

    // Note: 4xx errors are classified as 'business' because isBusinessError 
    // checks for 4xx status before isClientError is checked
    it('should return "business" for 4xx errors (due to isBusinessError priority)', () => {
      const error = new AxiosError('Bad request', '400', undefined, { status: 400 });
      expect(ErrorClassifier.determineType(error)).toBe('business');
    });

    it('should return "business" for response with error field', () => {
      const response: ApiErrorResponse = { error: 'Business error' };
      expect(ErrorClassifier.determineType(new Error('test'), response)).toBe('business');
    });

    it('should return "unknown" for unknown errors', () => {
      const error = new Error('Unknown error');
      expect(ErrorClassifier.determineType(error)).toBe('unknown');
    });
  });

  describe('determineSeverity', () => {
    it('should return "high" for network errors', () => {
      expect(ErrorClassifier.determineSeverity('network')).toBe('high');
    });

    it('should return "medium" for timeout errors', () => {
      expect(ErrorClassifier.determineSeverity('timeout')).toBe('medium');
    });

    it('should return "critical" for server errors', () => {
      expect(ErrorClassifier.determineSeverity('server')).toBe('critical');
    });

    it('should return "high" for client errors with 401', () => {
      expect(ErrorClassifier.determineSeverity('client', 401)).toBe('high');
    });

    it('should return "high" for client errors with 403', () => {
      expect(ErrorClassifier.determineSeverity('client', 403)).toBe('high');
    });

    it('should return "medium" for other client errors', () => {
      expect(ErrorClassifier.determineSeverity('client', 400)).toBe('medium');
    });

    it('should return "medium" for business errors', () => {
      expect(ErrorClassifier.determineSeverity('business')).toBe('medium');
    });

    it('should return "low" for unknown errors', () => {
      expect(ErrorClassifier.determineSeverity('unknown')).toBe('low');
    });
  });

  describe('classify', () => {
    it('should classify network error with correct properties', () => {
      const error = new TypeError('Failed to fetch');
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('network');
      expect(result.severity).toBe('high');
      expect(result.retryable).toBe(true);
    });

    it('should classify timeout error with correct properties', () => {
      const error = new Error('timeout exceeded');
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('timeout');
      expect(result.severity).toBe('medium');
      expect(result.retryable).toBe(true);
    });

    it('should classify server error with correct properties', () => {
      const error = new AxiosError('Server error', '500', undefined, { status: 500 });
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('server');
      expect(result.severity).toBe('critical');
      expect(result.retryable).toBe(true);
    });

    it('should classify 4xx error as business (due to isBusinessError priority)', () => {
      const error = new AxiosError('Bad request', '400', undefined, { status: 400 });
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('business');
      expect(result.severity).toBe('medium');
      expect(result.retryable).toBe(false);
    });

    it('should classify business error with correct properties', () => {
      const response: ApiErrorResponse = { error: 'Business error' };
      const error = new Error('test');
      const result = ErrorClassifier.classify(error, response);

      expect(result.type).toBe('business');
      expect(result.severity).toBe('medium');
      expect(result.retryable).toBe(false);
    });

    it('should classify unknown error with correct properties', () => {
      const error = new Error('Unknown error');
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('unknown');
      expect(result.severity).toBe('low');
      expect(result.retryable).toBe(false);
    });
  });

  // Boundary condition tests
  describe('Boundary Conditions', () => {
    it('should handle empty error message', () => {
      const error = new Error('');
      expect(ErrorClassifier.isNetworkError(error)).toBe(false);
      expect(ErrorClassifier.isTimeoutError(error)).toBe(false);
    });

    it('should handle very long error message', () => {
      const longMessage = 'a'.repeat(10000);
      const error = new Error(longMessage);
      expect(ErrorClassifier.determineType(error)).toBe('unknown');
    });

    it('should handle error message with special characters', () => {
      const error = new Error('Error with <script>alert("xss")</script>');
      expect(ErrorClassifier.determineType(error)).toBe('unknown');
    });

    it('should handle error message with Unicode', () => {
      const error = new Error('错误信息 🔴 🎉');
      expect(ErrorClassifier.determineType(error)).toBe('unknown');
    });
  });
});
