/**
 * @fileoverview JSON Guard Middleware
 * 
 * Part of: api-input-validation-layer / Epic E1
 * Protects routes from malformed JSON causing 500 errors
 */

import { Context, Next } from 'hono';
import { JsonParseError } from '../lib/validation-error';

import { safeError } from '@/lib/log-sanitizer';

/**
 * JSON Guard Middleware
 * 
 * Wraps JSON body parsing with try-catch to prevent 500 errors
 * from malformed JSON requests.
 * 
 * @example
 * ```typescript
 * import { jsonGuard } from '@/middleware/json-guard';
 * 
 * app.use('/api/*', jsonGuard);
 * ```
 */
export const jsonGuard = async (c: Context, next: Next): Promise<Response | void> => {
  try {
    // Clone the request to allow reading body multiple times
    const contentType = c.req.header('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        // Attempt to parse JSON - this will throw if invalid
        await c.req.raw.clone().json();
      } catch (error) {
        if (error instanceof SyntaxError) {
          const jsonError = new JsonParseError('Invalid JSON format in request body');
          return c.json(jsonError.toResponse(), jsonError.statusCode);
        }
        throw error;
      }
    }
    
    await next();
  } catch (error) {
    safeError('[jsonGuard] Unexpected error:', error);
    
    // Don't expose internal errors
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      500
    );
  }
};

/**
 * Create a JSON-safe request body reader
 * Returns null if JSON is invalid instead of throwing
 */
export async function safeParseJson<T = unknown>(c: Context): Promise<{
  success: true;
  data: T;
} | {
  success: false;
  error: string;
}> {
  try {
    const data = await c.req.json() as T;
    return { success: true, data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Invalid JSON format' };
    }
    return { success: false, error: 'Failed to parse request body' };
  }
}
