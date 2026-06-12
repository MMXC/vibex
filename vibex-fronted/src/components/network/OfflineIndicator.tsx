/**
 * OfflineIndicator.tsx — S93-E3: Offline-First PWA Enhancement
 *
 * A non-intrusive banner that shows:
 * - Offline status (amber warning bar when disconnected)
 * - Sync queue indicator (animated spinner when syncing)
 * - Pending operations count badge
 *
 * Renders nothing when online and no pending operations.
 *
 * @module components/network/OfflineIndicator
 */

'use client';

import { useOfflineSync } from '@/lib/offline/useOfflineSync';
import styles from './OfflineIndicator.module.css';

// ==================== Icons ====================

function WifiOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function SyncIcon({ syncing }: { syncing: boolean }) {
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
      className={syncing ? styles.spinning : styles.idle}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function CloudOffIcon() {
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
    >
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M9.34 9.34A4 4 0 0 0 6 12a5 5 0 0 0 9.18-3.05" />
      <path d="M21.17 17.17A5 5 0 0 0 13 8a4 4 0 0 0-7.66 2.96" />
    </svg>
  );
}

// ==================== Component ====================

export function OfflineIndicator() {
  const { isOffline, pendingOps, syncState } = useOfflineSync();

  // Don't render when online and no pending ops
  if (!isOffline && pendingOps === 0) {
    return null;
  }

  const isSyncing = syncState === 'syncing';

  return (
    <div
      className={`${styles.bar} ${isOffline ? styles.offline : styles.online}`}
      role="status"
      aria-live="polite"
      aria-label={
        isOffline
          ? '离线模式'
          : isSyncing
            ? `正在同步 ${pendingOps} 个待处理操作`
            : `${pendingOps} 个待处理操作`
      }
    >
      <div className={styles.inner}>
        {/* Left: Status icon + label */}
        <div className={styles.status}>
          {isOffline ? (
            <>
              <WifiOffIcon />
              <span>离线模式</span>
            </>
          ) : (
            <>
              <CloudOffIcon />
              <span>{pendingOps} 个待处理操作</span>
            </>
          )}
        </div>

        {/* Right: Sync indicator */}
        {(isOffline || pendingOps > 0) && (
          <div className={styles.syncBadge}>
            <SyncIcon syncing={isSyncing} />
            {isSyncing ? (
              <span>同步中...</span>
            ) : pendingOps > 0 ? (
              <span>{pendingOps}</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
