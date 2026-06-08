'use client';

import React, { memo, useEffect } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import type { MergeHistoryEntry } from '@/stores/dds/canvasHistoryStore';
import styles from './MergeHistoryPanel.module.css';

interface MergeHistoryPanelProps {
  /** Whether the panel is open */
  open: boolean;
  /** Current canvas ID */
  canvasId?: string;
  /** Called to close the panel */
  onClose: () => void;
}

/**
 * MergeHistoryPanel — side panel showing a timeline of branch merge operations.
 * Displays: source branch → target branch + timestamp + merged-by user.
 * E5 (Sprint79): New component.
 */
const MergeHistoryPanel = memo(function MergeHistoryPanel({
  open,
  canvasId,
  onClose,
}: MergeHistoryPanelProps) {
  const mergeHistory = useCanvasHistoryStore((s) => s.mergeHistory);
  const getMergeHistory = useCanvasHistoryStore((s) => s.getMergeHistory);

  // Load merge history when panel opens
  useEffect(() => {
    if (open && canvasId) {
      getMergeHistory(canvasId);
    }
  }, [open, canvasId, getMergeHistory]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  if (!open) return null;

  return (
    <div className={styles['merge-history-panel']} role="complementary" aria-label="合并历史">
      {/* Header */}
      <div className={styles['merge-history-header']}>
        <h2 className={styles['merge-history-title']}>合并历史</h2>
        <button
          className={styles['merge-history-close']}
          onClick={onClose}
          aria-label="关闭"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className={styles['merge-history-content']}>
        {mergeHistory.length === 0 ? (
          <div className={styles['merge-history-empty']}>
            <span className={styles['merge-history-empty-icon']}>📋</span>
            <p className={styles['merge-history-empty-text']}>
              暂无合并记录
              <br />
              <span style={{ fontSize: '11px' }}>合并分支后会自动显示在这里</span>
            </p>
          </div>
        ) : (
          <div className={styles['merge-history-timeline']}>
            {mergeHistory.map((entry: MergeHistoryEntry) => (
              <div key={entry.id} className={styles['merge-history-item']}>
                <div className={styles['merge-history-dot']} />
                <div className={styles['merge-history-branch-row']}>
                  <span className={styles['merge-history-source']}>{entry.sourceBranch}</span>
                  <span className={styles['merge-history-arrow']}>→</span>
                  <span className={styles['merge-history-target']}>{entry.targetBranch}</span>
                </div>
                <div className={styles['merge-history-meta']}>
                  <span className={styles['merge-history-time']}>{formatTime(entry.timestamp)}</span>
                  {entry.mergedBy && (
                    <span className={styles['merge-history-user']}>{entry.mergedBy}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export { MergeHistoryPanel };
