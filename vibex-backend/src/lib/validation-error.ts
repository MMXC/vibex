/**
 * @fileoverview Standardized Validation Error Classes
 * 
 * Part of: api-input-validation-layer / Epic E1
 * Provides structured validation error handling for Zod schemas
 */

import { ZodError, ZodIssue } from 'zod';

/**
 * Standardized field-level error structure
 */
export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Standardized validation error response format
 */
export interface ValidationErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      formErrors: string[];
      fieldErrors: Record<string, string[]>;
    };
  };
}

/**
 * Extended validation error with field-level details
 */
export class ValidationError extends Error {
  public readonly statusCode = 400;
  public readonly code = 'VALIDATION_ERROR';
  public readonly fieldErrors: Record<string, string[]>;
  public readonly formErrors: string[];

  constructor(
    message: string,
    fieldErrors: Record<string, string[]> = {},
    formErrors: string[] = []
  ) {
    super(message);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
    this.formErrors = formErrors;
  }

  /**
   * Create ValidationError from ZodError
   */
  static fromZodError(zodError: ZodError): ValidationError {
    const fieldErrors: Record<string, string[]> = {};
    const formErrors: string[] = [];

    for (const issue of zodError.issues) {
      const field = issue.path.join('.') || 'form';
      const message = issue.message;

      if (issue.path.length === 0) {
        // Form-level error
        formErrors.push(message);
      } else {
        // Field-level error
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        if (!fieldErrors[field].includes(message)) {
          fieldErrors[field].push(message);
        }
      }
    }

    return new ValidationError(
      'Validation failed',
      fieldErrors,
      formErrors
    );
  }

  /**
   * Convert to standardized API response
   */
  toResponse(): ValidationErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: {
          formErrors: this.formErrors,
          fieldErrors: this.fieldErrors,
        },
      },
    };
  }
}

/**
 * JSON parse error with sanitized message
 */
export class JsonParseError extends Error {
  public readonly statusCode = 400;
  public readonly code = 'INVALID_JSON';

  constructor(message: string = 'Invalid JSON format') {
    super(message);
    this.name = 'JsonParseError';
  }

  toResponse(): { success: false; error: { code: string; message: string } } {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

/**
 * Helper to format Zod issues into user-friendly messages
 */
export function formatZodIssues(issues: ZodIssue[]): FieldError[] {
  return issues.map((issue) => ({
    field: issue.path.join('.') || 'value',
    message: issue.message,
    code: issue.code,
  }));
}
