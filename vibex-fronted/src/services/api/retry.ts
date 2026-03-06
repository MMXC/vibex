import axios from 'axios';

// ==================== 接口定义 ====================

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  retryableStatusCodes: number[];
}

export interface RetryService {
  execute<T>(fn: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T>;
  isRetryable(error: unknown): boolean;
}

// ==================== 默认配置 ====================

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  retryableStatusCodes: [500, 502, 503, 504],
};

// ==================== 重试实现 ====================

class RetryImpl implements RetryService {
  private config: RetryConfig;

  constructor(config: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.config = config;
  }

  async execute<T>(
    fn: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const cfg = { ...this.config, ...config };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < cfg.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (this.isRetryable(error)) {
          await this.delay(cfg.baseDelay * (attempt + 1));
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }

  isRetryable(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      return (
        !error.response ||
        this.config.retryableStatusCodes.includes(error.response.status)
      );
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ==================== 单例导出 ====================

export const retry: RetryService = new RetryImpl();
