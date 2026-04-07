/**
 * Unified API Response Format
 * Following the architecture spec from docs/vibex-proposal-api-split/architecture.md
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export const ErrorCodes = {
  UNAUTHORIZED: 'AUTH_001',
  FORBIDDEN: 'AUTH_002',
  NOT_FOUND: 'RES_001',
  VALIDATION_ERROR: 'VAL_001',
  INTERNAL_ERROR: 'SYS_001',
  SERVICE_UNAVAILABLE: 'SYS_002',
  RATE_LIMITED: 'SYS_003',
  BAD_REQUEST: 'REQ_001',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ==================== Response Factory ====================

export function successResponse<T>(
  data: T,
  requestId?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId ?? crypto.randomUUID(),
    },
  };
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown,
  requestId?: string
): ApiResponse<never> {
  return {
    success: false,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId ?? crypto.randomUUID(),
    },
  };
}

export function unauthorizedResponse(
  message = 'Unauthorized',
  requestId?: string
): ApiResponse<never> {
  return errorResponse(ErrorCodes.UNAUTHORIZED, message, undefined, requestId);
}

export function notFoundResponse(
  message = 'Resource not found',
  requestId?: string
): ApiResponse<never> {
  return errorResponse(ErrorCodes.NOT_FOUND, message, undefined, requestId);
}

export function validationErrorResponse(
  message: string,
  details?: unknown,
  requestId?: string
): ApiResponse<never> {
  return errorResponse(ErrorCodes.VALIDATION_ERROR, message, details, requestId);
}

export function internalErrorResponse(
  message = 'Internal server error',
  requestId?: string
): ApiResponse<never> {
  return errorResponse(ErrorCodes.INTERNAL_ERROR, message, undefined, requestId);
}

// ==================== Type Guards ====================

export function isSuccessResponse<T>(res: ApiResponse<T>): res is ApiResponse<T> & { data: T } {
  return res.success === true && res.data !== undefined;
}

export function isErrorResponse<T>(res: ApiResponse<T>): res is ApiResponse<T> & { error: NonNullable<ApiResponse<T>['error']> } {
  return res.success === false && res.error !== undefined;
}
