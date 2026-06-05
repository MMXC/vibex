/**
 * AISessionDrawer — Streaming AI Session Drawer
 * Sprint63 E4: AI 流式响应 + 可视化重试
 * Sprint64 E3: 新增"历史"Tab → 渲染 AIHistoryPanel
 *
 * Displays live streaming AI response with typewriter effect.
 * Retry button re-runs the last prompt.
 * Tab: "当前对话" = streaming view, "历史" = AIHistoryPanel
 *
 * Usage:
 * ```tsx
 * <AISessionDrawer
 *   sessionId={activeSessionId}
 *   onClose={() => setSessionDrawerOpen(false)}
 * />
 * ```
 */

'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useAgentStore } from '@/stores/dds/agentStore';
import { AIHistoryPanel } from './AIHistoryPanel';
import styles from './AISessionDrawer.module.css';

interface AISessionDrawerProps {
  /** Session ID to display streaming content for */
  sessionId: string | null;
  /** Callback when drawer should close */
  onClose: () => void;
}

export const AISessionDrawer = memo(function AISessionDrawer({
  sessionId,
  onClose,
}: AISessionDrawerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // S64-E3: History tab state
  const [activeTab, setActiveTab] = useState<'stream' | 'history'>('stream');

  // Store selectors
  const streamingContent = useAgentStore(
    sessionId ? (s) => s.streamingContent[sessionId] ?? '' : () => ''
  );
  const isStreaming = useAgentStore(
    sessionId ? (s) => s.isStreaming[sessionId] ?? false : () => false
  );
  const lastPrompt = useAgentStore(
    sessionId ? (s) => s.lastPrompt[sessionId] ?? '' : () => ''
  );
  const retryCount = useAgentStore(
    sessionId ? (s) => {
      const session = s.sessions.find((ses) => ses.id === sessionId);
      return session?.retryCount ?? 0;
    } : () => 0
  );
  const isRetrying = useAgentStore(
    sessionId ? (s) => {
      const session = s.sessions.find((ses) => ses.id === sessionId);
      return session?.isRetrying ?? false;
    } : () => false
  );

  // Actions
  const retryLastStream = useAgentStore((s) => s.retryLastStream);
  const cancelStream = useAgentStore((s) => s.cancelStream);
  const clearStreamContent = useAgentStore((s) => s.clearStreamContent);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamingContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId && isStreaming) {
        cancelStream(sessionId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = useCallback(() => {
    if (!sessionId) return;
    retryLastStream(sessionId);
  }, [sessionId, retryLastStream]);

  const handleCancel = useCallback(() => {
    if (!sessionId) return;
    cancelStream(sessionId);
  }, [sessionId, cancelStream]);

  const handleClose = useCallback(() => {
    if (sessionId && isStreaming) {
      cancelStream(sessionId);
    }
    clearStreamContent(sessionId ?? '');
    onClose();
  }, [sessionId, isStreaming, cancelStream, clearStreamContent, onClose]);

  const isOpen = !!sessionId;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
        onClick={handleClose}
        role="presentation"
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`${styles.drawer} ${isOpen ? styles.open : ''}`}
        role="dialog"
        aria-label="AI 流式响应"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>
            {isStreaming && <span className={styles.streamingDot} aria-hidden="true" />}
            <span>AI 流式响应</span>
            {isRetrying && (
              <span style={{ fontSize: '0.75rem', color: '#60A5FA' }}>
                (重试中...)
              </span>
            )}
          </div>
          <div className={styles.headerActions}>
            {/* S64-E3: Tab switcher */}
            <div className={styles.tabSwitcher} role="tablist" aria-label="AI 会话标签">
              <button
                className={`${styles.tabBtn} ${activeTab === 'stream' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('stream')}
                role="tab"
                aria-selected={activeTab === 'stream'}
                aria-controls="ai-panel-stream"
                type="button"
              >
                当前对话
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('history')}
                role="tab"
                aria-selected={activeTab === 'history'}
                aria-controls="ai-panel-history"
                type="button"
              >
                历史
              </button>
            </div>
            <button
              className={styles.btnClose}
              onClick={handleClose}
              aria-label="关闭"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content} ref={contentRef}>
          {/* S64-E3: Tab panels */}
          {activeTab === 'stream' ? (
            <>
          {/* Prompt block */}
          {lastPrompt && (
            <div className={styles.promptBlock}>
              <div className={styles.promptLabel}>Prompt</div>
              <div className={styles.promptText}>{lastPrompt}</div>
            </div>
          )}

          {/* Response block */}
          <div className={styles.responseBlock}>
            <div className={styles.responseLabel}>
              <span>AI 响应</span>
              {isStreaming && <span className={styles.streamingDot} aria-hidden="true" />}
            </div>
            <div className={styles.responseText}>
              {streamingContent || (isStreaming ? '' : '暂无响应内容')}
              {isStreaming && <span className={styles.cursor} aria-hidden="true" />}
            </div>
          </div>
            </>
          ) : (
            <div id="ai-panel-history" role="tabpanel" aria-label="历史记录">
              <AIHistoryPanel />
            </div>
          )}
        </div>

        {/* Retry info */}
        {retryCount > 0 && (
          <div className={styles.retryInfo}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M13.65 2.35A8 8 0 1 0 15 8h-2a6 6 0 1 1-1.76-4.24" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 2v4h-4" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            已重试 {retryCount} 次
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnRetry}`}
            onClick={handleRetry}
            disabled={isStreaming || !lastPrompt}
            aria-label="重试"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M13.65 2.35A8 8 0 1 0 15 8h-2a6 6 0 1 1-1.76-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 2v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            重试
          </button>

          {isStreaming && (
            <button
              className={`${styles.btn} ${styles.btnCancel}`}
              onClick={handleCancel}
              aria-label="停止生成"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              停止
            </button>
          )}

          {retryCount > 0 && (
            <span className={styles.retryBadge} aria-live="polite">
              {retryCount} 次重试
            </span>
          )}
        </div>
      </div>
    </>
  );
});
