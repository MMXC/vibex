/**
 * DDSErrorsFallback — Friendly error fallback UI for DDS canvas errors
 */

import React from 'react';
import { ErrorBoundaryFallbackProps } from './ErrorBoundary';
import styles from './DDSErrorsFallback.module.css';

/** Sanitize error message — strip file paths, tokens, secrets */
function sanitizeError(error: Error): string {
  return error.message
    .replace(/\/[\w/\-.]+\.(ts|tsx|js|jsx):\d+:\d+/g, '[file]:[line]')
    .replace(/at [\w$.<>\s()]+ \([^)]+\)/g, 'at [anonymous]')
    .replace(/(password|token|secret|key|api[_-]?key)\s*[:=]\s*["']?[\w-]+["']?/gi, '$1=[REDACTED]')
    .slice(0, 300);
}

export function DDSErrorsFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  const sanitizedMessage = sanitizeError(error);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleReport = () => {
    const body = encodeURIComponent(
      `Error: ${sanitizedMessage}\n\nUser Agent: ${navigator.userAgent}\nTime: ${new Date().toISOString()}`
    );
    window.location.href = `mailto:support@vibex.top?subject=${encodeURIComponent('[VibeX] Runtime Error')}&body=${body}`;
  };

  return (
    <div className={styles.container} role="alert" aria-live="assertive">
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5" />
            <path d="M12 7v6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="#ef4444" />
          </svg>
        </div>

        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.subtitle}>We encountered an unexpected error. Please try again.</p>

        <div className={styles.errorBox}>
          <span className={styles.errorLabel}>Error</span>
          <code className={styles.errorMessage}>{sanitizedMessage}</code>
        </div>

        <div className={styles.actions}>
          <button className={styles.retryButton} onClick={handleRetry}>
            Retry
          </button>
          <button className={styles.reportButton} onClick={handleReport}>
            Report Issue
          </button>
        </div>
      </div>
    </div>
  );
}

export default DDSErrorsFallback;
