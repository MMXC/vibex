import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_CONFIG } from '@/lib/api-config';
import { configureAxiosRetry } from '@/lib/api-retry';
import { circuitBreakerManager } from '@/lib/circuit-breaker';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

// ==================== AuthError ====================

/**
 * AuthError — thrown when a 401 response is received.
 * Used by httpClient to distinguish auth failures from generic errors.
 * E1-S1.1
 */
export class AuthError extends Error {
  readonly isAuthError = true;
  readonly status: number;
  readonly returnTo: string;

  constructor(message: string, status: number, returnTo: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.returnTo = returnTo;
  }
}

// ==================== 接口定义 ====================

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

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  /** 每次请求前调用（用于日志/审计），E1-S1 */
  logRequest?: (config: AxiosRequestConfig) => void;
}

export interface HttpClient {
  readonly instance: AxiosInstance;
  /** API 调用指标（E1-S1） */
  readonly metrics: ApiMetrics;
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

// ==================== 内部工具 ====================

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)];
}

function calcPercentiles(window: number[]): Percentiles {
  const sorted = [...window].sort((a, b) => a - b);
  return {
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
  };
}

// ==================== 错误转换 ====================

export function transformError(error: AxiosError | Error): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    let message = '操作失败，请稍后重试';

    switch (status) {
      case 400:
        message = error.response?.data?.error || '请求参数错误';
        break;
      case 401:
        message = '登录已过期，请重新登录';
        break;
      case 403:
        message = '没有权限执行此操作';
        break;
      case 404:
        message = '请求的资源不存在';
        break;
      case 409:
        message = (error.response?.data?.error as string) || '该邮箱已被注册';
        break;
      case 500:
        message = '服务器错误，请稍后重试';
        break;
      default:
        message = error.response?.data?.error || '网络错误，请检查网络连接';
    }

    return new Error(message);
  }
  return error;
}

// ==================== 工厂函数 ====================

let _httpClient: HttpClient | null = null;

export function createHttpClient(config?: HttpClientConfig): HttpClient {
  if (_httpClient) {
    return _httpClient;
  }

  const baseURL = config?.baseURL || API_CONFIG.baseURL;
  const timeout = config?.timeout || 10000;
  const logRequest = config?.logRequest;

  const instance = axios.create({
    baseURL,
    timeout,
    headers: { 'Content-Type': 'application/json' },
  });

  // E1-S1: metrics 跟踪 — 1000 条滚动窗口
  const latencyWindow: number[] = [];
  const MAX_WINDOW = 1000;
  let requestCount = 0;
  let failureCount = 0;

  const metrics: ApiMetrics = {
    get requests() { return requestCount; },
    get failures() { return failureCount; },
    get latency() { return calcPercentiles(latencyWindow); },
  };

  // 配置重试机制（异步，不阻塞初始化）
  configureAxiosRetry(instance, {
    retries: 3,
    retryDelay: 1000,
    maxRetryDelay: 10000,
    exponentialBackoff: true,
    onRetry: (retryCount, error, requestConfig) => {
      canvasLogger.default.warn(`[API Retry] Attempt ${retryCount} for ${requestConfig.url}: ${error.message}`);
    },
  }).catch((err) => {
    canvasLogger.default.error('[API Client] Failed to configure retry:', err);
  });

  // 请求拦截器 - 添加认证token + E1-S1 logRequest
  if (instance.interceptors?.request) {
    instance.interceptors.request.use(
      (reqConfig: InternalAxiosRequestConfig) => {
        const token =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
            : null;
        if (token) {
          if (!reqConfig.headers) {
            reqConfig.headers = {} as InternalAxiosRequestConfig['headers'];
          }
          reqConfig.headers['Authorization'] = `Bearer ${token}`;
        }
        // E1-S1: logRequest 回调
        if (logRequest) {
          logRequest(reqConfig as AxiosRequestConfig);
        }
        return reqConfig;
      },
      (error: AxiosError) => Promise.reject(error)
    );
  }

  // 响应拦截器 - 统一错误处理 + E1-S1 metrics
  if (instance.interceptors?.response) {
    instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const ms = ((response.config as { metadata?: { startTime?: { getTime(): number } } }).metadata?.startTime?.getTime())
          ? Date.now() - ((response.config as { metadata?: { startTime?: { getTime(): number } } }).metadata!.startTime!.getTime())
          : 0;
        requestCount++;
        if (ms > 0) {
          latencyWindow.push(ms);
          if (latencyWindow.length > MAX_WINDOW) latencyWindow.shift();
        }
        return response;
      },
      (error: AxiosError) => {
        requestCount++;
        failureCount++;
        const ms = ((error.config as { metadata?: { startTime?: { getTime(): number } } })?.metadata?.startTime?.getTime())
          ? Date.now() - ((error.config as { metadata?: { startTime?: { getTime(): number } } })!.metadata!.startTime!.getTime())
          : 0;
        if (ms > 0) {
          latencyWindow.push(ms);
          if (latencyWindow.length > MAX_WINDOW) latencyWindow.shift();
        }
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            // Distinguish active logout from passive 401 — logout sets this flag
            const isLogoutAction = sessionStorage.getItem('auth_is_logout') === '1';
            if (!isLogoutAction) {
              const returnTo =
                window.location.pathname + window.location.search || '/dashboard';
              window.dispatchEvent(
                new CustomEvent('auth:401', { detail: { returnTo } })
              );
            } else {
              // Active logout: clear the flag and do NOT redirect
              sessionStorage.removeItem('auth_is_logout');
            }
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
          }
          const returnTo =
            typeof window !== 'undefined'
              ? window.location.pathname + window.location.search
              : '/dashboard';
          return Promise.reject(
            new AuthError('登录已过期，请重新登录', 401, returnTo)
          );
        }
        return Promise.reject(transformError(error));
      }
    );
  }

  _httpClient = {
    instance,
    metrics,
    get: <T>(url: string, config?: AxiosRequestConfig) =>
      instance.get<T>(url, config).then((r) => r.data),
    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      instance.post<T>(url, data, config).then((r) => r.data),
    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      instance.put<T>(url, data, config).then((r) => r.data),
    patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      instance.patch<T>(url, data, config).then((r) => r.data),
    delete: <T>(url: string, config?: AxiosRequestConfig) =>
      instance.delete<T>(url, config).then((r) => r.data),
  };

  return _httpClient;
}

// ==================== 单例导出 ====================

export const httpClient = createHttpClient();

// ==================== 熔断器保护调用 ====================

/**
 * 使用熔断器保护的 API 调用
 * 适用于关键 API 端点，防止级联故障
 */
export async function fetchWithCircuitBreaker<T>(
  apiName: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await circuitBreakerManager.execute(apiName, fn);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Circuit breaker')) {
      throw new Error('服务暂时不可用，请稍后重试');
    }
    throw error;
  }
}
