/**
 * Circuit Breaker Tests
 */

import { CircuitBreaker, CircuitBreakerManager } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-api', {
      failureRateThreshold: 0.5,
      minimumNumberOfCalls: 5,
      openDuration: 1000, // 1 second for testing
      halfOpenRequests: 2,
    });
  });

  describe('initial state', () => {
    it('should start in closed state', () => {
      expect(breaker.getState()).toBe('closed');
    });

    it('should have zero metrics initially', () => {
      const metrics = breaker.getMetrics();
      expect(metrics.totalCalls).toBe(0);
      expect(metrics.failedCalls).toBe(0);
      expect(metrics.successCalls).toBe(0);
      expect(metrics.state).toBe('closed');
    });
  });

  describe('closed state', () => {
    it('should execute successful calls', async () => {
      const result = await breaker.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });

    it('should track successful calls', async () => {
      await breaker.execute(() => Promise.resolve('ok'));
      await breaker.execute(() => Promise.resolve('ok'));
      
      const metrics = breaker.getMetrics();
      expect(metrics.successCalls).toBe(2);
    });

    it('should track failed calls', async () => {
      const failingFn = () => Promise.reject(new Error('fail'));
      
      await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      
      const metrics = breaker.getMetrics();
      expect(metrics.failedCalls).toBe(2);
    });

    it('should open when failure threshold reached', async () => {
      const failingFn = () => Promise.reject(new Error('fail'));
      
      // Execute minimumNumberOfCalls (5) failures
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }
      
      expect(breaker.getState()).toBe('open');
    });
  });

  describe('open state', () => {
    beforeEach(async () => {
      const failingFn = () => Promise.reject(new Error('fail'));
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }
    });

    it('should reject calls immediately when open', async () => {
      expect(breaker.getState()).toBe('open');
      
      await expect(
        breaker.execute(() => Promise.resolve('ok'))
      ).rejects.toThrow('Circuit breaker OPEN');
    });
  });

  describe('half-open state', () => {
    beforeEach(async () => {
      const failingFn = () => Promise.reject(new Error('fail'));
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }
    });

    it('should transition to half-open after openDuration', async () => {
      expect(breaker.getState()).toBe('open');
      
      // Wait for openDuration + buffer
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(breaker.getState()).toBe('half-open');
    });

    it('should close after successful calls in half-open', async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(breaker.getState()).toBe('half-open');
      
      // Successful call should close the circuit
      await breaker.execute(() => Promise.resolve('ok'));
      
      expect(breaker.getState()).toBe('closed');
    });

    it('should reopen on failure in half-open', async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(breaker.getState()).toBe('half-open');
      
      // Failed call should reopen the circuit
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      
      expect(breaker.getState()).toBe('open');
    });
  });

  describe('callbacks', () => {
    it('should call onOpen callback when circuit opens', async () => {
      const onOpen = jest.fn();
      breaker.onOpen(onOpen);
      
      const failingFn = () => Promise.reject(new Error('fail'));
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }
      
      expect(onOpen).toHaveBeenCalled();
    });

    it('should call onClose callback when circuit closes', async () => {
      const onClose = jest.fn();
      breaker.onClose(onClose);
      
      // Open the circuit
      const failingFn = () => Promise.reject(new Error('fail'));
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }
      
      // Wait and close
      await new Promise(resolve => setTimeout(resolve, 1100));
      await breaker.execute(() => Promise.resolve('ok'));
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset all state', async () => {
      const failingFn = () => Promise.reject(new Error('fail'));
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }
      
      expect(breaker.getState()).toBe('open');
      
      breaker.reset();
      
      expect(breaker.getState()).toBe('closed');
      const metrics = breaker.getMetrics();
      expect(metrics.totalCalls).toBe(0);
    });
  });
});

describe('CircuitBreakerManager', () => {
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    manager = new CircuitBreakerManager({
      failureRateThreshold: 0.5,
      minimumNumberOfCalls: 5,
      openDuration: 1000,
    });
  });

  it('should create and retrieve breakers', () => {
    const breaker1 = manager.getBreaker('api1');
    const breaker2 = manager.getBreaker('api2');
    
    expect(breaker1).not.toBe(breaker2);
    expect(manager.getBreaker('api1')).toBe(breaker1);
  });

  it('should execute with circuit breaker protection', async () => {
    const result = await manager.execute('test-api', () => Promise.resolve('ok'));
    expect(result).toBe('ok');
  });

  it('should get all metrics', async () => {
    await manager.execute('api1', () => Promise.resolve('ok'));
    await manager.execute('api2', () => Promise.resolve('ok'));
    
    const metrics = manager.getAllMetrics();
    expect(metrics['api1']).toBeDefined();
    expect(metrics['api2']).toBeDefined();
  });

  it('should reset all breakers', async () => {
    // Open a breaker
    const breaker = manager.getBreaker('test-api');
    for (let i = 0; i < 5; i++) {
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
    }
    
    expect(breaker.getState()).toBe('open');
    
    manager.resetAll();
    
    expect(breaker.getState()).toBe('closed');
  });
});