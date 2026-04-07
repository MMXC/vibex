'use client';

import React from 'react';

/**
 * EmptyFallback — 空数据 fallback 组件
 * 用于 DDD 组件（DomainModelDiagram、FlowDiagram、BoundedContextGraph）空数据场景
 */

export interface EmptyFallbackProps {
  /** 提示消息 */
  message?: string;
  /** 自定义样式类 */
  className?: string;
  /** 额外的内联样式 */
  style?: React.CSSProperties;
}

export function EmptyFallback({
  message = '暂无数据，请先生成',
  className = '',
  style,
}: EmptyFallbackProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '200px',
        background: 'var(--color-bg-secondary, #1e1e2e)',
        border: '1px dashed var(--color-border, #3a3a5c)',
        borderRadius: '12px',
        color: 'var(--color-text-muted, #a0a0b0)',
        gap: '8px',
        ...style,
      }}
      role="status"
      aria-live="polite"
      data-testid="ddd-empty-fallback"
    >
      <span style={{ fontSize: '32px', opacity: 0.5 }}>📭</span>
      <span style={{ fontSize: '14px', fontWeight: 500 }}>{message}</span>
    </div>
  );
}

/**
 * ErrorFallback — 错误 fallback 组件
 * 用于 DDD 组件渲染异常场景
 */

export interface ErrorFallbackProps {
  /** 错误对象或错误消息 */
  error?: unknown;
  /** 自定义提示消息 */
  message?: string;
  /** 是否在开发环境显示堆栈 */
  showStack?: boolean;
  /** 自定义样式类 */
  className?: string;
  /** 额外的内联样式 */
  style?: React.CSSProperties;
  /** 重试回调 */
  onRetry?: () => void;
}

export function ErrorFallback({
  error,
  message,
  showStack = process.env.NODE_ENV === 'development',
  className = '',
  style,
  onRetry,
}: ErrorFallbackProps) {
  const errorMessage =
    message ??
    (error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '渲染失败，请重试');

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '200px',
        background: 'var(--color-bg-secondary, #1e1e2e)',
        border: '1px solid var(--color-error, #ef4444)',
        borderRadius: '12px',
        color: 'var(--color-text-secondary, #e0e0e0)',
        gap: '8px',
        padding: '16px',
        ...style,
      }}
      role="alert"
      aria-live="assertive"
      data-testid="ddd-error-fallback"
    >
      <span style={{ fontSize: '32px', opacity: 0.7 }}>⚠️</span>
      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-error, #ef4444)' }}>
        {errorMessage}
      </span>
      {showStack && error instanceof Error && error.stack && (
        <details
          style={{
            marginTop: '8px',
            padding: '8px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
            fontSize: '11px',
            color: 'var(--color-text-muted, #a0a0b0)',
            maxWidth: '100%',
            overflow: 'auto',
          }}
        >
          <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
            错误详情
          </summary>
          <pre
            style={{
              marginTop: '8px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {error.stack}
          </pre>
        </details>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '8px',
            padding: '6px 16px',
            background: 'var(--color-primary, #3b82f6)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          重试
        </button>
      )}
    </div>
  );
}

export default { EmptyFallback, ErrorFallback };
