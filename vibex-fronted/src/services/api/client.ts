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

// ==================== 接口定义 ====================

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
}

export interface HttpClient {
  readonly instance: AxiosInstance;
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

// ==================== 工厂函数 ====================

let _httpClient: HttpClient | null = null;

export function createHttpClient(config?: HttpClientConfig): HttpClient {
  if (_httpClient) {
    return _httpClient;
  }

  const baseURL =
    config?.baseURL || API_CONFIG.baseURL;
  const timeout = config?.timeout || 10000;

  const instance = axios.create({
    baseURL,
    timeout,
    headers: { 'Content-Type': 'application/json' },
  });

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

  // 请求拦截器 - 添加认证token
  if (instance.interceptors?.request) {
    instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
            : null;
        if (token) {
          if (!config.headers) {
            config.headers = {} as InternalAxiosRequestConfig['headers'];
          }
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );
  }

  // 响应拦截器 - 统一错误处理
  if (instance.interceptors?.response) {
    instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
          }
        }
        return Promise.reject(transformError(error));
      }
    );
  }

  _httpClient = {
    instance,
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
      // 熔断状态，抛出友好提示
      throw new Error('服务暂时不可用，请稍后重试');
    }
    throw error;
  }
}
