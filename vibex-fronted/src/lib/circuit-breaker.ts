/**
 * Circuit Breaker Implementation
 * 
 * 熔断器模式实现，保护 API 调用
 * 当失败率超过阈值时打开熔断器，快速失败返回友好提示
 */

/** Dev-only logger */
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args);
};

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** 失败率阈值 (0-1)，默认 0.5 (50%) */
  failureRateThreshold?: number;
  /** 最小请求数，默认 5 */
  minimumNumberOfCalls?: number;
  /** 时间窗口（毫秒），默认 60000 (1分钟) */
  windowDuration?: number;
  /** 熔断持续时间（毫秒），默认 30000 (30秒) */
  openDuration?: number;
  /** 半开状态下允许的试探请求数，默认 3 */
  halfOpenRequests?: number;
}

export interface CircuitBreakerMetrics {
  totalCalls: number;
  failedCalls: number;
  successCalls: number;
  failureRate: number;
  state: CircuitState;
}

/**
 * 熔断器类
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private halfOpenCalls = 0;
  
  private readonly options: Required<CircuitBreakerOptions>;
  private readonly name: string;
  
  // 状态变化回调
  private onStateChange?: (state: CircuitState) => void;
  private onCircuitOpen?: () => void;
  private onCircuitClose?: () => void;
  private onCircuitHalfOpen?: () => void;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.options = {
      failureRateThreshold: options.failureRateThreshold ?? 0.5,
      minimumNumberOfCalls: options.minimumNumberOfCalls ?? 5,
      windowDuration: options.windowDuration ?? 60000,
      openDuration: options.openDuration ?? 30000,
      halfOpenRequests: options.halfOpenRequests ?? 3,
    };
  }

  /**
   * 设置状态变化回调
   */
  onStateChanged(callback: (state: CircuitState) => void): this {
    this.onStateChange = callback;
    return this;
  }

  /**
   * 设置熔断打开回调
   */
  onOpen(callback: () => void): this {
    this.onCircuitOpen = callback;
    return this;
  }

  /**
   * 设置熔断关闭回调
   */
  onClose(callback: () => void): this {
    this.onCircuitClose = callback;
    return this;
  }

  /**
   * 设置熔断半开回调
   */
  onHalfOpen(callback: () => void): this {
    this.onCircuitHalfOpen = callback;
    return this;
  }

  /**
   * 获取当前状态
   */
  getState(): CircuitState {
    // 检查是否应该从 open 转换到 half-open
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.options.openDuration) {
        this.setState('half-open');
      }
    }
    return this.state;
  }

  /**
   * 执行受保护的函数
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.getState();
    
    if (state === 'open') {
      // 熔断器打开，直接抛出错误
      throw new Error(`Circuit breaker OPEN: ${this.name} - 请稍后重试`);
    }
    
    if (state === 'half-open') {
      // 半开状态，限制试探请求数
      if (this.halfOpenCalls >= this.options.halfOpenRequests) {
        throw new Error(`Circuit breaker HALF-OPEN: ${this.name} - 正在恢复中`);
      }
      this.halfOpenCalls++;
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * 记录成功调用
   */
  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    
    if (this.state === 'half-open') {
      // 连续成功，关闭熔断器
      this.setState('closed');
    }
  }

  /**
   * 记录失败调用
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'half-open') {
      // 半开状态下失败，重新打开熔断器
      this.setState('open');
      return;
    }
    
    // 检查是否应该打开熔断器
    const totalCalls = this.successCount + this.failureCount;
    if (totalCalls >= this.options.minimumNumberOfCalls) {
      const failureRate = this.failureCount / totalCalls;
      if (failureRate >= this.options.failureRateThreshold) {
        this.setState('open');
      }
    }
  }

  /**
   * 设置状态
   */
  private setState(newState: CircuitState): void {
    if (this.state === newState) return;
    
    this.state = newState;
    
    // 触发回调
    this.onStateChange?.(newState);
    
    switch (newState) {
      case 'open':
        this.onCircuitOpen?.();
        console.error(`[CircuitBreaker] OPEN: ${this.name}`);
        break;
      case 'closed':
        this.failureCount = 0;
        this.successCount = 0;
        this.halfOpenCalls = 0;
        this.onCircuitClose?.();
        devLog(`[CircuitBreaker] CLOSED: ${this.name}`);
        break;
      case 'half-open':
        this.halfOpenCalls = 0;
        this.onCircuitHalfOpen?.();
        devLog(`[CircuitBreaker] HALF-OPEN: ${this.name}`);
        break;
    }
  }

  /**
   * 获取指标
   */
  getMetrics(): CircuitBreakerMetrics {
    const totalCalls = this.successCount + this.failureCount;
    return {
      totalCalls,
      failedCalls: this.failureCount,
      successCalls: this.successCount,
      failureRate: totalCalls > 0 ? this.failureCount / totalCalls : 0,
      state: this.state,
    };
  }

  /**
   * 重置熔断器
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenCalls = 0;
    this.lastFailureTime = 0;
    this.onCircuitClose?.();
  }
}

/**
 * API 熔断器管理器
 * 为不同的 API 端点管理熔断器
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private readonly defaultOptions: CircuitBreakerOptions;

  constructor(defaultOptions: CircuitBreakerOptions = {}) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * 获取或创建熔断器
   */
  getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker(name, {
        ...this.defaultOptions,
        ...options,
      });
      this.breakers.set(name, breaker);
    }
    return this.breakers.get(name)!;
  }

  /**
   * 执行受保护的 API 调用
   */
  async execute<T>(apiName: string, fn: () => Promise<T>): Promise<T> {
    const breaker = this.getBreaker(apiName);
    return breaker.execute(fn);
  }

  /**
   * 获取所有熔断器状态
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    for (const [name, breaker] of this.breakers) {
      metrics[name] = breaker.getMetrics();
    }
    return metrics;
  }

  /**
   * 重置所有熔断器
   */
  resetAll(): void {
    for (const [, breaker] of this.breakers) {
      breaker.reset();
    }
  }

  /**
   * 移除指定熔断器
   */
  remove(name: string): void {
    this.breakers.delete(name);
  }
}

// 默认配置
export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: Required<CircuitBreakerOptions> = {
  failureRateThreshold: 0.5,
  minimumNumberOfCalls: 5,
  windowDuration: 60000,
  openDuration: 30000,
  halfOpenRequests: 3,
};

// 单例导出
export const circuitBreakerManager = new CircuitBreakerManager(DEFAULT_CIRCUIT_BREAKER_OPTIONS);
