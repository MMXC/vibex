/** 项目级权限 */
export type ProjectPermission = 'view' | 'edit' | 'delete' | 'manageMembers';
/** 团队角色 */
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';
/** 权限映射表 */
export const ROLE_PERMISSIONS: Record<TeamRole, ProjectPermission[]> = {
  owner: ['view', 'edit', 'delete', 'manageMembers'],
  admin: ['view', 'edit', 'delete', 'manageMembers'],
  member: ['view', 'edit'],
  viewer: ['view'],
};
export function hasPermission(role: TeamRole, action: ProjectPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}
