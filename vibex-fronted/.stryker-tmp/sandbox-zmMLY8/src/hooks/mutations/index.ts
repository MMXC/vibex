/**
 * 数据变更 Mutations
 * 基于 React Query 的数据修改操作
 * 
 * 注意: 这些 Mutations 为未来扩展准备
 * 当前项目使用直接 API 调用方式
 */
// @ts-nocheck


import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/QueryProvider';

// 模拟 API 调用 (实际项目中从 services/api 导入)
const api = {
  projects: {
    create: async (data: any) => { /* 实现 */ return data; },
    update: async ({ id, data }: any) => { /* 实现 */ return { id, ...data }; },
    delete: async (id: string) => { /* 实现 */ return { id }; },
  },
  requirements: {
    create: async (data: any) => { /* 实现 */ return data; },
    update: async ({ id, data }: any) => { /* 实现 */ return { id, ...data }; },
    delete: async (id: string) => { /* 实现 */ return { id }; },
  },
};

// ============ Project Mutations ============

/**
 * 创建项目 Mutation
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.projects.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

/**
 * 更新项目 Mutation
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.projects.update,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

/**
 * 删除项目 Mutation
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.projects.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

// ============ Requirement Mutations ============

/**
 * 创建需求 Mutation
 */
export function useCreateRequirement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.requirements.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all });
    },
  });
}

/**
 * 更新需求 Mutation
 */
export function useUpdateRequirement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.requirements.update,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all });
    },
  });
}

/**
 * 删除需求 Mutation
 */
export function useDeleteRequirement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.requirements.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all });
    },
  });
}
