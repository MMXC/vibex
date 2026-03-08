/**
 * Error Middleware Core - 错误中间件核心
 * 
 * 包装 fetch 请求，整合分类器、映射器、重试器
 * 支持 Toast 显示错误信息
 * 
 * Usage:
 * const { request, get, post, put, delete } = createErrorMiddleware()
 * 
 * // 基本使用
 * const response = await get('/api/users')
 * 
 * // 带重试
 * const response = await request('/api/data', { retry: true })
 * 
 * // 自定义配置
 * const api = createErrorMiddleware({
 *   baseURL: '/api',
 *   onError: (error) => toast.error(error.message)
 * })
 */

import { classifyError, getUserMessage, isCritical } from './ErrorClassifier';
import { ErrorCodeMapper } from './ErrorCodeMapper';
import { RetryHandler, RetryOptions } from './RetryHandler';

// Toast 显示函数类型 (可注入)
export type ToastFunction = (message: string, type?: 'error' | 'warning' | 'info') => void;

// 中间件配置
export interface ErrorMiddlewareOptions {
  /** 基础 URL */
  baseURL?: string;
  /** 默认请求头 */
  headers?: Record<string, string>;
  /** 错误码映射器 */
  errorMapper?: ErrorCodeMapper;
  /** Toast 显示函数 */
  toast?: ToastFunction;
  /** 是否默认显示 Toast */
  showToast?: boolean;
  /** 默认重试配置 */
  defaultRetry?: RetryOptions;
  /** 请求拦截器 */
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  /** 响应拦截器 */
  onResponse?: (response: Response) => Response | Promise<Response>;
  /** 错误拦截器 */
  onError?: (error: MappedError) => void | Promise<void>;
  /** 开发模式 */
  dev?: boolean;
}

// 请求配置
export interface RequestConfig extends RequestInit {
  /** 请求 URL */
  url: string;
  /** 基础 URL */
  baseURL?: string;
  /** 重试 */
  retry?: boolean | RetryOptions;
  /** 不显示 Toast */
  silent?: boolean;
  /** 自定义错误处理 */
  onError?: (error: MappedError) => void;
  /** 超时 (ms) */
  timeout?: number;
}

// 映射后的错误
export interface MappedError {
  code: string;
  message: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  status?: number;
  hint?: string;
  recoverable: boolean;
}

// 请求结果
export interface RequestResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: MappedError;
  response?: Response;
}

// 全局配置
let globalOptions: ErrorMiddlewareOptions = {
  showToast: true,
  dev: process.env.NODE_ENV === 'development',
};

let globalErrorMapper: ErrorCodeMapper;

/**
 * 创建错误中间件
 */
