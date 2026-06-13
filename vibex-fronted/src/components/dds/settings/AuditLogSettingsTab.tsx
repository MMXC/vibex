/**
 * AuditLogSettingsTab.tsx — S94-E3: Canvas Audit Log
 *
 * Renders the audit log view inside the CanvasSettingsDrawer.
 * Shows filters and a scrollable timeline — no separate panel.
 */
'use client';

import React, { memo, useCallback, useEffect } from 'react';
import { useAuditStore, AuditAction, formatAuditAction, formatEntityType } from '@/stores/auditStore';
import { useAuditLog } from '@/hooks/canvas/useAuditLog';
import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';
import styles from './AuditLogSettingsTab.module.css';

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

export const AuditLogSettingsTab = memo(function AuditLogSettingsTab() {
  const canvasId = useDDSCanvasStore ? useDDSCanvasStore.getState().projectId : '';
  const filters = useAuditStore((s) => s.filters);
  const setFilters = useAuditStore((s) => s.setFilters);
  const clearFilters = useAuditStore((s) => s.clearFilters);
  const exportCSV = useAuditStore((s) => s.exportCSV);

  const { entries, total, isLoading, error, hasMore, fetchAuditLog, fetchNextPage } =
    useAuditLog(canvasId);

  useEffect(() => {
    void fetchAuditLog();
  }, []);

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

  return (
    <div className={styles.container}>
      <div className={styles.filterBar}>
        <div className={styles.filterRow}>
          <select
            className={styles.filterSelect}
            value={filters.action ?? 'all'}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input
            className={styles.filterInput}
            type="text"
            placeholder="用户 ID"
            value={filters.userId ?? ''}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
          />
        </div>
        <div className={styles.filterRow}>
          <input
            className={styles.dateInput}
            type="date"
            value={filters.from ? filters.from.slice(0, 10) : ''}
            onChange={(e) => handleFilterChange('from', e.target.value ? new Date(e.target.value).toISOString() : '')}
          />
          <span className={styles.dateSep}>—</span>
          <input
            className={styles.dateInput}
            type="date"
            value={filters.to ? filters.to.slice(0, 10) : ''}
            onChange={(e) => handleFilterChange('to', e.target.value ? new Date(e.target.value).toISOString() : '')}
          />
        </div>
        <div className={styles.filterActions}>
          <button className={styles.clearBtn} onClick={handleClearFilters}>清除</button>
          <button className={styles.applyBtn} onClick={handleApplyFilters}>应用</button>
          <button className={styles.exportBtn} onClick={handleExport} disabled={total === 0}>
            📥 导出
          </button>
        </div>
      </div>

      <div className={styles.timeline}>
        {isLoading && <div className={styles.loading}>加载中...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!isLoading && !error && entries.length === 0 && (
          <div className={styles.empty}>暂无审计日志</div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className={styles.entry}>
            <span className={`${styles.dot} ${styles[entry.action] ?? ''}`} />
            <div className={styles.entryContent}>
              <span className={styles.entryAction}>{formatAuditAction(entry.action)}</span>
              <span className={styles.entryEntity}>{formatEntityType(entry.entityType)}</span>
              <span className={styles.entryUser}>{entry.userId}</span>
              <span className={styles.entryTime}>{formatTime(entry.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.paginationInfo}>{entries.length} / {total} 条</span>
        {hasMore && (
          <button className={styles.loadMoreBtn} onClick={() => void fetchNextPage()}>
            加载更多
          </button>
        )}
      </div>
    </div>
  );
});
