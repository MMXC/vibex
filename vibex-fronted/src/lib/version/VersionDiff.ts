/**
 * VersionDiff.ts — Sprint6 E3 U6: VersionDiff Logic
 *
 * Computes structural diff between two version snapshots.
 * Classifies changes into added / removed / modified.
 */

'use client';

import * as jsondiffpatch from 'jsondiffpatch';

// ==================== Types ====================

export interface VersionSnapshot {
  id?: string;
  name?: string;
  version?: number;
  timestamp?: number;
  [key: string]: unknown;
}

export interface DiffEntry {
  path: string;
  value?: unknown;
}

export interface VersionDiffResult {
  added: DiffEntry[];
  removed: DiffEntry[];
  modified: DiffEntry[];
  unchanged: number;
}

// ==================== Diff Engine ====================

const diffpatcher = jsondiffpatch.create({
  objectHash: (obj: object): string => {
    const o = obj as Record<string, unknown>;
    return String(o.id || o.name || JSON.stringify(obj));
  },
  arrays: {
    detectMove: true,
    includeValueOnMove: false,
  },
  propertyFilter: (_name: string) => true,
});

/** Flatten a nested diff delta into a path → value map
 * Handles both object and array diffs from jsondiffpatch */
function flattenDelta(
  delta: jsondiffpatch.Delta,
  basePath = ''
): Map<string, { type: 'added' | 'removed' | 'modified'; value: unknown }> {
  const result = new Map<string, { type: 'added' | 'removed' | 'modified'; value: unknown }>();

  function walk(obj: unknown, path: string): void {
    if (!obj || typeof obj !== 'object') return;

    const record = obj as Record<string, unknown>;
    const isArrayDiff = record._t === 'a';

    for (const [key, value] of Object.entries(record)) {
      // Skip jsondiffpatch metadata keys
      if (key === '_t') continue;

      const currentPath = path ? `${path}.${key}` : key;

      if (Array.isArray(value)) {
        if (isArrayDiff) {
          // Array diff: index → [oldVal, newVal] or [val, 0] for removal
          const idx = parseInt(key, 10);
          if (!isNaN(idx)) {
            if (value.length === 2) {
              const [oldV, newV] = value;
              if (oldV === undefined && newV !== undefined) {
                result.set(currentPath, { type: 'added', value: newV });
              } else if (newV === undefined) {
                result.set(currentPath, { type: 'removed', value: oldV });
              } else {
                result.set(currentPath, { type: 'modified', value: newV });
              }
            } else if (value.length === 1 && typeof value[0] === 'number') {
              // Text diff length marker, skip
            } else {
              result.set(currentPath, { type: 'modified', value });
            }
          }
        } else {
          // Object property change (replaced entire array)
          if (value.length === 2) {
            const [oldV, newV] = value;
            if (oldV === undefined && newV !== undefined) {
              result.set(currentPath, { type: 'added', value: newV });
            } else if (newV === undefined) {
              result.set(currentPath, { type: 'removed', value: oldV });
            } else {
              result.set(currentPath, { type: 'modified', value: newV });
            }
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        // Nested diff, recurse
        walk(value, currentPath);
      }
    }
  }

  walk(delta, basePath);
  return result;
}

/** Extract the changed item from a deep nested object */
function extractAtPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

// ==================== U6: diffVersions ====================

/**
 * Compute structural diff between two version snapshots.
 *
 * @param v1 - Previous version snapshot
 * @param v2 - New version snapshot
 * @returns Classified diff: added / removed / modified entries
 *
 * @example
 * const diff = diffVersions(snapshotV1, snapshotV2);
 * diff.added   // [{ path: 'nodes[2]', value: {...} }]
 * diff.removed // [{ path: 'nodes[0].label', value: 'Old' }]
 * diff.modified // [{ path: 'nodes[1].x', value: 100 }]
 */
export function diffVersions(
  v1: VersionSnapshot | null | undefined,
  v2: VersionSnapshot | null | undefined
): VersionDiffResult {
  if (!v1 && !v2) {
    return { added: [], removed: [], modified: [], unchanged: 0 };
  }
  if (!v1) {
    // Entirely new — everything in v2 is added
    const flat2 = flattenPlain(v2);
    return {
      added: flat2.map(([path, value]) => ({ path, value })),
      removed: [],
      modified: [],
      unchanged: 0,
    };
  }
  if (!v2) {
    // Entirely removed
    const flat1 = flattenPlain(v1);
    return {
      added: [],
      removed: flat1.map(([path, value]) => ({ path, value })),
      modified: [],
      unchanged: 0,
    };
  }

  const delta = diffpatcher.diff(v1, v2);

  if (!delta) {
    return { added: [], removed: [], modified: [], unchanged: 1 };
  }

  const changes = flattenDelta(delta);
  const result: VersionDiffResult = { added: [], removed: [], modified: [], unchanged: 0 };

  for (const [path, { type, value }] of changes) {
    if (type === 'added') {
      result.added.push({ path, value });
    } else if (type === 'removed') {
      result.removed.push({ path, value });
    } else {
      result.modified.push({ path, value });
    }
  }

  // Count unchanged — total keys minus changed
  const totalKeys = countKeys(v2);
  const changedCount = result.added.length + result.removed.length + result.modified.length;
  result.unchanged = Math.max(0, totalKeys - changedCount);

  return result;
}

/** Flatten a plain object to [path, value] pairs */
function flattenPlain(obj: unknown, basePath = ''): Array<[string, unknown]> {
  const entries: Array<[string, unknown]> = [];
  if (!obj || typeof obj !== 'object') return entries;

  const record = obj as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith('_')) continue;
    const path = basePath ? `${basePath}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenPlain(value, path));
    } else {
      entries.push([path, value]);
    }
  }
  return entries;
}

function countKeys(obj: unknown): number {
  if (!obj || typeof obj !== 'object') return 0;
  return Object.keys(obj as Record<string, unknown>).filter((k) => !k.startsWith('_')).length;
}

// ==================== U6: hasChanges ====================

/** Returns true if the diff delta has any actual changes */
export function hasChanges(delta: jsondiffpatch.Delta | null | undefined): boolean {
  if (!delta) return false;
  return Object.keys(delta).some((key) => key !== '_t');
}
