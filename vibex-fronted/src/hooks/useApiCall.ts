/**
 * useApiCall - 统一 API 调用 Hook
 * 
 * 提供统一的 API 调用封装，支持：
 * - React Query 集成 (useMutation)
 * - 自动重试机制（指数退避）
 * - 错误提示（Toast）
 * - 类型安全
 * - Loading 状态管理
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorConfig, ErrorMiddlewareOptions, ApiErrorResponse } from '@/types/error';
import { defaultErrorMapper } from '@/lib/error/ErrorCodeMapper';
import { defaultRetryHandler } from '@/lib/error/RetryHandler';
import { useToast } from '@/components/ui/Toast';

/** Dev-only logger */
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args);
};

export interface UseApiCallOptions<TArgs extends unknown[], TData> {
  /** API 调用函数 */
  apiFn: (...args: TArgs) => Promise<TData>;
  /** 调用成功回调 */
  onSuccess?: (data: TData) => void;
  /** 调用失败回调 */
  onError?: (error: ErrorConfig) => void;
  /** 重试次数（默认3次） */
  retryCount?: number;
  /** 是否启用重试（默认true） */
  enableRetry?: boolean;
  /** 初始重试延迟（ms，默认1000） */
  retryDelay?: number;
  /** 是否显示错误 Toast（默认true） */
  showToast?: boolean;
  /** 自定义错误映射 */
  customErrorMapper?: (error: unknown) => ErrorConfig | null;
  /** 突变键（用于缓存管理） */
  mutationKey?: unknown[];
  /** 缓存失效查询键 */
  invalidateQueries?: unknown[];
}

export interface UseApiCallReturn<TData> {
  /** 返回数据 */
  data: TData | null;
  /** 是否加载中 */
  loading: boolean;
  /** 错误信息 */
  error: ErrorConfig | null;
  /** 执行 API 调用 */
  execute: (...args: unknown[]) => Promise<TData | null>;
  /** 重置状态 */
  reset: () => void;
  /** 直接设置数据（用于测试或手动更新） */
  setData: (data: TData) => void;
  /** React Query mutation 状态 */
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  isLoading: boolean;
  /** 重试执行 */
  retry: () => void;
}

/**
 * 统一的 API 调用 Hook (React Query 集成版)
 * 
 * @example
 * ```typescript
 * const { data, loading, error, execute } = useApiCall({
 *   apiFn: () => fetchProjects(),
 *   onSuccess: (data) => console.log('Success:', data),
 *   retryCount: 3,
 *   showToast: true,
 *   mutationKey: ['projects'],
 *   invalidateQueries: [['projects']]
 * });
 * 
 * // 在组件中调用
 * const handleFetch = async () => {
 *   const result = await execute();
 * };
 * ```
 */
