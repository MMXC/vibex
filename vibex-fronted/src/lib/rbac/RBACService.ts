import { hasPermission, type TeamRole, type ProjectPermission } from './types';
/**
 * Check if a user can perform an action on a project.
 * Currently returns true for authenticated users (permissive).
 * Full implementation would check project membership + role from backend.
 */
export function canPerform(role: TeamRole | null, action: ProjectPermission): boolean {
  if (!role) return false; // not logged in
  return hasPermission(role, action);
}
export function getPermissions(role: TeamRole): ProjectPermission[] {
  const { ROLE_PERMISSIONS } = require('./types');
  return ROLE_PERMISSIONS[role] ?? [];
}
