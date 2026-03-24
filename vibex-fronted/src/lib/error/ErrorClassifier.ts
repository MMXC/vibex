/**
 * ErrorClassifier - 错误分类器
 * 根据错误特征分类为: NETWORK_ERROR | TIMEOUT | PARSE_ERROR | UNKNOWN
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
   * 判断是否为解析错误
   */
  static isParseError(error: unknown): boolean {
    if (error instanceof SyntaxError) return true;
    if (error instanceof TypeError) {
      const msg = error.message.toLowerCase();
      return msg.includes('json') || msg.includes('parse') || msg.includes('undefined is not an object');
    }
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return msg.includes('json') || msg.includes('unexpected token') || msg.includes('parse error');
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

    // 解析错误不可重试（数据格式问题）
    if (this.isParseError(error)) {
      return false;
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
   * 返回: NETWORK_ERROR | TIMEOUT | PARSE_ERROR | UNKNOWN
   */
  static determineType(error: unknown, response?: ApiErrorResponse): ErrorType {
    if (this.isParseError(error)) {
      return 'PARSE_ERROR';
    }

    if (this.isNetworkError(error)) {
      return 'NETWORK_ERROR';
    }

    if (this.isTimeoutError(error)) {
      return 'TIMEOUT';
    }

    // 其他错误类型 (4xx 客户端, 5xx 服务端, 业务错误等) 归为 UNKNOWN
    if (this.isServerError(error) || this.isClientError(error)) {
      return 'UNKNOWN';
    }

    return 'UNKNOWN';
  }

  /**
   * 判断错误严重程度
   */
  static determineSeverity(type: ErrorType, status?: number): ErrorSeverity {
    switch (type) {
      case 'NETWORK_ERROR':
        return 'high';
      case 'TIMEOUT':
        return 'medium';
      case 'PARSE_ERROR':
        return 'high';
      case 'UNKNOWN':
        if (status === 401 || status === 403) {
          return 'high';
        }
        if (status !== undefined && status >= 500) {
          return 'critical';
        }
        return status === undefined ? 'low' : 'medium';
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
