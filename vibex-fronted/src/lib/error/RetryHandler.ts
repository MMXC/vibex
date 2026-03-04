/**
 * RetryHandler - 重试处理器
 * 实现指数退避算法的重试机制
 */

import { ErrorClassifier } from './ErrorClassifier';

export interface RetryOptions {
  /** 最大重试次数 */
  maxRetries: number;
  /** 初始延迟 (ms) */
  baseDelay: number;
  /** 最大延迟 (ms) */
  maxDelay: number;
  /** 退避算法 */
  backoff: 'exponential' | 'linear' | 'fixed';
  /** 是否随机抖动 */
  jitter: boolean;
  /** 重试条件回调 */
  shouldRetry?: (error: unknown) => boolean;
  /** 重试回调 */
  onRetry?: (attempt: number, error: unknown) => void;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoff: 'exponential',
  jitter: true,
};

/**
 * 计算退避延迟
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoff: 'exponential' | 'linear' | 'fixed',
  jitter: boolean
): number {
  let delay: number;
  
  switch (backoff) {
    case 'exponential':
      delay = baseDelay * Math.pow(2, attempt);
      break;
    case 'linear':
      delay = baseDelay * (attempt + 1);
      break;
    case 'fixed':
    default:
      delay = baseDelay;
      break;
  }
  
  // 限制最大延迟
  delay = Math.min(delay, maxDelay);
  
  // 添加随机抖动 (±25%)
  if (jitter) {
    const jitterAmount = delay * 0.25;
    delay = delay + (Math.random() * jitterAmount * 2 - jitterAmount);
  }
  
  return Math.floor(delay);
}

/**
 * 等待指定时间
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class RetryHandler {
  private options: RetryOptions;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = {
      ...DEFAULT_RETRY_OPTIONS,
      ...options,
    };
  }

  /**
   * 执行带重试的函数
   */
  async execute<T>(
    fn: () => Promise<T>,
    customOptions?: Partial<RetryOptions>
  ): Promise<T> {
    const options = {
      ...this.options,
      ...customOptions,
    };
    
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // 检查是否应该重试
        const shouldRetry = options.shouldRetry 
          ? options.shouldRetry(error)
          : ErrorClassifier.isRetryableError(error);
        
        if (!shouldRetry || attempt === options.maxRetries) {
          throw error;
        }
        
        // 计算延迟
        const delayMs = calculateDelay(
          attempt,
          options.baseDelay,
          options.maxDelay,
          options.backoff,
          options.jitter
        );
        
        // 触发重试回调
        options.onRetry?.(attempt + 1, error);
        
        // 等待后重试
        await delay(delayMs);
      }
    }
    
    // 不应该到达这里，但为了类型安全
    throw lastError;
  }

  /**
   * 创建带有重试包装的 Promise
   */
  static withRetry<T>(
    promise: Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const handler = new RetryHandler(options);
    return handler.execute(() => promise);
  }

  /**
   * 立即抛出错误（不重试）
   */
  static withoutRetry<T>(promise: Promise<T>): Promise<T> {
    return promise;
  }

  /**
   * 更新选项
   */
  setOptions(options: Partial<RetryOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * 获取当前选项
   */
  getOptions(): RetryOptions {
    return { ...this.options };
  }
}

// 导出默认实例
export const defaultRetryHandler = new RetryHandler();
