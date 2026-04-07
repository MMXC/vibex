/**
 * Standardized ValidationError for Zod-based input validation.
 *
 * Extends HTTPException for proper Hono integration.
 * Returns consistent error shape:
 * {
 *   success: false,
 *   error: string,
 *   details: { formErrors: string[], fieldErrors: Record<string, string[]> }
 * }
 */

import { HTTPException } from 'hono/http-exception';
import type { ZodError } from 'zod';

export interface ValidationErrorResponse {
  success: false;
  error: string;
  details: {
    formErrors: string[];
    fieldErrors: Record<string, string[]>;
  };
}

/**
 * Zod-based ValidationError that produces standardized JSON error responses.
 */
export class ValidationError extends HTTPException {
  readonly zodError: ZodError | null;
  readonly errorResponse: ValidationErrorResponse;

  constructor(zodError: ZodError, message = 'Validation failed') {
    const fieldErrors: Record<string, string[]> = {};
    const formErrors: string[] = [];

    if (zodError) {
      // Group Zod issues by field path
      for (const issue of zodError.issues) {
        if (issue.path.length === 0) {
          // Top-level (form) error
          formErrors.push(issue.message);
        } else {
          const field = issue.path.join('.');
          if (!fieldErrors[field]) {
            fieldErrors[field] = [];
          }
          fieldErrors[field].push(issue.message);
        }
      }
    }

    const errorResponse: ValidationErrorResponse = {
      success: false,
      error: message,
      details: { formErrors, fieldErrors },
    };

    super(400, { message: JSON.stringify(errorResponse) });
    this.name = 'ValidationError';
    this.zodError = zodError;
    this.errorResponse = errorResponse;
  }

  /**
   * Factory: create from a plain object (e.g. malformed JSON).
   */
  static fromParseError(message = 'Invalid JSON format'): ValidationError {
    const pseudoZodError = {
      issues: [{ path: [], message }] as any,
    } as ZodError;
    return new ValidationError(pseudoZodError, message);
  }

  toJSON(): ValidationErrorResponse {
    return this.errorResponse;
  }
}
