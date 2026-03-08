/**
 * ErrorMiddleware - API 错误处理中间件
 * 统一错误拦截、错误码映射、重试机制、Toast 提示
 */

import { AxiosError, AxiosResponse } from 'axios';
import { ErrorClassifier } from './ErrorClassifier';
import { ErrorCodeMapper, defaultErrorMapper } from './ErrorCodeMapper';
import { RetryHandler, DEFAULT_RETRY_OPTIONS } from './RetryHandler';
import {
  ErrorConfig,
  ErrorMiddlewareOptions,
  ApiErrorResponse,
} from './types';

export class ErrorMiddleware {
  private options: Required<ErrorMiddlewareOptions>;
  private errorMapper: ErrorCodeMapper;
  private retryHandler: RetryHandler;
  private toastFunction?: (message: string, type: 'error' | 'warning' | 'info') => void;

  constructor(options: ErrorMiddlewareOptions = {}) {
    this.options = {
      showToast: options.showToast ?? true,
      retryCount: options.retryCount ?? DEFAULT_RETRY_OPTIONS.maxRetries,
      onError: options.onError ?? (() => {}),
      customMappings: options.customMappings ?? {},
      enableRetry: options.enableRetry ?? true,
      retryDelay: options.retryDelay ?? DEFAULT_RETRY_OPTIONS.baseDelay,
    };

    this.errorMapper = new ErrorCodeMapper(this.options.customMappings);
    this.retryHandler = new RetryHandler({
      maxRetries: this.options.retryCount,
      baseDelay: this.options.retryDelay,
    });
  }

  /**
   * 设置 Toast 显示函数
   */
  setToastFunction(fn: (message: string, type: 'error' | 'warning' | 'info') => void): void {
    this.toastFunction = fn;
  }

  /**
   * 显示 Toast 提示
   */
  private showToast(userMessage: string): void {
    if (this.options.showToast && this.toastFunction) {
      this.toastFunction(userMessage, 'error');
    }
  }

  /**
   * 处理错误
   */
  handleError(error: unknown, response?: AxiosResponse): ErrorConfig {
    // 提取响应数据
    const responseData = response?.data as ApiErrorResponse | undefined;
    const httpStatus = response?.status;
    
    // 分类错误
    const classification = ErrorClassifier.classify(error, responseData);
    
    // 映射错误配置
    const errorConfig = this.errorMapper.map(error, responseData, httpStatus);
    
    // 合并分类信息
    const fullConfig: ErrorConfig = {
      ...errorConfig,
      type: classification.type,
      severity: classification.severity,
      retryable: classification.retryable && errorConfig.retryable,
    };
    
    // 显示 Toast
    this.showToast(fullConfig.userMessage);
    
    // 调用自定义错误回调
    this.options.onError(fullConfig);
    
    return fullConfig;
  }

  /**
   * 包装异步函数
   */
  async wrap<T>(
    fn: () => Promise<T>,
    options?: Partial<ErrorMiddlewareOptions>
  ): Promise<T> {
    const mergedOptions = { ...this.options, ...options };
    
    // 如果启用重试，使用重试处理器
    if (mergedOptions.enableRetry) {
      return this.retryHandler.execute(fn, {
        maxRetries: mergedOptions.retryCount,
        baseDelay: mergedOptions.retryDelay,
        shouldRetry: (error) => ErrorClassifier.isRetryableError(error),
      });
    }
    
    // 否则直接执行
    try {
      return await fn();
    } catch (error) {
      const axiosError = error as AxiosError;
      this.handleError(error, axiosError.response);
      throw error;
    }
  }

  /**
   * 创建带错误处理的 API 客户端包装器
   */
  createHandler<T>(
    fn: () => Promise<T>,
    options?: Partial<ErrorMiddlewareOptions>
  ): () => Promise<T> {
    return () => this.wrap(fn, options);
  }

  /**
   * 添加自定义错误映射
   */
  addErrorMapping(code: string, config: ErrorConfig): void {
    this.errorMapper.addMapping(code, config);
  }

  /**
   * 批量添加自定义错误映射
   */
  addErrorMappings(mappings: Record<string, ErrorConfig>): void {
    this.errorMapper.addMappings(mappings);
  }

  /**
   * 获取错误映射
   */
  getErrorMappings(): Record<string, ErrorConfig> {
    return this.errorMapper.getAllMappings();
  }
}

// 导出默认实例
export const defaultErrorMiddleware = new ErrorMiddleware();

// 便捷函数
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  options?: ErrorMiddlewareOptions
): Promise<T> => {
  const middleware = new ErrorMiddleware(options);
  return middleware.wrap(fn);
};

// 重新导出类型和类
export { ErrorClassifier } from './ErrorClassifier';
export { ErrorCodeMapper } from './ErrorCodeMapper';
export { RetryHandler } from './RetryHandler';
export * from './types';
