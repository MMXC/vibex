/**
 * ErrorMapper - HTTP 状态码到 ErrorCode 的映射器
 * 
 * 提供独立的错误映射逻辑
 */

import { ErrorCode, mapHttpStatusToCode } from './ErrorCode';
import { ApiError } from './ApiError';

/**
 * 错误映射配置
 */
export interface ErrorMapperConfig {
  /** 自定义错误码映射 */
  customMappings?: Record<number, ErrorCode>;
  
  /** 是否显示详细错误信息 */
  verbose?: boolean;
}

/**
 * 错误映射器类
 */
export class ErrorMapper {
  private customMappings: Record<number, ErrorCode>;
  private verbose: boolean;

  constructor(config: ErrorMapperConfig = {}) {
    this.customMappings = config.customMappings || {};
    this.verbose = config.verbose || false;
  }

  /**
   * 从 HTTP 状态码映射到 ErrorCode
   */
  map(status: number): ErrorCode {
    // 优先使用自定义映射
    if (this.customMappings[status]) {
      return this.customMappings[status];
    }
    // 使用默认映射
    return mapHttpStatusToCode(status);
  }

  /**
   * 从 HTTP 响应创建 ApiError
   */
  mapToApiError(status: number, data?: unknown, message?: string): ApiError {
    const code = this.map(status);
    const errorMessage = this.getErrorMessage(code, data, message);
    return new ApiError(code, errorMessage, status, data);
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(code: ErrorCode, data?: unknown, customMessage?: string): string {
    // 优先使用自定义消息
    if (customMessage) {
      return customMessage;
    }
    
    // 尝试从响应数据中提取消息
    if (this.verbose && data) {
      const responseData = data as Record<string, any>;
      if (responseData?.message) {
        return responseData.message;
      }
      if (responseData?.error) {
        return responseData.error;
      }
    }
    
    // 使用默认消息
    const { ErrorMessage } = require('./ErrorCode');
    return ErrorMessage[code];
  }

  /**
   * 添加自定义映射
   */
  addMapping(status: number, code: ErrorCode): void {
    this.customMappings[status] = code;
  }

  /**
   * 批量添加映射
   */
  addMappings(mappings: Record<number, ErrorCode>): void {
    this.customMappings = { ...this.customMappings, ...mappings };
  }

  /**
   * 判断状态码是否表示客户端错误
   */
  static isClientError(status: number): boolean {
    return status >= 400 && status < 500;
  }

  /**
   * 判断状态码是否表示服务端错误
   */
  static isServerError(status: number): boolean {
    return status >= 500;
  }

  /**
   * 判断状态码是否表示成功
   */
  static isSuccess(status: number): boolean {
    return status >= 200 && status < 300;
  }
}

/**
 * 默认错误映射器实例
 */
export const defaultErrorMapper = new ErrorMapper();

/**
 * 从 axios 错误转换
 */
export function transformAxiosError(error: any): ApiError {
  // 网络错误（无响应）
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return ApiError.timeout();
    }
    return ApiError.networkError(error.message);
  }

  // 有响应的错误
  const { status, data } = error.response;
  const message = data?.error || data?.message;
  
  return ApiError.fromHttpStatus(status, message, data);
}