export function useApiCall<TArgs extends unknown[], TData>(
  options: UseApiCallOptions<TArgs, TData>
): UseApiCallReturn<TData> {
  const {
    apiFn,
    onSuccess,
    onError,
    retryCount = 3,
    enableRetry = true,
    retryDelay = 1000,
    showToast = true,
    customErrorMapper,
    mutationKey,
    invalidateQueries,
  } = options;

  const queryClient = useQueryClient();
  const { showToast: showToastFn } = useToast();
  
  // 内部状态 - 用于向后兼容
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<ErrorConfig | null>(null);

  // 将未知错误转换为 ErrorConfig
  const transformError = useCallback(
    (err: unknown): ErrorConfig => {
      // 如果有自定义错误映射器，先尝试使用
      if (customErrorMapper) {
        const mapped = customErrorMapper(err);
        if (mapped) return mapped;
      }

      // 检查是否是 Axios 错误
      if (isAxiosError(err)) {
        // 使用 map 方法统一处理错误
        const errorConfig = defaultErrorMapper.map(err, err.response?.data, err.response?.status);
        return errorConfig;
      }

      // 原生 Error
      if (err instanceof Error) {
        // 网络错误检测
        if (err.name === 'AbortError' || err.message.includes('timeout')) {
          return defaultErrorMapper.map(new Error('timeout'), undefined, 408);
        }
        // 其他错误
        return {
          code: 'E9999',
          type: 'UNKNOWN',
          severity: 'high',
          message: err.message,
          userMessage: '操作失败，请稍后重试',
          retryable: true,
        };
      }

      // 默认未知错误
      return {
        code: 'E9999',
        type: 'UNKNOWN',
        severity: 'high',
        message: '未知错误',
        userMessage: '操作失败，请稍后重试',
        retryable: true,
      };
    },
    [customErrorMapper]
  );

  // 使用 React Query useMutation
  const mutation = useMutation<TData, Error, TArgs[0] | undefined>({
    mutationFn: async (vars) => {
      // Convert single variable to args tuple
      const args = vars !== undefined ? [vars] as TArgs : ([] as unknown as TArgs);
      
      if (enableRetry) {
        // 使用重试机制
        const result = await defaultRetryHandler.execute<TData>(
          async () => apiFn(...args),
          {
            maxRetries: retryCount,
            baseDelay: retryDelay,
            onRetry: (attempt, maxRetries) => {
              devLog(`重试 ${attempt}/${maxRetries}`);
            },
          }
        );
        return result;
      } else {
        // 直接调用
        return apiFn(...args);
      }
    },
    mutationKey: mutationKey ? [mutationKey] : undefined,
    onSuccess: (data) => {
      setData(data);
      onSuccess?.(data);
      
      // 缓存失效
      if (invalidateQueries) {
        invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: queryKey as unknown[] });
        });
      }
    },
    onError: (err: Error) => {
      const errorConfig = transformError(err);
      setError(errorConfig);
      onError?.(errorConfig);

      // 显示错误 Toast
      if (showToast && typeof window !== 'undefined') {
        console.error('API Error:', errorConfig.userMessage);
        showToastFn(errorConfig.userMessage || '操作失败，请稍后重试', 'error');
      }
    },
    retry: enableRetry ? retryCount : false,
    retryDelay,
  });

  // 执行 API 调用 - 包装 mutation 的 mutate
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const execute = useCallback(
    async (...args: any[]): Promise<TData | null> => {
      try {
        await mutation.mutateAsync(args[0]);
        return mutation.data || null;
      } catch (err) {
        return null;
      }
    },
    [mutation]
  );

  // 重置状态
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    mutation.reset();
  }, [mutation]);

  // 直接设置数据
  const setDataDirect = useCallback((newData: TData) => {
    setData(newData);
  }, []);

  // 重试
  const retry = useCallback(() => {
    if (mutation.failureCount > 0) {
      mutation.reset();
    }
  }, [mutation]);

  return {
    data: mutation.data ?? data,
    loading: mutation.isPending,
    error: mutation.error ? transformError(mutation.error) : error,
    execute,
    reset,
    setData: setDataDirect,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    isLoading: mutation.isPending,
    retry,
  };
}

// 辅助函数：检查是否是 Axios 错误
function isAxiosError(err: unknown): err is {
  isAxiosError: boolean;
  response?: {
    status?: number;
    data?: ApiErrorResponse;
  };
  message?: string;
  code?: string;
} {
  return (
    typeof err === 'object' &&
    err !== null &&
    'isAxiosError' in err
  );
}

/**
 * useApiCallWithToast - 带 Toast 提示的 API 调用 Hook
 * 
 * useApiCall 的封装，自动显示错误 Toast
 * 
 * @example
 * ```typescript
 * const { data, loading, error, execute } = useApiCallWithToast({
 *   apiFn: () => fetchProjects(),
 *   showToast: true
 * });
 * ```
 */
export function useApiCallWithToast<TArgs extends unknown[], TData>(
  options: UseApiCallOptions<TArgs, TData>
): UseApiCallReturn<TData> {
  const { showToast: _, ...restOptions } = options;
  const { showToast } = useToast();
  
  const apiCall = useApiCall<TArgs, TData>({
    ...restOptions,
    showToast: options.showToast ?? true,
    onError: (error) => {
      // 调用自定义 onError
      options.onError?.(error);
      
      // 显示 Toast
      if (options.showToast !== false) {
        // 根据错误类型映射 toast variant
        const toastType = mapErrorToToastType(error);
        showToast(error.userMessage || '操作失败，请稍后重试', toastType);
      }
    },
  });
  
  return apiCall;
}

// 错误类型到 Toast 类型的映射
function mapErrorToToastType(error: ErrorConfig): 'success' | 'error' | 'warning' | 'info' {
  switch (error.type) {
    case 'NETWORK_ERROR':
    case 'UNKNOWN':
      return 'error';
    case 'TIMEOUT':
      return 'warning';
    default:
      return 'error';
  }
}

export default useApiCall;
