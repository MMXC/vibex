// @ts-nocheck
import { Project } from './project';

// ==================== 页面相关类型 ====================

export interface Page {
  id: string;
  name: string;
  content?: string | null;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
  project?: Project;
}

export interface PageCreate {
  name: string;
  content?: string | null;
  projectId: string;
}

export interface PageUpdate {
  name?: string;
  content?: string | null;
}
