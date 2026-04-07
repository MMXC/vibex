/**
 * Retry Handler - 重试处理器
 * 
 * 指数退避重试策略，支持可配置的最大重试次数和重试条件
 * 
 * Features:
 * - 指数退避 (exponential backoff)
 * - 最大重试次数配置
 * - 可重试错误判断
 * - 随机抖动 (jitter)
 * - 取消重试
 * 
 * Usage:
 * const handler = new RetryHandler({ maxRetries: 3 })
 * await handler.execute(() => apiCall())
 */

import { isRetryable } from './ErrorClassifier';

// 重试配置
export interface RetryOptions {
  /** 最大重试次数 */
  maxRetries?: number;
  /** 初始延迟 (ms) */
  initialDelay?: number;
  /** 最大延迟 (ms) */
  maxDelay?: number;
  /** 退避乘数 */
  backoffMultiplier?: number;
  /** 是否添加随机抖动 */
  addJitter?: boolean;
  /** 抖动比例 (0-1) */
  jitterRatio?: number;
  /** 自定义重试条件 */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** 重试回调 */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
  /** 放弃回调 */
  onGiveUp?: (error: unknown, attempts: number) => void;
}

// 重试结果
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  totalTime: number;
  lastError?: unknown;
}

// 重试状态
export interface RetryState {
  attempt: number;
  delay: number;
  startTime: number;
}

/**
 * 重试处理器类
 */
export class RetryHandler {
  private maxRetries: number;
  private initialDelay: number;
  private maxDelay: number;
  private backoffMultiplier: number;
  private addJitter: boolean;
  private jitterRatio: number;
  private shouldRetry: (error: unknown, attempt: number) => boolean;
  private onRetry?: (error: unknown, attempt: number, delay: number) => void;
  private onGiveUp?: (error: unknown, attempts: number) => void;

  constructor(options: RetryOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.initialDelay = options.initialDelay ?? 1000;
    this.maxDelay = options.maxDelay ?? 30000;
    this.backoffMultiplier = options.backoffMultiplier ?? 2;
    this.addJitter = options.addJitter ?? true;
    this.jitterRatio = options.jitterRatio ?? 0.3;
    this.shouldRetry = options.shouldRetry ?? isRetryable;
    this.onRetry = options.onRetry;
    this.onGiveUp = options.onGiveUp;
  }

  /**
   * 执行重试
   */
  async execute<T>(fn: () => Promise<T>): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: unknown;
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      attempt++;

      try {
        const data = await fn();
        
        return {
          success: true,
          data,
          attempts: attempt,
          totalTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error;

        // 检查是否应该重试
        if (attempt > this.maxRetries || !this.shouldRetry(error, attempt)) {
          // 放弃重试
          this.onGiveUp?.(error, attempt);
          
          return {
            success: false,
            error,
            attempts: attempt,
            totalTime: Date.now() - startTime,
            lastError: error,
          };
        }

        // 计算延迟
        const delay = this.calculateDelay(attempt);
        
        // 触发重试回调
        this.onRetry?.(error, attempt, delay);

        // 等待后重试
        await this.sleep(delay);
      }
    }

    // 理论上不会到达这里，但作为安全网
    return {
      success: false,
      error: lastError,
      attempts: attempt,
      totalTime: Date.now() - startTime,
      lastError,
    };
  }

  /**
   * 计算延迟 (指数退避 + 抖动)
   */
  private calculateDelay(attempt: number): number {
    // 指数退避: initialDelay * (multiplier ^ (attempt - 1))
    const exponentialDelay = this.initialDelay * Math.pow(this.backoffMultiplier, attempt - 1);
    
    // 限制最大延迟
    const cappedDelay = Math.min(exponentialDelay, this.maxDelay);
    
    // 添加随机抖动
    if (this.addJitter) {
      const jitter = cappedDelay * this.jitterRatio * Math.random();
      return Math.floor(cappedDelay + jitter);
    }
    
    return Math.floor(cappedDelay);
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 创建带取消的重试执行器
   */
  createCancellableExecutor(): {
    execute: <T>(fn: () => Promise<T>) => Promise<RetryResult<T>>;
    cancel: () => void;
  } {
    let cancelled = false;

    const execute = async <T>(fn: () => Promise<T>): Promise<RetryResult<T>> => {
      cancelled = false;
      return this.execute<T>(async () => {
        if (cancelled) {
          throw new Error('Retry cancelled');
        }
        return fn();
      });
    };

    const cancel = () => {
      cancelled = true;
    };

    return { execute, cancel };
  }

  /**
   * 设置自定义重试条件
   */
  setShouldRetry(shouldRetry: (error: unknown, attempt: number) => boolean): void {
    this.shouldRetry = shouldRetry;
  }

  /**
   * 设置重试回调
   */
  setOnRetry(callback: (error: unknown, attempt: number, delay: number) => void): void {
    this.onRetry = callback;
  }

  /**
   * 设置放弃回调
   */
  setOnGiveUp(callback: (error: unknown, attempts: number) => void): void {
    this.onGiveUp = callback;
  }

  /**
   * 获取当前配置
   */
  getConfig(): RetryOptions {
    return {
      maxRetries: this.maxRetries,
      initialDelay: this.initialDelay,
      maxDelay: this.maxDelay,
      backoffMultiplier: this.backoffMultiplier,
      addJitter: this.addJitter,
      jitterRatio: this.jitterRatio,
    };
  }
}

/**
 * 便捷函数: 带重试的执行
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<RetryResult<T>> {
  const handler = new RetryHandler(options);
  return handler.execute(fn);
}

/**
 * 便捷函数: 带重试的 fetch
 */
export async function retryFetch(
  url: string,
  options?: RequestInit & RetryOptions
): Promise<Response> {
  const { maxRetries, initialDelay, maxDelay, backoffMultiplier, addJitter, jitterRatio, shouldRetry, onRetry, onGiveUp, ...fetchOptions } = options || {};
  
  const handler = new RetryHandler({
    maxRetries,
    initialDelay,
    maxDelay,
    backoffMultiplier,
    addJitter,
    jitterRatio,
    shouldRetry,
    onRetry,
    onGiveUp,
  });

  return handler.execute(() => fetch(url, fetchOptions)).then(result => {
    if (!result.success) {
      throw result.error;
    }
    return result.data as Response;
  });
}

/**
 * 判断特定错误是否可重试
 */
export function canRetry(error: unknown, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false;
  return isRetryable(error);
}

export default RetryHandler;
