/**
 * ErrorCode - API 错误码枚举
 * 
 * 统一管理所有 API 错误类型
 */

/**
 * API 错误码枚举
 * 覆盖所有可能的错误类型
 */
export enum ErrorCode {
  // 网络层错误
  NETWORK_ERROR = 'NETWORK_ERROR',     // 网络连接失败
  TIMEOUT = 'TIMEOUT',                 // 请求超时
  
  // 认证授权错误
  UNAUTHORIZED = 'UNAUTHORIZED',       // 未登录/登录过期
  FORBIDDEN = 'FORBIDDEN',           // 无权限
  
  // 资源错误
  NOT_FOUND = 'NOT_FOUND',             // 资源不存在
  
  // 服务端错误
  SERVER_ERROR = 'SERVER_ERROR',       // 服务器内部错误
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE', // 服务不可用
  
  // 业务错误
  VALIDATION_ERROR = 'VALIDATION_ERROR', // 参数验证失败
  RATE_LIMIT = 'RATE_LIMIT',           // 请求频率限制
  BUSINESS_ERROR = 'BUSINESS_ERROR',   // 业务逻辑错误
}

/**
 * 错误码对应的用户友好提示
 */
export const ErrorMessage: Record<ErrorCode, string> = {
  [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络',
  [ErrorCode.TIMEOUT]: '请求超时，请重试',
  [ErrorCode.UNAUTHORIZED]: '登录已过期，请重新登录',
  [ErrorCode.FORBIDDEN]: '没有权限执行此操作',
  [ErrorCode.NOT_FOUND]: '请求的资源不存在',
  [ErrorCode.SERVER_ERROR]: '服务器错误，请稍后重试',
  [ErrorCode.SERVICE_UNAVAILABLE]: '服务暂时不可用，请稍后',
  [ErrorCode.VALIDATION_ERROR]: '输入信息有误，请检查',
  [ErrorCode.RATE_LIMIT]: '操作过于频繁，请稍后',
  [ErrorCode.BUSINESS_ERROR]: '操作失败，请重试',
};

/**
 * 判断错误是否可重试
 */
export function isRetryable(code: ErrorCode): boolean {
  const retryableCodes: ErrorCode[] = [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TIMEOUT,
    ErrorCode.SERVER_ERROR,
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.RATE_LIMIT,
  ];
  return retryableCodes.includes(code);
}

/**
 * HTTP 状态码到 ErrorCode 的映射
 */
export function mapHttpStatusToCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.VALIDATION_ERROR;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 408:
      return ErrorCode.TIMEOUT;
    case 429:
      return ErrorCode.RATE_LIMIT;
    case 500:
    case 501:
      return ErrorCode.SERVER_ERROR;
    case 502:
    case 503:
    case 504:
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      return ErrorCode.BUSINESS_ERROR;
  }
}
