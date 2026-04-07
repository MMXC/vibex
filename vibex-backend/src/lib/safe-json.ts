/**
 * S4: Safe JSON parsing utility
 * Returns null on parse error, so callers can return 400 gracefully
 */

/**
 * Parse JSON string safely, returns null on error
 */
export function safeJsonParse(jsonString: string): unknown | null {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

/**
 * Async version: parse JSON from request, return null on error
 */
export async function parseJsonBody<T>(
  request: { json: () => Promise<unknown> },
  fallback?: T
): Promise<{ data: T | null; error?: string }> {
  try {
    const body = await request.json();
    return { data: body as T };
  } catch (err) {
    return {
      data: fallback ?? null,
      error: 'Invalid JSON in request body',
    };
  }
}
