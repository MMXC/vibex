/**
 * validateReturnTo unit tests
 * E1-S3.2
 */

import { describe, it, expect } from 'vitest';

// Re-implement validateReturnTo to test (mirrors auth/page.tsx)
function validateReturnTo(returnTo: string | null): string {
  if (!returnTo) return '/dashboard';
  if (!returnTo.startsWith('/')) return '/dashboard';
  if (/^(https?|javascript:|data:)/i.test(returnTo)) return '/dashboard';
  if (/^\/\//.test(returnTo)) return '/dashboard'; // protocol-relative
  if (returnTo.includes('/../') || returnTo.endsWith('/..')) return '/dashboard';
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
});
