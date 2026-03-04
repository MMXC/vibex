/**
 * VibeX API Error Types
 * 统一错误类型定义
 */

export type ErrorType = 'network' | 'business' | 'server' | 'client' | 'timeout' | 'unknown';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorConfig {
  code: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  retryable: boolean;
}

export interface ErrorMiddlewareOptions {
  /** 是否显示 Toast 提示 */
  showToast?: boolean;
  /** 最大重试次数 */
  retryCount?: number;
  /** 自定义错误回调 */
  onError?: (error: ErrorConfig) => void;
  /** 自定义错误码映射 */
  customMappings?: Record<string, ErrorConfig>;
  /** 是否启用重试 */
  enableRetry?: boolean;
  /** 重试延迟基数 (ms) */
  retryDelay?: number;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

// 默认错误码映射表
export const DEFAULT_ERROR_MAPPINGS: Record<string, ErrorConfig> = {
  // 网络错误
  'E1001': {
    code: 'E1001',
    type: 'network',
    severity: 'high',
    message: '网络连接失败',
    userMessage: '网络连接失败，请检查网络',
    retryable: true,
  },
  'E1002': {
    code: 'E1002',
    type: 'timeout',
    severity: 'medium',
    message: '请求超时',
    userMessage: '请求超时，请稍后重试',
    retryable: true,
  },
  // 服务端错误
  'E1003': {
    code: 'E1003',
    type: 'server',
    severity: 'critical',
    message: '服务端错误',
    userMessage: '服务异常，请稍后重试',
    retryable: true,
  },
  // 客户端错误 (4xx)
  'E1004': {
    code: 'E1004',
    type: 'client',
    severity: 'high',
    message: '未授权',
    userMessage: '登录已过期，请重新登录',
    retryable: false,
  },
  'E1005': {
    code: 'E1005',
    type: 'client',
    severity: 'high',
    message: '禁止访问',
    userMessage: '无权限执行此操作',
    retryable: false,
  },
  'E1006': {
    code: 'E1006',
    type: 'client',
    severity: 'medium',
    message: '资源不存在',
    userMessage: '请求的资源不存在',
    retryable: false,
  },
  // 业务错误
  'B2001': {
    code: 'B2001',
    type: 'business',
    severity: 'medium',
    message: '项目创建失败',
    userMessage: '创建项目失败，请重试',
    retryable: true,
  },
  'B2002': {
    code: 'B2002',
    type: 'business',
    severity: 'medium',
    message: '项目不存在',
    userMessage: '项目不存在或已被删除',
    retryable: false,
  },
  'B2003': {
    code: 'B2003',
    type: 'business',
    severity: 'medium',
    message: '需求创建失败',
    userMessage: '创建需求失败，请重试',
    retryable: true,
  },
  'B2004': {
    code: 'B2004',
    type: 'business',
    severity: 'medium',
    message: 'AI 生成失败',
    userMessage: 'AI 生成失败，请重试',
    retryable: true,
  },
};

// HTTP 状态码到错误码的映射
export const HTTP_STATUS_TO_ERROR_CODE: Record<number, string> = {
  400: 'E1007',
  401: 'E1004',
  403: 'E1005',
  404: 'E1006',
  408: 'E1002',
  429: 'E1001',
  500: 'E1003',
  502: 'E1003',
  503: 'E1003',
  504: 'E1002',
};
