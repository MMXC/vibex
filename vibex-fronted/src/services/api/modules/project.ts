import { Project, ProjectCreate, ProjectUpdate, ProjectRole } from '../types/project';
import { SuccessResponse } from '../types/common';
import { httpClient } from '../client';
import { retry } from '../retry';
import { cache, getCacheKey } from '../cache';

// ==================== 接口定义 ====================

export interface ProjectApi {
  getProjects(userId: string): Promise<Project[]>;
  getProject(projectId: string): Promise<Project>;
  createProject(project: ProjectCreate): Promise<Project>;
  updateProject(projectId: string, data: ProjectUpdate): Promise<Project>;
  deleteProject(projectId: string): Promise<SuccessResponse>;
  softDeleteProject(projectId: string): Promise<Project>;
  restoreProject(projectId: string): Promise<Project>;
  permanentDeleteProject(projectId: string): Promise<SuccessResponse>;
  getDeletedProjects(): Promise<Project[]>;
  clearDeletedProjects(): Promise<SuccessResponse>;
  getProjectRole(projectId: string): Promise<{ role: ProjectRole }>;
}

// ==================== 实现 ====================

class ProjectApiImpl implements ProjectApi {
  private isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  async getProjects(userId: string): Promise<Project[]> {
    const cacheKey = getCacheKey('projects', userId);
    const cached = cache.get<Project[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<{ projects: Project[] }>('/projects', { params: { userId } });
    });
    const projects: Project[] = (result as any).projects || result;
    cache.set(cacheKey, projects);
    return projects;
  }

  async getProject(projectId: string): Promise<Project> {
    const cacheKey = getCacheKey('project', projectId);
    const cached = cache.get<Project>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<{ project: Project }>(`/projects/${projectId}`);
    });
    const project: Project = (result as any).project || result;
    cache.set(cacheKey, project);
    return project;
  }

  async createProject(project: ProjectCreate): Promise<Project> {
    const result = await retry.execute(async () => {
      return await httpClient.post<{ project: Project }>('/projects', project);
    });
    const created: Project = (result as any).project || result;
    cache.remove(getCacheKey('projects', project.userId));
    return created;
  }

  async updateProject(projectId: string, data: ProjectUpdate): Promise<Project> {
    const result = await retry.execute(async () => {
      return await httpClient.put<{ project: Project }>(`/projects/${projectId}`, data);
    });
    const project: Project = (result as any).project || result;
    cache.remove(getCacheKey('project', projectId));
    return project;
  }

  async deleteProject(projectId: string): Promise<SuccessResponse> {
    const result = await retry.execute(async () => {
      return await httpClient.delete<SuccessResponse>(`/projects/${projectId}`);
    });
    return result;
  }

  async softDeleteProject(projectId: string): Promise<Project> {
    const result = await retry.execute(async () => {
      return await httpClient.patch<{ project: Project }>(`/projects/${projectId}/soft-delete`, {});
    });
    return (result as any).project || result;
  }

  async restoreProject(projectId: string): Promise<Project> {
    const result = await retry.execute(async () => {
      return await httpClient.patch<{ project: Project }>(`/projects/${projectId}/restore`, {});
    });
    return (result as any).project || result;
  }

  async permanentDeleteProject(projectId: string): Promise<SuccessResponse> {
    const result = await retry.execute(async () => {
      return await httpClient.delete<SuccessResponse>(`/projects/${projectId}/permanent`);
    });
    return result;
  }

  async getDeletedProjects(): Promise<Project[]> {
    const result = await retry.execute(async () => {
      return await httpClient.get<{ projects: Project[] }>('/projects/deleted');
    });
    return (result as any).projects || result;
  }

  async clearDeletedProjects(): Promise<SuccessResponse> {
    const result = await retry.execute(async () => {
      return await httpClient.delete<SuccessResponse>('/projects/deleted-all');
    });
    return result;
  }

  async getProjectRole(projectId: string): Promise<{ role: ProjectRole }> {
    const result = await retry.execute(async () => {
      return await httpClient.get<{ role: ProjectRole }>(`/projects/${projectId}/role`);
    });
    return result;
  }
}

// ==================== 工厂函数 ====================

export function createProjectApi(): ProjectApi {
  return new ProjectApiImpl();
}

// ==================== 单例导出 ====================

export const projectApi = createProjectApi();