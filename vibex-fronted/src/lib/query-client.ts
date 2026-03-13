/**
 * React Query Client 配置
 * 统一数据获取层的缓存策略
 */

import { QueryClient } from '@tanstack/react-query';

// QueryClient 配置选项
export const queryClient = new QueryClient({
  defaultOptions: {
    // 全局查询配置
    queries: {
      // 失败后自动重试 3 次
      retry: 3,
      // 缓存时间：5 分钟
      staleTime: 5 * 60 * 1000,
      // 缓存保留时间：30 分钟
      gcTime: 30 * 60 * 1000,
      // 后台重新获取
      refetchOnWindowFocus: false,
      // 重试延迟：指数退避
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    // 全局 mutation 配置
    mutations: {
      // 失败后重试 2 次
      retry: 2,
    },
  },
});

// 导出 QueryClient 实例类型
export type QueryClientInstance = typeof queryClient;

// 常用查询键
export const queryKeys = {
  // DDD 相关
  boundedContexts: (requirement: string) => ['bounded-contexts', requirement] as const,
  domainModels: (requirement: string) => ['domain-models', requirement] as const,
  businessFlow: (requirement: string) => ['business-flow', requirement] as const,
  
  // 项目相关
  projects: ['projects'] as const,
  project: (id: string) => ['project', id] as const,
  
  // 用户相关
  user: ['user'] as const,
  
  // 通用
  templates: ['templates'] as const,
} as const;
