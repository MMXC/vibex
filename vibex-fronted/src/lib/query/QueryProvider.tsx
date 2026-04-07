/**
 * React Query Setup
 * 全局 Query Client 配置
 * 
 * 配置说明:
 * - staleTime: 5分钟 (数据新鲜时间)
 * - gcTime: 10分钟 (垃圾回收时间)
 * - retry: 3次 (网络错误重试)
 * - refetchOnWindowFocus: true (窗口聚焦刷新)
 * - persistQueryClient: 持久化到 localStorage
 */

'use client';

import { QueryCache, QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createLocalStoragePersister } from './persistQueryClient';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

/**
 * 全局错误处理回调
 * 用于统一处理查询和变更中的错误
 */
const queryErrorHandler = (error: Error | null): void => {
  // 统一错误处理逻辑
  // 可以扩展: 上报 Sentry、显示 toast 等
  if (error) {
    canvasLogger.default.error('[React Query Error]', error.message);
  }
};

export interface QueryProviderProps {
  children: ReactNode;
}

// 创建持久化器
const persister = createLocalStoragePersister();

export function QueryProvider({ children }: QueryProviderProps) {
  // 标记 hydration 完成后再持久化，避免 SSR/CSR mismatch
  const hydrationRef = useRef(false);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 数据新鲜时间 5 分钟
            staleTime: 5 * 60 * 1000,
            // 垃圾回收时间 10 分钟 (之前是 cacheTime)
            gcTime: 10 * 60 * 1000,
            // 网络错误重试 3 次
            retry: 3,
            // 窗口聚焦时刷新数据
            refetchOnWindowFocus: true,
            // 重连时重新获取
            refetchOnReconnect: true,
            // 挂载时重新获取
            refetchOnMount: true,
          },
          mutations: {
            // mutation 重试 1 次
            retry: 1,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            queryErrorHandler(error as Error);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            queryErrorHandler(error as Error);
          },
        }),
      })
  );

  // 初始化持久化（hydration 完成后再持久化）
  useEffect(() => {
    // 标记 hydration 完成后再持久化
    hydrationRef.current = true;
    const [, persistPromise] = persistQueryClient({
      queryClient,
      persister,
      maxAge: 24 * 60 * 60 * 1000, // 24 小时
    });
    persistPromise.catch(canvasLogger.default.error);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ============ Query Keys ============
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
  },
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    deleted: () => [...queryKeys.projects.all, 'deleted'] as const,
  },
  // Requirements
  requirements: {
    all: ['requirements'] as const,
    byProject: (projectId: string) => [...queryKeys.requirements.all, projectId] as const,
    detail: (id: string) => [...queryKeys.requirements.all, id] as const,
  },
  // Domain Entities
  entities: {
    all: ['entities'] as const,
    byProject: (projectId: string) => [...queryKeys.entities.all, projectId] as const,
    detail: (id: string) => [...queryKeys.entities.all, id] as const,
  },
  // Flows
  flows: {
    all: ['flows'] as const,
    byProject: (projectId: string) => [...queryKeys.flows.all, projectId] as const,
    detail: (id: string) => [...queryKeys.flows.all, id] as const,
  },
  // DDD Analysis
  ddd: {
    contexts: (requirement: string) => ['ddd', 'contexts', requirement] as const,
    domainModels: (...contextIds: string[]) => ['ddd', 'domainModels', ...contextIds] as const,
    businessFlow: (...modelIds: string[]) => ['ddd', 'businessFlow', ...modelIds] as const,
  },
  // User Preferences
  preferences: {
    all: ['preferences'] as const,
    byUser: (userId: string) => ['preferences', userId] as const,
  },
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unread: () => ['notifications', 'unread'] as const,
    byUser: (userId: string) => ['notifications', 'user', userId] as const,
  },
};

export default QueryProvider;
