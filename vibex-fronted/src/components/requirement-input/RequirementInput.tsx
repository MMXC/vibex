/**
 * Requirement Input Component
 * 需求输入框组件
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import styles from './RequirementInput.module.css';

interface RequirementInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function RequirementInput({
  value: controlledValue,
  onChange,
  onSubmit,
  onClear,
  placeholder = '输入你的需求...',
  maxLength = 5000,
  disabled = false,
  autoFocus = false,
}: RequirementInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Controlled or uncontrolled
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = controlledValue !== undefined 
    ? (v: string) => onChange?.(v)
    : setInternalValue;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setValue(newValue);
    }
  }, [maxLength, setValue]);

  const handleClear = useCallback(() => {
    setValue('');
    onClear?.();
    textareaRef.current?.focus();
  }, [onClear, setValue]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSubmit?.(trimmed);
    }
  }, [value, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const charCount = value.length;
  const isOverLimit = charCount > maxLength;
  const canClear = value.length > 0;
  const canSubmit = value.trim().length > 0 && !disabled;

  return (
    <div className={`${styles.container} ${isFocused ? styles.focused : ''} ${disabled ? styles.disabled : ''}`}>
      <textarea
        ref={textareaRef}
        className={`${styles.textarea} ${isOverLimit ? styles.overLimit : ''}`}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        rows={1}
        aria-label="需求输入"
      />
      
      <div className={styles.footer}>
        <span className={`${styles.counter} ${isOverLimit ? styles.counterError : ''}`}>
          {charCount}/{maxLength}
        </span>
        
        <div className={styles.actions}>
          {canClear && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              disabled={disabled}
              aria-label="清空输入"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label="提交需求"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            <span>提交</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RequirementInput;
