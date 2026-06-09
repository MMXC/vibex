'use client';

import React, { memo, useCallback } from 'react';
import type { Snapshot } from '@/stores/dds/canvasHistoryStore';
import {
  useCanvasTimelineStore,
  filterSnapshotsByZoom,
  getUniqueBranches,
  getTickWidth,
  type TimelineZoomLevel,
} from '@/stores/dds/canvasTimelineStore';
import styles from './VersionTimeline.module.css';

interface VersionTimelineProps {
  /** All snapshots from the canvas */
  snapshots: Snapshot[];
  /** Currently selected snapshot ID */
  selectedId: string | null;
  /** Callback when a snapshot is selected */
  onSelect: (snap: Snapshot) => void;
  /** Callback when a snapshot is starred */
  onStar: (snap: Snapshot) => void;
  /** Callback when two snapshots are compared */
  onCompare: (snap: Snapshot) => void;
  /** Callback to restore a snapshot */
  onRestore: (snap: Snapshot) => void;
  /** Callback to delete a snapshot */
  onDelete: (snap: Snapshot) => void;
  /** Callback when zoom level changes */
  onZoomChange?: (level: TimelineZoomLevel) => void;
}

const ZOOM_LABELS: Record<TimelineZoomLevel, string> = {
  hour: '1小时',
  day: '1天',
  week: '1周',
  month: '1月',
};

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const VersionTimeline = memo(function VersionTimeline({
  snapshots,
  selectedId,
  onSelect,
  onStar,
  onCompare,
  onRestore,
  onDelete,
  onZoomChange,
}: VersionTimelineProps) {
  const zoomLevel = useCanvasTimelineStore((s) => s.zoomLevel);
  const setZoomLevel = useCanvasTimelineStore((s) => s.setZoomLevel);
  const activeBranch = useCanvasTimelineStore((s) => s.activeBranch);
  const setActiveBranch = useCanvasTimelineStore((s) => s.setActiveBranch);

  const filtered = filterSnapshotsByZoom(snapshots, zoomLevel, activeBranch);
  const branches = getUniqueBranches(snapshots);
  const tickWidth = getTickWidth(zoomLevel);

  const handleZoomChange = useCallback(
    (level: TimelineZoomLevel) => {
      setZoomLevel(level);
      onZoomChange?.(level);
    },
    [setZoomLevel, onZoomChange],
  );

  const handleBranchChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setActiveBranch(val === '' ? null : val);
    },
    [setActiveBranch],
  );

  if (snapshots.length === 0) {
    return (
      <div className={styles.empty}>
        <span>暂无快照</span>
      </div>
    );
  }

  return (
    <div className={styles.timeline} role="region" aria-label="版本时间轴">
      {/* Controls bar */}
      <div className={styles.controls}>
        <div className={styles.zoomControls} role="group" aria-label="时间轴缩放">
          {(Object.keys(ZOOM_LABELS) as TimelineZoomLevel[]).map((level) => (
            <button
              key={level}
              className={`${styles.zoomBtn} ${zoomLevel === level ? styles.zoomBtnActive : ''}`}
              onClick={() => handleZoomChange(level)}
              aria-pressed={zoomLevel === level}
              aria-label={`缩放到${ZOOM_LABELS[level]}`}
            >
              {ZOOM_LABELS[level]}
            </button>
          ))}
        </div>

        {branches.length > 1 && (
          <select
            className={styles.branchSelect}
            value={activeBranch ?? ''}
            onChange={handleBranchChange}
            aria-label="筛选分支"
          >
            <option value="">全部分支</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Snapshot count */}
      <div className={styles.countBar} aria-live="polite">
        <span>
          {filtered.length} / {snapshots.length} 个快照
        </span>
        {activeBranch && <span className={styles.branchBadge}>{activeBranch}</span>}
      </div>

      {/* Timeline axis + cards */}
      <div
        className={styles.timelineBody}
        style={{ '--tick-width': `${tickWidth}px` } as React.CSSProperties}
        role="list"
        aria-label="快照时间线"
      >
        {filtered.map((snap, idx) => {
          const isSelected = snap.id === selectedId;
          const isFirst = idx === 0;
          const isLast = idx === filtered.length - 1;

          return (
            <div
              key={snap.id}
              className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
              role="listitem"
            >
              {/* Vertical connector line */}
              <div
                className={`${styles.line} ${isFirst ? styles.lineFirst : ''} ${isLast ? styles.lineLast : ''}`}
              />

              {/* Timeline node */}
              <div
                className={`${styles.dot} ${snap.isStarred ? styles.dotStarred : ''} ${isFirst ? styles.dotCurrent : ''}`}
                aria-hidden="true"
              >
                {snap.isStarred ? '★' : ''}
              </div>

              {/* Snapshot card */}
              <div
                className={styles.card}
                onClick={() => onSelect(snap)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(snap)}
                role="button"
                tabIndex={0}
                aria-label={`快照: ${snap.name}`}
                aria-pressed={isSelected}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.cardName}>{snap.name}</span>
                  {snap.branchName && snap.branchName !== 'main' && (
                    <span className={styles.cardBranch}>{snap.branchName}</span>
                  )}
                  {isFirst && <span className={styles.cardCurrent}>当前</span>}
                </div>
                <div className={styles.cardMeta}>
                  <span>{formatTime(snap.timestamp)}</span>
                  <span className={styles.cardAgo}>{timeAgo(snap.timestamp)}</span>
                </div>
                {snap.data && (
                  <div className={styles.cardStats}>
                    <span>{snap.data.nodes?.length ?? 0} 节点</span>
                    <span>{snap.data.edges?.length ?? 0} 边</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className={styles.actions}>
                <button
                  className={`${styles.actionBtn} ${styles.actionStar}`}
                  onClick={(e) => { e.stopPropagation(); onStar(snap); }}
                  title="收藏"
                  aria-label="收藏"
                >
                  {snap.isStarred ? '★' : '☆'}
                </button>
                {!isFirst && (
                  <button
                    className={`${styles.actionBtn} ${styles.actionCompare}`}
                    onClick={(e) => { e.stopPropagation(); onCompare(snap); }}
                    title="与当前对比"
                    aria-label="与当前对比"
                  >
                    ⟷
                  </button>
                )}
                {!isFirst && (
                  <button
                    className={`${styles.actionBtn} ${styles.actionRestore}`}
                    onClick={(e) => { e.stopPropagation(); onRestore(snap); }}
                    title="恢复到此版本"
                    aria-label="恢复到此版本"
                  >
                    ↩
                  </button>
                )}
                {!isFirst && (
                  <button
                    className={`${styles.actionBtn} ${styles.actionDelete}`}
                    onClick={(e) => { e.stopPropagation(); onDelete(snap); }}
                    title="删除快照"
                    aria-label="删除快照"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default VersionTimeline;
