/**
 * Dialogue Input Area Component
 * 用户输入区域
 */
// @ts-nocheck


'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import styles from './InputArea.module.css';

export interface InputAreaProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function InputArea({ onSubmit, disabled, placeholder = '输入你的需求描述...', maxLength = 2000 }: InputAreaProps) {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
      setText('');
    }
  }, [text, onSubmit, disabled]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const charCount = text.length;
  const isOverLimit = charCount > maxLength;

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <textarea
          className={`${styles.textarea} ${isOverLimit ? styles.error : ''}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
        />
        <div className={styles.footer}>
          <span className={`${styles.charCount} ${isOverLimit ? styles.error : ''}`}>
            {charCount}/{maxLength}
          </span>
          <button
            type="button"
            className={styles.sendButton}
            onClick={handleSubmit}
            disabled={disabled || !text.trim() || isOverLimit}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

export default InputArea;
