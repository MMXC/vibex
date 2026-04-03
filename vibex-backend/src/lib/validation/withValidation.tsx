/**
 * withValidation — HOC-style validation wrapper for Hono route handlers.
 *
 * Usage:
 *   app.post(
 *     '/api/chat',
 *     withValidation(null, chatMessageSchema, async (c) => { ... })
 *   )
 *
 * Or with param schema:
 *   app.post(
 *     '/api/github/repos/:owner/:repo/contents/*',
 *     withValidation(githubPathSchema, null, async (c) => { ... })
 *   )
 */

import type { Context, Next } from 'hono';
import type { ZodRawShape, ZodType, ZodError } from 'zod';
import { ValidationError } from './ValidationError';

export interface ValidatedData<P = unknown, B = unknown, Q = Record<string, string>> {
  param: P;
  body: B;
  query: Q;
}

/**
 * Extended Hono context with validated data injected by withValidation.
 */
export interface ContextWithValidated<P = unknown, B = unknown, Q = Record<string, string>>
  extends Context {
  validatedData: ValidatedData<P, B, Q>;
}

/**
 * Handler signature after withValidation has injected typed data.
 */
export type ValidatedHandler<
  P extends ZodType | null = null,
  B extends ZodType | null = null,
  Q extends Record<string, string> = Record<string, string>,
> = (
  c: ContextWithValidated<P extends ZodType ? z.infer<P> : null, B extends ZodType ? z.infer<B> : null, Q>,
  next: Next,
) => Promise<Response>;

type z = typeof import('zod');

/**
 * Parse and validate request body, respecting content-type.
 */
async function parseBody(c: Context, bodySchema: ZodType | null): Promise<unknown> {
  const contentType = c.req.header('content-type') || '';

  if (!contentType.includes('application/json')) {
    if (bodySchema) {
      // Try to parse as JSON anyway if body is present
      const raw = await c.req.text();
      if (raw.trim()) {
        try {
          return JSON.parse(raw);
        } catch {
          throw ValidationError.fromParseError('Invalid JSON format');
        }
      }
      // empty body — let schema handle required check
      return undefined;
    }
    return undefined;
  }

  try {
    return await c.req.json();
  } catch {
    throw ValidationError.fromParseError('Invalid JSON format');
  }
}

/**
 * Build the withValidation HOC.
 *
 * @param paramSchema  Zod schema for route params (null = skip param validation)
 * @param bodySchema   Zod schema for request body (null = skip body validation)
 * @param handler      Route handler receiving typed ctx.validatedData
 */
export function withValidation<P extends ZodType, B extends ZodType>(
  paramSchema: P | null,
  bodySchema: B | null,
  handler: (
    c: ContextWithValidated<
      P extends ZodType ? z.infer<P> : null,
      B extends ZodType ? z.infer<B> : null
    >,
    next: Next,
  ) => Promise<Response>,
): (c: Context, next: Next) => Promise<Response | void>;

/**
 * Overload: body only
 */
export function withValidation<B extends ZodType>(
  paramSchema: null,
  bodySchema: B,
  handler: (c: ContextWithValidated<null, z.infer<B>>, next: Next) => Promise<Response>,
): (c: Context, next: Next) => Promise<Response | void>;

/**
 * Overload: param only
 */
export function withValidation<P extends ZodType>(
  paramSchema: P,
  bodySchema: null,
  handler: (c: ContextWithValidated<z.infer<P>, null>, next: Next) => Promise<Response>,
): (c: Context, next: Next) => Promise<Response | void>;

/**
 * Implementation
 */
export function withValidation(
  paramSchema: ZodType | null,
  bodySchema: ZodType | null,
  handler: (c: Context, next: Next) => Promise<Response>,
): (c: Context, next: Next) => Promise<Response | void> {
  return async (c: Context, next: Next): Promise<Response | void> => {
    // 1. Validate body
    let body: unknown;
    if (bodySchema) {
      const raw = await parseBody(c, bodySchema);
      const result = bodySchema.safeParse(raw);
      if (!result.success) {
        throw new ValidationError(result.error as ZodError);
      }
      body = result.data;
    } else {
      body = undefined;
    }

    // 2. Validate params
    let param: unknown;
    if (paramSchema) {
      const result = paramSchema.safeParse(c.req.param());
      if (!result.success) {
        throw new ValidationError(result.error as ZodError);
      }
      param = result.data;
    } else {
      param = {};
    }

    // 3. Inject validated data into context
    c.set('validatedData', {
      param,
      body,
      query: c.req.query() as Record<string, string>,
    } as ValidatedData);

    // 4. Delegate to handler
    return handler(c as ContextWithValidated, next);
  };
}
