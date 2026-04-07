/**
 * usePermission Hook - 前端权限检查
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { getAuthToken } from '@/lib/auth-token';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

export type GlobalRole = 'super_admin' | 'user' | 'guest';
export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type UserRole = GlobalRole | ProjectRole;
export type Permission = 'read' | 'create' | 'update' | 'delete' | 'manage';
export type Resource =
  | 'projects'
  | 'agents'
  | 'pages'
  | 'flows'
  | 'requirements'
  | 'prototypes'
  | 'components'
  | 'users'
  | 'domain-entities'
  | 'collaborations'
  | 'all';

export interface JWTPayloadWithRole {
  userId: string;
  email: string;
  role?: GlobalRole;
  iat?: number;
  exp?: number;
}

interface ProjectRoleCache {
  [projectId: string]: { role: ProjectRole; expiresAt: number };
}

export const GLOBAL_ROLE_PERMISSIONS: Record<GlobalRole, Permission[]> = {
  super_admin: ['read', 'create', 'update', 'delete', 'manage'],
  user: ['read', 'create', 'update'],
  guest: ['read'],
};

export const PROJECT_ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  owner: ['read', 'create', 'update', 'delete', 'manage'],
  admin: ['read', 'create', 'update', 'delete', 'manage'],
  editor: ['read', 'create', 'update'],
  viewer: ['read'],
};

function parseJWT(token: string): JWTPayloadWithRole | null {
  try {
    const payload = token.split('.')[1];
    if (payload) return JSON.parse(atob(payload));
  } catch {
    /* ignore */
  }
  return null;
}

export interface UsePermissionReturn {
  globalRole: GlobalRole;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isUser: boolean;
  isGuest: boolean;
  hasPermission: (permission: Permission) => boolean;
  canAccess: (resource: Resource, permission: Permission) => boolean;
  user: JWTPayloadWithRole | null;
  refreshUser: () => void;
  getProjectRole: (projectId: string) => ProjectRole | null;
  hasProjectPermission: (
    projectId: string,
    permission: Permission
  ) => Promise<boolean>;
  setProjectRole: (projectId: string, role: ProjectRole) => void;
  clearProjectRole: (projectId: string) => void;
}

export function usePermission(): UsePermissionReturn {
  const [user, setUser] = useState<JWTPayloadWithRole | null>(null);
  const [projectRoles, setProjectRoles] = useState<ProjectRoleCache>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = getAuthToken();
    setUser(token ? parseJWT(token) : null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cached = localStorage.getItem('project_roles');
    if (cached) {
      try {
        setProjectRoles(JSON.parse(cached));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const globalRole: GlobalRole = user?.role || 'user';
  const isAuthenticated = !!user;
  const isSuperAdmin = globalRole === 'super_admin';
  const isUser = globalRole === 'user' || globalRole === 'super_admin';
  const isGuest = globalRole === 'guest';

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (globalRole === 'super_admin') return true;
      return GLOBAL_ROLE_PERMISSIONS[globalRole]?.includes(permission) ?? false;
    },
    [globalRole]
  );

  const canAccess = useCallback(
    (resource: Resource, permission: Permission): boolean => {
      if (globalRole === 'super_admin') return true;
      if (globalRole === 'user' && permission === 'manage') return false;
      return hasPermission(permission);
    },
    [globalRole, hasPermission]
  );

  const refreshUser = useCallback(() => {
    window.location.reload();
  }, []);

  const getProjectRole = useCallback(
    (projectId: string): ProjectRole | null => {
      const cached = projectRoles[projectId];
      if (!cached) return null;
      if (cached.expiresAt < Date.now()) {
        const newRoles = { ...projectRoles };
        delete newRoles[projectId];
        setProjectRoles(newRoles);
        if (typeof window !== 'undefined')
          localStorage.setItem('project_roles', JSON.stringify(newRoles));
        return null;
      }
      return cached.role;
    },
    [projectRoles]
  );

  const hasProjectPermission = useCallback(
    async (projectId: string, permission: Permission): Promise<boolean> => {
      const cachedRole = getProjectRole(projectId);
      if (cachedRole) {
        if (
          globalRole === 'super_admin' ||
          cachedRole === 'owner' ||
          cachedRole === 'admin'
        )
          return true;
        return (
          PROJECT_ROLE_PERMISSIONS[cachedRole]?.includes(permission) ?? false
        );
      }
      try {
        const response = await apiService.getProjectRole(projectId);
        if (response && response.role) {
          const newRoles = {
            ...projectRoles,
            [projectId]: {
              role: response.role,
              expiresAt: Date.now() + 86400000,
            },
          };
          setProjectRoles(newRoles);
          if (typeof window !== 'undefined')
            localStorage.setItem('project_roles', JSON.stringify(newRoles));
          if (
            globalRole === 'super_admin' ||
            response.role === 'owner' ||
            response.role === 'admin'
          )
            return true;
          return (
            PROJECT_ROLE_PERMISSIONS[response.role]?.includes(permission) ??
            false
          );
        }
      } catch (error) {
        canvasLogger.default.error('Failed to get project role:', error);
      }
      return false;
    },
    [globalRole, projectRoles, getProjectRole]
  );

  const setProjectRoleFn = useCallback(
    (projectId: string, role: ProjectRole): void => {
      const newRoles = {
        ...projectRoles,
        [projectId]: { role, expiresAt: Date.now() + 86400000 },
      };
      setProjectRoles(newRoles);
      if (typeof window !== 'undefined')
        localStorage.setItem('project_roles', JSON.stringify(newRoles));
    },
    [projectRoles]
  );

  const clearProjectRoleFn = useCallback(
    (projectId: string): void => {
      const newRoles = { ...projectRoles };
      delete newRoles[projectId];
      setProjectRoles(newRoles);
      if (typeof window !== 'undefined')
        localStorage.setItem('project_roles', JSON.stringify(newRoles));
    },
    [projectRoles]
  );

  return {
    globalRole,
    isAuthenticated,
    isSuperAdmin,
    isUser,
    isGuest,
    hasPermission,
    canAccess,
    user,
    refreshUser,
    getProjectRole,
    hasProjectPermission,
    setProjectRole: setProjectRoleFn,
    clearProjectRole: clearProjectRoleFn,
  };
}

export function checkGlobalRolePermission(
  role: GlobalRole,
  permission: Permission
): boolean {
  if (role === 'super_admin') return true;
  return GLOBAL_ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function checkProjectRolePermission(
  role: ProjectRole,
  permission: Permission
): boolean {
  if (role === 'owner' || role === 'admin') return true;
  return PROJECT_ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getGlobalRoleDisplayName(role: GlobalRole): string {
  const names: Record<GlobalRole, string> = {
    super_admin: '超级管理员',
    user: '用户',
    guest: '访客',
  };
  return names[role] || '未知';
}

export function getProjectRoleDisplayName(role: ProjectRole): string {
  const names: Record<ProjectRole, string> = {
    owner: '所有者',
    admin: '管理员',
    editor: '编辑者',
    viewer: '查看者',
  };
  return names[role] || '未知';
}

export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    super_admin: '#ef4444',
    user: '#3b82f6',
    guest: '#6b7280',
    owner: '#8b5cf6',
    admin: '#f59e0b',
    editor: '#10b981',
    viewer: '#6b7280',
  };
  return colors[role] || '#6b7280';
}

export default usePermission;
