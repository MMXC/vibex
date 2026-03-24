/**
 * API Handler Utilities
 * 
 * 提供简化的 API 调用包装器，用于替换 try-catch 模式
 */

import { ErrorConfig } from '@/lib/error';
import { defaultErrorMapper } from '@/lib/error/ErrorCodeMapper';

/**
 * API 错误处理器选项
 */
export interface ApiHandlerOptions {
  /** 错误回调 */
  onError?: (error: ErrorConfig) => void;
  /** 成功回调 */
  onSuccess?: (data: unknown) => void;
  /** 是否显示 Toast */
  showToast?: boolean;
  /** 自定义错误消息 */
  customErrorMessage?: string;
}

/**
 * 默认选项
 */
const defaultOptions: ApiHandlerOptions = {
  showToast: true,
};

/**
 * 处理 API 错误的辅助函数
 */
function handleApiError(err: unknown, options: ApiHandlerOptions): ErrorConfig {
  // 使用 ErrorCodeMapper 的 map 方法统一处理错误
  const axiosErr = err as { response?: { status?: number; data?: unknown }; code?: string; message?: string };
  const errorConfig = defaultErrorMapper.map(
    axiosErr,
    axiosErr.response?.data as undefined,
    axiosErr.response?.status
  );

  // 如果映射失败，使用默认错误
  const finalConfig = errorConfig || {
    code: 'E9999',
    type: 'UNKNOWN' as const,
    severity: 'high' as const,
    message: err instanceof Error ? err.message : '未知错误',
    userMessage: options.customErrorMessage || '操作失败',
    retryable: true,
  };

  // 调用错误回调
  options.onError?.(finalConfig);

  // 显示错误日志
  if (options.showToast && typeof window !== 'undefined') {
    console.error('API Error:', finalConfig.userMessage);
  }

  return finalConfig;
}

/**
 * 带错误处理的 API 调用包装器
 * 
 * @example
 * ```typescript
 * // 之前
 * try {
 *   const data = await apiService.getProjects();
 *   setProjects(data);
 * } catch (err) {
 *   setError(err instanceof Error ? err.message : '加载失败');
 * }
 * 
 * // 之后
 * const [error, setError] = useState<string>('');
 * await withErrorHandling(
 *   () => apiService.getProjects(),
 *   { onSuccess: setProjects, onError: (e) => setError(e.userMessage) }
 * );
 * ```
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  options: ApiHandlerOptions = defaultOptions
): Promise<{ success: boolean; data: T | null; error: ErrorConfig | null }> {
  try {
    const data = await apiCall();
    options.onSuccess?.(data);
    return { success: true, data, error: null };
  } catch (err) {
    const errorConfig = handleApiError(err, options);
    return { success: false, data: null, error: errorConfig };
  }
}

/**
 * 简化的 API 调用包装器，只返回数据或 null
 * 
 * @example
 * ```typescript
 * const data = await safeApiCall(() => apiService.getProjects(), '加载失败');
 * if (data) setProjects(data);
 * ```
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  errorMessage: string = '操作失败'
): Promise<T | null> {
  const result = await withErrorHandling(apiCall, {
    customErrorMessage: errorMessage,
  });
  return result.data;
}

export default { withErrorHandling, safeApiCall };
