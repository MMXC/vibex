/**
 * React Query Client 配置
 * 统一数据获取层的缓存策略
 * 
 * F1.4: 缓存配置优化 - 统一缓存配置
 * - staleTime: 5 分钟
 * - gcTime: 30 分钟
 * - retry: 3 次
 * - refetchOnWindowFocus: false
 */

import { QueryClient } from '@tanstack/react-query';

// ==================== 统一缓存配置 ====================

/** 缓存配置常量 - 统一管理 */
export const CACHE_CONFIG = {
  /** 数据新鲜时间: 5 分钟 */
  STALE_TIME: 5 * 60 * 1000,
  /** 垃圾回收时间: 30 分钟 */
  GC_TIME: 30 * 60 * 1000,
  /** 查询重试次数 */
  QUERY_RETRY: 3,
  /** Mutation 重试次数 */
  MUTATION_RETRY: 2,
  /** 重试延迟: 指数退避 */
  RETRY_DELAY: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  /** 后台刷新: 关闭 */
  REFETCH_ON_WINDOW_FOCUS: false,
} as const;

// QueryClient 配置选项
export const queryClient = new QueryClient({
  defaultOptions: {
    // 全局查询配置
    queries: {
      // 失败后自动重试 3 次
      retry: CACHE_CONFIG.QUERY_RETRY,
      // 缓存时间：5 分钟
      staleTime: CACHE_CONFIG.STALE_TIME,
      // 缓存保留时间：30 分钟
      gcTime: CACHE_CONFIG.GC_TIME,
      // 后台重新获取
      refetchOnWindowFocus: CACHE_CONFIG.REFETCH_ON_WINDOW_FOCUS,
      // 重试延迟：指数退避
      retryDelay: CACHE_CONFIG.RETRY_DELAY,
    },
    // 全局 mutation 配置
    mutations: {
      // 失败后重试 2 次
      retry: CACHE_CONFIG.MUTATION_RETRY,
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
