/**
 * React Query Hooks: Flows
 * 流程图查询
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/QueryProvider';
import { flowApi } from '@/services/api/modules/flow';
import type { FlowData } from '@/services/api/types/flow';

/**
 * 获取单个流程详情
 * @param flowId 流程ID
 * @param options React Query 选项
 */
export function useFlow(
  flowId: string,
  options?: Omit<UseQueryOptions<FlowData, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.flows.detail(flowId),
    queryFn: () => flowApi.getFlow(flowId),
    enabled: !!flowId,
    ...options,
  });
}
