/**
 * API error handling tests — E3-U2
 *
 * AuthError class tests (no axios mock needed).
 * Error message format verified via AuthError behavior.
 */

import { describe, it, expect } from 'vitest';
import { AuthError } from './client';

// ── AuthError class tests ──────────────────────────────────────────────────

describe('AuthError (E3-U2)', () => {
  it('should have isAuthError flag set to true', () => {
    const err = new AuthError('登录已过期', 401, '/canvas');
    expect((err as unknown as { isAuthError: boolean }).isAuthError).toBe(true);
  });

  it('should store status code', () => {
    const err = new AuthError('Unauthorized', 403, '/');
    expect((err as unknown as { status: number }).status).toBe(403);
  });

  it('should store returnTo path', () => {
    const err = new AuthError('Token expired', 401, '/auth');
    expect((err as unknown as { returnTo: string }).returnTo).toBe('/auth');
  });

  it('should extend Error base class', () => {
    const err = new AuthError('msg', 401, '/');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AuthError);
  });

  it('should have correct error message', () => {
    const err = new AuthError('登录已失效', 401, '/canvas');
    expect(err.message).toBe('登录已失效');
  });

  it('should have correct name property', () => {
    const err = new AuthError('msg', 401, '/');
    expect(err.name).toBe('AuthError');
  });

  it('should handle 401 status for auth redirect', () => {
    const err = new AuthError('未登录', 401, '/login');
    expect((err as unknown as { status: number }).status).toBe(401);
    expect(err.message).toBe('未登录');
    expect((err as unknown as { isAuthError: boolean }).isAuthError).toBe(true);
  });

  it('should handle 403 status for permission denied', () => {
    const err = new AuthError('权限不足', 403, '/');
    expect((err as unknown as { status: number }).status).toBe(403);
    expect((err as unknown as { isAuthError: boolean }).isAuthError).toBe(true);
  });
});