/**
 * React Query Hooks: Domain Entities
 * 领域实体查询
 */
// @ts-nocheck


import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/QueryProvider';
import { domainEntityApi } from '@/services/api/modules/domain-entity';
import type { DomainEntity } from '@/services/api/types/prototype/domain';

/**
 * 获取需求下的领域实体列表
 * @param requirementId 需求ID
 * @param options React Query 选项
 */
export function useDomainEntities(
  requirementId: string,
  options?: Omit<UseQueryOptions<DomainEntity[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.entities.byProject(requirementId),
    queryFn: () => domainEntityApi.getDomainEntities(requirementId),
    enabled: !!requirementId,
    ...options,
  });
}

/**
 * 获取单个领域实体详情
 * @param entityId 实体ID
 * @param options React Query 选项
 */
export function useDomainEntity(
  entityId: string,
  options?: Omit<UseQueryOptions<DomainEntity, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.entities.detail(entityId),
    queryFn: () => domainEntityApi.getDomainEntity(entityId),
    enabled: !!entityId,
    ...options,
  });
}