export function createErrorMiddleware(options: ErrorMiddlewareOptions = {}): {
  request: <T = unknown>(config: RequestConfig) => Promise<RequestResult<T>>;
  get: <T = unknown>(url: string, config?: RequestConfig) => Promise<RequestResult<T>>;
  post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<RequestResult<T>>;
  put: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<RequestResult<T>>;
  patch: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<RequestResult<T>>;
  delete: <T = unknown>(url: string, config?: RequestConfig) => Promise<RequestResult<T>>;
  setBaseURL: (url: string) => void;
  setToken: (token: string) => void;
} {
  const errorMapper = options.errorMapper || new ErrorCodeMapper();
  globalErrorMapper = errorMapper;
  
  let baseURL = options.baseURL || '';
  let authToken: string | undefined;

  // 显示 Toast
  const showToast = (error: MappedError) => {
    if (options.toast && options.showToast !== false) {
      options.toast(error.message, error.severity === 'critical' ? 'error' : 'warning');
    }
  };

  // 处理错误
  const handleError = async (error: unknown, config: RequestConfig): Promise<MappedError> => {
    // 分类错误
    const classified = classifyError(error);
    
    // 映射错误码
    const mapped = errorMapper.map(error);
    
    // 触发错误回调
    if (config.onError) {
      await config.onError(mapped);
    }
    
    if (options.onError) {
      await options.onError(mapped);
    }
    
    // 显示 Toast
    if (!config.silent) {
      showToast(mapped);
    }
    
    // 开发模式打印详细信息
    if (options.dev) {
      console.error('[ErrorMiddleware]', {
        classified,
        mapped,
        config,
      });
    }
    
    return mapped;
  };

  // 执行请求
  const request = async <T = unknown>(config: RequestConfig): Promise<RequestResult<T>> => {
    // 合并配置
    const mergedConfig: RequestConfig = {
      ...config,
      headers: {
        ...options.headers,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...config.headers,
      },
    };

    // 请求拦截器
    let finalConfig = mergedConfig;
    if (options.onRequest) {
      finalConfig = await options.onRequest(mergedConfig) || mergedConfig;
    }

    // 构建 URL
    const url = finalConfig.baseURL || baseURL
      ? `${finalConfig.baseURL || baseURL}${finalConfig.url}`
      : finalConfig.url;

    // 处理超时
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout>;
    if (finalConfig.timeout) {
      timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);
    }

    try {
      // 确定是否重试
      const shouldRetry = finalConfig.retry;
      const retryOptions = typeof shouldRetry === 'object' ? shouldRetry : undefined;

      // 执行请求 (带重试)
      if (shouldRetry) {
        const retryHandler = new RetryHandler({
          ...options.defaultRetry,
          ...retryOptions,
          shouldRetry: () => true, // 由 fetch 判断
        });

        const result = await retryHandler.execute(async () => {
          const response = await fetch(url, {
            ...finalConfig,
            signal: controller.signal,
          });

          // 响应拦截器
          if (options.onResponse) {
            return await options.onResponse(response);
          }

          // 检查响应状态
          if (!response.ok) {
            throw response;
          }

          return response;
        });

        clearTimeout(timeoutId);

        if (!result.success) {
          const error = await handleError(result.lastError || result.error || new Error('Request failed'), finalConfig);
          return { success: false, error };
        }

        const response = result.data as Response;
        
        // 解析响应数据
        let data: T;
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text() as unknown as T;
        }

        return { success: true, data, response };
      }

      // 不重试
      const response = await fetch(url, {
        ...finalConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 响应拦截器
      const finalResponse = options.onResponse ? await options.onResponse(response) : response;

      // 检查响应状态
      if (!finalResponse.ok) {
        const error = await handleError(finalResponse, finalConfig);
        return { success: false, error };
      }

      // 解析响应数据
      let data: T;
      const contentType = finalResponse.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await finalResponse.json();
      } else {
        data = await finalResponse.text() as unknown as T;
      }

      return { success: true, data, response: finalResponse };

    } catch (error) {
      clearTimeout(timeoutId);
      
      // 处理错误
      const mappedError = await handleError(error, finalConfig);
      return { success: false, error: mappedError };
    }
  };

  // GET 请求
  const get = <T = unknown>(url: string, config?: RequestConfig): Promise<RequestResult<T>> => {
    return request<T>({ url, method: 'GET', ...config });
  };

  // POST 请求
  const post = <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<RequestResult<T>> => {
    return request<T>({
      url,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: { 'Content-Type': 'application/json', ...config?.headers },
      ...config,
    });
  };

  // PUT 请求
  const put = <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<RequestResult<T>> => {
    return request<T>({
      url,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: { 'Content-Type': 'application/json', ...config?.headers },
      ...config,
    });
  };

  // PATCH 请求
  const patch = <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<RequestResult<T>> => {
    return request<T>({
      url,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      headers: { 'Content-Type': 'application/json', ...config?.headers },
      ...config,
    });
  };

  // DELETE 请求
  const deleteRequest = <T = unknown>(url: string, config?: RequestConfig): Promise<RequestResult<T>> => {
    return request<T>({ url, method: 'DELETE', ...config });
  };

  // 设置基础 URL
  const setBaseURL = (url: string) => {
    baseURL = url;
  };

  // 设置 Token
  const setToken = (token: string) => {
    authToken = token;
  };

  return {
    request,
    get,
    post,
    put,
    patch,
    delete: deleteRequest,
    setBaseURL,
    setToken,
  };
}

/**
 * 设置全局配置
 */
export function setGlobalOptions(options: ErrorMiddlewareOptions): void {
  globalOptions = { ...globalOptions, ...options };
}

/**
 * 获取全局错误映射器
 */
export function getGlobalErrorMapper(): ErrorCodeMapper | undefined {
  return globalErrorMapper;
}

/**
 * 创建默认中间件实例
 */
export const errorMiddleware = createErrorMiddleware();

// 导出便捷函数
export const {
  request,
  get,
  post,
  put,
  patch,
  delete: deleteRequest,
  setBaseURL,
  setToken,
} = errorMiddleware;

export default createErrorMiddleware;
