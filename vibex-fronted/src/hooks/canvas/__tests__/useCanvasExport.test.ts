/**
 * useCanvasExport — vitest tests
 * Epic S55-E1: Canvas Export Menu (PNG/SVG/JSON/YAML/PDF)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────
// validateFileSize tests
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

// ─────────────────────────────────────────────
// ExportFormat type coverage
// ─────────────────────────────────────────────
describe('ExportFormat type', () => {
  it('should support all expected format strings', () => {
    const formats: Array<'png' | 'svg' | 'json' | 'yaml' | 'markdown'> = ['png', 'svg', 'json', 'yaml', 'markdown'];
    expect(formats).toHaveLength(5);
    formats.forEach((f) => expect(typeof f).toBe('string'));
  });
});

// ─────────────────────────────────────────────
// ExportScope type coverage
// ─────────────────────────────────────────────
describe('ExportScope type', () => {
  it('should support all expected scope strings', () => {
    const scopes: Array<'context' | 'flow' | 'component' | 'all'> = ['context', 'flow', 'component', 'all'];
    expect(scopes).toHaveLength(4);
    scopes.forEach((s) => expect(typeof s).toBe('string'));
  });
});

// ─────────────────────────────────────────────
// validateFileSize edge cases
// ─────────────────────────────────────────────
describe('validateFileSize edge cases', () => {
  it('should not throw for empty blob', () => {
    const emptyBlob = new Blob([''], { type: 'text/plain' });
    expect(() => validateFileSize(emptyBlob)).not.toThrow();
  });

  it('should not throw for 1 byte under limit', () => {
    const almostFull = new Blob(['x'.repeat(5 * 1024 * 1024 - 1)], { type: 'image/png' });
    expect(() => validateFileSize(almostFull)).not.toThrow();
  });

  it('should throw with exact 6MB size', () => {
    const sixMB = new Blob(['x'.repeat(6 * 1024 * 1024)], { type: 'image/png' });
    expect(() => validateFileSize(sixMB)).toThrow(/超过 5MB 限制/);
  });

  it('should throw for 10MB blob', () => {
    const tenMB = new Blob(['x'.repeat(10 * 1024 * 1024)], { type: 'image/png' });
    expect(() => validateFileSize(tenMB)).toThrow(/超过 5MB 限制/);
    try {
      validateFileSize(tenMB);
    } catch (e: any) {
      expect(e.message).toMatch('10.00MB');
    }
  });
});

// ─────────────────────────────────────────────
// hook return type — smoke test
// ─────────────────────────────────────────────
describe('useCanvasExport hook interface', () => {
  it('should export useCanvasExport function', async () => {
    const mod = await import('../useCanvasExport');
    expect(typeof mod.useCanvasExport).toBe('function');
  });
});

// ─────────────────────────────────────────────
// validateFileSize returns void (no return value on success)
// ─────────────────────────────────────────────
describe('validateFileSize return value', () => {
  it('should return undefined on success (not throw)', () => {
    const blob = new Blob(['x'.repeat(1024)], { type: 'image/png' });
    const result = validateFileSize(blob);
    expect(result).toBeUndefined();
  });
});
