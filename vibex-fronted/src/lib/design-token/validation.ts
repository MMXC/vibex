/**
 * Design Token Validation — E1 Design-to-Code Pipeline
 *
 * Type guard functions for DesignNode and token structure validation.
 *
 * @module lib/design-token/validation
 */

import type { DesignNode, TokenSnapshot } from '@/types/codegen';

/**
 * Check whether a value is a valid DesignNode.
 * Returns true if the value conforms to the DesignNode shape.
 */
export function validateDesignNode(node: unknown): node is DesignNode {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  const n = node as Record<string, unknown>;
  return (
    typeof n['id'] === 'string' &&
    typeof n['type'] === 'string' &&
    (n['name'] === undefined || typeof n['name'] === 'string') &&
    (n['description'] === undefined || typeof n['description'] === 'string') &&
    (n['position'] === undefined ||
      (typeof n['position'] === 'object' &&
        n['position'] !== null &&
        typeof (n['position'] as Record<string, unknown>)['x'] === 'number' &&
        typeof (n['position'] as Record<string, unknown>)['y'] === 'number')) &&
    (n['metadata'] === undefined ||
      (typeof n['metadata'] === 'object' && n['metadata'] !== null))
  );
}

/**
 * Check whether a token value conforms to a minimal token structure.
 * A token must be a non-null object with a value-like property.
 */
export function validateTokenStructure(tokens: unknown): boolean {
  if (typeof tokens !== 'object' || tokens === null) {
    return false;
  }
  // Token map must have at least one entry to be considered valid
  if (Array.isArray(tokens)) {
    return tokens.length > 0;
  }
  const keys = Object.keys(tokens as Record<string, unknown>);
  return keys.length > 0;
}

/**
 * Validate a full TokenSnapshot object.
 */
export function validateTokenSnapshot(snapshot: unknown): snapshot is TokenSnapshot {
  if (typeof snapshot !== 'object' || snapshot === null) {
    return false;
  }
  const s = snapshot as Record<string, unknown>;
  return (
    typeof s['id'] === 'string' &&
    typeof s['tokens'] === 'object' &&
    s['tokens'] !== null &&
    typeof s['version'] === 'string' &&
    typeof s['createdAt'] === 'string'
  );
}
