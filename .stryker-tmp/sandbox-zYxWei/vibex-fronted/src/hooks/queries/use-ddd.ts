/**
 * DDD API React Query Hooks
 * 统一数据获取层 - 限界上下文、领域模型、业务流程
 */
// @ts-nocheck


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Query Keys - 用于缓存标识
export const dddKeys = {
  all: ['ddd'] as const,
  contexts: () => [...dddKeys.all, 'contexts'] as const,
  context: (id: string) => [...dddKeys.contexts(), id] as const,
  domainModels: (contextId?: string) => [...dddKeys.all, 'domainModels', contextId ?? 'all'] as const,
  businessFlow: () => [...dddKeys.all, 'businessFlow'] as const,
};

// API functions
async function fetchBoundedContexts(requirement: string) {
  const response = await fetch('/api/ddd/bounded-context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ requirement }),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('登录已过期，请重新登录');
    throw new Error('Failed to fetch bounded contexts');
  }
  return response.json();
}

async function fetchDomainModels(requirement: string, contexts: unknown[]) {
  const response = await fetch('/api/ddd/domain-model', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ requirement, contexts }),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('登录已过期，请重新登录');
    throw new Error('Failed to fetch domain models');
  }
  return response.json();
}

async function fetchBusinessFlow(requirement: string, domainModels: unknown[]) {
  const response = await fetch('/api/ddd/business-flow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ requirement, domainModels }),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('登录已过期，请重新登录');
    throw new Error('Failed to fetch business flow');
  }
  return response.json();
}

// ==================== Hooks ====================

/**
 * 获取限界上下文列表
 */
export function useBoundedContexts(requirement: string) {
  return useQuery({
    queryKey: dddKeys.contexts(),
    queryFn: () => fetchBoundedContexts(requirement),
    enabled: !!requirement.trim(),
    staleTime: 10 * 60 * 1000, // 10 分钟
  });
}

/**
 * 获取领域模型
 */
export function useDomainModels(requirement: string, contexts: unknown[]) {
  return useQuery({
    queryKey: dddKeys.domainModels(),
    queryFn: () => fetchDomainModels(requirement, contexts),
    enabled: !!requirement && contexts.length > 0,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * 获取业务流程
 */
export function useBusinessFlow(requirement: string, domainModels: unknown[]) {
  return useQuery({
    queryKey: dddKeys.businessFlow(),
    queryFn: () => fetchBusinessFlow(requirement, domainModels),
    enabled: !!requirement && domainModels.length > 0,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * 流式生成限界上下文 Mutation
 */
export function useGenerateContexts() {
  return useMutation({
    mutationFn: fetchBoundedContexts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dddKeys.contexts() });
    },
  });
}

/**
 * 流式生成领域模型 Mutation
 */
export function useGenerateDomainModels() {
  return useMutation({
    mutationFn: ({ requirement, contexts }: { requirement: string; contexts: unknown[] }) =>
      fetchDomainModels(requirement, contexts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dddKeys.domainModels() });
    },
  });
}

/**
 * 流式生成业务流程 Mutation
 */
export function useGenerateBusinessFlow() {
  return useMutation({
    mutationFn: ({ requirement, domainModels }: { requirement: string; domainModels: unknown[] }) =>
      fetchBusinessFlow(requirement, domainModels),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dddKeys.businessFlow() });
    },
  });
}

/**
 * 预获取限界上下文
 */
export function usePrefetchContexts() {
  return (requirement: string) => {
    queryClient.prefetchQuery({
      queryKey: dddKeys.contexts(),
      queryFn: () => fetchBoundedContexts(requirement),
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * 清除 DDD 缓存
 */
export function useClearDDDCache() {
  return () => {
    queryClient.removeQueries({ queryKey: dddKeys.all });
  };
}
