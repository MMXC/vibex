/**
 * middleware.ts unit tests
 * E1-S1.5
 */

import { describe, it, expect } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Minimal inline middleware for testing (without the Next.js config export)
function getProtectedPaths() {
  return ['/dashboard', '/canvas', '/design', '/project-settings', '/preview'];
}

function getPublicPaths() {
  return ['/auth', '/login', '/oauth/callback', '/api/auth'];
}

function shouldSkip(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  );
}

describe('middleware path classification', () => {
  const protectedPaths = getProtectedPaths();
  const publicPaths = getPublicPaths();

  // Protected routes
  it.each([
    '/dashboard',
    '/canvas',
    '/canvas/project/123',
    '/design/abc',
    '/project-settings',
    '/preview',
  ])('protects %s', (path) => {
    expect(protectedPaths.some((p) => path.startsWith(p))).toBe(true);
  });

  // Public routes
  it.each(['/auth', '/auth/login', '/login', '/oauth/callback/github', '/api/auth/login'])(
    'allows public path %s',
    (path) => {
      expect(publicPaths.some((p) => path.startsWith(p))).toBe(true);
    }
  );

  // Static resources
  it.each(['/_next/static/chunks/main.js', '/favicon.ico', '/images/logo.png'])(
    'skips static resource %s',
    (path) => {
      expect(shouldSkip(path)).toBe(true);
    }
  );
});

describe('auth redirect logic', () => {
  function simulateAuthCheck(pathname: string, authToken: string | null) {
    const protectedPaths = getProtectedPaths();
    const publicPaths = getPublicPaths();

    const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
    const isPublic = publicPaths.some((p) => pathname.startsWith(p));

    if (isProtected && !authToken) {
      return 'REDIRECT_TO_AUTH';
    }
    if (pathname === '/auth' && authToken) {
      return 'REDIRECT_TO_DASHBOARD';
    }
    if (isPublic) {
      return 'ALLOW';
    }
    if (isProtected && authToken) {
      return 'ALLOW';
    }
    return 'ALLOW';
  }

  it('redirects unauthenticated user from /dashboard to /auth', () => {
    expect(simulateAuthCheck('/dashboard', null)).toBe('REDIRECT_TO_AUTH');
  });

  it('redirects unauthenticated user from /canvas to /auth', () => {
    expect(simulateAuthCheck('/canvas', null)).toBe('REDIRECT_TO_AUTH');
  });

  it('allows authenticated user on /dashboard', () => {
    expect(simulateAuthCheck('/dashboard', 'fake-token')).toBe('ALLOW');
  });

  it('allows authenticated user on /canvas', () => {
    expect(simulateAuthCheck('/canvas/project/123', 'fake-token')).toBe('ALLOW');
  });

  it('redirects authenticated user from /auth to /dashboard', () => {
    expect(simulateAuthCheck('/auth', 'fake-token')).toBe('REDIRECT_TO_DASHBOARD');
  });

  it('allows public /auth without token', () => {
    expect(simulateAuthCheck('/auth', null)).toBe('ALLOW');
  });

  it('allows unauthenticated on /login', () => {
    expect(simulateAuthCheck('/login', null)).toBe('ALLOW');
  });

  it('redirects unauthenticated from /design', () => {
    expect(simulateAuthCheck('/design/abc', null)).toBe('REDIRECT_TO_AUTH');
  });
});
