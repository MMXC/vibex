/**
 * PermissionDenied 组件
 */
// @ts-nocheck


'use client';

import {
  usePermission,
  getGlobalRoleDisplayName,
  getRoleColor,
  Permission,
  Resource,
} from '@/hooks/usePermission';

interface PermissionDeniedProps {
  requiredPermission?: Permission;
  resource?: Resource;
  message?: string;
  showBackButton?: boolean;
  className?: string;
}

export function PermissionDenied({
  requiredPermission,
  resource,
  message,
  showBackButton = false,
  className = '',
}: PermissionDeniedProps) {
  const { globalRole } = usePermission();

  const defaultMessage =
    message ||
    (requiredPermission && resource
      ? `您需要 ${getPermissionName(requiredPermission)} 权限才能访问 ${getResourceName(resource)}`
      : '您没有权限执行此操作');

  return (
    <div className={className}>
      <div style={{ fontSize: '28px', marginBottom: '16px' }}>🚫</div>
      <h3
        style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '8px',
        }}
      >
        权限不足
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '16px',
          maxWidth: '400px',
        }}
      >
        {defaultMessage}
      </p>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          fontSize: '13px',
        }}
      >
        <span>当前角色:</span>
        <span style={{ fontWeight: '600', color: getRoleColor(globalRole) }}>
          {getGlobalRoleDisplayName(globalRole)}
        </span>
      </div>
      {requiredPermission && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#1e40af',
            maxWidth: '400px',
          }}
        >
          <p style={{ margin: 0 }}>
            需要权限: <strong>{getPermissionName(requiredPermission)}</strong>
          </p>
          <p style={{ margin: '4px 0 0' }}>
            联系管理员升级您的角色以获得更多权限
          </p>
        </div>
      )}
      {showBackButton && (
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: '24px',
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          ← 返回
        </button>
      )}
    </div>
  );
}

interface RequirePermissionProps {
  permission: Permission;
  resource?: Resource;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDeniedMessage?: boolean;
}

export function RequirePermission({
  permission,
  resource = 'all',
  children,
  fallback = null,
  showDeniedMessage = false,
}: RequirePermissionProps) {
  const { canAccess } = usePermission();
  const hasAccess = canAccess(resource, permission);

  if (hasAccess) return <>{children}</>;
  if (showDeniedMessage)
    return (
      <PermissionDenied requiredPermission={permission} resource={resource} />
    );
  return <>{fallback}</>;
}

function getPermissionName(permission: Permission): string {
  const names: Record<Permission, string> = {
    read: '读取',
    create: '创建',
    update: '更新',
    delete: '删除',
    manage: '管理',
  };
  return names[permission] || permission;
}

function getResourceName(resource: Resource): string {
  const names: Record<Resource, string> = {
    projects: '项目',
    agents: '智能体',
    pages: '页面',
    flows: '流程',
    requirements: '需求',
    prototypes: '原型',
    components: '组件',
    users: '用户',
    'domain-entities': '领域实体',
    collaborations: '协作',
    all: '所有资源',
  };
  return names[resource] || resource;
}

export default PermissionDenied;
