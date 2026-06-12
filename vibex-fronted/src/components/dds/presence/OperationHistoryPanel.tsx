/**
 * OperationHistoryPanel — S91-E3-F3: 操作历史实时同步
 *
 * Collapsible panel showing the last 10 collaborative operations in real-time.
 * Mounted inside PresenceOverlay. Each operation shows:
 * - Icon per operation type (add/delete/edit-property/move)
 * - User name
 * - Operation description
 * - Relative timestamp
 */

'use client';

import React, { memo, useState } from 'react';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import type { OperationType } from '@/lib/collaboration/presenceStore';
import styles from './OperationHistoryPanel.module.css';

/** S91-E3-F3: Icons per operation type */
function OperationIcon({ type }: { type: OperationType }) {
  switch (type) {
    case 'add':
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`${styles.opIcon} ${styles.opIconAdd}`}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'delete':
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`${styles.opIcon} ${styles.opIconDelete}`}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'edit-property':
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`${styles.opIcon} ${styles.opIconEdit}`}
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case 'move':
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`${styles.opIcon} ${styles.opIconMove}`}
        >
          <polyline points="5 9 2 12 5 15" />
          <polyline points="9 5 12 2 15 5" />
          <polyline points="15 19 12 22 9 19" />
          <polyline points="19 9 22 12 19 15" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="12" y1="2" x2="12" y2="22" />
        </svg>
      );
  }
}

/** Format relative time (e.g., "刚刚", "2分钟前") */
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 5_000) return '刚刚';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}秒前`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;
  return `${Math.floor(diff / 86_400_000)}天前`;
}

/** Single operation row */
function OperationRow({
  userName,
  operationType,
  description,
  timestamp,
}: {
  userName: string;
  operationType: OperationType;
  description: string;
  timestamp: number;
}) {
  return (
    <div className={styles.opRow} data-testid={`op-history-row-${operationType}`}>
      <OperationIcon type={operationType} />
      <div className={styles.opContent}>
        <span className={styles.opUser}>{userName}</span>
        <span className={styles.opDesc}>{description}</span>
      </div>
      <span className={styles.opTime} title={new Date(timestamp).toLocaleTimeString()}>
        {formatRelativeTime(timestamp)}
      </span>
    </div>
  );
}

export const OperationHistoryPanel = memo(function OperationHistoryPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const operationHistory = usePresenceStore((s) => s.operationHistory);

  if (operationHistory.length === 0) {
    return null;
  }

  return (
    <div
      className={`${styles.panel} ${collapsed ? styles.panelCollapsed : ''}`}
      data-testid="op-history-panel"
      data-count={operationHistory.length}
    >
      {/* Header */}
      <button
        className={styles.header}
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        data-testid="op-history-toggle"
      >
        <div className={styles.headerLeft}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={styles.headerIcon}
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className={styles.headerTitle}>操作历史</span>
          <span className={styles.headerCount}>{operationHistory.length}</span>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`${styles.chevron} ${collapsed ? styles.chevronCollapsed : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Operation list */}
      {!collapsed && (
        <div className={styles.list} data-testid="op-history-list">
          {operationHistory.map((op, index) => (
            <OperationRow
              key={`${op.targetId}-${op.timestamp}-${index}`}
              userName={op.userName}
              operationType={op.operationType}
              description={op.description}
              timestamp={op.timestamp}
            />
          ))}
        </div>
      )}
    </div>
  );
});
