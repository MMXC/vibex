/**
 * Error Classifier - API 错误分类器
 * 
 * 根据错误特征分类错误类型，判断严重程度
 * 
 * 错误类型:
 * - network: 网络连接失败、DNS 解析失败等
 * - timeout: 请求超时
 * - server: 5xx 服务端错误
 * - client: 4xx 客户端错误
 * - business: 业务逻辑错误
 * 
 * 严重程度:
 * - critical: 需要立即处理 (网络错误，服务端错误)
 * - warning: 需要关注但可继续 (客户端错误)
 * - info: 提示信息 (业务错误)
 * 
 * Usage:
 * const { type, severity, message } = classifyError(error)
 */

// 错误类型
export type ErrorType = 'network' | 'timeout' | 'server' | 'client' | 'business' | 'unknown';

// 严重程度
export type ErrorSeverity = 'critical' | 'warning' | 'info';

// 错误分类结果
export interface ClassifiedError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  status?: number;
  recoverable: boolean;
  retryable: boolean;
}

// HTTP 状态码映射
const STATUS_CODES: Record<number, { type: ErrorType; message: string }> = {
  // 客户端错误 (4xx)
  400: { type: 'client', message: '请求参数错误' },
  401: { type: 'client', message: '登录已过期，请重新登录' },
  403: { type: 'client', message: '无权限执行此操作' },
  404: { type: 'client', message: '请求的资源不存在' },
  409: { type: 'business', message: '资源冲突' },
  422: { type: 'client', message: '请求数据验证失败' },
  429: { type: 'server', message: '请求过于频繁，请稍后重试' },
  
  // 服务端错误 (5xx)
  500: { type: 'server', message: '服务异常，请稍后重试' },
  502: { type: 'server', message: '服务网关错误' },
  503: { type: 'server', message: '服务暂时不可用' },
  504: { type: 'server', message: '服务响应超时' },
};

// 业务错误码映射
const BUSINESS_ERROR_CODES: Record<string, { message: string; severity: ErrorSeverity }> = {
  'PROJECT_001': { message: '项目创建失败', severity: 'warning' },
  'PROJECT_002': { message: '项目不存在', severity: 'warning' },
  'PROJECT_003': { message: '无权限访问该项目', severity: 'warning' },
  'USER_001': { message: '用户不存在', severity: 'warning' },
  'USER_002': { message: '邮箱已被注册', severity: 'warning' },
  'AUTH_001': { message: '登录凭证已过期', severity: 'warning' },
  'AUTH_002': { message: '用户名或密码错误', severity: 'warning' },
  'AUTH_003': { message: '账号已被禁用', severity: 'critical' },
  'COMMON_001': { message: '操作过于频繁', severity: 'info' },
  'COMMON_002': { message: '请求参数无效', severity: 'warning' },
};

// 检查是否为 axios 错误
function isAxiosError(error: unknown): error is { isAxiosError: boolean; response?: { status?: number; data?: unknown }; code?: string; message: string } {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}

// 检查是否为 fetch Response
function isResponse(error: unknown): error is Response {
  return typeof error === 'object' && error !== null && 'status' in error && 'json' in error;
}

/**
 * 判断错误是否为网络错误
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return error.message.includes('fetch') || 
           error.message.includes('Network') ||
           error.message.includes('Failed to fetch');
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') ||
           message.includes('dns') ||
           message.includes('connection') ||
           message.includes('econnrefused') ||
           message.includes('enotfound');
  }
  
  return false;
}

/**
 * 判断错误是否为超时错误
 */
function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('timeout') ||
           message.includes('timed out') ||
           message.includes('etimedout');
  }
  
  // Check if it's an AbortError (fetch aborted due to timeout)
  if (error instanceof DOMException) {
    return error.name === 'AbortError' && error.message.includes('timeout');
  }
  
  return false;
}

/**
 * 从错误响应中提取业务错误码
 */
function extractBusinessCode(error: unknown): string | undefined {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      return (data as Record<string, unknown>).code as string || 
             (data as Record<string, unknown>).errorCode as string ||
             (data as Record<string, unknown>).error_code as string;
    }
  }
  
  return undefined;
}

/**
 * 分类错误
 */
