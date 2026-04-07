/**
 * Spacing Token Tests
 */

import { spacing } from './spacing';

describe('spacing', () => {
  it('should have standard spacing values', () => {
    expect(spacing[0]).toBe('0');
    expect(spacing[1]).toBe('4px');
    expect(spacing[2]).toBe('8px');
    expect(spacing[4]).toBe('16px');
    expect(spacing[8]).toBe('32px');
  });

  it('should have numeric keys', () => {
    expect(spacing[0]).toBeDefined();
    expect(spacing[1]).toBeDefined();
    expect(spacing[4]).toBeDefined();
  });

  it('should have consistent scale', () => {
    // Check that spacing values increase (comparing numeric part)
    const parsePx = (v: string) => parseInt(v);
    expect(parsePx(spacing[1])).toBeLessThan(parsePx(spacing[4]));
    expect(parsePx(spacing[4])).toBeLessThan(parsePx(spacing[8]));
  });
});
