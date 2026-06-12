/**
 * VersionHistoryPanel.tsx — Sprint93 E1: Canvas Version History
 *
 * Time-axis panel displaying canvas version history.
 * Allows users to view version metadata, preview snapshots, and restore versions.
 */
'use client';

import React from 'react';
import { useVersionStore } from '@/stores/versionStore';
import type { CanvasVersion } from '@/stores/versionStore';
import styles from './VersionHistoryPanel.module.css';

interface VersionHistoryPanelProps {
  canvasId: string;
  onSnapshotRequest?: () => void;
  /** Called when the user clicks Restore on a version */
  onRestore?: (version: CanvasVersion) => void;
}

function formatTimestamp(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins <= 1 ? '刚刚' : `${diffMins} 分钟前`;
  }
  if (diffHours < 24) {
    return `${Math.floor(diffHours)} 小时前`;
  }
  if (diffHours < 24 * 7) {
    return `${Math.floor(diffHours / 24)} 天前`;
  }
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function VersionItem({
  version,
  isLatest,
  isActive,
  isRestoring,
  onPreview,
  onRestore,
}: {
  version: CanvasVersion;
  isLatest: boolean;
  isActive: boolean;
  isRestoring: boolean;
  onPreview: () => void;
  onRestore: () => void;
}) {
  return (
    <div
      className={[
        styles.versionItem,
        isActive ? styles.active : '',
        isRestoring ? styles.loading : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onPreview}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPreview(); }}
    >
      <div className={styles.timelineDot}>
        <div className={styles.timelineLine} />
        <div className={[styles.dot, isLatest ? styles.latest : ''].filter(Boolean).join(' ')} />
      </div>
      <div className={styles.versionContent}>
        <div className={styles.versionHeader}>
          <span className={styles.versionNumber}>
            v{version.versionNumber}
            {isLatest && <span style={{ marginLeft: '0.25rem', color: 'var(--color-green, #00ff88)' }}>最新</span>}
          </span>
          <span className={styles.versionTime}>{formatTimestamp(version.createdAt)}</span>
        </div>
        {version.description && (
          <p className={styles.versionDesc} title={version.description}>
            {version.description}
          </p>
        )}
        <div className={styles.versionMeta}>
          <button
            className={styles.restoreBtn}
            onClick={(e) => { e.stopPropagation(); onRestore(); }}
            disabled={isRestoring || isLatest}
            title={isLatest ? '当前版本' : '恢复到该版本'}
          >
            {isRestoring ? '恢复中…' : '恢复'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function VersionHistoryPanel({ canvasId, onSnapshotRequest, onRestore }: VersionHistoryPanelProps) {
  const {
    versionsByCanvas,
    previewVersionId,
    isLoading,
    error,
    isPanelOpen,
    fetchVersions,
    restoreVersion,
    setPreviewVersion,
    setPanelOpen,
    clearError,
  } = useVersionStore();

  const versions = versionsByCanvas[canvasId] ?? [];
  const latestVersionNumber = versions.length > 0 ? versions[0]!.versionNumber : 0;

  React.useEffect(() => {
    if (isPanelOpen && versions.length === 0) {
      fetchVersions(canvasId);
    }
  }, [isPanelOpen, canvasId, versions.length, fetchVersions]);

  const handlePreview = React.useCallback(
    (versionId: string) => {
      setPreviewVersion(versionId);
    },
    [setPreviewVersion]
  );

  const handleRestore = React.useCallback(
    async (versionId: string) => {
      const v = versions.find((ver) => ver.id === versionId);
      if (!v) return;
      onRestore?.(v);
      await restoreVersion(versionId);
    },
    [versions, restoreVersion, onRestore]
  );

  const handleRefresh = React.useCallback(() => {
    fetchVersions(canvasId);
  }, [canvasId, fetchVersions]);

  if (!isPanelOpen) return null;

  return (
    <div className={styles.panel} role="complementary" aria-label="版本历史">
      <div className={styles.header}>
        <h3 className={styles.title}>版本历史</h3>
        <button
          className={styles.closeBtn}
          onClick={() => setPanelOpen(false)}
          aria-label="关闭版本历史"
          title="关闭"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          <span className={styles.errorMsg}>{error}</span>
          <button className={styles.errorDismiss} onClick={clearError} aria-label="关闭错误">✕</button>
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.snapshotBtn}
          onClick={onSnapshotRequest}
          disabled={isLoading}
          title="保存当前画布状态为新版本"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="17,21 17,13 7,13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 3l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          创建快照
        </button>
        <button
          className={styles.refreshBtn}
          onClick={handleRefresh}
          disabled={isLoading}
          title="刷新版本列表"
          aria-label="刷新"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="1,4 1,10 7,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.51 15a9 9 0 1 0 .49-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className={styles.timeline}>
        {isLoading && versions.length === 0 ? (
          <div className={styles.empty}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>加载中…</span>
          </div>
        ) : versions.length === 0 ? (
          <div className={styles.empty}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" />
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>暂无版本记录</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>点击「创建快照」保存当前画布</span>
          </div>
        ) : (
          versions.map((version) => (
            <VersionItem
              key={version.id}
              version={version}
              isLatest={version.versionNumber === latestVersionNumber}
              isActive={version.id === previewVersionId}
              isRestoring={isLoading}
              onPreview={() => handlePreview(version.id)}
              onRestore={() => handleRestore(version.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
