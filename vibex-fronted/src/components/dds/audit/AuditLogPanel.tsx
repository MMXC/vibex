/**
 * AuditLogPanel.tsx — S94-E3: Canvas Audit Log
 *
 * Right-side slide-in panel showing canvas audit log timeline.
 * Filter by user / time / operation type.
 * Export CSV for admins.
 *
 * data-testid="audit-log-panel"
 */
'use client';

import React, { memo, useCallback, useEffect } from 'react';
import { useAuditStore, AuditAction, formatAuditAction, formatEntityType } from '@/stores/auditStore';
import { useAuditLog } from '@/hooks/canvas/useAuditLog';
import styles from './AuditLogPanel.module.css';

const ACTION_OPTIONS: { value: AuditAction; label: string }[] = [
  { value: 'all', label: '全部操作' },
  { value: 'create', label: '创建' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'share', label: '分享' },
  { value: 'permission', label: '权限' },
];

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHr < 24) return `${diffHr} 小时前`;
  if (diffDay < 7) return `${diffDay} 天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details) return '';
  if (typeof details === 'object') {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(details)) {
      parts.push(`${key}: ${value}`);
    }
    return parts.join(', ');
  }
  return String(details);
}

interface AuditLogPanelProps {
  /** Canvas ID */
  canvasId: string;
  /** Called when panel is closed */
  onClose?: () => void;
}

export const AuditLogPanel = memo(function AuditLogPanel({
  canvasId,
  onClose,
}: AuditLogPanelProps) {
  const isOpen = useAuditStore((s) => s.isPanelOpen);
  const filters = useAuditStore((s) => s.filters);
  const setFilters = useAuditStore((s) => s.setFilters);
  const clearFilters = useAuditStore((s) => s.clearFilters);
  const closePanel = useAuditStore((s) => s.closePanel);
  const exportCSV = useAuditStore((s) => s.exportCSV);

  const { entries, total, isLoading, error, hasMore, fetchAuditLog, fetchNextPage } =
    useAuditLog(canvasId);

  // Fetch on mount
  useEffect(() => {
    if (isOpen && canvasId) {
      void fetchAuditLog();
    }
  }, [isOpen, canvasId]);

  const handleFilterChange = useCallback(
    (key: 'action' | 'userId' | 'from' | 'to', value: string) => {
      if (key === 'action') {
        setFilters({ action: value as AuditAction });
      } else if (key === 'userId') {
        setFilters({ userId: value || undefined });
      } else if (key === 'from') {
        setFilters({ from: value || undefined });
      } else if (key === 'to') {
        setFilters({ to: value || undefined });
      }
    },
    [setFilters]
  );

  const handleApplyFilters = useCallback(() => {
    void fetchAuditLog();
  }, [fetchAuditLog]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
    void fetchAuditLog({});
  }, [clearFilters, fetchAuditLog]);

  const handleExport = useCallback(() => {
    void exportCSV(canvasId);
  }, [exportCSV, canvasId]);

  const handleClose = useCallback(() => {
    closePanel();
    onClose?.();
  }, [closePanel, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.panel} data-testid="audit-log-panel" role="dialog" aria-label="审计日志">
      <div className={styles.header}>
        <h2 className={styles.title}>审计日志</h2>
        <button
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="关闭"
          title="关闭"
        >
          ✕
        </button>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>操作</span>
          <select
            className={styles.filterSelect}
            value={filters.action ?? 'all'}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>用户</span>
          <input
            className={styles.filterInput}
            type="text"
            placeholder="用户 ID"
            value={filters.userId ?? ''}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
          />
        </div>

        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>开始</span>
          <input
            className={styles.filterInput}
            type="datetime-local"
            value={filters.from ? filters.from.slice(0, 16) : ''}
            onChange={(e) => handleFilterChange('from', e.target.value ? new Date(e.target.value).toISOString() : '')}
          />
          <span className={styles.filterLabel}>结束</span>
          <input
            className={styles.filterInput}
            type="datetime-local"
            value={filters.to ? filters.to.slice(0, 16) : ''}
            onChange={(e) => handleFilterChange('to', e.target.value ? new Date(e.target.value).toISOString() : '')}
          />
        </div>

        <div className={styles.filterActions}>
          <button className={styles.clearBtn} onClick={handleClearFilters}>
            清除筛选
          </button>
          <button className={styles.exportBtn} onClick={handleExport} disabled={total === 0}>
            📥 导出 CSV
          </button>
        </div>
      </div>

      <div className={styles.timeline}>
        {isLoading && entries.length === 0 && (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            加载中...
          </div>
        )}

        {error && entries.length === 0 && (
          <div className={styles.errorState}>{error}</div>
        )}

        {!isLoading && !error && entries.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <div>暂无审计日志</div>
          </div>
        )}

        {entries.map((entry) => (
          <div key={entry.id} className={styles.entry}>
            <div className={`${styles.entryDot} ${styles[entry.action] ?? ''}`} />
            <div className={styles.entryContent}>
              <div className={styles.entryHeader}>
                <span className={styles.entryAction}>
                  {formatAuditAction(entry.action)}
                </span>
                <span className={styles.entryEntity}>
                  {formatEntityType(entry.entityType)}
                </span>
              </div>
              <div className={styles.entryMeta}>
                <span className={styles.entryUser}>{entry.userId}</span>
                <span className={styles.entryTime}>{formatTime(entry.createdAt)}</span>
              </div>
              {entry.details && (
                <div className={styles.entryDetails}>
                  {formatDetails(entry.details)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.paginationInfo}>
          {entries.length} / {total} 条记录
        </span>
        {hasMore && (
          <button
            className={styles.loadMoreBtn}
            onClick={() => void fetchNextPage()}
            disabled={isLoading}
          >
            {isLoading ? '加载中...' : '加载更多'}
          </button>
        )}
      </div>
    </div>
  );
});
