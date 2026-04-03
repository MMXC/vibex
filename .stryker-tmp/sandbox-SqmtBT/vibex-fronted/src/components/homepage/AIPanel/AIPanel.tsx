/**
 * AIPanel - AI 助手面板
 * E3-S3.3: AIPanel 核心交互实现
 * - 发送功能 (loading 状态, 错误处理, 重试)
 * - 关闭功能 (Esc 快捷键, 未发送内容确认)
 * - 交互细节 (输入验证, Ctrl+Enter 发送, 响应滚动)
 */
// @ts-nocheck

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './AIPanel.module.css';
import type { AIPanelProps, AIMessage } from '../types';

export const AIPanel: React.FC<AIPanelProps> = ({
  isOpen = false,
  messages = [],
  onClose,
  onSendMessage,
  newItemId,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // E3-S3.3 AC7: 消息区域自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // E3-S3.3 AC5: Esc 键关闭面板
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // E3-S3.3 AC6: 有未发送内容时显示确认
        if (inputValue.trim()) {
          setShowCloseConfirm(true);
        } else {
          onClose?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inputValue, onClose]);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // E3-S3.3: 发送消息
  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setSendError(null);

    try {
      await onSendMessage?.(trimmed);
      setInputValue('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '发送失败，请重试';
      setSendError(msg);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputValue, isSending, onSendMessage]);

  // E3-S3.3 AC8: Ctrl+Enter / Cmd+Enter 发送
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleSend();
        }
      }
    },
    [handleSend]
  );

  // E3-S3.3 AC6: 确认关闭
  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    setInputValue('');
    onClose?.();
  }, [onClose]);

  const handleCancelClose = useCallback(() => {
    setShowCloseConfirm(false);
    inputRef.current?.focus();
  }, []);

  // E3-S3.3 AC5: 直接关闭
  const handleClose = useCallback(() => {
    if (inputValue.trim()) {
      setShowCloseConfirm(true);
    } else {
      onClose?.();
    }
  }, [inputValue, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.aiPanel} role="dialog" aria-label="AI 助手" aria-modal="true">
      {/* 头部 */}
      <div className={styles.header}>
        <span className={styles.title}>AI 助手</span>
        <button
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="关闭 AI 助手"
          title="关闭 (Esc)"
        >
          ✕
        </button>
      </div>

      {/* 消息列表 E3-S3.3 AC7: 滚动查看 */}
      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.empty}>暂无消息</div>
        ) : (
          <>
            {messages.map((msg: AIMessage) => {
              const isThinking = msg.id.startsWith('thinking-');
              const isNew = newItemId === msg.id;
              return (
                <div
                  key={msg.id}
                  className={[
                    styles.message,
                    styles[msg.role],
                    isThinking ? styles['thinking-item'] : '',
                    isNew ? styles.new : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-thinking={isThinking ? 'true' : undefined}
                >
                  <div className={styles.messageContent}>{msg.content}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* E3-S3.3 AC4: 发送失败错误 + 重试按钮 */}
        {sendError && (
          <div className={styles.errorBanner} role="alert">
            <span className={styles.errorText}>{sendError}</span>
            <button
              className={styles.retryButton}
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
            >
              重试
            </button>
            <button
              className={styles.dismissError}
              onClick={() => setSendError(null)}
              aria-label="关闭错误"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 关闭确认弹窗 E3-S3.3 AC6 */}
      {showCloseConfirm && (
        <div className={styles.confirmOverlay} role="dialog" aria-modal="true" aria-label="确认关闭">
          <div className={styles.confirmBox}>
            <p className={styles.confirmText}>有未发送的内容，确定要关闭吗？</p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancel}
                onClick={handleCancelClose}
              >
                取消
              </button>
              <button
                className={styles.confirmOk}
                onClick={handleConfirmClose}
              >
                确定关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 输入区 E3-S3.3: loading 状态, Ctrl+Enter 发送 */}
      <div className={styles.inputArea}>
        <input
          ref={inputRef}
          className={styles.input}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="向 AI 提问..."
          disabled={isSending}
          aria-label="向 AI 提问"
          data-testid="ai-input"
        />
        <button
          className={`${styles.sendButton} ${isSending ? styles.sending : ''}`}
          onClick={handleSend}
          disabled={!inputValue.trim() || isSending}
          aria-label={isSending ? '发送中...' : '发送消息 (Ctrl+Enter)'}
          title="发送 (Ctrl+Enter)"
          data-testid="ai-send-btn"
        >
          {isSending ? '⏳' : '发送'}
        </button>
      </div>
    </div>
  );
};

export default AIPanel;
