/**
 * VersionDiff.test.ts — Sprint6 E3 U6 Tests
 */

import { describe, it, expect } from 'vitest';
import { diffVersions, hasChanges } from '../VersionDiff';
import type { VersionSnapshot } from '../VersionDiff';

describe('diffVersions — U6', () => {
  it('U6 AC3: modified fields detected', () => {
    const v1: VersionSnapshot = { id: 'p1', name: 'Old Name', x: 100, y: 100 };
    const v2: VersionSnapshot = { id: 'p1', name: 'New Name', x: 200, y: 200 };
    const diff = diffVersions(v1, v2);
    expect(diff.modified.length).toBeGreaterThan(0);
  });

  it('returns empty diff for identical simple objects', () => {
    const v: VersionSnapshot = { id: '1', name: 'Test', nodes: 5 };
    const diff = diffVersions(v, v);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.unchanged).toBeGreaterThan(0);
  });

  it('handles null v1 (entirely new)', () => {
    const v2: VersionSnapshot = { id: '1', name: 'New', nodes: 3 };
    const diff = diffVersions(null, v2);
    expect(diff.added.length).toBeGreaterThan(0);
    expect(diff.removed).toEqual([]);
  });

  it('handles null v2 (entirely removed)', () => {
    const v1: VersionSnapshot = { id: '1', name: 'Old', nodes: 3 };
    const diff = diffVersions(v1, null);
    expect(diff.removed.length).toBeGreaterThan(0);
    expect(diff.added).toEqual([]);
  });

  it('handles both null', () => {
    const diff = diffVersions(null, null);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.modified).toEqual([]);
  });

  it('detects deep nested changes', () => {
    const v1: VersionSnapshot = { project: { config: { version: '1.0' } } };
    const v2: VersionSnapshot = { project: { config: { version: '2.0' } } };
    const diff = diffVersions(v1, v2);
    expect(diff.modified.length).toBeGreaterThan(0);
  });

  it('returns unchanged count as number', () => {
    const v1: VersionSnapshot = { id: '1', name: 'A', value: 10 };
    const v2: VersionSnapshot = { id: '1', name: 'A', value: 20 };
    const diff = diffVersions(v1, v2);
    expect(typeof diff.unchanged).toBe('number');
    expect(diff.unchanged).toBeGreaterThanOrEqual(0);
  });

  it('detects scalar field changes', () => {
    const v1: VersionSnapshot = { count: 5 };
    const v2: VersionSnapshot = { count: 10 };
    const diff = diffVersions(v1, v2);
    expect(diff.modified.length + diff.added.length).toBeGreaterThan(0);
  });
});

describe('hasChanges', () => {
  it('returns false for null delta', () => {
    expect(hasChanges(null)).toBe(false);
    expect(hasChanges(undefined)).toBe(false);
  });

  it('returns true for delta with changes', () => {
    const delta = { name: ['A', 'B'] };
    expect(hasChanges(delta)).toBe(true);
  });

  it('returns false for empty delta', () => {
    expect(hasChanges({})).toBe(false);
  });
});
