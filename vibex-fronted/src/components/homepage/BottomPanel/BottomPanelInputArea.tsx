/**
 * BottomPanelInputArea - 底部面板录入区
 * 规格: 80px 高度，input + send button
 */
import React, { useState, useCallback } from 'react';
import styles from './BottomPanelInputArea.module.css';

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
}

export function BottomPanelInputArea({
  placeholder = '输入需求或问题...',
  onChange,
  onSend,
  disabled = false,
  isSending = false,
}: BottomPanelInputAreaProps) {
  const [value, setValue] = useState('');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      onChange?.(e.target.value);
    },
    [onChange]
  );

  const handleSend = useCallback(() => {
    if (value.trim() && !disabled && !isSending) {
      onSend?.(value.trim());
      setValue('');
    }
  }, [value, disabled, isSending, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div
      className={styles.inputArea}
      data-testid="input-area"
    >
      <textarea
        className={styles.input}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSending}
        rows={2}
      />
      <button
        className={styles.sendBtn}
        onClick={handleSend}
        disabled={!value.trim() || disabled || isSending}
        type="button"
        title="发送"
        aria-label="发送消息"
      >
        {isSending ? '⏳' : '➤'}
      </button>
    </div>
  );
}

export default BottomPanelInputArea;
