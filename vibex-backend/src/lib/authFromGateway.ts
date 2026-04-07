/**
 * @fileoverview Auth utility for Next.js App Router
 *
 * E4: Auth middleware consolidation — auth only at Hono gateway layer.
 * Next.js routes read auth from headers set by Hono after JWT validation.
 * Falls back to local JWT verification for direct calls (backward compatibility).
 *
 * Usage:
 *   import { getAuthUserFromRequest } from '@/lib/authFromGateway';
 *   const auth = getAuthUserFromRequest(request, jwtSecret);
 */

import { NextRequest } from 'next/server';
import { verifyToken } from './auth';

export interface AuthUser {
  userId: string;
  email?: string;
  name?: string;
}

/**
 * Get authenticated user from request.
 *
 * Priority:
 * 1. X-Auth-User header (set by Hono gateway after JWT validation)
 * 2. X-Auth-User-Id header (simpler format, set by Hono)
 * 3. Authorization header — local JWT verification fallback
 *
 * This allows Hono to be the single auth layer while Next.js routes
 * can be called directly (fallback) or through Hono (preferred).
 */
export function getAuthUserFromRequest(
  request: NextRequest,
  jwtSecret: string
): AuthUser | null {
  // 1. Try X-Auth-User header (set by Hono gateway)
  const authUserHeader = request.headers.get('x-auth-user');
  if (authUserHeader) {
    try {
      const user = JSON.parse(authUserHeader) as AuthUser;
      if (user.userId) return user;
    } catch {
      // Invalid JSON, try x-auth-user-id
    }
  }

  // 2. Try X-Auth-User-Id header (simpler format)
  const authUserId = request.headers.get('x-auth-user-id');
  if (authUserId) {
    return { userId: authUserId };
  }

  // 3. Fall back to local JWT verification (backward compatibility)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token, jwtSecret) as AuthUser | null;
    if (payload) {
      return { userId: (payload as any).userId, email: (payload as any).email };
    }
  }

  return null;
}
