/**
 * RBAC (Role-Based Access Control) Middleware
 * 
 * Supports roles: admin, editor, viewer
 * Permissions: read, create, update, delete
 */

import { Context, Next } from 'hono';
import { CloudflareEnv } from './env';
import { JWTPayload, AuthContext } from './auth';

// ==================== Role Types ====================

export type UserRole = 'admin' | 'editor' | 'viewer';

export type Permission = 'read' | 'create' | 'update' | 'delete';

export type Resource = 'projects' | 'agents' | 'pages' | 'flows' | 'requirements' | 
  'prototypes' | 'components' | 'users' | 'domain-entities' | 'collaborations' | 'all';

// ==================== Permission Matrix ====================

/**
 * Permission matrix defining what each role can do
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['read', 'create', 'update', 'delete'],     // Full access
  editor: ['read', 'create', 'update'],               // No delete
  viewer: ['read'],                                    // Read only
};

// ==================== Extended JWT Payload with Role ====================

export interface JWTPayloadWithRole extends JWTPayload {
  role: UserRole;
}

export interface AuthVariablesWithRole {
  user: JWTPayloadWithRole | null;
}

export type AuthContextWithRole = Context<{ Bindings: CloudflareEnv; Variables: AuthVariablesWithRole }>;

// ==================== Permission Check Functions ====================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role can access a resource with a specific permission
 * Admin has access to everything
 */
export function canAccessResource(role: UserRole, _resource: Resource, permission: Permission): boolean {
  // Admin has full access
  if (role === 'admin') {
    return true;
  }
  return hasPermission(role, permission);
}

// ==================== Middleware Factories ====================

/**
 * Create a middleware that requires a specific permission
 * 
 * Usage:
 * ```ts
 * const requireReadProjects = requirePermission('projects', 'read');
 * app.get('/api/projects', authMiddleware, requireReadProjects, handler);
 * ```
 */
export function requirePermission(resource: Resource, permission: Permission) {
  return async (c: AuthContextWithRole, next: Next): Promise<Response | void> => {
    const user = c.get('user');
    
    if (!user) {
      return c.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' },
        401
      );
    }

    const role = user.role || 'viewer';
    
    if (!canAccessResource(role, resource, permission)) {
      return c.json(
        { 
          success: false, 
          error: `Permission denied: ${permission} on ${resource} requires ${getRequiredRole(resource, permission)} role`, 
          code: 'FORBIDDEN' 
        },
        403
      );
    }
    
    await next();
  };
}

/**
 * Create a middleware that requires a specific role
 * 
 * Usage:
 * ```ts
 * const requireAdmin = requireRole('admin');
 * app.delete('/api/admin/*', authMiddleware, requireAdmin, handler);
 * ```
 */
export function requireRole(requiredRole: UserRole) {
  return async (c: AuthContextWithRole, next: Next): Promise<Response | void> => {
    const user = c.get('user');
    
    if (!user) {
      return c.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' },
        401
      );
    }

    const userRole = user.role || 'viewer';
    const roleHierarchy: UserRole[] = ['viewer', 'editor', 'admin'];
    const userRoleLevel = roleHierarchy.indexOf(userRole);
    const requiredRoleLevel = roleHierarchy.indexOf(requiredRole);
    
    if (userRoleLevel < requiredRoleLevel) {
      return c.json(
        { 
          success: false, 
          error: `Access denied: requires ${requiredRole} role`, 
          code: 'FORBIDDEN' 
        },
        403
      );
    }
    
    await next();
  };
}

/**
 * Require admin role (shorthand)
 */
export function requireAdmin(c: AuthContextWithRole, next: Next): Promise<Response | void> {
  return requireRole('admin')(c, next);
}

/**
 * Require editor or admin role
 */
export function requireEditor(c: AuthContextWithRole, next: Next): Promise<Response | void> {
  return requireRole('editor')(c, next);
}

// ==================== Helper Functions ====================

/**
 * Get the minimum required role for a resource+permission combination
 */
function getRequiredRole(resource: Resource, permission: Permission): string {
  // For delete operations, require editor (not viewer)
  if (permission === 'delete') {
    return 'editor';
  }
  // For create/update, require editor
  if (permission === 'create' || permission === 'update') {
    return 'editor';
  }
  return 'viewer';
}

/**
 * Get role from JWT payload, default to viewer
 */
export function getUserRole(user: JWTPayloadWithRole | JWTPayload | null): UserRole {
  if (!user) return 'viewer';
  return (user as JWTPayloadWithRole).role || 'viewer';
}

/**
 * Check if user can perform action (utility function for route handlers)
 */
export function checkPermission(user: JWTPayloadWithRole | null, resource: Resource, permission: Permission): boolean {
  if (!user) return false;
  const role = getUserRole(user);
  return canAccessResource(role, resource, permission);
}

// ==================== Re-export for backward compatibility ====================

// Keep backward compatibility with existing requireRole in auth.ts
export { requireRole as requireRoleFromAuth };
