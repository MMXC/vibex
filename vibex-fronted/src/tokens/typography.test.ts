/**
 * Typography Token Tests
 */

import { typography, fontSize, fontWeight } from './typography';

describe('typography', () => {
  it('should have font family defined', () => {
    expect(typography.fontFamily).toBeDefined();
  });

  it('should have font sizes defined', () => {
    expect(typography.fontSize).toBeDefined();
    expect(typography.fontSize.xs).toBeDefined();
    expect(typography.fontSize.sm).toBeDefined();
    expect(typography.fontSize.base).toBeDefined();
  });

  it('should have font weights defined', () => {
    expect(typography.fontWeight).toBeDefined();
  });

  it('should have line heights defined', () => {
    expect(typography.lineHeight).toBeDefined();
  });
});

describe('fontSize', () => {
  it('should have standard sizes', () => {
    expect(fontSize.xs).toBe('12px');
    expect(fontSize.sm).toBe('13px');
    expect(fontSize.base).toBe('14px');
  });
});
