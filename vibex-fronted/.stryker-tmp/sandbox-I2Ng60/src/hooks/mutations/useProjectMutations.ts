/**
 * React Query Mutations: Project
 * 项目创建、更新、删除等变更操作
 */
// @ts-nocheck


import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/QueryProvider';
import { projectApi } from '@/services/api/modules/project';
import type { Project, ProjectCreate, ProjectUpdate } from '@/services/api/types/project';

/**
 * 项目变更操作选项
 */
export interface UseProjectMutationsOptions {
  onCreateSuccess?: (project: Project) => void;
  onUpdateSuccess?: (project: Project) => void;
  onDeleteSuccess?: () => void;
}

/**
 * 项目变更 Mutations Hook
 * 提供创建、更新、软删除、恢复、永久删除等操作
 */
export function useProjectMutations(options?: UseProjectMutationsOptions) {
  const queryClient = useQueryClient();

  // 创建项目
  const createMutation = useMutation({
    mutationFn: (data: ProjectCreate) => projectApi.createProject(data),
    onMutate: async (newProject) => {
      // 取消进行中的请求
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.lists() });

      // 保存旧数据用于回滚
      const previousProjects = queryClient.getQueryData<Project[]>(
        queryKeys.projects.lists()
      );

      // 乐观更新：添加临时项目
      if (previousProjects) {
        const optimisticProject: Project = {
          id: `temp-${Date.now()}`,
          name: newProject.name,
          description: newProject.description,
          userId: newProject.userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Project;

        queryClient.setQueryData<Project[]>(
          queryKeys.projects.lists(),
          [...previousProjects, optimisticProject]
        );
      }

      return { previousProjects };
    },
    onError: (_err, _newProject, context) => {
      // 回滚到旧数据
      if (context?.previousProjects) {
        queryClient.setQueryData(
          queryKeys.projects.lists(),
          context.previousProjects
        );
      }
    },
    onSuccess: (data) => {
      options?.onCreateSuccess?.(data);
    },
    onSettled: () => {
      // 刷新项目列表
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });

  // 更新项目
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) =>
      projectApi.updateProject(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.projects.detail(id),
      });

      // 保存旧数据
      const previousProject = queryClient.getQueryData<Project>(
        queryKeys.projects.detail(id)
      );

      // 乐观更新
      if (previousProject) {
        queryClient.setQueryData<Project>(queryKeys.projects.detail(id), {
          ...previousProject,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousProject };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(
          queryKeys.projects.detail(id),
          context.previousProject
        );
      }
    },
    onSuccess: (data) => {
      options?.onUpdateSuccess?.(data);
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });

  // 软删除项目
  const softDeleteMutation = useMutation({
    mutationFn: (projectId: string) => projectApi.softDeleteProject(projectId),
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.lists() });

      const previousProjects = queryClient.getQueryData<Project[]>(
        queryKeys.projects.lists()
      );

      // 乐观更新：从列表移除
      if (previousProjects) {
        queryClient.setQueryData<Project[]>(
          queryKeys.projects.lists(),
          previousProjects.filter((p) => p.id !== projectId)
        );
      }

      return { previousProjects };
    },
    onError: (_err, projectId, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(
          queryKeys.projects.lists(),
          context.previousProjects
        );
      }
    },
    onSuccess: () => {
      options?.onDeleteSuccess?.();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.deleted() });
    },
  });

  // 恢复项目
  const restoreMutation = useMutation({
    mutationFn: (projectId: string) => projectApi.restoreProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.deleted() });
    },
  });

  // 永久删除项目
  const permanentDeleteMutation = useMutation({
    mutationFn: (projectId: string) =>
      projectApi.permanentDeleteProject(projectId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.deleted() });
    },
  });

  // 清空回收站
  const clearDeletedMutation = useMutation({
    mutationFn: () => projectApi.clearDeletedProjects(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.deleted() });
    },
  });

  return {
    create: createMutation,
    update: updateMutation,
    softDelete: softDeleteMutation,
    restore: restoreMutation,
    permanentDelete: permanentDeleteMutation,
    clearDeleted: clearDeletedMutation,
  };
}
