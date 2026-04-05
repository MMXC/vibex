'use client';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

/**
 * VersionHistoryPanel — 画布版本历史侧边栏
 * E4-F11: 版本历史
 *
 * 显示快照列表，支持预览和恢复
 * 侧边抽屉式设计，从右侧滑入
 * 内部管理 creating/restoring 状态，不依赖外部 props
 */

import React, { useCallback, useState } from 'react';
import { useVersionHistory } from '@/hooks/canvas/useVersionHistory';
import styles from './VersionHistoryPanel.module.css';

interface VersionHistoryPanelProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

const TRIGGER_LABELS: Record<string, string> = {
  manual: '💾 手动保存',
  ai_complete: '🤖 AI 生成',
  auto: '⚡ 自动',
};

export function VersionHistoryPanel({ open, onClose }: VersionHistoryPanelProps) {
  const {
    snapshots,
    loading,
    isOpen,
    selectedSnapshot,
    selectSnapshot,
    loadSnapshots,
    createSnapshot,
    restoreSnapshot,
  } = useVersionHistory();

  // Local loading states for async operations
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with parent open state
  React.useEffect(() => {
    if (open && !isOpen) {
      loadSnapshots();
    }
  }, [open, isOpen, loadSnapshots]);

  const handleRestore = useCallback(
    async (snapshotId: string) => {
      setRestoring(true);
      setError(null);
      try {
        await restoreSnapshot(snapshotId);
        // After successful restore, close panel
        onClose();
      } catch (err) {
        setError('恢复失败，请重试');
        canvasLogger.VersionHistoryPanel.error(' restore error:', err);
      } finally {
        setRestoring(false);
      }
    },
    [restoreSnapshot, onClose]
  );

  const handleCreate = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      await createSnapshot();
    } catch (err) {
      setError('创建快照失败，请重试');
      canvasLogger.VersionHistoryPanel.error(' create error:', err);
    } finally {
      setCreating(false);
    }
  }, [createSnapshot]);

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />

      {/* Drawer panel */}
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="版本历史"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>📜 版本历史</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
            data-testid="close-history-btn"
          >
            ✕
          </button>
        </div>

        {/* Create snapshot button */}
        <div className={styles.createSection}>
          <button
            type="button"
            className={styles.createBtn}
            onClick={handleCreate}
            disabled={creating}
            data-testid="create-snapshot-btn"
            title="保存当前画布状态为新快照"
          >
            {creating ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                保存中...
              </>
            ) : (
              <>
                <span aria-hidden="true">💾</span>
                保存当前版本
              </>
            )}
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <span>❌ {error}</span>
          </div>
        )}

        {/* Snapshot list */}
        <div className={styles.list}>
          {loading ? (
            <div className={styles.emptyState}>
              <span className={styles.spinner} aria-hidden="true" />
              <span>加载中...</span>
            </div>
          ) : snapshots.length === 0 ? (
            <div className={styles.emptyState}>
              <span aria-hidden="true">📭</span>
              <span>暂无版本记录</span>
              <span className={styles.emptyHint}>
                点击「保存当前版本」创建第一个快照
              </span>
            </div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.snapshotId}
                className={`${styles.snapshotCard} ${
                  selectedSnapshot?.snapshotId === snap.snapshotId
                    ? styles.snapshotCardSelected
                    : ''
                }`}
                onClick={() =>
                  selectSnapshot(
                    selectedSnapshot?.snapshotId === snap.snapshotId
                      ? null
                      : snap
                  )
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    selectSnapshot(
                      selectedSnapshot?.snapshotId === snap.snapshotId
                        ? null
                        : snap
                    );
                  }
                }}
                data-testid={`snapshot-item-${snap.snapshotId}`}
              >
                <div className={styles.snapshotHeader}>
                  <span className={styles.snapshotTrigger}>
                    {TRIGGER_LABELS[snap.trigger] ?? snap.trigger}
                  </span>
                  <span className={styles.snapshotTime}>
                    {formatDate(snap.createdAt)}
                  </span>
                </div>

                <div className={styles.snapshotLabel}>{snap.label}</div>

                <div className={styles.snapshotStats}>
                  <span title="限界上下文">◇ {snap.contextCount}</span>
                  <span title="业务流程">→ {snap.flowCount}</span>
                  <span title="组件">▣ {snap.componentCount}</span>
                </div>

                {/* Restore button — shown when card is selected */}
                {selectedSnapshot?.snapshotId === snap.snapshotId && (
                  <button
                    type="button"
                    className={styles.restoreBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(snap.snapshotId);
                    }}
                    disabled={restoring}
                    data-testid={`restore-snapshot-${snap.snapshotId}`}
                    aria-label={`恢复到 ${snap.label}`}
                  >
                    {restoring ? '恢复中...' : '↩ 恢复'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
