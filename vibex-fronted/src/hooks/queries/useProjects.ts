/**
 * React Query Hooks: Projects
 * 项目列表和详情查询
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/QueryProvider';
import { projectApi } from '@/services/api/modules/project';
import type { Project } from '@/services/api/types/project';

// ==================== 类型定义 ====================

// 项目过滤条件
export interface ProjectFilters {
  status?: 'active' | 'deleted';
  search?: string;
  [key: string]: unknown;
}

export interface UseProjectsOptions {
  userId: string;
  filters?: ProjectFilters;
  options?: Omit<UseQueryOptions<Project[], Error>, 'queryKey' | 'queryFn'>;
}

/**
 * 获取用户项目列表
 * @param userId 用户ID
 * @param filters 可选的过滤条件
 * @param options React Query 选项
 */
export function useProjects({ userId, filters, options }: UseProjectsOptions) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters || {}),
    queryFn: () => projectApi.getProjects(userId),
    enabled: !!userId,
    ...options,
  });
}

/**
 * 获取单个项目详情
 * @param projectId 项目ID
 * @param options React Query 选项
 */
export function useProject(projectId: string, options?: Omit<UseQueryOptions<Project, Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => projectApi.getProject(projectId),
    enabled: !!projectId,
    ...options,
  });
}

/**
 * 获取已删除项目列表
 * @param options React Query 选项
 */
export function useDeletedProjects(options?: Omit<UseQueryOptions<Project[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.projects.deleted(),
    queryFn: () => projectApi.getDeletedProjects(),
    ...options,
  });
}

/**
 * 获取项目角色
 * @param projectId 项目ID
 */
export function useProjectRole(projectId: string, options?: Omit<UseQueryOptions<{ role: string }, Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: [...queryKeys.projects.detail(projectId), 'role'] as const,
    queryFn: () => projectApi.getProjectRole(projectId),
    enabled: !!projectId,
    ...options,
  });
}
