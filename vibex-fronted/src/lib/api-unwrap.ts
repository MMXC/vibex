/**
 * API Response Unwrapping Utilities
 * Phase 1 of type safety cleanup: Safe unwrapping helpers
 * Replaces (data as any).field || data pattern
 */

/**
 * Unwrap a field from an API response object
 */
export function unwrapField<T>(
  response: Record<string, unknown> | unknown,
  field: string,
  fallback: T
): T {
  if (response && typeof response === 'object' && field in response) {
    const value = (response as Record<string, unknown>)[field];
    if (value !== undefined && value !== null) {
      return value as T;
    }
  }
  return fallback;
}

/**
 * Unwrap list response, returning empty array if undefined
 */
export function unwrapList<T>(
  response: Record<string, unknown> | unknown,
  field: string
): T[] {
  if (response && typeof response === 'object' && field in response) {
    const value = (response as Record<string, unknown>)[field];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }
  return [];
}

/**
 * Unwrap single item response, returning null if undefined
 */
export function unwrapItem<T>(
  response: Record<string, unknown> | unknown,
  field: string
): T | null {
  if (response && typeof response === 'object' && field in response) {
    const value = (response as Record<string, unknown>)[field];
    if (value !== undefined && value !== null) {
      return value as T;
    }
  }
  return null;
}

/**
 * Type guard: check if response has the expected field
 */
export function hasField(
  response: unknown,
  field: string
): response is Record<string, unknown> {
  return (
    response !== null &&
    response !== undefined &&
    typeof response === 'object' &&
    field in response
  );
}

/**
 * Safe JSON parse for SSE data
 */
export function safeJsonParse<T = unknown>(
  data: string,
  fallback: T
): T {
  try {
    const parsed = JSON.parse(data);
    return parsed as T;
  } catch {
    return fallback;
  }
}
