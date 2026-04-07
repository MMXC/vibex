// @ts-nocheck
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Context, Next } from 'hono';
import { CloudflareEnv } from './env';

const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role?: 'admin' | 'editor' | 'viewer';
}

/**
 * Custom variables for Hono context with authenticated user
 */
export interface AuthVariables {
  user: JWTPayload | null;
}

/**
 * Extended context type including auth
 */
export type AuthContext = Context<{ Bindings: CloudflareEnv; Variables: AuthVariables }>;

// ==================== Password Functions ====================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ==================== JWT Functions ====================

export function generateToken(payload: JWTPayload, jwtSecret: string): string {
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string, jwtSecret: string): JWTPayload | null {
  if (!jwtSecret) {
    return null;
  }
  try {
    return jwt.verify(token, jwtSecret) as JWTPayload;
  } catch {
    return null;
  }
}

// ==================== Request Helpers ====================

export function getAuthUser(request: Request, jwtSecret: string): JWTPayload | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyToken(token, jwtSecret);
}

// Hono compatible auth helper
export function getAuthUserFromHeader(authHeader: string | null, jwtSecret: string): JWTPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token, jwtSecret);
}

export function getAuthUserFromHono(c: { env: CloudflareEnv; req: { header: (name: string) => string | undefined } }): JWTPayload | null {
  const authHeader = c.req.header('Authorization');
  return getAuthUserFromHeader(authHeader || null, c.env.JWT_SECRET);
}

// ==================== Auth Middleware ====================

/**
 * Authentication middleware for Hono
 * 
 * Usage:
 * ```ts
 * import { authMiddleware } from '@/lib/auth';
 * 
 * app.use('/api/protected/*', authMiddleware);
 * ```
 * 
 * After middleware, authenticated user is available at:
 * - c.get('user') - returns JWTPayload | null
 * - c.var.user - TypeScript access
 */
export async function authMiddleware(c: AuthContext, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET;

  // No JWT_SECRET configured - reject all requests
  if (!jwtSecret) {
    console.error('[Auth] JWT_SECRET not configured');
    return c.json(
      { success: false, error: 'Server configuration error', code: 'INTERNAL_ERROR' },
      500
    );
  }

  // No Authorization header - return 401
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' },
      401
    );
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token, jwtSecret);

  // Invalid token - return 401
  if (!payload) {
    return c.json(
      { success: false, error: 'Invalid or expired token', code: 'UNAUTHORIZED' },
      401
    );
  }

  // Attach user to context
  c.set('user', payload);
  
  await next();
}

/**
 * Optional authentication middleware
 * - Attaches user to context if valid token present
 * - Allows request to continue even without token
 * - Use when endpoint is public but user info is helpful
 * 
 * Usage:
 * ```ts
 * app.use('/api/public', optionalAuthMiddleware);
 * ```
 */
export async function optionalAuthMiddleware(c: AuthContext, next: Next): Promise<void> {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env.JWT_SECRET;

  if (jwtSecret && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token, jwtSecret);
    c.set('user', payload);
  } else {
    c.set('user', null);
  }

  await next();
}

/**
 * Require auth middleware - throws error if not authenticated
 * Use for cleaner route handlers
 * 
 * Usage:
 * ```ts
 * app.post('/api/data', requireAuth, async (c) => {
 *   const user = requireAuthUser(c); // guaranteed non-null
 *   // ...
 * });
 * ```
 */
export function requireAuth(c: AuthContext): JWTPayload {
  const user = c.get('user');
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Get authenticated user from context, returns null if not authenticated
 */
export function getAuthenticatedUser(c: AuthContext): JWTPayload | null {
  return c.get('user');
}

// ==================== Authorization Helpers ====================

/**
 * Check if user owns the resource
 * 
 * Usage:
 * ```ts
 * if (!isOwner(user.userId, resourceOwnerId)) {
 *   return c.json({ error: 'Forbidden' }, 403);
 * }
 * ```
 */
export function isOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

/**
 * Role-based authorization factory
 * 
 * Usage:
 * ```ts
 * const requireAdmin = requireRole('admin');
 * app.delete('/api/admin/*', authMiddleware, requireAdmin, handler);
 * ```
 */
export function requireRole(requiredRole: 'admin'): (c: AuthContext, next: Next) => Promise<Response | void> {
  return async (c: AuthContext, next: Next): Promise<Response | void> => {
    const user = c.get('user');
    
    if (!user) {
      return c.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' },
        401
      );
    }

    // TODO: Add role field to JWTPayload and check user role
    // For now, this is a placeholder for future RBAC implementation
    
    await next();
  };
}

// ==================== Re-export for backward compatibility ====================
// Note: Functions are already exported above, no need to re-export
// This section kept for documentation purposes
// The following functions are already exported: hashPassword, verifyPassword, generateToken, verifyToken, getAuthUser, getAuthUserFromHeader, getAuthUserFromHono
