/**
 * Shared ID generation utilities.
 * Part of: canvas-phase0-cleanup E3 generateId extraction
 */

/** Generate a unique ID with timestamp + random suffix */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Generate a prefixed ID */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}-${generateId()}`;
}
