/**
 * @fileoverview Zod Validation Middleware for Hono
 * 
 * Part of: api-input-validation-layer / Epic E1
 * Provides withValidation() high-order function for request validation
 */

import { Context, Next, Hono } from 'hono';
import { z, ZodType, ZodError } from 'zod';
import { ValidationError, JsonParseError } from './validation-error';

// ==================== Type Definitions ====================

/**
 * Validated data container attached to context
 */
export interface ValidatedData {
  body: Record<string, unknown>;
  param: Record<string, string>;
  query: Record<string, string>;
}

/**
 * Context with validated data
 */
export interface ValidatedContext extends Context {
  validatedData: ValidatedData;
}

/**
 * Validation schema configuration
 */
export interface ValidationSchemas {
  body?: ZodType<unknown>;
  param?: ZodType<unknown>;
  query?: ZodType<unknown>;
  /** @deprecated Use options.skipBody instead */
  skipBody?: boolean;
}

/**
 * Handler function type for validated routes
 */
export type ValidatedHandler = (c: ValidatedContext, next: Next) => Promise<Response | void>;

/**
 * Options for withValidation
 */
export interface ValidationOptions {
  /** Skip body validation (for GET/DELETE) */
  skipBody?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Transform data before validation */
  transform?: {
    body?: (data: unknown) => unknown;
  };
}

// ==================== Core Validation Function ====================

/**
 * Parse and validate request body with JSON error handling
 */
async function parseBody(c: Context): Promise<Record<string, unknown>> {
  const contentType = c.req.header('content-type') || '';
  
  // Handle JSON requests
  if (contentType.includes('application/json') || !contentType) {
    try {
      const body = await c.req.raw.clone().json();
      return body as Record<string, unknown>;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new JsonParseError('Invalid JSON format in request body');
      }
      throw error;
    }
  }
  
  // Handle form data
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await c.req.raw.clone().formData();
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
function validateData<T>(
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

// ==================== withValidation HOF ====================

/**
 * Create a validation middleware for Hono routes
 * 
 * @example
 * ```typescript
 * import { withValidation } from '@/lib/api-validation';
 * import { registerSchema } from '@/schemas/auth';
 * 
 * app.post('/api/auth/register',
 *   withValidation({ body: registerSchema }, async (c) => {
 *     const { email, password, name } = c.validatedData.body;
 *     // ... handle registration
 *   })
 * );
 * ```
 */
export function withValidation(
  schemas: ValidationSchemas,
  handler: ValidatedHandler,
  options: ValidationOptions = {}
): (c: Context, next: Next) => Promise<Response | void> {
  return async (c: Context, next: Next): Promise<Response | void> => {
    try {
      const validatedData: ValidatedData = {
        body: {},
        param: {},
        query: {},
      };

      // Validate body if schema provided
      if (schemas.body && !options.skipBody) {
        const rawBody = await parseBody(c);
        const bodyToValidate = options.transform?.body 
          ? options.transform.body(rawBody) 
          : rawBody;
        validatedData.body = validateData(bodyToValidate, schemas.body, 'body') as Record<string, unknown>;
      }

      // Validate params if schema provided
      if (schemas.param) {
        const params = c.req.param();
        validatedData.param = validateData(params, schemas.param, 'param') as Record<string, string>;
      }

      // Validate query if schema provided
      if (schemas.query) {
        const query = Object.fromEntries(
          Object.entries(c.req.queries()).map(([k, v]) => [k, v?.[0] ?? ''])
        );
        validatedData.query = validateData(query, schemas.query, 'query') as Record<string, string>;
      }

      // Attach validated data to context
      (c as ValidatedContext).validatedData = validatedData;

      // Execute handler
      return await handler(c as ValidatedContext, next);
    } catch (error) {
      // Handle ValidationError
      if (error instanceof ValidationError) {
        return c.json(error.toResponse(), error.statusCode);
      }
      
      // Handle JsonParseError
      if (error instanceof JsonParseError) {
        return c.json(error.toResponse(), error.statusCode);
      }

      // Handle unexpected errors
      console.error('[withValidation] Unexpected error:', error);
      return c.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: options.errorMessage || 'Validation internal error',
          },
        },
        500
      );
    }
  };
}

// ==================== Convenience Wrappers ====================

/**
 * Create a validation middleware for POST/PUT/PATCH routes
 */
export function validateBody<T>(schema: ZodType<T>, handler: ValidatedHandler) {
  return withValidation({ body: schema }, handler);
}

/**
 * Create a validation middleware for GET routes with query params
 */
export function validateQuery<T>(
  schema: ZodType<T>,
  handler: ValidatedHandler
) {
  return withValidation({ query: schema, skipBody: true }, handler);
}

/**
 * Create a validation middleware for routes with path params
 */
export function validateParams<T>(
  schema: ZodType<T>,
  handler: ValidatedHandler
) {
  return withValidation({ param: schema }, handler);
}

// ==================== Re-export from validation-error ====================

export { ValidationError, JsonParseError } from './validation-error';
export type { FieldError, ValidationErrorResponse } from './validation-error';
