/**
 * Timeline — Horizontal scrollable snapshot timeline for canvas version history
 *
 * S49-E4: 画布版本历史可视化
 *
 * Features:
 * - Horizontal scrollable timeline showing all snapshots
 * - Color-coded trigger badges (ai-generate / pre-export / manual)
 * - Selected snapshot highlighted
 * - Click to select for diff view
 * - Download snapshot as JSON
 */

'use client';

import React, { memo, useCallback } from 'react';
import type { Snapshot } from '@/stores/dds/snapshotHistoryStore';
import styles from './Timeline.module.css';

export interface TimelineProps {
  snapshots: Snapshot[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete?: (id: string) => void;
}

const TRIGGER_LABEL: Record<string, { label: string; className: string }> = {
  'ai-generate': { label: 'AI 生成', className: styles.badgeAi },
  'pre-export': { label: '导出前', className: styles.badgeExport },
  manual: { label: '手动', className: styles.badgeManual },
};

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function downloadSnapshot(snap: Snapshot): void {
  const blob = new Blob([JSON.stringify(snap, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `snapshot-${snap.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export const Timeline = memo(function Timeline({
  snapshots,
  selectedId,
  onSelect,
  onDelete,
}: TimelineProps) {
  const handleDownload = useCallback(
    (e: React.MouseEvent, snap: Snapshot) => {
      e.stopPropagation();
      downloadSnapshot(snap);
    },
    []
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, snapId: string) => {
      e.stopPropagation();
      onDelete?.(snapId);
    },
    [onDelete]
  );

  if (snapshots.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyText}>暂无快照记录</span>
        <span className={styles.emptyHint}>
          AI 生成卡片或手动点击快照按钮时会自动记录
        </span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.track}>
        {snapshots.map((snap) => {
          const badge = TRIGGER_LABEL[snap.trigger] ?? TRIGGER_LABEL.manual;
          const isSelected = snap.id === selectedId;
          return (
            <button
              key={snap.id}
              className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
              onClick={() => onSelect(isSelected ? null : snap.id)}
              title={`${snap.label}\n节点: ${snap.canvasState.nodes.length} | 边: ${snap.canvasState.edges.length}`}
            >
              <span className={styles.date}>{formatDate(snap.timestamp)}</span>
              <span className={styles.dot} />
              <span className={styles.time}>{formatTime(snap.timestamp)}</span>
              <span className={`${styles.badge} ${badge.className}`}>
                {badge.label}
              </span>
              <span className={styles.meta}>
                {snap.canvasState.nodes.length} 节点 · {snap.canvasState.edges.length} 边
              </span>
              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => handleDownload(e, snap)}
                  title="下载快照 JSON"
                >
                  ↓
                </button>
                {onDelete && (
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                    onClick={(e) => handleDelete(e, snap.id)}
                    title="删除快照"
                  >
                    ×
                  </button>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default Timeline;
