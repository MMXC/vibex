/**
 * @fileoverview Zod Validation Middleware for Next.js App Router
 * 
 * Part of: api-input-validation-layer / Epic E2
 * Provides validation utilities compatible with Next.js App Router
 */

import { NextRequest } from 'next/server';
import { z, ZodType, ZodError } from 'zod';
import { ValidationError, JsonParseError } from './validation-error';

import { safeError } from '@/lib/log-sanitizer';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Validated data container
 */
export interface ValidatedData {
  body: Record<string, unknown>;
  param: Record<string, string>;
  query: Record<string, string>;
}

/**
 * Handler function type for validated routes
 */
export type ValidatedHandler = (
  validatedData: ValidatedData,
  request: NextRequest
) => Promise<Response>;

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Parse and validate request body with JSON error handling
 */
export async function parseBody(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') || '';
  
  // Handle JSON requests
  if (contentType.includes('application/json') || !contentType) {
    try {
      return await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new JsonParseError('Invalid JSON format in request body');
      }
      throw error;
    }
  }
  
  // Handle form data
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    const obj: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
  
  return {};
}

/**
 * Validate data against a Zod schema
 */
export function validateData<T>(
  data: unknown,
  schema: ZodType<T>,
  dataType: 'body' | 'param' | 'query'
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw ValidationError.fromZodError(result.error);
  }
  
  return result.data;
}

// =============================================================================
// withValidation for Next.js
// =============================================================================

/**
 * Validation schemas configuration
 */
export interface ValidationSchemas {
  body?: ZodType<unknown>;
  param?: ZodType<unknown>;
  query?: ZodType<unknown>;
}

/**
 * Options for withValidation
 */
export interface ValidationOptions {
  /** Skip body validation (for GET/DELETE) */
  skipBody?: boolean;
}

/**
 * Create a validation middleware for Next.js App Router routes
 * 
 * @example
 * ```typescript
 * import { withValidation } from '@/lib/next-validation';
 * import { chatMessageSchema } from '@/schemas/security';
 * 
 * export const POST = withValidation(
 *   { body: chatMessageSchema },
 *   async (data, request) => {
 *     const { message } = data.body;
 *     // ... handle chat
 *   }
 * );
 * ```
 */
export function withValidation(
  schemas: ValidationSchemas,
  handler: ValidatedHandler,
  options: ValidationOptions = {}
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const validatedData: ValidatedData = {
        body: {},
        param: {},
        query: {},
      };

      // Validate body if schema provided
      if (schemas.body && !options.skipBody) {
        const rawBody = await parseBody(request);
        validatedData.body = validateData(rawBody, schemas.body, 'body') as Record<string, unknown>;
      }

      // Validate params if schema provided
      if (schemas.param) {
        // Params come from route path, need special handling
        const params = request.nextUrl.pathname.match(/\/api\/[^\/]+\/([^/]+)/);
        // Note: For dynamic routes, params need to be extracted differently
        // This is a placeholder - actual implementation depends on route structure
      }

      // Validate query if schema provided
      if (schemas.query) {
        const query: Record<string, string> = {};
        request.nextUrl.searchParams.forEach((value, key) => {
          query[key] = value;
        });
        validatedData.query = validateData(query, schemas.query, 'query') as Record<string, string>;
      }

      // Execute handler with validated data
      return await handler(validatedData, request);
    } catch (error) {
      // Handle ValidationError
      if (error instanceof ValidationError) {
        return Response.json(error.toResponse(), { status: error.statusCode });
      }
      
      // Handle JsonParseError
      if (error instanceof JsonParseError) {
        return Response.json(error.toResponse(), { status: error.statusCode });
      }

      // Handle unexpected errors
      safeError('[withValidation] Unexpected error:', error);
      return Response.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Validation internal error',
          },
        },
        { status: 500 }
      );
    }
  };
}

// =============================================================================
// Convenience Wrappers
// =============================================================================

/**
 * Validate POST/PUT/PATCH body
 */
export function validateBody<T>(
  schema: ZodType<T>,
  handler: (body: T, request: NextRequest) => Promise<Response>
) {
  return withValidation(
    { body: schema },
    async (data, request) => handler(data.body as T, request)
  );
}

/**
 * Validate GET query params
 */
export function validateQuery<T>(
  schema: ZodType<T>,
  handler: (query: T, request: NextRequest) => Promise<Response>
) {
  return withValidation(
    { query: schema },
    async (data, request) => handler(data.query as T, request)
  );
}

// =============================================================================
// Re-export ValidationError for convenience
// =============================================================================

export { ValidationError, JsonParseError } from './validation-error';
export type { FieldError, ValidationErrorResponse } from './validation-error';