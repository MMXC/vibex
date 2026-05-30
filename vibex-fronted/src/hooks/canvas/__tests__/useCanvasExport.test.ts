/**
 * useCanvasExport — vitest tests
 * Epic E4: Canvas Export (PNG/SVG/PDF)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────
// Tests for validateFileSize
// ─────────────────────────────────────────────
import { validateFileSize } from '../useCanvasExport';

describe('validateFileSize', () => {
  it('should not throw for blobs under 5MB', () => {
    const smallBlob = new Blob(['x'.repeat(1024 * 1024)], { type: 'image/png' }); // 1MB
    expect(() => validateFileSize(smallBlob)).not.toThrow();
  });

  it('should not throw for blobs exactly at 5MB', () => {
    const exactBlob = new Blob(['x'.repeat(5 * 1024 * 1024)], { type: 'image/png' });
    expect(() => validateFileSize(exactBlob)).not.toThrow();
  });

  it('should throw for blobs over 5MB', () => {
    const largeBlob = new Blob(['x'.repeat(6 * 1024 * 1024)], { type: 'image/png' }); // 6MB
    expect(() => validateFileSize(largeBlob)).toThrow(/超过 5MB 限制/);
  });

  it('should include actual size in error message', () => {
    const largeBlob = new Blob(['x'.repeat(6 * 1024 * 1024)], { type: 'image/png' });
    try {
      validateFileSize(largeBlob);
    } catch (e: any) {
      expect(e.message).toMatch('6.00MB');
    }
  });
});
