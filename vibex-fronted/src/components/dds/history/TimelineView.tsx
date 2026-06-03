'use client';

import React, { memo } from 'react';
import type { Snapshot } from '@/stores/dds/canvasHistoryStore';

interface TimelineViewProps {
  snapshots: Snapshot[];
  selectedId: string | null;
  onSelect: (snap: Snapshot) => void;
  onStar: (snap: Snapshot) => void;
  onCompare: (snap: Snapshot) => void;
  onRestore: (snap: Snapshot) => void;
  onDelete: (snap: Snapshot) => void;
}

/** Format timestamp to relative string */
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

/** Format full timestamp */
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TimelineView({
  snapshots,
  selectedId,
  onSelect,
  onStar,
  onCompare,
  onRestore,
  onDelete,
}: TimelineViewProps) {
  if (snapshots.length === 0) {
    return (
      <div className="history-timeline-empty">
        <span>暂无快照</span>
      </div>
    );
  }

  return (
    <div className="history-timeline" role="list" aria-label="快照时间线">
      {snapshots.map((snap, idx) => {
        const isSelected = snap.id === selectedId;
        const isFirst = idx === 0;
        const isLast = idx === snapshots.length - 1;
        return (
          <div
            key={snap.id}
            className={`timeline-item ${isSelected ? 'selected' : ''}`}
            role="listitem"
          >
            {/* Vertical line */}
            <div className={`timeline-line ${isFirst ? 'first' : ''} ${isLast ? 'last' : ''}`} />

            {/* Timeline dot */}
            <div className={`timeline-dot ${snap.isStarred ? 'starred' : ''} ${isFirst ? 'current' : ''}`} aria-hidden="true">
              {snap.isStarred ? '★' : ''}
            </div>

            {/* Card */}
            <div
              className="timeline-card"
              onClick={() => onSelect(snap)}
              role="button"
              tabIndex={0}
              aria-label={`快照: ${snap.name}`}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(snap)}
            >
              <div className="timeline-card-header">
                <span className="timeline-card-name">{snap.name}</span>
                {snap.branchName && snap.branchName !== 'main' && (
                  <span className="timeline-card-branch">{snap.branchName}</span>
                )}
                {isFirst && <span className="timeline-card-current">当前</span>}
              </div>
              <div className="timeline-card-meta">
                <span>{formatTime(snap.timestamp)}</span>
                <span className="timeline-card-ago">{timeAgo(snap.timestamp)}</span>
              </div>
              <div className="timeline-card-stats">
                <span>{snap.data.nodes?.length ?? 0} 节点</span>
                <span>{snap.data.edges?.length ?? 0} 连线</span>
              </div>

              {/* Actions */}
              <div className="timeline-card-actions">
                <button
                  className={`timeline-action-btn ${snap.isStarred ? 'starred' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onStar(snap); }}
                  title={snap.isStarred ? '取消星标' : '星标快照'}
                  aria-label={snap.isStarred ? '取消星标' : '星标快照'}
                >
                  {snap.isStarred ? '★' : '☆'}
                </button>
                {idx > 0 && (
                  <button
                    className="timeline-action-btn"
                    onClick={(e) => { e.stopPropagation(); onCompare(snap); }}
                    title="与当前对比"
                    aria-label="与当前对比"
                  >
                    ⟷
                  </button>
                )}
                {!isFirst && (
                  <button
                    className="timeline-action-btn restore"
                    onClick={(e) => { e.stopPropagation(); onRestore(snap); }}
                    title="恢复到此版本"
                    aria-label="恢复到此版本"
                  >
                    ↩
                  </button>
                )}
                {!isFirst && (
                  <button
                    className="timeline-action-btn delete"
                    onClick={(e) => { e.stopPropagation(); onDelete(snap); }}
                    title="删除快照"
                    aria-label="删除快照"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(TimelineView);
