/**
 * CardTreeError — Error state view for CardTree
 *
 * Shows when API request fails with:
 * - Error message (network error, timeout, server error)
 * - Retry button to refetch data
 */
// @ts-nocheck


'use client';

import React from 'react';
import styles from './CardTree.module.css';

export interface CardTreeErrorProps {
  /** Error message to display */
  message: string;
  /** Callback to retry the request */
  onRetry: () => void;
  /** Custom class name */
  className?: string;
}

/**
 * CardTreeError — Displays error state with retry action
 */
export function CardTreeError({ message, onRetry, className }: CardTreeErrorProps) {
  return (
    <div
      className={`${styles.error} ${className ? ` ${className}` : ''}`}
      data-testid="cardtree-error"
      role="alert"
      aria-live="polite"
    >
      <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
      <p className={styles.errorText} data-testid="error-message">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={styles.retryButton}
        data-testid="retry-button"
        aria-label="重试"
      >
        重试
      </button>
    </div>
  );
}
