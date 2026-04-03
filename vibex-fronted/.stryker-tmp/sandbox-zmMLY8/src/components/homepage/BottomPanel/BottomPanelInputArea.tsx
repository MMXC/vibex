/**
 * BottomPanelInputArea - 底部面板录入区
 * 规格: 80px 高度，textarea + send button，支持 5000 字，Ctrl+Enter 发送
 */
// @ts-nocheck

import React, { useState, useCallback, useEffect } from 'react';
import styles from './BottomPanelInputArea.module.css';

const MAX_CHARS = 5000;

export interface BottomPanelInputAreaProps {
  /** 占位符文本 */
  placeholder?: string;
  /** 输入值变化回调 */
  onChange?: (value: string) => void;
  /** 发送回调 */
  onSend?: (value: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否正在发送 */
  isSending?: boolean;
  /** 初始值（用于恢复草稿） */
  defaultValue?: string;
}

export function BottomPanelInputArea({
  placeholder = '输入需求或问题...',
  onChange,
  onSend,
  disabled = false,
  isSending = false,
  defaultValue = '',
}: BottomPanelInputAreaProps) {
  const [value, setValue] = useState(defaultValue);
  const [isOverLimit, setIsOverLimit] = useState(false);

  // 当外部 defaultValue 变化时同步
  useEffect(() => {
    setValue(defaultValue);
    setIsOverLimit(defaultValue.length > MAX_CHARS);
  }, [defaultValue]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      setIsOverLimit(newValue.length > MAX_CHARS);
      onChange?.(newValue);
    },
    [onChange]
  );

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !disabled && !isSending && !isOverLimit) {
      onSend?.(trimmed);
      setValue('');
      onChange?.('');
    }
  }, [value, disabled, isSending, isOverLimit, onSend, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // ST-6.10: Ctrl+Enter 发送，Shift+Enter 换行
      if (e.key === 'Enter') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleSend();
        }
        // 普通 Enter 不发送（保持换行）
      }
    },
    [handleSend]
  );

  const charCount = value.length;
  const isEmpty = !value.trim();

  return (
    <div
      className={styles.inputArea}
      data-testid="input-area"
    >
      <textarea
        className={`${styles.input} ${isOverLimit ? styles.overLimit : ''}`}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSending}
        rows={3}
        maxLength={MAX_CHARS + 100} // 允许略微超出方便体验
        data-testid="requirement-input"
        aria-label="需求输入框"
        aria-describedby="char-count-display"
      />
      {/* 字数统计 ST-6.2 */}
      <span
        id="char-count-display"
        className={`${styles.charCount} ${isOverLimit ? styles.charCountError : ''}`}
        data-testid="char-count"
        aria-live="polite"
      >
        {charCount}/{MAX_CHARS}
      </span>
      <button
        className={`${styles.sendBtn} ${isSending ? styles.loading : ''}`}
        onClick={handleSend}
        disabled={isEmpty || disabled || isSending || isOverLimit}
        type="button"
        title="发送 (Ctrl+Enter)"
        aria-label="发送消息"
        data-testid="send-btn"
      >
        {isSending ? '⏳' : '➤'}
      </button>
    </div>
  );
}

export default BottomPanelInputArea;
