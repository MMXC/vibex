/**
 * Resilient HTTP Client
 * 
 * 集成重试机制和熔断器的 HTTP 客户端
 * 保护 API 调用，提升健壮性
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { configureAxiosRetry } from './api-retry';
import { CircuitBreakerManager } from './circuit-breaker';
import { API_CONFIG } from './api-config';

// 客户端配置
export interface ResilientClientConfig {
  baseURL?: string;
  timeout?: number;
  // 重试配置
  retry?: {
    enabled?: boolean;
    retries?: number;
    retryDelay?: number;
    maxRetryDelay?: number;
  };
  // 熔断器配置
  circuitBreaker?: {
    enabled?: boolean;
    failureRateThreshold?: number;
    minimumNumberOfCalls?: number;
    windowDuration?: number;
    openDuration?: number;
  };
}

// 熔断器管理器实例
const breakerManager = new CircuitBreakerManager({
  failureRateThreshold: 0.5,
  minimumNumberOfCalls: 5,
  windowDuration: 60000,
  openDuration: 30000,
});

/**
 * 创建带重试和熔断的 HTTP 客户端
 */
export function createResilientClient(config: ResilientClientConfig = {}): AxiosInstance {
  const baseURL = config.baseURL || API_CONFIG.baseURL;
  const timeout = config.timeout || 10000;
  
  // 创建 axios 实例
  const instance = axios.create({
    baseURL,
    timeout,
    headers: { 'Content-Type': 'application/json' },
  });

  // 配置重试
  if (config.retry?.enabled !== false) {
    configureAxiosRetry(instance, {
      retries: config.retry?.retries ?? 3,
      retryDelay: config.retry?.retryDelay ?? 1000,
      maxRetryDelay: config.retry?.maxRetryDelay ?? 10000,
      onRetry: (retryCount, error) => {
        console.warn(`[API Retry] Attempt ${retryCount} for ${error.config?.url}`, error.message);
      },
    });
  }

  // 添加熔断拦截器
  if (config.circuitBreaker?.enabled !== false) {
    instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const url = error.config?.url || 'unknown';
        
        try {
          // 执行带熔断的请求
          const result = await breakerManager.execute(url, async () => {
            throw error; // 让错误继续传播
          });
          return result as any;
        } catch (breakerError) {
          // 熔断器打开，返回友好错误
          if (breakerError instanceof Error && breakerError.message.includes('Circuit breaker')) {
            return Promise.reject(new Error('服务暂时不可用，请稍后重试'));
          }
          return Promise.reject(error);
        }
      }
    );
  }

  return instance;
}

/**
 * 使用熔断器执行函数
 */
export async function executeWithCircuitBreaker<T>(
  apiName: string,
  fn: () => Promise<T>
): Promise<T> {
  return breakerManager.execute(apiName, fn);
}

/**
 * 获取熔断器状态
 */
export function getCircuitBreakerStatus(): Record<string, any> {
  return breakerManager.getAllMetrics();
}

/**
 * 重置所有熔断器
 */
export function resetAllCircuitBreakers(): void {
  breakerManager.resetAll();
}

// 默认客户端实例
let _resilientClient: AxiosInstance | null = null;

export function getResilientClient(): AxiosInstance {
  if (!_resilientClient) {
    _resilientClient = createResilientClient();
  }
  return _resilientClient;
}
