/**
 * DriftDetector — Unit Tests
 * E1 Design-to-Code Pipeline
 *
 * Function signature: threeWayMerge(base: string, local: string, remote: string)
 * Strategy:
 *   - base === remote → use local
 *   - base === local  → use remote
 *   - local === remote (and both differ from base) → use local (deterministic)
 *   - all three differ → conflict markers
 */

import { describe, it, expect } from 'vitest';
import { detectDrift, threeWayMerge } from '../DriftDetector';

describe('detectDrift', () => {
  it('returns false when versions match', () => {
    expect(detectDrift('1.0.0', '1.0.0')).toBe(false);
  });

  it('returns true when versions differ', () => {
    expect(detectDrift('1.0.0', '2.0.0')).toBe(true);
  });

  it('returns true when local version is older', () => {
    expect(detectDrift('1.0.0', '1.0.1')).toBe(true);
  });
});

describe('threeWayMerge(base, local, remote)', () => {
  it('returns local when base equals remote (only local changed)', () => {
    expect(threeWayMerge('base', 'local content', 'base')).toBe('local content');
  });

  it('returns remote when base equals local (only remote changed)', () => {
    expect(threeWayMerge('base', 'base', 'remote content')).toBe('remote content');
  });

  it('returns local when all three are equal (no changes)', () => {
    expect(threeWayMerge('base', 'base', 'base')).toBe('base');
  });

  it('returns local when both changed identically', () => {
    expect(threeWayMerge('base', 'same content', 'same content')).toBe('same content');
  });

  it('returns conflict markers when both differ from base', () => {
    const result = threeWayMerge('base', 'local', 'remote');
    expect(result).toContain('<<<<<<< LOCAL');
    expect(result).toContain('=======');
    expect(result).toContain('>>>>>>> REMOTE');
    expect(result).toContain('local');
    expect(result).toContain('remote');
  });

  it('handles empty strings — no changes', () => {
    expect(threeWayMerge('', '', '')).toBe('');
  });

  it('returns remote when base and local are empty but remote has content', () => {
    expect(threeWayMerge('', '', 'remote')).toBe('remote');
  });

  it('returns local when base and remote are empty but local has content', () => {
    expect(threeWayMerge('', 'local', '')).toBe('local');
  });
});