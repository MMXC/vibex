/**
 * API Authentication Middleware for Next.js App Router
 * 
 * Provides authentication checking utilities for API routes.
 * This is a simplified version designed for Next.js App Router (Pages Router),
 * compatible with the existing getAuthUser() function.
 * 
 * Usage:
 * ```ts
 * import { withAuth, optionalAuth } from '@/lib/apiAuth';
 * 
 * // Required auth - returns 401 if not authenticated
 * export const GET = withAuth(async (req, { auth }) => {
 *   return NextResponse.json({ userId: auth.userId });
 * });
 * 
 * // Optional auth - continues even without auth
 * export const GET = optionalAuth(async (req, { auth }) => {
 *   if (auth) {
 *     return NextResponse.json({ userId: auth.userId });
 *   }
 *   return NextResponse.json({ userId: null });
 * });
 * ```
 * 
 * Or use the auth check directly:
 * ```ts
 * import { checkAuth } from '@/lib/apiAuth';
 * 
 * export async function GET(req: NextRequest) {
 *   const authResult = checkAuth(req);
 *   if (!authResult.auth) {
 *     return authResult.response;
 *   }
 *   const { auth } = authResult;
 *   // continue...
 * }
 * ```
 */

import type { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, type JWTPayload } from './auth';
import { getLocalEnv } from './env';

// JWT_SECRET for local dev, will be overridden by env in production
const getJwtSecret = (): string => {
  const env = getLocalEnv();
  return env.JWT_SECRET;
};

/**
 * Result of auth check
 */
export interface AuthCheckResult {
  auth: JWTPayload | null;
  response: NextResponse | null;
}

/**
 * Check authentication from a NextRequest
 * Returns auth payload if valid, or error response if invalid/missing
 */
export function checkAuth(request: NextRequest): AuthCheckResult {
  const jwtSecret = getJwtSecret();
  const auth = getAuthUser(request as unknown as Request, jwtSecret);

  if (!auth) {
    return {
      auth: null,
      response: new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: authentication required',
          code: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }

  return {
    auth,
    response: null,
  };
}

/**
 * Check authentication with custom JWT secret (for testing)
 */
export function checkAuthWithSecret(request: NextRequest, jwtSecret: string): AuthCheckResult {
  const auth = getAuthUser(request as unknown as Request, jwtSecret);

  if (!auth) {
    return {
      auth: null,
      response: new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: authentication required',
          code: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }

  return {
    auth,
    response: null,
  };
}

/**
 * HOC for wrapping route handlers with required authentication
 * 
 * Usage:
 * ```ts
 * export const POST = withAuth(async (req, { auth }) => {
 *   // auth.userId, auth.email available
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withAuth<
  T extends (req: NextRequest, context: { auth: JWTPayload }) => Promise<NextResponse>
>(
  handler: T
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const { auth, response } = checkAuth(req);
    if (!auth || response) {
      return response as NextResponse;
    }
    return handler(req, { auth });
  };
}

/**
 * HOC for wrapping route handlers with optional authentication
 * 
 * Usage:
 * ```ts
 * export const GET = optionalAuth(async (req, { auth }) => {
 *   // auth may be null
 *   if (auth) {
 *     return NextResponse.json({ userId: auth.userId });
 *   }
 *   return NextResponse.json({ message: 'anonymous' });
 * });
 * ```
 */
export function optionalAuth<
  T extends (req: NextRequest, context: { auth: JWTPayload | null }) => Promise<NextResponse>
>(
  handler: T
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const jwtSecret = getJwtSecret();
    const auth = getAuthUser(req as unknown as Request, jwtSecret);
    return handler(req, { auth });
  };
}

/**
 * Simple auth guard for use in existing handlers
 * 
 * Usage:
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const auth = requireAuth(req);
 *   if (!auth) return auth; // Returns 401 response
 *   
 *   // Continue with auth.userId, auth.email...
 * }
 * ```
 */
export function requireAuth(req: NextRequest): JWTPayload | NextResponse {
  const { auth, response } = checkAuth(req);
  if (!auth || response) {
    return response as NextResponse;
  }
  return auth;
}

/**
 * Simple optional auth for use in existing handlers
 * 
 * Usage:
 * ```ts
 * export async function GET(req: NextRequest) {
 *   const auth = getOptionalAuth(req); // May be null
 *   // Continue with potentially null auth...
 * }
 * ```
 */
export function getOptionalAuth(req: NextRequest): JWTPayload | null {
  const jwtSecret = getJwtSecret();
  return getAuthUser(req as unknown as Request, jwtSecret);
}
