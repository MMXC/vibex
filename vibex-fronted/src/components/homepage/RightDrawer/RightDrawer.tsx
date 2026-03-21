/**
 * RightDrawer - 右侧抽屉：AI 思考过程展示
 * 
 * Epic 5: SSE 流式 + AI展示区
 * 
 * Features:
 * - 320px right drawer (architecture.md: "RP[RightDrawer 320px]")
 * - Shows streaming AI thinking text via StreamingText component
 * - SSE status indicator (connecting/connected/reconnecting/error)
 * - Collapsible with animation
 * - Auto-scrolls to latest content
 * 
 * Red lines:
 * - R-1: Does NOT break existing 6-step flow (purely display component)
 */

'use client';

import React, { useEffect, useRef } from 'react';
import type { SSEStatus } from '../hooks/useSSEStream';
import { StreamingText } from './StreamingText';
import styles from './RightDrawer.module.css';

export interface RightDrawerProps {
  /** 是否打开 */
  isOpen?: boolean;
  /** 流式文本内容 */
  streamingText?: string;
  /** SSE 连接状态 */
  sseStatus?: SSEStatus;
  /** 重连次数 */
  reconnectCount?: number;
  /** 错误消息 */
  errorMessage?: string | null;
  /** 关闭回调 */
  onClose?: () => void;
}

/** SSE 状态对应的中文文本 */
const STATUS_TEXT: Record<SSEStatus, string> = {
  idle: '等待连接',
  connecting: '正在连接...',
  connected: '已连接',
  reconnecting: '重连中...',
  error: '连接错误',
  failed: '连接失败',
};

/** SSE 状态对应的颜色 */
const STATUS_COLOR: Record<SSEStatus, string> = {
  idle: '#9ca3af',
  connecting: '#f59e0b',
  connected: '#10b981',
  reconnecting: '#f59e0b',
  error: '#ef4444',
  failed: '#dc2626',
};

export const RightDrawer: React.FC<RightDrawerProps> = ({
  isOpen = false,
  streamingText = '',
  sseStatus = 'idle',
  reconnectCount = 0,
  errorMessage = null,
  onClose,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when streaming text updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamingText]);

  if (!isOpen) return null;

  return (
    <aside
      className={styles.drawer}
      data-testid="right-drawer"
      data-sse-status={sseStatus}
      data-reconnect-count={reconnectCount}
    >
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>AI 思考过程</span>
          {/* SSE Status Indicator */}
          <span
            className={styles.statusDot}
            style={{ backgroundColor: STATUS_COLOR[sseStatus] }}
            title={STATUS_TEXT[sseStatus]}
            data-testid="sse-status-dot"
          />
        </div>
        <button
          className={styles.closeButton}
          onClick={onClose}
          data-testid="right-drawer-close"
          aria-label="关闭右侧抽屉"
        >
          ✕
        </button>
      </header>

      {/* Status Bar */}
      <div className={styles.statusBar} data-testid="sse-status-bar">
        <span
          className={styles.statusText}
          data-testid="sse-status-text"
        >
          {STATUS_TEXT[sseStatus]}
          {sseStatus === 'reconnecting' && reconnectCount > 0 && (
            <span className={styles.reconnectCount}>
              (重试 {reconnectCount}/3)
            </span>
          )}
        </span>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className={styles.errorMessage} data-testid="sse-error-message">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Streaming Content */}
      <div
        className={styles.content}
        ref={scrollRef}
        data-testid="streaming-content"
      >
        {streamingText ? (
          <StreamingText
            text={streamingText}
            data-testid="streaming-text"
          />
        ) : (
          <div className={styles.emptyState} data-testid="empty-streaming">
            <span className={styles.emptyIcon}>💭</span>
            <p>输入需求后，AI 思考过程将显示在这里</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightDrawer;
