/**
 * @fileoverview Unified API Error Factory
 *
 * Provides standardized error responses for all backend routes.
 * Part of: vibex-p0-q2-sprint1 / Unit 2
 */

export const ERROR_CODES = {
  // 4xx Client errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  BAD_REQUEST: 'BAD_REQUEST',
  // 5xx Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  // Domain-specific
  FLOW_NOT_FOUND: 'FLOW_NOT_FOUND',
  PAGE_NOT_FOUND: 'PAGE_NOT_FOUND',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  DOMAIN_MODEL_NOT_FOUND: 'DOMAIN_MODEL_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export interface ApiErrorResponse {
  error: string;
  code: ErrorCode;
  details?: unknown;
}

/**
 * Create a standardized API error response object
 */
export function apiError(
  message: string,
  code: ErrorCode,
  details?: unknown
): ApiErrorResponse {
  return { error: message, code, ...(details !== undefined && { details }) };
}
