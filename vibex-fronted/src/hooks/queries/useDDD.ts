/**
 * DDD 分析查询 Hooks
 * 基于 React Query 统一数据获取
 * 
 * 注意: 这些 Hooks 为未来迁移准备
 * 当前仍使用 useDDDStream 处理流式数据
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/QueryProvider';

// DDD API 类型定义
interface DDDApi {
  generateContexts: (requirement: string) => Promise<any>;
  generateDomainModel: (data: any) => Promise<any>;
  generateBusinessFlow: (data: any) => Promise<any>;
}

// 模拟 DDD API (实际项目中从 services/api 导入)
const dddApi: DDDApi = {
  generateContexts: async (requirement: string) => {
    const response = await fetch('/api/ddd/contexts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement }),
    });
    return response.json();
  },
  generateDomainModel: async (data: any) => {
    const response = await fetch('/api/ddd/domain-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  generateBusinessFlow: async (data: any) => {
    const response = await fetch('/api/ddd/business-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

/**
 * 获取限界上下文列表
 * @param requirement 需求描述
 */
export function useBoundedContexts(requirement: string) {
  return useQuery({
    queryKey: queryKeys.ddd.contexts(requirement),
    queryFn: () => dddApi.generateContexts(requirement),
    enabled: requirement.trim().length > 0,
    staleTime: 30 * 60 * 1000, // 30 分钟缓存
    gcTime: 60 * 60 * 1000, // 1 小时垃圾回收
  });
}

/**
 * 获取领域模型
 * @param boundedContexts 限界上下文列表
 * @param requirement 可选的需求描述
 */
export function useDomainModels(
  boundedContexts: any[], 
  requirement?: string
) {
  const contextIds = boundedContexts.map((ctx: any) => ctx.id);
  
  return useQuery({
    queryKey: queryKeys.ddd.domainModels(...contextIds),
    queryFn: () => dddApi.generateDomainModel({ boundedContexts, requirement }),
    enabled: boundedContexts.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

/**
 * 获取业务流程
 * @param domainModels 领域模型列表
 * @param requirement 可选的需求描述
 */
export function useBusinessFlowQuery(
  domainModels: any[], 
  requirement?: string
) {
  const modelIds = domainModels.map((model: any) => model.id);
  
  return useQuery({
    queryKey: queryKeys.ddd.businessFlow(...modelIds),
    queryFn: () => dddApi.generateBusinessFlow({ domainModels, requirement }),
    enabled: domainModels.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

/**
 * 获取所有 DDD 分析结果 (组合 Hook)
 * @param requirement 需求描述
 * @param boundedContexts 可选的限界上下文
 * @param domainModels 可选的领域模型
 */
export function useDDDAnalysis(
  requirement: string,
  boundedContexts: any[] = [],
  domainModels: any[] = []
) {
  const contextsQuery = useBoundedContexts(requirement);
  const domainModelsQuery = useDomainModels(boundedContexts, requirement);
  const businessFlowQuery = useBusinessFlowQuery(domainModels, requirement);
  
  return {
    contexts: contextsQuery,
    domainModels: domainModelsQuery,
    businessFlow: businessFlowQuery,
    isLoading: contextsQuery.isLoading || domainModelsQuery.isLoading || businessFlowQuery.isLoading,
    isError: contextsQuery.isError || domainModelsQuery.isError || businessFlowQuery.isError,
  };
}
