/**
 * ConnectionStatus.tsx — Sprint49 P001-E1
 *
 * Displays AI streaming connection status via a RetryBadge.
 * Shows: "正在重连 (N/3)" / "请求超时" / "重连成功" / hidden (idle)
 */

import React from 'react';
import { type RetryStatus } from '@/hooks/useStreamingAgent';
import styles from './ConnectionStatus.module.css';

export interface ConnectionStatusProps {
  /** Current retry status from useStreamingAgent */
  retryStatus: RetryStatus;
  /** Current retry attempt count */
  retryCount?: number;
  /** Max retries (used in "正在重连 (N/M)" label) */
  maxRetries?: number;
  /** Additional CSS class */
  className?: string;
}

const STATUS_LABELS: Record<RetryStatus, string> = {
  idle: '',
  retrying: '',
  timeout: '请求超时',
  success: '重连成功',
};

export function ConnectionStatus({
  retryStatus,
  retryCount = 0,
  maxRetries = 3,
  className = '',
}: ConnectionStatusProps) {
  if (retryStatus === 'idle') {
    return null;
  }

  const label =
    retryStatus === 'retrying'
      ? `正在重连 (${retryCount}/${maxRetries})`
      : STATUS_LABELS[retryStatus];

  const variant =
    retryStatus === 'retrying'
      ? 'warning'
      : retryStatus === 'timeout'
      ? 'error'
      : 'success';

  return (
    <span className={`${styles.connectionStatus} ${styles[variant]} ${className}`}>
      {retryStatus === 'retrying' && <span className={styles.pulse} />}
      {label}
    </span>
  );
}

export default ConnectionStatus;
