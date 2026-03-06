/**
 * RBAC 前端权限管理 - 统一导出
 */

export { usePermission } from '@/hooks/usePermission';
export {
  checkGlobalRolePermission,
  checkProjectRolePermission,
  getGlobalRoleDisplayName,
  getProjectRoleDisplayName,
  getRoleColor,
  GLOBAL_ROLE_PERMISSIONS,
  PROJECT_ROLE_PERMISSIONS,
  type UsePermissionReturn,
  type UserRole,
  type GlobalRole,
  type ProjectRole,
  type Permission,
  type Resource,
  type JWTPayloadWithRole,
} from '@/hooks/usePermission';

export {
  PermissionDenied,
  RequirePermission,
} from '@/components/PermissionDenied';
