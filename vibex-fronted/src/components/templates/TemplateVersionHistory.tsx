'use client';

/**
 * TemplateVersionHistory — S93-E2: Template Versioning & Fork
 *
 * Time-axis panel displaying template version history.
 * Allows template authors to view version metadata, pin versions,
 * and see downstream canvas usage.
 */

import React from 'react';
import styles from './TemplateVersionHistory.module.css';

export interface TemplateVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  description: string | null;
  snapshotJson: string | null;
  pinned: boolean;
  createdBy: string;
  createdAt: number; // unix seconds
}

interface TemplateVersionHistoryProps {
  templateId: string;
  versions: TemplateVersion[];
  isLoading: boolean;
  error: string | null;
  onPin: (versionId: string, pinned: boolean) => void;
  onClose: () => void;
  onRefresh: () => void;
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
  onPin,
  isPinning,
}: {
  version: TemplateVersion;
  isLatest: boolean;
  onPin: (versionId: string, pinned: boolean) => void;
  isPinning: boolean;
}) {
  return (
    <div className={[styles.versionItem, version.pinned ? styles.pinned : ''].filter(Boolean).join(' ')}>
      <div className={styles.timelineDot}>
        <div className={styles.timelineLine} />
        <div className={[styles.dot, isLatest ? styles.latest : '', version.pinned ? styles.dotPinned : ''].filter(Boolean).join(' ')} />
      </div>
      <div className={styles.versionContent}>
        <div className={styles.versionHeader}>
          <span className={styles.versionNumber}>
            v{version.versionNumber}
            {isLatest && <span className={styles.latestBadge}>最新</span>}
            {version.pinned && !isLatest && <span className={styles.pinnedBadge}>已固定</span>}
          </span>
          <span className={styles.versionTime}>{formatTimestamp(version.createdAt)}</span>
        </div>
        {version.description && (
          <p className={styles.versionDesc} title={version.description}>
            {version.description}
          </p>
        )}
        <div className={styles.versionActions}>
          <button
            className={styles.pinBtn}
            onClick={() => onPin(version.id, !version.pinned)}
            disabled={isPinning}
            title={version.pinned ? '取消固定该版本' : '固定该版本（下游画布将使用此版本）'}
          >
            {isPinning ? '处理中…' : version.pinned ? '取消固定' : '固定版本'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TemplateVersionHistory({
  templateId,
  versions,
  isLoading,
  error,
  onPin,
  onClose,
  onRefresh,
}: TemplateVersionHistoryProps) {
  const [isPinning, setIsPinning] = React.useState(false);

  const handlePin = React.useCallback(
    async (versionId: string, pinned: boolean) => {
      setIsPinning(true);
      try {
        await onPin(versionId, pinned);
      } finally {
        setIsPinning(false);
      }
    },
    [onPin]
  );

  const latestVersionNumber = versions.length > 0 ? versions[0]!.versionNumber : 0;

  return (
    <div className={styles.panel} role="complementary" aria-label="模板版本历史">
      <div className={styles.header}>
        <h3 className={styles.title}>版本历史</h3>
        <div className={styles.headerActions}>
          <button
            className={styles.iconBtn}
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="刷新"
            title="刷新"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="1,4 1,10 7,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.51 15a9 9 0 1 0 .49-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭版本历史"
            title="关闭"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <span className={styles.errorMsg}>{error}</span>
        </div>
      )}

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
            <span className={styles.emptyHint}>保存模板后自动创建第一个版本</span>
          </div>
        ) : (
          versions.map((version) => (
            <VersionItem
              key={version.id}
              version={version}
              isLatest={version.versionNumber === latestVersionNumber}
              onPin={handlePin}
              isPinning={isPinning}
            />
          ))
        )}
      </div>
    </div>
  );
}
