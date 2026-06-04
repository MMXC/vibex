/**
 * OfflineBanner — 网络离线状态提示 + 同步状态可视化
 * E05-S4: 离线时显示 banner，重新上线后自动隐藏
 * F1.4-U1: 扩展支持离线写入队列的同步状态
 * S63-E3 D3.5: 扩展显示 canvas 操作队列 pendingOps 数量
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPendingCount, getQueueSize } from '@/lib/offline-queue';
import { useTranslations } from '@/hooks/useTranslations';
import styles from './OfflineBanner.module.css';

export function OfflineBanner() {
  const t = useTranslations('canvas')();
  const [isOffline, setIsOffline] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [canvasPendingCount, setCanvasPendingCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load pending count from offline queue (HTTP requests + canvas operations)
  const refreshPendingCount = useCallback(async () => {
    try {
      const [httpCount, canvasCount] = await Promise.all([
        getPendingCount(),
        getQueueSize(),
      ]);
      setPendingCount(httpCount);
      setCanvasPendingCount(canvasCount);
      const total = httpCount + canvasCount;
      setTotalCount((prev) => prev === 0 ? total : prev);
    } catch {
      // Silently fail — we don't want to break the banner
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  // Listen to replay progress events
  useEffect(() => {
    const handleProgress = (e: CustomEvent) => {
      const detail = e.detail;
      if (detail.type === 'progress') {
        setPendingCount(detail.total - detail.completed - detail.failed);
        setTotalCount(detail.total);
        setIsSyncing(true);
        setSyncError(null);
      } else if (detail.type === 'complete') {
        setPendingCount(0);
        setIsSyncing(false);
        setSyncError(null);
        // Hide banner after 2s delay
        setTimeout(() => {
          setHidden(true);
        }, 2000);
      } else if (detail.type === 'error') {
        setSyncError(detail.lastError ?? 'Sync failed, please check network');
        setIsSyncing(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('offline-replay-progress', handleProgress as EventListener);
      return () => {
        window.removeEventListener('offline-replay-progress', handleProgress as EventListener);
      };
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Hide after 5s if no pending items
      if (pendingCount === 0) {
        setTimeout(() => setHidden(true), 5000);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setHidden(false);
      refreshPendingCount();
    };

    // Initial state
    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingCount, refreshPendingCount]);

  // Show sync banner when there are pending items (online or offline)
  const totalPending = pendingCount + canvasPendingCount;
  const showSyncBanner = !hidden && (isOffline || totalPending > 0 || isSyncing);
  if (!showSyncBanner) return null;

  return (
    <div
      className={styles.banner}
      data-testid="offline-banner"
      role="alert"
      aria-live="polite"
      data-sync-error={syncError !== null}
    >
      <span className={styles.icon}>
        {isSyncing ? '🔄' : isOffline ? '📡' : syncError ? '⚠️' : '✅'}
      </span>

      <div className={styles.content}>
        {isOffline && (
          <span className={styles.text}>{t('offlineMode')}</span>
        )}

        {pendingCount > 0 && !isOffline && (
          <span className={styles.text}>
            {t('pendingChanges', { count: pendingCount })}
            {canvasPendingCount > 0 && ` + ${canvasPendingCount} canvas ops`}
          </span>
        )}

        {isSyncing && (
          <div
            className={styles.progressBar}
            role="progressbar"
            data-sync-progress="true"
            aria-valuenow={totalCount - pendingCount}
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-label={`${t('syncingPending', { count: pendingCount })} ${totalCount - pendingCount}/${totalCount}`}
          >
            <div
              className={styles.progressFill}
              style={{
                width: `${totalCount > 0 ? ((totalCount - pendingCount) / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        )}

        {syncError && (
          <span className={`${styles.text} ${styles.errorText}`}>
            {syncError}
          </span>
        )}
      </div>
    </div>
  );
}
