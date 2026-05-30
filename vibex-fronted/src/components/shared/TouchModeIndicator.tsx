/**
 * TouchModeIndicator.tsx — Shows when canvas switches to touch mode
 *
 * E5: 移动端触控支持
 * Displays a dismissable indicator when touch mode is active on the canvas.
 * Uses the app's existing design tokens.
 */

'use client';

import React, { memo, useState, useEffect } from 'react';
import styles from './TouchModeIndicator.module.css';

export interface TouchModeIndicatorProps {
  /** Whether touch mode is currently active */
  active: boolean;
  /** Callback when indicator is manually dismissed */
  onDismiss?: () => void;
}

export const TouchModeIndicator = memo(function TouchModeIndicator({
  active,
  onDismiss,
}: TouchModeIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      // Auto-hide after 3 seconds (gesture guidance only)
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!visible || !active) return null;

  return (
    <div
      className={styles.indicator}
      role="status"
      aria-live="polite"
      data-testid="touch-mode-indicator"
    >
      <span className={styles.icon} aria-hidden="true">
        {/* Touch hand icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 3a2 2 0 0 0-2 2v6c0 1.1.9 2 2 2h1v5a2 2 0 0 0 4 0v-5h1a2 2 0 0 0 4 0v5a2 2 0 0 0 4 0v-9a2 2 0 0 0-4 0V8h-1V5a2 2 0 0 0-4 0V8h-1V5a2 2 0 0 0-2-2H9z"/>
        </svg>
      </span>
      <span className={styles.label}>触控模式已开启</span>
      {onDismiss && (
        <button
          className={styles.dismiss}
          onClick={() => { setVisible(false); onDismiss(); }}
          aria-label="关闭触控模式提示"
        >
          ×
        </button>
      )}
    </div>
  );
});
