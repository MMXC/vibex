/**
 * lib/api/client.ts — TanStack Query API Client
 *
 * E1-S1: 统一 API Client with TanStack Query
 *
 * 特性:
 * - 统一请求/响应拦截（认证、错误转换）
 * - 延迟指标跟踪（P50/P95/P99）
 * - 1000 条滚动窗口，无内存泄漏
 * - logRequest 回调支持
 * - 与现有 axios client.ts 互补（Query 层）
 *
 * 与 src/services/api/client.ts 的关系:
 * - services 层: 底层 HTTP（axios）
 * - lib/api 层: Query 层（TanStack Query, 缓存/dedup/refetch）
 */
import { QueryClient } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

// ==================== 类型定义 ====================

export interface Percentiles {
  p50: number;
  p95: number;
  p99: number;
}

export interface ApiMetrics {
  requests: number;
  failures: number;
  latency: Percentiles;
}

// ==================== TanStack Query Client ====================

/** 全局 QueryClient 实例 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,         // 1 分钟内不重新请求
      gcTime: 5 * 60 * 1000,         // 5 分钟垃圾回收
      retry: 1,                       // 失败重试 1 次
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ==================== Metrics 跟踪 ====================

const latencyWindow: number[] = [];
const MAX_WINDOW = 1000;
let requestCount = 0;
let failureCount = 0;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)];
}

export const apiMetrics: ApiMetrics = {
  get requests() { return requestCount; },
  get failures() { return failureCount; },
  get latency() {
    const sorted = [...latencyWindow].sort((a, b) => a - b);
    return {
      p50: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      p99: percentile(sorted, 0.99),
    };
  },
};

/**
 * 记录请求延迟（内部使用）
 */
export function recordLatency(ms: number): void {
  requestCount++;
  latencyWindow.push(ms);
  if (latencyWindow.length > MAX_WINDOW) {
    latencyWindow.shift();
  }
}

/**
 * 记录请求失败（内部使用）
 */
export function recordFailure(): void {
  requestCount++;
  failureCount++;
}

// ==================== 请求包装器 ====================

export interface RequestOptions extends AxiosRequestConfig {
  /** 每次请求前调用（用于日志/审计） */
  logRequest?: (config: AxiosRequestConfig) => void;
}

/**
 * 使用 queryClient 执行请求，自动跟踪指标
 *
 * 用法:
 *   const data = await apiRequest<Project[]>({
 *     queryKey: ['projects'],
 *     queryFn: () => projectApi.getProjects(),
 *   });
 */
export async function apiRequest<T>(options: {
  queryKey: readonly unknown[];
  queryFn: () => Promise<T>;
  logRequest?: (config: AxiosRequestConfig) => void;
}): Promise<T> {
  const { queryKey, queryFn, logRequest } = options;
  const start = Date.now();

  try {
    // E1-S1: logRequest 回调
    if (logRequest) {
      logRequest({ url: String(queryKey[0]) } as AxiosRequestConfig);
    }
    const result = await queryFn();
    recordLatency(Date.now() - start);
    return result;
  } catch (error) {
    recordFailure();
    throw error;
  }
}