export function classifyError(error: unknown): ClassifiedError {
  // Handle axios errors
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const statusInfo = status ? STATUS_CODES[status] : null;
    
    if (status) {
      // Known HTTP status code
      if (statusInfo) {
        return {
          type: statusInfo.type,
          severity: getSeverity(statusInfo.type),
          message: statusInfo.message,
          status,
          recoverable: statusInfo.type !== 'server',
          retryable: statusInfo.type === 'server' || statusInfo.type === 'timeout',
        };
      }
      
      // Unknown status code - categorize by range
      if (status >= 500) {
        return {
          type: 'server',
          severity: 'critical',
          message: '服务异常，请稍后重试',
          status,
          recoverable: true,
          retryable: true,
        };
      }
      
      if (status >= 400) {
        // Check for business error code
        const code = extractBusinessCode(error);
        if (code && BUSINESS_ERROR_CODES[code]) {
          const bizError = BUSINESS_ERROR_CODES[code];
          return {
            type: 'business',
            severity: bizError.severity,
            message: bizError.message,
            code,
            status,
            recoverable: true,
            retryable: false,
          };
        }
        
        return {
          type: 'client',
          severity: 'warning',
          message: (error.response?.data as Record<string, unknown>)?.message as string || '请求失败',
          status,
          recoverable: true,
          retryable: false,
        };
      }
    }
    
    // Network error (no response)
    if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
      return {
        type: 'timeout',
        severity: 'critical',
        message: '请求超时，请稍后重试',
        recoverable: true,
        retryable: true,
      };
    }
    
    if (error.code === 'ERR_NETWORK' || error.message.toLowerCase().includes('network')) {
      return {
        type: 'network',
        severity: 'critical',
        message: '网络连接失败，请检查网络',
        recoverable: true,
        retryable: true,
      };
    }
  }
  
  // Handle fetch Response errors
  if (isResponse(error)) {
    const status = error.status;
    const statusInfo = status ? STATUS_CODES[status] : null;
    
    if (statusInfo) {
      return {
        type: statusInfo.type,
        severity: getSeverity(statusInfo.type),
        message: statusInfo.message,
        status,
        recoverable: statusInfo.type !== 'server',
        retryable: statusInfo.type === 'server',
      };
    }
    
    if (status >= 500) {
      return {
        type: 'server',
        severity: 'critical',
        message: '服务异常，请稍后重试',
        status,
        recoverable: true,
        retryable: true,
      };
    }
    
    return {
      type: 'client',
      severity: 'warning',
      message: '请求失败',
      status,
      recoverable: true,
      retryable: false,
    };
  }
  
  // Handle native errors
  if (isNetworkError(error)) {
    return {
      type: 'network',
      severity: 'critical',
      message: '网络连接失败，请检查网络',
      recoverable: true,
      retryable: true,
    };
  }
  
  if (isTimeoutError(error)) {
    return {
      type: 'timeout',
      severity: 'critical',
      message: '请求超时，请稍后重试',
      recoverable: true,
      retryable: true,
    };
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    return {
      type: 'unknown',
      severity: 'warning',
      message: error.message || '发生未知错误',
      recoverable: true,
      retryable: false,
    };
  }
  
  // Fallback
  return {
    type: 'unknown',
    severity: 'warning',
    message: '发生未知错误',
    recoverable: true,
    retryable: false,
  };
}

/**
 * 根据错误类型获取严重程度
 */
function getSeverity(type: ErrorType): ErrorSeverity {
  switch (type) {
    case 'network':
    case 'timeout':
    case 'server':
      return 'critical';
    case 'client':
      return 'warning';
    case 'business':
    case 'unknown':
    default:
      return 'info';
  }
}

/**
 * 判断错误是否可重试
 */
export function isRetryable(error: unknown): boolean {
  const classified = classifyError(error);
  return classified.retryable;
}

/**
 * 判断错误是否需要用户立即处理
 */
export function isCritical(error: unknown): boolean {
  const classified = classifyError(error);
  return classified.severity === 'critical';
}

/**
 * 获取错误对应的用户提示
 */
export function getUserMessage(error: unknown): string {
  const classified = classifyError(error);
  return classified.message;
}

export default classifyError;
