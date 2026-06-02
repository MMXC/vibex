/**
 * HistoryPanel — Canvas Undo/Redo History Panel
 * Sprint54 E1: Canvas Snapshot 版本历史 UI
 *
 * 显示 canvasHistoryStore 的 past 栈（undo 历史），
 * 每个条目展示时间戳 + 操作描述 + Restore 按钮。
 * 支持点击 Restore 恢复到指定历史节点（selectiveUndo）。
 */

'use client';

import React, { memo, useCallback } from 'react';
import { useHistoryPanel } from '@/hooks/canvas/useHistoryPanel';
import styles from './HistoryPanel.module.css';

interface HistoryPanelProps {
  /** Controls whether the panel is visible — when false, panel is not rendered */
  isOpen?: boolean;
  onClose: () => void;
}

function EmptyState() {
  return (
    <div className={styles.empty} role="status" aria-live="polite">
      <span className={styles.emptyIcon} aria-hidden="true">📋</span>
      <p className={styles.emptyText}>No snapshots</p>
      <p className={styles.emptySubtext}>历史记录将在您操作画布后出现</p>
    </div>
  );
}

function HistoryItem({
  index,
  cmd,
  label,
  isCurrent,
  onRestore,
}: {
  index: number;
  cmd: { id: string; timestamp: number; description?: string };
  label: string;
  isCurrent: boolean;
  onRestore: (index: number) => void;
}) {
  const handleRestore = useCallback(() => {
    onRestore(index);
  }, [index, onRestore]);

  return (
    <div
      className={`${styles.item} ${isCurrent ? styles.current : ''}`}
      role="listitem"
    >
      <div className={styles.itemContent}>
        <span className={styles.itemLabel}>
          {cmd.description ?? `操作 #${index + 1}`}
        </span>
        <span className={styles.itemTime}>{label}</span>
      </div>
      {!isCurrent && (
        <button
          type="button"
          className={styles.restoreBtn}
          onClick={handleRestore}
          aria-label={`Restore to ${cmd.description ?? `操作 #${index + 1}`}`}
        >
          Restore
        </button>
      )}
      {isCurrent && (
        <span className={styles.currentBadge} aria-label="当前状态">✓ 当前</span>
      )}
    </div>
  );
}

/**
 * HistoryPanel — 显示 undo 历史记录列表。
 * 底部显示 Clear 按钮。
 */
export const HistoryPanel = memo(function HistoryPanel({
  isOpen = true,
  onClose,
}: HistoryPanelProps) {
  if (!isOpen) return null;

  const { snapshots, undoCount, redoCount, hasHistory, restore, clear } =
    useHistoryPanel();

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-panel-title"
      onClick={handleOverlayClick}
    >
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 id="history-panel-title" className={styles.title}>
              历史记录
            </h2>
            {hasHistory && (
              <span className={styles.counts} aria-live="polite">
                {undoCount} 可撤销 · {redoCount} 可重做
              </span>
            )}
          </div>
          <div className={styles.headerRight}>
            {hasHistory && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={clear}
                aria-label="清空所有历史记录"
              >
                清空
              </button>
            )}
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="关闭历史记录面板"
            >
              ×
            </button>
          </div>
        </div>

        {/* History list */}
        <div className={styles.body} role="list" aria-label="历史记录列表">
          {!hasHistory ? (
            <EmptyState />
          ) : (
            snapshots.map((snap) => (
              <HistoryItem
                key={snap.cmd.id}
                index={snap.index}
                cmd={snap.cmd}
                label={snap.label}
                isCurrent={snap.isCurrent}
                onRestore={restore}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});
