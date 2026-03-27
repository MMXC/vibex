/**
 * useErrorHandler — Unified error handling hook for UI components
 *
 * Provides:
 * - Consistent error state management
 * - Built-in retry logic with configurable strategy
 * - Error-to-userMessage mapping for each ErrorType
 * - Retry attempt tracking
 *
 * @example
 * ```typescript
 * const { error, errorInfo, retry, isRetrying, clearError } = useErrorHandler({
 *   onError: (err) => console.error(err),
 *   maxRetries: 3,
 * });
 * ```
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { ErrorType, ErrorConfig } from '@/types/error';

// ==================== Types ====================

/** Error type labels for user-facing display */
export const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  NETWORK_ERROR: '网络错误',
  TIMEOUT: '请求超时',
  PARSE_ERROR: '数据解析错误',
  UNKNOWN: '未知错误',
};

/** Error recovery strategies by type */
export const ERROR_RECOVERY_STRATEGY: Record<ErrorType, { retryable: boolean; maxRetries: number; baseDelay: number }> = {
  NETWORK_ERROR: { retryable: true, maxRetries: 3, baseDelay: 1000 },
  TIMEOUT: { retryable: true, maxRetries: 2, baseDelay: 2000 },
  PARSE_ERROR: { retryable: false, maxRetries: 0, baseDelay: 0 },
  UNKNOWN: { retryable: true, maxRetries: 1, baseDelay: 1000 },
};

export interface UseErrorHandlerOptions {
  /** Custom error callback */
  onError?: (error: ErrorConfig) => void;
  /** Override max retries (uses ERROR_RECOVERY_STRATEGY if not set) */
  maxRetries?: number;
  /** Override retry delay (ms) */
  retryDelay?: number;
  /** Transform unknown errors to ErrorConfig */
  errorMapper?: (error: unknown) => ErrorConfig;
}

export interface UseErrorHandlerReturn {
  /** Current error config */
  error: ErrorConfig | null;
  /** Raw error from source */
  rawError: unknown;
  /** User-friendly error message */
  userMessage: string;
  /** Whether the error is retryable */
  isRetryable: boolean;
  /** Current retry attempt count */
  retryCount: number;
  /** Whether retry is in progress */
  isRetrying: boolean;
  /** Handle an error */
  handleError: (error: unknown) => void;
  /** Retry the operation */
  retry: (fn: () => void | Promise<void>) => void;
  /** Clear the error state */
  clearError: () => void;
}

// ==================== Hook ====================

/**
 * useErrorHandler — Unified error handling hook
 *
 * Composable hook for any component that needs error state + retry.
 * Integrates with lib/error ErrorConfig and ERROR_RECOVERY_STRATEGY.
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const { onError, maxRetries: overrideMaxRetries, retryDelay: overrideDelay, errorMapper } = options;

  const [error, setError] = useState<ErrorConfig | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Convert any error to ErrorConfig */
  const toErrorConfig = useCallback(
    (err: unknown): ErrorConfig => {
      if (errorMapper) {
        const mapped = errorMapper(err);
        if (mapped) return mapped;
      }
      if (err && typeof err === 'object' && 'type' in err && 'code' in err) {
        return err as ErrorConfig;
      }
      // Unknown error → default
      const msg = err instanceof Error ? err.message : String(err);
      const isTimeout =
        err instanceof Error &&
        (err.name === 'AbortError' ||
          msg.includes('timeout') || msg.includes('Timeout') ||
          msg.includes('超时'));
      const isNetwork =
        err instanceof Error &&
        (msg.includes('network') || msg.includes('fetch') ||
          msg.includes('Failed to fetch') ||
          msg.includes('网络错误') || msg.includes('网络'));
      const type: ErrorType = isTimeout ? 'TIMEOUT' : isNetwork ? 'NETWORK_ERROR' : 'UNKNOWN';
      const strategy = ERROR_RECOVERY_STRATEGY[type];
      return {
        code: 'E9999',
        type,
        severity: 'low',
        message: msg,
        userMessage: ERROR_TYPE_LABELS[type],
        retryable: strategy.retryable,
      };
    },
    [errorMapper]
  );

  /** Get user-friendly message from error */
  const userMessage = error?.userMessage
    ?? (rawError instanceof Error ? rawError.message : ERROR_TYPE_LABELS.UNKNOWN);

  /** Whether the error is retryable */
  const isRetryable = error?.retryable ?? false;

  /** Handle an error */
  const handleError = useCallback(
    (err: unknown) => {
      const config = toErrorConfig(err);
      setError(config);
      setRawError(err);
      setRetryCount(0);
      onError?.(config);
    },
    [toErrorConfig, onError]
  );

  /** Clear error state */
  const clearError = useCallback(() => {
    setError(null);
    setRawError(null);
    setRetryCount(0);
    setIsRetrying(false);
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  /** Retry with exponential backoff */
  const retry = useCallback(
    (fn: () => void | Promise<void>) => {
      if (!error || !isRetryable) return;

      const strategy = ERROR_RECOVERY_STRATEGY[error.type];
      const max = overrideMaxRetries ?? strategy.maxRetries;
      const delay = overrideDelay ?? strategy.baseDelay;

      if (retryCount >= max) return;

      setIsRetrying(true);
      const backoffDelay = delay * Math.pow(2, retryCount);

      retryTimerRef.current = setTimeout(async () => {
        try {
          await fn();
          clearError();
        } catch (err) {
          setRetryCount((c) => c + 1);
          setIsRetrying(false);
          handleError(err);
        }
      }, backoffDelay);
    },
    [error, isRetryable, retryCount, overrideMaxRetries, overrideDelay, clearError, handleError]
  );

  return {
    error,
    rawError,
    userMessage,
    isRetryable,
    retryCount,
    isRetrying,
    handleError,
    retry,
    clearError,
  };
}
