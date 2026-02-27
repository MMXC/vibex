import React, { forwardRef } from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'filled' | 'glass';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  variant = 'default',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={`${styles.inputWrapper} ${styles[variant]} ${hasError ? styles.error : ''}`}>
        {icon && iconPosition === 'left' && (
          <span className={`${styles.icon} ${styles.iconLeft}`}>{icon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${styles.input} ${icon ? styles[`icon-${iconPosition}`] : ''}`}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <span className={`${styles.icon} ${styles.iconRight}`}>{icon}</span>
        )}
        {hasError && (
          <span className={styles.errorIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
        )}
      </div>
      {(error || hint) && (
        <span className={`${styles.message} ${hasError ? styles.errorMessage : styles.hintMessage}`}>
          {error || hint}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
