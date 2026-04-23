/**
 * @fileoverview Auth utility for Next.js App Router
 *
 * E4: Auth middleware consolidation — auth only at Hono gateway layer.
 * Next.js routes read auth from headers set by Hono after JWT validation.
 * Falls back to local JWT verification for direct calls (backward compatibility).
 *
 * Usage (E1 new pattern — single arg, destructured result):
 *   import { getAuthUserFromRequest } from '@/lib/authFromGateway';
 *   const { success, user } = getAuthUserFromRequest(request);
 *   if (!success) return unauthorized;
 *
 * Usage (legacy pattern — two args):
 *   import { getAuthUserFromRequest } from '@/lib/authFromGateway';
 *   const auth = getAuthUserFromRequest(request, jwtSecret);
 *   if (!auth) return unauthorized;
 */

import { NextRequest } from 'next/server';
import { verifyToken } from './auth';

export interface AuthUser {
  userId: string;
  email?: string;
  name?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
}

// Overload 1: single-arg new pattern → AuthResult
export function getAuthUserFromRequest(request: NextRequest): AuthResult;

// Overload 2: two-arg legacy pattern → AuthUser | null
export function getAuthUserFromRequest(
  request: NextRequest,
  jwtSecret: string
): AuthUser | null;

// Implementation
export function getAuthUserFromRequest(
  request: NextRequest,
  jwtSecret?: string
): AuthResult | AuthUser | null {
  // 1. Try X-Auth-User header (set by Hono gateway)
  const authUserHeader = request.headers.get('x-auth-user');
  if (authUserHeader) {
    try {
      const user = JSON.parse(authUserHeader) as AuthUser;
      if (user.userId) {
        if (jwtSecret !== undefined) {
          return user; // legacy two-arg path
        }
        return { success: true, user };
      }
    } catch {
      // Invalid JSON, try x-auth-user-id
    }
  }

  // 2. Try X-Auth-User-Id header (simpler format)
  const authUserId = request.headers.get('x-auth-user-id');
  if (authUserId) {
    const user = { userId: authUserId };
    if (jwtSecret !== undefined) {
      return user;
    }
    return { success: true, user };
  }

  // 3. Authorization header — JWT verification
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const secret = jwtSecret ?? process.env.JWT_SECRET ?? 'vibex-dev-secret';
    const token = authHeader.substring(7);
    const payload = verifyToken(token, secret) as AuthUser | null;
    if (payload) {
      const user = {
        userId: (payload as unknown as { userId: string }).userId,
        email: (payload as unknown as { email?: string }).email,
      };
      if (jwtSecret !== undefined) {
        return user;
      }
      return { success: true, user };
    }
  }

  if (jwtSecret !== undefined) {
    return null;
  }
  return { success: false };
}