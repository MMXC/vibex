/**
 * React Query Hooks: Requirements
 * 需求列表和详情查询
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/QueryProvider';
import { requirementApi } from '@/services/api/modules/requirement';
import type { Requirement } from '@/services/api/types/prototype/requirement';

/**
 * 获取用户的需求列表
 * @param userId 用户ID
 * @param options React Query 选项
 */
export function useRequirements(
  userId: string,
  options?: Omit<UseQueryOptions<Requirement[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.requirements.byProject(userId),
    queryFn: () => requirementApi.getRequirements(userId),
    enabled: !!userId,
    ...options,
  });
}

/**
 * 获取单个需求详情
 * @param requirementId 需求ID
 * @param options React Query 选项
 */
export function useRequirement(
  requirementId: string,
  options?: Omit<UseQueryOptions<Requirement, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.requirements.detail(requirementId),
    queryFn: () => requirementApi.getRequirement(requirementId),
    enabled: !!requirementId,
    ...options,
  });
}

/**
 * 获取需求的分析结果
 * @param requirementId 需求ID
 * @param options React Query 选项
 */
export function useAnalysisResult(
  requirementId: string,
  options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...queryKeys.requirements.detail(requirementId), 'analysis'] as const,
    queryFn: () => requirementApi.getAnalysisResult(requirementId),
    enabled: !!requirementId,
    ...options,
  });
}
