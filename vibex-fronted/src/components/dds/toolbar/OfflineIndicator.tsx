/**
 * OfflineIndicator — P002-E3: Shows 🔴 when collaboration connection is down
 */

'use client';

import React from 'react';
import styles from './online-users.module.css';

export interface OfflineIndicatorProps {
  isConnected: boolean;
}

export function OfflineIndicator({ isConnected }: OfflineIndicatorProps) {
  if (isConnected) return null;

  return (
    <span
      className={styles.offline}
      title="协作连接已断开"
      aria-label="协作连接已断开"
      role="img"
    >
      🔴
    </span>
  );
}
