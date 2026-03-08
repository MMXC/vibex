/**
 * ErrorClassifier - 错误分类器
 * 根据错误特征分类为 network/business/server/client/timeout
 */

import { AxiosError } from 'axios';
import { ErrorType, ErrorSeverity, ErrorConfig, ApiErrorResponse } from './types';

export class ErrorClassifier {
  /**
   * 判断是否为网络错误
   */
  static isNetworkError(error: unknown): boolean {
    if (error instanceof TypeError) {
      // 网络错误通常会导致 TypeError (如 "Failed to fetch")
      return error.message.includes('fetch') || error.message.includes('NetworkError');
    }
    
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('failed to fetch') ||
        message.includes('network request failed') ||
        message.includes('network error')
      );
    }
    
    return false;
  }

  /**
   * 判断是否为超时错误
   */
  static isTimeoutError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('timed out') ||
        message.includes('request timeout') ||
        message.includes('etimedout')
      );
    }
    
    if (error instanceof AxiosError) {
      return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    }
    
    return false;
  }

  /**
   * 判断是否为服务端错误 (5xx)
   */
  static isServerError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      return status !== undefined && status >= 500 && status < 600;
    }
    return false;
  }

  /**
   * 判断是否为客户端错误 (4xx)
   */
  static isClientError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      return status !== undefined && status >= 400 && status < 500;
    }
    return false;
  }

  /**
   * 判断是否为业务错误
   * 业务错误通常是 200 但 success=false 或有特定的错误码
   */
  static isBusinessError(error: unknown, response?: ApiErrorResponse): boolean {
    // 优先检查响应体中的业务错误标识
    if (response) {
      // 检查是否有 error 字段（后端约定的错误格式）
      if (response.error !== undefined) {
        return true;
      }
      // 检查是否有业务错误码
      if (response.code && response.code.startsWith('B')) {
        return true;
      }
    }
    
    // 通过 AxiosError 判断
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      // 4xx 客户端错误通常也是业务错误的一种
      return status !== undefined && status >= 400 && status < 500;
    }
    
    return false;
  }

  /**
   * 判断是否为可重试错误
   */
  static isRetryableError(error: unknown): boolean {
    // 网络错误可重试
    if (this.isNetworkError(error)) {
      return true;
    }
    
    // 超时可重试
    if (this.isTimeoutError(error)) {
      return true;
    }
    
    // 5xx 服务端错误可重试
    if (this.isServerError(error)) {
      return true;
    }
    
    // 429 Too Many Requests 可重试
    if (error instanceof AxiosError) {
      if (error.response?.status === 429) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 判断错误类型
   */
  static determineType(error: unknown, response?: ApiErrorResponse): ErrorType {
    if (this.isNetworkError(error)) {
      return 'network';
    }
    
    if (this.isTimeoutError(error)) {
      return 'timeout';
    }
    
    if (this.isBusinessError(error, response)) {
      return 'business';
    }
    
    if (this.isServerError(error)) {
      return 'server';
    }
    
    if (this.isClientError(error)) {
      return 'client';
    }
    
    return 'unknown';
  }

  /**
   * 判断错误严重程度
   */
  static determineSeverity(type: ErrorType, status?: number): ErrorSeverity {
    switch (type) {
      case 'network':
        return 'high';
      case 'timeout':
        return 'medium';
      case 'server':
        return 'critical';
      case 'client':
        if (status === 401 || status === 403) {
          return 'high';
        }
        return 'medium';
      case 'business':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * 分类错误
   */
  static classify(error: unknown, response?: ApiErrorResponse): {
    type: ErrorType;
    severity: ErrorSeverity;
    retryable: boolean;
  } {
    const type = this.determineType(error, response);
    const severity = this.determineSeverity(
      type,
      error instanceof AxiosError ? error.response?.status : undefined
    );
    const retryable = this.isRetryableError(error);
    
    return { type, severity, retryable };
  }
}
