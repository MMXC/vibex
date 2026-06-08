/**
 * OfflineBanner.tsx — Sprint77 E4: 画布离线状态提示
 *
 * Shown when the browser goes offline. Displays pending change count.
 */

'use client';

import React, { memo } from 'react';
import { useCanvasOfflineStore } from '@/stores/canvasOfflineStore';

interface OfflineBannerProps {
  /** Whether the banner is visible (only shown when offline) */
  open?: boolean;
}

const OfflineBanner = memo(function OfflineBanner({ open = true }: OfflineBannerProps) {
  const isOffline = useCanvasOfflineStore((s) => s.isOffline);
  const pendingCount = useCanvasOfflineStore((s) => s.pendingQueue.length);
  const syncStatus = useCanvasOfflineStore((s) => s.syncStatus);

  if (!open || !isOffline) return null;

  const showConflict = syncStatus === 'conflict';
  const showSyncing = syncStatus === 'syncing';
  const pending = pendingCount;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '8px 16px',
        background: showConflict ? '#f59e0b' : showSyncing ? '#3b82f6' : '#ef4444',
        color: '#fff',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      role="status"
      aria-live="polite"
    >
      <span>
        {showConflict
          ? '⚠️ 检测到冲突 — 请选择保留本地更改或接受远程版本'
          : showSyncing
          ? '🔄 正在同步离线更改...'
          : '📴 离线模式 — 更改将在恢复网络后同步'}
      </span>
      {pending > 0 && !showSyncing && (
        <span style={{ fontWeight: 600 }}>
          ({pending} 项待同步)
        </span>
      )}
    </div>
  );
});

export { OfflineBanner };
