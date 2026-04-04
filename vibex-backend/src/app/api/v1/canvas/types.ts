/**
 * Shared types for Canvas API endpoints
 * Part of: E3 - 统一错误码
 */

/** Unified error response structure for Canvas API endpoints */
export interface CanvasAPIError {
  success: false;
  error: string; // User-friendly message
  code?: string; // Error code (e.g., "INVALID_INPUT", "AI_ERROR")
  details?: unknown; // Optional debug info
}

/** Standard error codes for Canvas APIs */
export const CanvasErrorCodes = {
  INVALID_INPUT: 'INVALID_INPUT',
  AI_ERROR: 'AI_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  API_KEY_MISSING: 'API_KEY_MISSING',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EMPTY_RESPONSE: 'EMPTY_RESPONSE',
} as const;

export type CanvasErrorCode = (typeof CanvasErrorCodes)[keyof typeof CanvasErrorCodes];

/** Helper to build consistent error responses */
export function canvasError(
  error: string,
  code?: CanvasErrorCode,
  details?: unknown
): CanvasAPIError {
  return {
    success: false,
    error,
    ...(code && { code }),
    ...(details !== undefined && { details }),
  };
}
