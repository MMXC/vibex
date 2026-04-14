/**
 * api-error-handler.ts
 * 前端统一 API 错误处理
 *
 * Unit 10: E4 前端错误处理
 * 负责解析后端 apiError() 响应格式的全局错误处理
 *
 * 响应格式: { success: false, status: number, code: string, message: string }
 */

import type { AxiosError } from 'axios';
// eslint-disable-next-line @typescript-eslint/no-redeclare
import { AxiosError as AxiosErrorClass } from 'axios';

// ─── Error Types ─────────────────────────────────────────────────────────────

export interface ApiErrorPayload {
  success: false;
  status: number;
  code: string;
  message: string;
}

export function isApiErrorPayload(error: unknown): error is ApiErrorPayload {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    (error as ApiErrorPayload).success === false &&
    'code' in error &&
    'message' in error
  );
}

// ─── Error Code → User Message Mapping ──────────────────────────────────────

const ERROR_MESSAGES: Partial<Record<string, string>> = {
  VALIDATION_ERROR: '输入验证失败，请检查后重试',
  UNAUTHORIZED: '请重新登录',
  FORBIDDEN: '无权限访问此资源',
  NOT_FOUND: '请求的资源不存在',
  RATE_LIMITED: '请求过于频繁，请稍后重试',
  INTERNAL_ERROR: '服务器内部错误，请稍后重试',
  BAD_REQUEST: '请求格式错误',
  CONFLICT: '资源冲突，请刷新后重试',
};

/**
 * 获取用户友好的错误消息
 */
export function getErrorMessage(code: string, fallback: string): string {
  return ERROR_MESSAGES[code] ?? fallback;
}

// ─── Toast Handler ────────────────────────────────────────────────────────────

type ToastFn = (message: string, type?: 'error' | 'warning' | 'info') => void;
let globalToastFn: ToastFn | null = null;

/**
 * 注册全局 toast 函数（由 QueryProvider 调用）
 */
export function registerToastHandler(fn: ToastFn): void {
  globalToastFn = fn;
}

// ─── Error Handler ───────────────────────────────────────────────────────────

/**
 * 从 Axios 错误中提取 apiError payload
 */
export function extractApiError(error: unknown): ApiErrorPayload | null {
  if (error instanceof AxiosErrorClass && error.response?.data) {
    const data = error.response.data;
    if (isApiErrorPayload(data)) return data;
  }
  if (isApiErrorPayload(error)) return error;
  return null;
}

/**
 * 全局 mutation 错误处理器
 * 用法: mutations: { onError: mutationErrorHandler }
 *
 * Unit 10 Verification:
 * - API 错误显示 toast ✅
 * - 错误格式正确解析 ✅
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mutationErrorHandler(error: unknown, _vars?: any, _onMutateResult?: any, _context?: any): void {
  if (!globalToastFn) return;

  const apiError = extractApiError(error);

  if (apiError) {
    const userMessage = getErrorMessage(apiError.code, apiError.message);
    globalToastFn(userMessage, apiError.status >= 500 ? 'error' : 'warning');
  } else if (error instanceof AxiosErrorClass) {
    // 网络错误或其他 Axios 错误
    if (error.code === 'ECONNABORTED') {
      globalToastFn('请求超时，请检查网络后重试', 'warning');
    } else if (!error.response) {
      globalToastFn('网络连接失败，请检查网络', 'error');
    } else {
      globalToastFn('请求失败，请稍后重试', 'error');
    }
  } else {
    globalToastFn('发生未知错误，请稍后重试', 'error');
  }
}

/**
 * 通用错误处理 Hook 返回值
 * 用于在组件中处理错误
 */
export function useApiError() {
  return {
    handleError: mutationErrorHandler,
    extractApiError,
    isApiErrorPayload,
    getErrorMessage,
  };
}
