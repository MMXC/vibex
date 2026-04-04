/**
 * @fileoverview High-Risk Route Validation Helper for Next.js
 *
 * Part of: api-input-validation-layer / Epic E2
 *
 * Provides validateBody() helper for Next.js App Router route handlers,
 * wrapping Zod schemas with standardized error responses.
 */

import { NextResponse } from 'next/server';
import { ZodType, ZodError } from 'zod';
import { ValidationError } from './validation-error';

/**
 * Parse and validate JSON body with proper error handling.
 * Returns null on JSON parse error (so caller can handle).
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>
): Promise<{ data: T } | { error: { message: string; status: number } }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const ve = ValidationError.fromZodError(result.error);
      return {
        error: {
          message: JSON.stringify(ve.toResponse()),
          status: 400,
        },
      };
    }

    return { data: result.data };
  } catch (err) {
    if (err instanceof SyntaxError) {
      return {
        error: {
          message: JSON.stringify({
            success: false,
            error: { code: 'INVALID_JSON', message: 'Invalid JSON format in request body' },
          }),
          status: 400,
        },
      };
    }
    throw err;
  }
}

/**
 * Validate route params against a Zod schema.
 */
export function validateParams<T>(
  params: Record<string, string>,
  schema: ZodType<T>
): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(params);

  if (!result.success) {
    const ve = ValidationError.fromZodError(result.error);
    return { error: NextResponse.json(ve.toResponse(), { status: 400 }) };
  }

  return { data: result.data };
}
