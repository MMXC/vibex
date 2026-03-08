import { Page } from './page';

// ==================== 项目相关类型 ====================

export interface Project {
  id: string;
  name: string;
  userId: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  pages?: Page[];
}

export interface ProjectCreate {
  name: string;
  description?: string;
  userId: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
}

export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';
