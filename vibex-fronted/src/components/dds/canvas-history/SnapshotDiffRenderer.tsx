'use client';

import React, { memo } from 'react';
import type { SnapshotDiff, SnapshotDiffItem } from '@/stores/dds/canvasHistoryStore';

interface SnapshotDiffRendererProps {
  diff: SnapshotDiff;
  /** Called when user clicks a diff item */
  onItemClick?: (item: SnapshotDiffItem) => void;
}

/** Color coding for diff types */
const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  added: { color: '#16a34a', bg: '#f0fdf4', icon: '+', label: '新增' },
  removed: { color: '#dc2626', bg: '#fef2f2', icon: '−', label: '删除' },
  modified: { color: '#d97706', bg: '#fffbeb', icon: '~', label: '修改' },
};

/**
 * Renders individual diff items with color coding.
 * Green = added, Red = removed, Amber = modified.
 */
export const DiffItemRow = memo(function DiffItemRow({
  item,
  onClick,
}: {
  item: SnapshotDiffItem;
  onClick?: (item: SnapshotDiffItem) => void;
}) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.modified;
  return (
    <div
      className={`diff-item diff-item--${item.type}`}
      style={{ backgroundColor: config.bg, borderLeftColor: config.color }}
      onClick={() => onClick?.(item)}
      role="listitem"
      aria-label={`${config.label}: ${item.id}`}
    >
      <span className="diff-item-icon" aria-hidden="true" style={{ color: config.color }}>
        {config.icon}
      </span>
      <span className="diff-item-id">{item.id}</span>
      {item.label && <span className="diff-item-label">{item.label}</span>}
      {item.details && (
        <span className="diff-item-details">{item.details}</span>
      )}
    </div>
  );
});

/**
 * SnapshotDiffRenderer — renders a full SnapshotDiff with summary stats
 * and individual color-coded diff rows.
 */
const SnapshotDiffRenderer = memo(function SnapshotDiffRenderer({
  diff,
  onItemClick,
}: SnapshotDiffRendererProps) {
  const { added, removed, modified } = diff;
  const total = added.length + removed.length + modified.length;

  if (total === 0) {
    return (
      <div className="snapshot-diff-empty" role="status">
        两个快照完全相同，无变更。
      </div>
    );
  }

  return (
    <div className="snapshot-diff-renderer" role="list" aria-label="快照差异列表">
      {/* Stats bar */}
      <div className="diff-summary-bar" aria-label="差异统计">
        <span className="diff-stat diff-stat--added" aria-label={`新增 ${added.length} 项`}>
          <span className="diff-stat-count" style={{ color: TYPE_CONFIG.added.color }}>{added.length}</span>
          <span className="diff-stat-label">新增</span>
        </span>
        <span className="diff-stat diff-stat--removed" aria-label={`删除 ${removed.length} 项`}>
          <span className="diff-stat-count" style={{ color: TYPE_CONFIG.removed.color }}>{removed.length}</span>
          <span className="diff-stat-label">删除</span>
        </span>
        <span className="diff-stat diff-stat--modified" aria-label={`修改 ${modified.length} 项`}>
          <span className="diff-stat-count" style={{ color: TYPE_CONFIG.modified.color }}>{modified.length}</span>
          <span className="diff-stat-label">修改</span>
        </span>
      </div>

      {/* Diff rows */}
      <div className="diff-items">
        {added.map((item) => (
          <DiffItemRow key={`added-${item.id}`} item={item} onClick={onItemClick} />
        ))}
        {removed.map((item) => (
          <DiffItemRow key={`removed-${item.id}`} item={item} onClick={onItemClick} />
        ))}
        {modified.map((item) => (
          <DiffItemRow key={`modified-${item.id}`} item={item} onClick={onItemClick} />
        ))}
      </div>
    </div>
  );
});

export default SnapshotDiffRenderer;
