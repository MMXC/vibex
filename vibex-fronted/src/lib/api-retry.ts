/**
 * API Retry Configuration
 * 
 * 使用 axios-retry 实现重试机制
 * 支持指数退避，网络错误重试、5xx 错误重试
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, isAxiosError } from 'axios';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

// 重试配置选项
export interface RetryOptions {
  /** 重试次数，默认 3 */
  retries?: number;
  /** 初始延迟（毫秒），默认 1000 */
  retryDelay?: number;
  /** 最大延迟（毫秒），默认 10000 */
  maxRetryDelay?: number;
  /** 是否使用指数退避，默认 true */
  exponentialBackoff?: boolean;
  /** 重试条件函数 */
  retryCondition?: (error: AxiosError) => boolean;
  /** 重试回调 */
  onRetry?: ((retryCount: number, error: AxiosError, requestConfig: AxiosRequestConfig) => void) | undefined;
}

/**
 * 判断是否应该重试
 */
function defaultRetryCondition(error: AxiosError): boolean {
  // 网络错误
  if (!error.response) {
    return true;
  }
  
  // 5xx 服务器错误
  const status = error.response.status;
  if (status >= 500 && status < 600) {
    return true;
  }
  
  // 429 Too Many Requests
  if (status === 429) {
    return true;
  }
  
  return false;
}

/**
 * 计算重试延迟（支持指数退避）
 */
function calculateDelay(
  retryCount: number,
  baseDelay: number,
  maxDelay: number,
  exponentialBackoff: boolean
): number {
  if (exponentialBackoff) {
    // 指数退避: baseDelay * 2^retryCount
    const delay = baseDelay * Math.pow(2, retryCount);
    return Math.min(delay, maxDelay);
  }
  // 线性退避
  return baseDelay;
}

/**
 * 为 axios 实例配置重试
 */
export async function configureAxiosRetry(
  axiosInstance: AxiosInstance,
  options: RetryOptions = {}
): Promise<void> {
  const {
    retries = 3,
    retryDelay = 1000,
    maxRetryDelay = 10000,
    exponentialBackoff = true,
    retryCondition = defaultRetryCondition,
    onRetry,
  } = options;

  // 动态导入 axios-retry
  let axiosRetry: any;
  try {
    const axiosRetryModule = await import('axios-retry');
    axiosRetry = axiosRetryModule.default || axiosRetryModule;
  } catch (err) {
    canvasLogger.default.error('Failed to load axios-retry:', err);
    return;
  }
  
  axiosRetry(axiosInstance, {
    retries,
    
    // 重试条件
    retryCondition: (error: AxiosError) => {
      // 不重试 POST 请求的 400 错误
      if (error.config?.method === 'post' && error.response?.status === 400) {
        return false;
      }
      return retryCondition(error);
    },
    
    // 重试延迟
    retryDelay: (retryCount: number, error: AxiosError) => {
      const delay = calculateDelay(
        retryCount,
        retryDelay,
        maxRetryDelay,
        exponentialBackoff
      );
      
      // 调用重试回调
      if (onRetry && error.config) {
        try {
          onRetry(retryCount, error, error.config);
        } catch (e) {
          // 忽略回调错误
        }
      }
      
      return delay;
    },
    
    // 额外选项
    shouldResetTimeout: true,
  });
}

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  retries: 3,
  retryDelay: 1000,
  maxRetryDelay: 10000,
  exponentialBackoff: true,
  retryCondition: defaultRetryCondition,
  onRetry: undefined,
};

/**
 * 创建带重试的 axios 实例
 */
export function createRetryableClient(baseURL: string, options?: RetryOptions): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });
  
  // 配置重试（不阻塞初始化）
  configureAxiosRetry(instance, options).catch((err) => {
    canvasLogger.default.error('Failed to configure retry:', err);
  });
  
  return instance;
}
