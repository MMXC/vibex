/**
 * error-mapper.ts — Maps API error codes to user-friendly Chinese messages.
 * E1-S1.3
 */

export interface ErrorMapping {
  code?: number;
  pattern?: RegExp;
  message: string;
}

const ERROR_MAPPINGS: ErrorMapping[] = [
  // 401 / 403
  { code: 401, message: '登录已过期，请重新登录' },
  { code: 403, message: '没有权限执行此操作' },

  // 404
  { code: 404, message: '请求的资源不存在' },

  // 409 — conflict
  { code: 409, message: '该资源已存在，操作冲突' },

  // 422 — validation
  { code: 422, message: '请求参数错误，请检查输入' },

  // 429 — rate limit
  { code: 429, message: '操作过于频繁，请稍后重试' },

  // 500
  { code: 500, message: '服务器错误，请稍后重试' },

  // 503
  { code: 503, message: '服务暂时不可用，请稍后重试' },

  // Pattern-based fallbacks
  { pattern: /email.*already.*exists/i, message: '该邮箱已被注册' },
  { pattern: /duplicate.*user/i, message: '用户名已存在' },
  { pattern: /network.*error/i, message: '网络连接失败，请检查网络' },
  { pattern: /timeout/i, message: '请求超时，请重试' },
];

/**
 * Get a user-friendly Chinese error message for an error.
 * @param error - Error object or string
 * @param fallback - Fallback message if no mapping found
 */
export function getErrorMessage(error: unknown, fallback = '操作失败，请稍后重试'): string {
  if (!error) return fallback;

  const errorStr = error instanceof Error ? error.message : String(error);
  const errorObj = error as { response?: { status?: number; data?: { error?: string; message?: string } }; status?: number };

  const status = errorObj?.response?.status || errorObj?.status;
  const dataMessage = errorObj?.response?.data?.error || errorObj?.response?.data?.message;

  // 1. Try HTTP status code
  if (status) {
    const mapping = ERROR_MAPPINGS.find((m) => m.code === status);
    if (mapping) return mapping.message;
  }

  // 2. Try data.message from API
  if (dataMessage) {
    const mapping = ERROR_MAPPINGS.find((m) => m.pattern?.test(dataMessage));
    if (mapping) return mapping.message;
  }

  // 3. Try matching error string against patterns
  for (const mapping of ERROR_MAPPINGS) {
    if (mapping.pattern && mapping.pattern.test(errorStr)) {
      return mapping.message;
    }
  }

  // 4. Return API message if available
  if (dataMessage) return dataMessage;

  return fallback;
}

/**
 * Format API error for logging — returns a safe string for canvasLogger.
 */
export function formatErrorForLog(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}
