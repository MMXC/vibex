// @ts-nocheck
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
  isSuccessResponse,
  isErrorResponse,
  ErrorCodes,
  ApiResponse,
} from '../api-response';

describe('api-response', () => {
  describe('successResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: '1', name: 'test' };
      const result = successResponse(data);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.meta?.timestamp).toBeDefined();
      expect(result.meta?.requestId).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should accept custom requestId', () => {
      const result = successResponse({ id: '1' }, 'custom-request-id');
      expect(result.meta?.requestId).toBe('custom-request-id');
    });
  });

  describe('errorResponse', () => {
    it('should create an error response', () => {
      const result = errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid input', { field: 'email' });
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VAL_001');
      expect(result.error?.message).toBe('Invalid input');
      expect(result.error?.details).toEqual({ field: 'email' });
      expect(result.data).toBeUndefined();
    });
  });

  describe('unauthorizedResponse', () => {
    it('should create an unauthorized response with default message', () => {
      const result = unauthorizedResponse();
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AUTH_001');
      expect(result.error?.message).toBe('Unauthorized');
    });

    it('should accept custom message', () => {
      const result = unauthorizedResponse('Token expired');
      expect(result.error?.message).toBe('Token expired');
    });
  });

  describe('notFoundResponse', () => {
    it('should create a not found response', () => {
      const result = notFoundResponse('Project not found');
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RES_001');
      expect(result.error?.message).toBe('Project not found');
    });
  });

  describe('validationErrorResponse', () => {
    it('should create a validation error response', () => {
      const result = validationErrorResponse('Email is required', { field: 'email' });
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VAL_001');
      expect(result.error?.details).toEqual({ field: 'email' });
    });
  });

  describe('internalErrorResponse', () => {
    it('should create an internal error response', () => {
      const result = internalErrorResponse();
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SYS_001');
    });
  });

  describe('isSuccessResponse', () => {
    it('should return true for success response with data', () => {
      const response: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: '1' },
        meta: { timestamp: new Date().toISOString(), requestId: '123' },
      };
      expect(isSuccessResponse(response)).toBe(true);
    });

    it('should return false for error response', () => {
      const response: ApiResponse<never> = {
        success: false,
        error: { code: 'AUTH_001', message: 'Unauthorized' },
        meta: { timestamp: new Date().toISOString(), requestId: '123' },
      };
      expect(isSuccessResponse(response)).toBe(false);
    });
  });

  describe('isErrorResponse', () => {
    it('should return true for error response', () => {
      const response: ApiResponse<never> = {
        success: false,
        error: { code: 'RES_001', message: 'Not found' },
        meta: { timestamp: new Date().toISOString(), requestId: '123' },
      };
      expect(isErrorResponse(response)).toBe(true);
    });

    it('should return false for success response', () => {
      const response: ApiResponse<string> = {
        success: true,
        data: 'ok',
        meta: { timestamp: new Date().toISOString(), requestId: '123' },
      };
      expect(isErrorResponse(response)).toBe(false);
    });
  });

  describe('ErrorCodes', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCodes.UNAUTHORIZED).toBe('AUTH_001');
      expect(ErrorCodes.FORBIDDEN).toBe('AUTH_002');
      expect(ErrorCodes.NOT_FOUND).toBe('RES_001');
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VAL_001');
      expect(ErrorCodes.INTERNAL_ERROR).toBe('SYS_001');
      expect(ErrorCodes.SERVICE_UNAVAILABLE).toBe('SYS_002');
      expect(ErrorCodes.RATE_LIMITED).toBe('SYS_003');
      expect(ErrorCodes.BAD_REQUEST).toBe('REQ_001');
    });
  });
});
