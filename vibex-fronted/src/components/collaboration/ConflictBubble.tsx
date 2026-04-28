'use client';

/**
 * ConflictBubble — S16-P1-1 Firebase Mock
 *
 * Shows connection status banner:
 * - DISCONNECTED: "Offline — changes queued"
 * - RECONNECTING: "Reconnecting..."
 * - CONNECTED: "Synced" then auto-dismiss
 */

import React, { useEffect, useState } from 'react';
import type { FirebaseMockState } from '@/lib/firebase/firebaseMock';
import styles from './ConflictBubble.module.css';

interface ConflictBubbleProps {
  /** Current Firebase state */
  state: FirebaseMockState;
  /** Called when user dismisses */
  onDismiss?: () => void;
}

export function ConflictBubble({
  state,
  onDismiss,
}: ConflictBubbleProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState<
    'warning' | 'error' | 'info' | 'success'
  >('info');
  const [autoDismissTimer, setAutoDismissTimer] = useState<
    ReturnType<typeof setTimeout> | null
  >(null);

  useEffect(() => {
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
      setAutoDismissTimer(null);
    }

    if (state === 'CONNECTED') {
      setMessage('Synced');
      setVariant('success');
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setAutoDismissTimer(null);
      }, 2000);
      setAutoDismissTimer(timer);
    } else if (state === 'DISCONNECTED') {
      setMessage('Offline — changes queued');
      setVariant('error');
      setVisible(true);
    } else if (state === 'RECONNECTING') {
      setMessage('Reconnecting...');
      setVariant('warning');
      setVisible(true);
    } else if (state === 'DEGRADED') {
      setMessage('Slow connection — some features limited');
      setVariant('warning');
      setVisible(true);
    } else {
      setVisible(false);
    }

    return () => {
      if (autoDismissTimer) {
        clearTimeout(autoDismissTimer);
      }
    };
  }, [state]);

  const handleDismiss = () => {
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
    }
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div
      className={`${styles.bubble} ${styles[`bubble--${variant}`]}`}
      data-testid="conflict-bubble"
      data-state={state}
      role="status"
      aria-live="polite"
    >
      <span className={styles.icon} data-testid="bubble-icon">
        {variant === 'error' && '⚠️'}
        {variant === 'warning' && '🔄'}
        {variant === 'success' && '✅'}
        {variant === 'info' && 'ℹ️'}
      </span>
      <span className={styles.message} data-testid="bubble-message">
        {message}
      </span>
      <button
        type="button"
        className={styles.dismiss}
        onClick={handleDismiss}
        data-testid="bubble-dismiss"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
