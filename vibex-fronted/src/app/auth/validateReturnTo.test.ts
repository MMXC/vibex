/**
 * validateReturnTo unit tests
 * E1-S3.2
 */

import { describe, it, expect } from 'vitest';

// Re-implement validateReturnTo to test (mirrors auth/page.tsx)
function validateReturnTo(returnTo: string | null): string {
  if (!returnTo) return '/dashboard';
  // Reject non-string or whitespace-only
  if (typeof returnTo !== 'string' || !returnTo.trim() || !returnTo.startsWith('/')) return '/dashboard';
  // Reject absolute/unsafe URLs
  if (/^(https?|javascript:|data:)/i.test(returnTo)) return '/dashboard';
  // Reject protocol-relative (encoded or plain)
  if (/^\/\//i.test(returnTo)) return '/dashboard';
  // Reject path traversal (plain and URL-encoded)
  if (returnTo.includes('/../') || returnTo.endsWith('/..')) return '/dashboard';
  const decoded = decodeURIComponent(returnTo);
  if (decoded !== returnTo) {
    // Reject decoded traversal or protocol-relative
    if (decoded.includes('/../') || decoded.startsWith('/..') || decoded.startsWith('//')) return '/dashboard';
    // Reject if any path segment after decoding contains '..'
    const segments = decoded.split('/');
    if (segments.some((s) => s === '..')) return '/dashboard';
  }
  // Reject null-byte injection and control characters
  if (/[\x00-\x1f\x7f]/.test(returnTo)) return '/dashboard';
  // Reject CRLF injection
  if (/[\n\r]/.test(returnTo)) return '/dashboard';
  return returnTo;
}

describe('validateReturnTo', () => {
  // TC-001: null input → /dashboard
  it('returns /dashboard when input is null', () => {
    expect(validateReturnTo(null)).toBe('/dashboard');
  });

  // TC-002: undefined input → /dashboard
  it('returns /dashboard when input is undefined', () => {
    expect(validateReturnTo(undefined)).toBe('/dashboard');
  });

  // TC-003: empty string → /dashboard
  it('returns /dashboard when input is empty string', () => {
    expect(validateReturnTo('')).toBe('/dashboard');
  });

  // TC-004: absolute URL → /dashboard
  it('returns /dashboard for absolute https URL', () => {
    expect(validateReturnTo('https://evil.com/redirect')).toBe('/dashboard');
  });

  // TC-005: protocol-relative URL → /dashboard
  it('returns /dashboard for protocol-relative URL', () => {
    expect(validateReturnTo('//evil.com/redirect')).toBe('/dashboard');
  });

  // TC-006: javascript: URL → /dashboard
  it('returns /dashboard for javascript: URL', () => {
    expect(validateReturnTo('javascript:alert(1)')).toBe('/dashboard');
  });

  // TC-007: path traversal → /dashboard
  it('returns /dashboard for path traversal attempt', () => {
    expect(validateReturnTo('/canvas/../../etc/passwd')).toBe('/dashboard');
  });

  // TC-008: simple safe path → returns as-is
  it('returns safe path as-is', () => {
    expect(validateReturnTo('/dashboard')).toBe('/dashboard');
    expect(validateReturnTo('/canvas/project/123')).toBe('/canvas/project/123');
    expect(validateReturnTo('/projects/new')).toBe('/projects/new');
  });

  // TC-009: safe path with query string → preserved
  it('preserves query string in safe path', () => {
    expect(validateReturnTo('/canvas?project=123')).toBe('/canvas?project=123');
    expect(validateReturnTo('/auth?mode=register&returnTo=/dashboard')).toBe('/auth?mode=register&returnTo=/dashboard');
  });

  // TC-010: path starting with / but containing traversal → /dashboard
  it('returns /dashboard for path with traversal sequence', () => {
    expect(validateReturnTo('/auth/../secret')).toBe('/dashboard');
  });

  // TC-011: relative path (no leading /) → /dashboard
  it('returns /dashboard for relative path', () => {
    expect(validateReturnTo('dashboard')).toBe('/dashboard');
    expect(validateReturnTo('canvas/project')).toBe('/dashboard');
  });

  // TC-012: data: URL → /dashboard
  it('returns /dashboard for data: URL', () => {
    expect(validateReturnTo('data:text/html,<script>alert(1)</script>')).toBe('/dashboard');
  });

  // T13: null byte → /dashboard (fuzzing)
  it('returns /dashboard for null byte injection (T13)', () => {
    expect(validateReturnTo('/canvas\x00evil')).toBe('/dashboard');
  });

  // T14: encoded path traversal /canvas/..%2F.. → /dashboard (fuzzing)
  it('returns /dashboard for URL-encoded path traversal (T14)', () => {
    expect(validateReturnTo('/canvas/..%2F..')).toBe('/dashboard');
    expect(validateReturnTo('/auth/..%2F..%2Fsecret')).toBe('/dashboard');
  });

  // T15: encoded // %2f%2fevil.com → /dashboard (fuzzing)
  it('returns /dashboard for URL-encoded protocol-relative URL (T15)', () => {
    expect(validateReturnTo('%2f%2fevil.com')).toBe('/dashboard');
    // /%2f%2f... starts with / but decodes to /\/evil.com which is path traversal
    expect(validateReturnTo('/%2f%2fevil.com/redirect')).toBe('/dashboard');
  });

  // T16: pure whitespace path → /dashboard (fuzzing)
  it('returns /dashboard for pure whitespace path (T16)', () => {
    expect(validateReturnTo('   ')).toBe('/dashboard');
    expect(validateReturnTo('\t')).toBe('/dashboard');
  });

  // T17: CRLF injection \n → /dashboard (fuzzing)
  it('returns /dashboard for CRLF injection (T17)', () => {
    expect(validateReturnTo('/canvas\n<script>evil</script>')).toBe('/dashboard');
    expect(validateReturnTo('/auth\r\n/../secret')).toBe('/dashboard');
  });
});
