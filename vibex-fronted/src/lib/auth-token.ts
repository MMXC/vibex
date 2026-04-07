/**
 * Auth Token Utility
 * 
 * 安全获取认证 token 和用户 ID。
 * 优先从 sessionStorage 读取（安全），fallback 到 localStorage（兼容旧数据迁移期）。
 * 所有需要读取 auth token 的地方应使用此函数。
 */

/**
 * 获取当前认证 token
 * 优先 sessionStorage（安全），fallback localStorage（兼容迁移期）
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
}

/**
 * 获取当前用户 ID
 * 优先 sessionStorage（安全），fallback localStorage（兼容迁移期）
 */
export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
}

/**
 * 检查是否有有效的认证 token
 */
export function hasAuthToken(): boolean {
  return !!getAuthToken();
}

/**
 * 清除认证 token（从所有存储位置）
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('auth_token');
  localStorage.removeItem('auth_token');
}
