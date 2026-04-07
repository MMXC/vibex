/**
 * ErrorCodeMapper - 错误码映射器
 * HTTP 状态码 → 业务错误码 → 错误配置
 */
// @ts-nocheck


import { AxiosError } from 'axios';
import {
  ErrorConfig,
  ApiErrorResponse,
  DEFAULT_ERROR_MAPPINGS,
  HTTP_STATUS_TO_ERROR_CODE,
} from './types';

export class ErrorCodeMapper {
  private mappings: Record<string, ErrorConfig>;

  constructor(customMappings?: Record<string, ErrorConfig>) {
    // 合并默认映射和自定义映射，自定义映射优先
    this.mappings = {
      ...DEFAULT_ERROR_MAPPINGS,
      ...customMappings,
    };
  }

  /**
   * 添加自定义映射
   */
  addMapping(code: string, config: ErrorConfig): void {
    this.mappings[code] = config;
  }

  /**
   * 批量添加自定义映射
   */
  addMappings(mappings: Record<string, ErrorConfig>): void {
    this.mappings = {
      ...this.mappings,
      ...mappings,
    };
  }

  /**
   * 通过 HTTP 状态码获取错误码
   */
  getErrorCodeFromStatus(status: number | undefined): string {
    if (status === undefined) {
      return 'E1001'; // 默认网络错误
    }
    return HTTP_STATUS_TO_ERROR_CODE[status] || `E${status}`;
  }

  /**
   * 从响应体中提取业务错误码
   */
  getBusinessCode(response: ApiErrorResponse | undefined): string | null {
    if (!response) return null;
    
    // 优先使用 code 字段
    if (response.code) {
      return response.code;
    }
    
    // 从 error 字段推断错误码
    if (response.error) {
      // 尝试解析 error 字符串中的错误码
      const match = response.error.match(/\[([A-Z]\d+)\]/);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * 解析错误配置
   */
  map(
    error: unknown,
    response?: ApiErrorResponse,
    httpStatus?: number
  ): ErrorConfig {
    // 1. 优先从响应体中获取业务错误码
    const businessCode = this.getBusinessCode(response);
    if (businessCode && this.mappings[businessCode]) {
      return this.mappings[businessCode];
    }

    // 2. 从 HTTP 状态码获取错误码
    const statusCode = httpStatus ?? (error instanceof AxiosError ? error.response?.status : undefined);
    const errorCode = this.getErrorCodeFromStatus(statusCode);
    
    if (this.mappings[errorCode]) {
      return this.mappings[errorCode];
    }

    // 3. 返回默认错误配置
    return this.getDefaultConfig(error, statusCode);
  }

  /**
   * 获取默认错误配置
   */
  private getDefaultConfig(error: unknown, _status?: number): ErrorConfig {
    // 根据错误类型返回默认配置
    if (error instanceof AxiosError) {
      const message = error.response?.data?.error || error.message;
      
      if (!error.response) {
        // 无响应 = 网络错误
        return {
          code: 'E1001',
          type: 'NETWORK_ERROR',
          severity: 'high',
          message: message || '网络连接失败',
          userMessage: '网络连接失败，请检查网络',
          retryable: true,
        };
      }
      
      const statusCode = error.response.status;
      
      if (statusCode >= 500) {
        return {
          code: `E${statusCode}`,
          type: 'UNKNOWN',
          severity: 'critical',
          message: message || '服务端错误',
          userMessage: '服务异常，请稍后重试',
          retryable: true,
        };
      }
      
      if (statusCode === 401) {
        return {
          code: 'E1004',
          type: 'UNKNOWN',
          severity: 'high',
          message: message || '未授权',
          userMessage: '登录已过期，请重新登录',
          retryable: false,
        };
      }
      
      if (statusCode === 403) {
        return {
          code: 'E1005',
          type: 'UNKNOWN',
          severity: 'high',
          message: message || '禁止访问',
          userMessage: '无权限执行此操作',
          retryable: false,
        };
      }
      
      if (statusCode === 404) {
        return {
          code: 'E1006',
          type: 'UNKNOWN',
          severity: 'medium',
          message: message || '资源不存在',
          userMessage: '请求的资源不存在',
          retryable: false,
        };
      }
      
      return {
        code: `E${statusCode}`,
        type: 'UNKNOWN',
        severity: 'medium',
        message: message || '请求错误',
        userMessage: message || '请求失败，请检查输入',
        retryable: false,
      };
    }
    
    // 普通 Error
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('timeout')) {
        return {
          code: 'E1002',
          type: 'TIMEOUT',
          severity: 'medium',
          message: error.message,
          userMessage: '请求超时，请稍后重试',
          retryable: true,
        };
      }
      
      if (message.includes('network') || message.includes('fetch')) {
        return {
          code: 'E1001',
          type: 'NETWORK_ERROR',
          severity: 'high',
          message: error.message,
          userMessage: '网络连接失败，请检查网络',
          retryable: true,
        };
      }
    }
    
    // 未知错误
    return {
      code: 'E9999',
      type: 'UNKNOWN',
      severity: 'low',
      message: '未知错误',
      userMessage: '发生未知错误，请稍后重试',
      retryable: false,
    };
  }

  /**
   * 获取所有映射（用于调试）
   */
  getAllMappings(): Record<string, ErrorConfig> {
    return { ...this.mappings };
  }
}

// 导出默认实例
export const defaultErrorMapper = new ErrorCodeMapper();
