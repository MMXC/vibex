/**
 * @fileoverview Unified Error Classes
 *
 * Part of: vibex-backend-fixes-20260410 / E1-Schema统一
 *
 * Provides:
 * - AppError: base error with code, message, statusCode, details
 * - AuthError: 401 Unauthorized
 * - ValidationError: 400 Bad Request (Zod-compatible)
 * - NotFoundError: 404 Not Found
 * - ForbiddenError: 403 Forbidden
 * - ConflictError: 409 Conflict
 */

export interface ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;
}

export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code ?? 'INTERNAL_ERROR';
    this.details = details;
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }

  /**
   * Create from Zod error with field-level details
   */
  static fromZodError(
    zodError: {
      flatten: () => { fieldErrors: Record<string, string[]>; formErrors: string[] };
    },
    message = 'Validation failed'
  ): ValidationError {
    const { fieldErrors, formErrors } = zodError.flatten();
    return new ValidationError(message, { fieldErrors, formErrors });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Convert AppError to JSON response body
 */
export function errorToResponse(error: AppError): {
  error: string;
  code: string;
  details?: unknown;
} {
  return {
    error: error.message,
    code: error.code,
    ...(error.details !== undefined && { details: error.details }),
  };
}
