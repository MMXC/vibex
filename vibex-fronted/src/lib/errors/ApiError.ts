/**
 * ApiError - API 错误类
 * 
 * 统一封装所有 API 错误信息
 */

import {
  ErrorCode,
  ErrorMessage,
  mapHttpStatusToCode,
  isRetryable
} from './ErrorCode';
import type { AxiosError } from 'axios';

/**
 * API 错误类
 * 统一封装所有 API 错误信息
 */
export class ApiError extends Error {
  /** 错误码 */
  readonly code: ErrorCode;
  
  /** HTTP 状态码 */
  readonly status: number;
  
  /** 原始错误数据 */
  readonly data?: unknown;
  
  /** 时间戳 */
  readonly timestamp: number;

  constructor(
    code: ErrorCode,
    message?: string,
    status: number = 0,
    data?: unknown
  ) {
    super(message || ErrorMessage[code]);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.data = data;
    this.timestamp = Date.now();
    
    // 保持原型链
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * 从 HTTP 错误创建 ApiError
   */
  static fromHttpStatus(status: number, message?: string, data?: unknown): ApiError {
    const code = mapHttpStatusToCode(status);
    return new ApiError(code, message, status, data);
  }

  /**
   * 创建网络错误
   */
  static networkError(message?: string): ApiError {
    return new ApiError(
      ErrorCode.NETWORK_ERROR,
      message || ErrorMessage[ErrorCode.NETWORK_ERROR]
    );
  }

  /**
   * 创建超时错误
   */
  static timeout(): ApiError {
    return new ApiError(ErrorCode.TIMEOUT, ErrorMessage[ErrorCode.TIMEOUT]);
  }

  /**
   * 创建认证错误
   */
  static unauthorized(message?: string): ApiError {
    return new ApiError(
      ErrorCode.UNAUTHORIZED,
      message || ErrorMessage[ErrorCode.UNAUTHORIZED]
    );
  }

  /**
   * 创建禁止访问错误
   */
  static forbidden(message?: string): ApiError {
    return new ApiError(
      ErrorCode.FORBIDDEN,
      message || ErrorMessage[ErrorCode.FORBIDDEN]
    );
  }

  /**
   * 创建资源不存在错误
   */
  static notFound(message?: string): ApiError {
    return new ApiError(
      ErrorCode.NOT_FOUND,
      message || ErrorMessage[ErrorCode.NOT_FOUND]
    );
  }

  /**
   * 创建验证错误
   */
  static validationError(message?: string): ApiError {
    return new ApiError(
      ErrorCode.VALIDATION_ERROR,
      message || ErrorMessage[ErrorCode.VALIDATION_ERROR]
    );
  }

  /**
   * 创建业务错误
   */
  static businessError(message?: string, data?: unknown): ApiError {
    return new ApiError(
      ErrorCode.BUSINESS_ERROR,
      message || ErrorMessage[ErrorCode.BUSINESS_ERROR],
      0,
      data
    );
  }

  /**
   * 是否可重试
   */
  get retryable(): boolean {
    return isRetryable(this.code);
  }

  /**
   * 是否是认证错误
   */
  get isAuthError(): boolean {
    return this.code === ErrorCode.UNAUTHORIZED || this.code === ErrorCode.FORBIDDEN;
  }

  /**
   * 转换为 JSON（用于日志/上报）
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      status: this.status,
      timestamp: this.timestamp,
      data: this.data,
    };
  }

  /**
   * 从未知错误创建 ApiError
   */
  static fromUnknown(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }
    
    if (error instanceof Error) {
      // 检查是否是 axios 错误
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // HTTP 响应错误
        const { status, data } = axiosError.response as { status: number; data: Record<string, unknown> };
        const message = String(data?.error || data?.message || (error as Error).message);
        return ApiError.fromHttpStatus(status, message, data);
      }
      
      if (axiosError.code === 'ECONNABORTED' || (error as Error).message.includes('timeout')) {
        return ApiError.timeout();
      }
      
      // 网络错误
      return ApiError.networkError((error as Error).message);
    }
    
    // 未知错误
    return ApiError.businessError(String(error));
  }
}
