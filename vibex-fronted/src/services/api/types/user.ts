// ==================== 用户相关类型 ====================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role?: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'super_admin' | 'user' | 'guest';

export interface UserUpdate {
  name?: string;
  avatar?: string | null;
}
