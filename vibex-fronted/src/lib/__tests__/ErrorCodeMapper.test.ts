/**
 * ErrorCodeMapper Tests
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

import { ErrorCodeMapper, defaultErrorMapper } from '../error/ErrorCodeMapper';
import { ApiErrorResponse } from '../error/types';
import { AxiosError } from 'axios';

describe('ErrorCodeMapper', () => {
  describe('constructor', () => {
    it('should use default mappings when no custom mappings provided', () => {
      const mapper = new ErrorCodeMapper();
      const mappings = mapper.getAllMappings();
      expect(Object.keys(mappings).length).toBeGreaterThan(0);
    });

    it('should merge custom mappings with default mappings', () => {
      const customMapping = {
        code: 'CUSTOM1',
        type: 'business' as const,
        severity: 'low' as const,
        message: 'Custom error',
        userMessage: 'Custom user message',
        retryable: false,
      };
      const mapper = new ErrorCodeMapper({ CUSTOM1: customMapping });
      const mappings = mapper.getAllMappings();
      expect(mappings.CUSTOM1).toEqual(customMapping);
    });
  });

  describe('addMapping', () => {
    it('should add a single mapping', () => {
      const mapper = new ErrorCodeMapper();
      const customMapping = {
        code: 'TEST1',
        type: 'business' as const,
        severity: 'low' as const,
        message: 'Test',
        userMessage: 'Test message',
        retryable: false,
      };
      mapper.addMapping('TEST1', customMapping);
      expect(mapper.getAllMappings().TEST1).toEqual(customMapping);
    });
  });

  describe('addMappings', () => {
    it('should add multiple mappings at once', () => {
      const mapper = new ErrorCodeMapper();
      const mappings = {
        TEST1: { code: 'TEST1', type: 'business' as const, severity: 'low' as const, message: 'Test1', userMessage: 'Test1', retryable: false },
        TEST2: { code: 'TEST2', type: 'server' as const, severity: 'critical' as const, message: 'Test2', userMessage: 'Test2', retryable: true },
      };
      mapper.addMappings(mappings);
      expect(mapper.getAllMappings().TEST1).toBeDefined();
      expect(mapper.getAllMappings().TEST2).toBeDefined();
    });
  });

  describe('getErrorCodeFromStatus', () => {
    it('should return E1004 for 401', () => {
      const mapper = new ErrorCodeMapper();
      expect(mapper.getErrorCodeFromStatus(401)).toBe('E1004');
    });

    it('should return E1005 for 403', () => {
      const mapper = new ErrorCodeMapper();
      expect(mapper.getErrorCodeFromStatus(403)).toBe('E1005');
    });

    it('should return E1006 for 404', () => {
      const mapper = new ErrorCodeMapper();
      expect(mapper.getErrorCodeFromStatus(404)).toBe('E1006');
    });

    it('should return E1003 for 500', () => {
      const mapper = new ErrorCodeMapper();
      expect(mapper.getErrorCodeFromStatus(500)).toBe('E1003');
    });

    it('should return E1003 for 502', () => {
      const mapper = new ErrorCodeMapper();
      expect(mapper.getErrorCodeFromStatus(502)).toBe('E1003');
    });

    it('should return E1003 for 503', () => {
      const mapper = new ErrorCodeMapper();
      expect(mapper.getErrorCodeFromStatus(503)).toBe('E1003');
    });

    it('should return E1002 for 408 (request timeout)', () => {
      const mapper = new ErrorCodeMapper();
      expect(mapper.getErrorCodeFromStatus(408)).toBe('E1002');
    });

    it('should return E1001 for 429 (rate limit)', () => {
      const mapper = new ErrorCodeMapper();
      expect(mapper.getErrorCodeFromStatus(429)).toBe('E1001');
    });

    it('should return default E1001 for undefined status', () => {
      const mapper = new ErrorCodeMapper();
      expect(mapper.getErrorCodeFromStatus(undefined)).toBe('E1001');
    });

    it('should generate error code for unknown status', () => {
      const mapper = new ErrorCodeMapper();
      expect(mapper.getErrorCodeFromStatus(418)).toBe('E418');
    });
  });

  describe('getBusinessCode', () => {
    it('should extract code from response.code', () => {
      const mapper = new ErrorCodeMapper();
      const response: ApiErrorResponse = { code: 'B2001' };
      expect(mapper.getBusinessCode(response)).toBe('B2001');
    });

    it('should extract code from response.error with brackets', () => {
      const mapper = new ErrorCodeMapper();
      const response: ApiErrorResponse = { error: 'Something went wrong [B2001]' };
      expect(mapper.getBusinessCode(response)).toBe('B2001');
    });

    it('should return null for response without code or error', () => {
      const mapper = new ErrorCodeMapper();
      const response: ApiErrorResponse = { message: 'Hello' };
      expect(mapper.getBusinessCode(response)).toBeNull();
    });

    it('should return null for undefined response', () => {
      const mapper = new ErrorCodeMapper();
      expect(mapper.getBusinessCode(undefined)).toBeNull();
    });
  });

  describe('map', () => {
    it('should map business error code to config', () => {
      const mapper = new ErrorCodeMapper();
      const response: ApiErrorResponse = { code: 'B2001' };
      const result = mapper.map(new Error('test'), response);
      expect(result.code).toBe('B2001');
      expect(result.type).toBe('business');
    });

    it('should map 401 to unauthorized config', () => {
      const mapper = new ErrorCodeMapper();
      const error = new AxiosError('Unauthorized', '401', undefined, { status: 401 });
      const result = mapper.map(error, undefined, 401);
      expect(result.code).toBe('E1004');
      expect(result.userMessage).toBe('登录已过期，请重新登录');
      expect(result.retryable).toBe(false);
    });

    it('should map 403 to forbidden config', () => {
      const mapper = new ErrorCodeMapper();
      const error = new AxiosError('Forbidden', '403', undefined, { status: 403 });
      const result = mapper.map(error, undefined, 403);
      expect(result.code).toBe('E1005');
      expect(result.userMessage).toBe('无权限执行此操作');
    });

    it('should map 404 to not found config', () => {
      const mapper = new ErrorCodeMapper();
      const error = new AxiosError('Not found', '404', undefined, { status: 404 });
      const result = mapper.map(error, undefined, 404);
      expect(result.code).toBe('E1006');
      expect(result.retryable).toBe(false);
    });

    it('should map 500 to server error config', () => {
      const mapper = new ErrorCodeMapper();
      const error = new AxiosError('Server error', '500', undefined, { status: 500 });
      const result = mapper.map(error, undefined, 500);
      expect(result.code).toBe('E1003');
      expect(result.type).toBe('server');
      expect(result.retryable).toBe(true);
    });

    it('should map network error (no response) to network config', () => {
      const mapper = new ErrorCodeMapper();
      const error = new AxiosError('Network error');
      const result = mapper.map(error);
      expect(result.type).toBe('network');
      expect(result.code).toBe('E1001');
      expect(result.retryable).toBe(true);
    });

    it('should map timeout error correctly', () => {
      const mapper = new ErrorCodeMapper();
      // Pass httpStatus to bypass the default E1001 mapping
      const error = new Error('Request timeout only');
      const result = mapper.map(error, undefined, 408);
      expect(result.type).toBe('timeout');
      expect(result.code).toBe('E1002');
      expect(result.retryable).toBe(true);
    });

    it('should map network-related error message correctly', () => {
      const mapper = new ErrorCodeMapper();
      const error = new Error('Failed to fetch');
      const result = mapper.map(error);
      expect(result.type).toBe('network');
      expect(result.code).toBe('E1001');
    });

    it('should return unknown error for unrecognized errors', () => {
      const mapper = new ErrorCodeMapper();
      // Pass an unrecognized HTTP status that has no mapping
      const error = new Error('Just some random error message xyz');
      const result = mapper.map(error, undefined, 599); // Unrecognized status
      expect(result.type).toBe('unknown');
      expect(result.code).toBe('E9999');
    });
  });

  describe('defaultErrorMapper', () => {
    it('should be an instance of ErrorCodeMapper', () => {
      expect(defaultErrorMapper).toBeInstanceOf(ErrorCodeMapper);
    });

    it('should map HTTP 401 correctly', () => {
      const result = defaultErrorMapper.map(new Error('test'), undefined, 401);
      expect(result.code).toBe('E1004');
    });

    it('should map HTTP 500 correctly', () => {
      const result = defaultErrorMapper.map(new Error('test'), undefined, 500);
      expect(result.code).toBe('E1003');
    });
  });

  // Boundary condition tests
  describe('Boundary Conditions', () => {
    it('should handle empty response object', () => {
      const mapper = new ErrorCodeMapper();
      const result = mapper.map(new Error('test'), {});
      expect(result).toBeDefined();
    });

    it('should handle null error', () => {
      const mapper = new ErrorCodeMapper();
      // null is treated as network error in default handler
      const result = mapper.map(null as any);
      expect(result).toBeDefined();
    });

    it('should handle undefined httpStatus', () => {
      const mapper = new ErrorCodeMapper();
      const result = mapper.map(new Error('test'), undefined, undefined);
      expect(result).toBeDefined();
    });

    it('should handle very large HTTP status code', () => {
      const mapper = new ErrorCodeMapper();
      const result = mapper.map(new Error('test'), undefined, 99999);
      // Large status code falls to unknown
      expect(result.type).toBe('unknown');
    });

    it('should handle negative HTTP status code', () => {
      const mapper = new ErrorCodeMapper();
      const result = mapper.map(new Error('test'), undefined, -1);
      // Negative status falls through to unknown error
      expect(result.type).toBe('unknown');
    });
  });
});
