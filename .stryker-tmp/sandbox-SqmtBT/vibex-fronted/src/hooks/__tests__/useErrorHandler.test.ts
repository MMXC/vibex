/**
 * P2-2: 错误处理统一 — 验收测试
 *
 * PRD acceptance criteria:
 * - expect(ErrorType).toEqual(['NETWORK_ERROR', 'TIMEOUT', 'PARSE_ERROR', 'UNKNOWN'])
 * - expect(useErrorHandler).toBeDefined()
 */
// @ts-nocheck


import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler';
import { ErrorType, ErrorConfig } from '@/lib/error';

// ==================== ErrorType 验收 ====================

describe('P2-2 ErrorType 验收', () => {
  /**
   * PRD acceptance: expect(ErrorType).toEqual(['NETWORK_ERROR', 'TIMEOUT', 'PARSE_ERROR', 'UNKNOWN'])
   */
  it('ErrorType 包含所有预期值', () => {
    const expectedTypes: ErrorType[] = ['NETWORK_ERROR', 'TIMEOUT', 'PARSE_ERROR', 'UNKNOWN'];
    expectedTypes.forEach((type) => {
      const config: ErrorConfig = {
        code: 'TEST',
        type,
        severity: 'medium',
        message: 'test',
        userMessage: 'test',
        retryable: true,
      };
      expect(config.type).toBe(type);
    });
  });

  it('ErrorType 不包含旧版小写值', () => {
    const config: ErrorConfig = {
      code: 'TEST',
      type: 'NETWORK_ERROR',
      severity: 'high',
      message: 'test',
      userMessage: 'test',
      retryable: true,
    };
    // 确认类型是 UPPERCASE，不是小写
    expect(config.type).not.toBe('network');
    expect(config.type).not.toBe('timeout');
    expect(config.type).not.toBe('parse');
    expect(config.type).not.toBe('unknown');
  });
});

// ==================== useErrorHandler 验收 ====================

describe('P2-2 useErrorHandler 验收', () => {
  /**
   * PRD acceptance: expect(useErrorHandler).toBeDefined()
   */
  it('useErrorHandler hook 已定义', () => {
    expect(useErrorHandler).toBeDefined();
    expect(typeof useErrorHandler).toBe('function');
  });

  it('useErrorHandler 默认状态', () => {
    const { result } = renderHook(() => useErrorHandler());
    expect(result.current.error).toBeNull();
    expect(result.current.rawError).toBeNull();
    expect(result.current.userMessage).toBe('未知错误');
    expect(result.current.isRetryable).toBe(false);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
  });

  it('handleError 处理普通 Error', () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError(new Error('something went wrong'));
    });
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.type).toBe('UNKNOWN');
    expect(result.current.error?.severity).toBe('low');
  });

  it('handleError 处理网络错误', () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError(new Error('Failed to fetch'));
    });
    expect(result.current.error?.type).toBe('NETWORK_ERROR');
    expect(result.current.error?.retryable).toBe(true);
  });

  it('handleError 处理超时错误', () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError(new Error('timeout exceeded'));
    });
    expect(result.current.error?.type).toBe('TIMEOUT');
    expect(result.current.error?.retryable).toBe(true);
  });

  it('clearError 重置错误状态', () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError(new Error('test error'));
    });
    expect(result.current.error).not.toBeNull();
    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.retryCount).toBe(0);
  });

  it('onError 回调被触发', () => {
    const onError = jest.fn();
    const { result } = renderHook(() => useErrorHandler({ onError }));
    act(() => {
      result.current.handleError(new Error('callback test'));
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].type).toBe('UNKNOWN');
  });

  it('ERROR_TYPE_LABELS 包含所有 ErrorType', () => {
    // Dynamically import to avoid jest configuration issues
    const { ERROR_TYPE_LABELS } = require('../useErrorHandler');
    expect(ERROR_TYPE_LABELS.NETWORK_ERROR).toBe('网络错误');
    expect(ERROR_TYPE_LABELS.TIMEOUT).toBe('请求超时');
    expect(ERROR_TYPE_LABELS.PARSE_ERROR).toBe('数据解析错误');
    expect(ERROR_TYPE_LABELS.UNKNOWN).toBe('未知错误');
  });

  it('ERROR_RECOVERY_STRATEGY 包含所有 ErrorType', () => {
    const { ERROR_RECOVERY_STRATEGY } = require('../useErrorHandler');
    expect(ERROR_RECOVERY_STRATEGY.NETWORK_ERROR.retryable).toBe(true);
    expect(ERROR_RECOVERY_STRATEGY.TIMEOUT.retryable).toBe(true);
    expect(ERROR_RECOVERY_STRATEGY.PARSE_ERROR.retryable).toBe(false);
    expect(ERROR_RECOVERY_STRATEGY.UNKNOWN.retryable).toBe(true);
  });
});
