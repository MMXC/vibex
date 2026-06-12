'use client';

/**
 * VersionHistoryPanel — 画布版本历史侧边栏
 * E4-F11: 版本历史
 * S90-E2: 选择性回滚 (Selective Rollback) — 支持按 Epic 回滚
 *
 * 显示快照列表，支持预览和恢复
 * 侧边抽屉式设计，从右侧滑入
 * 内部管理 creating/restoring 状态，不依赖外部 props
 */

import React, { useCallback, useState, useMemo } from 'react';
import type { CanvasSnapshot } from '@/lib/canvas/types';
import { canvasLogger } from '@/lib/canvas/canvasLogger';
import { computeSnapshotDiff } from '@/lib/canvas/snapshotDiff';
import { useVersionHistory } from '@/hooks/canvas/useVersionHistory';
import { useConfirmDialogStore } from '@/lib/canvas/stores/confirmDialogStore';
import { SnapshotDiffView } from './SnapshotDiffView';
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

// S90-E2: Extracted snapshot card for reuse in both Epic sections and standalone list
interface SnapshotCardProps {
  snap: CanvasSnapshot;
  isSelected: boolean;
  isInCompare: boolean;
  onSelect: () => void;
  onToggleCompare: () => void;
  onRestore: (snapshotId: string, snapshotLabel: string) => void;
  restoring: boolean;
  formatDate: (isoString: string) => string;
}

const SnapshotCard = memo(function SnapshotCard({
  snap,
  isSelected,
  isInCompare,
  onSelect,
  onToggleCompare,
  onRestore,
  restoring,
  formatDate,
}: SnapshotCardProps) {
  return (
    <div
      className={`${styles.snapshotCard} ${styles.snapshotCardRelative} ${
        isSelected ? styles.snapshotCardSelected : ''
      } ${isInCompare ? styles.snapshotCardCompareSelected : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
        }
      }}
      data-testid={`snapshot-item-${snap.snapshotId}`}
    >
      <div className={styles.snapshotHeader}>
        <span className={styles.snapshotTrigger}>
          {TRIGGER_LABELS[snap.trigger] ?? snap.trigger}
        </span>
        {/* S90-E2: Epic badge */}
        {snap.epicId && (
          <span className={styles.epicBadge}>
            📌 {snap.epicId}
          </span>
        )}
        <span className={styles.snapshotTime}>
          {formatDate(snap.createdAt)}
        </span>
      </div>

      <div className={styles.snapshotLabel}>{snap.label}</div>

      <div className={styles.cardLeft}>
        <input
          type="checkbox"
          className={styles.compareCheckbox}
          checked={isInCompare}
          onChange={onToggleCompare}
          onClick={(e) => e.stopPropagation()}
          aria-label={`选择 ${snap.label} 用于对比`}
        />
      </div>

      <div className={styles.snapshotStats}>
        <span title="限界上下文">◇ {snap.contextCount}</span>
        <span title="业务流程">→ {snap.flowCount}</span>
        <span title="组件">▣ {snap.componentCount}</span>
      </div>

      {/* Restore button — shown when card is selected */}
      {isSelected && (
        <button
          type="button"
          className={styles.restoreBtn}
          onClick={(e) => {
            e.stopPropagation();
            onRestore(snap.snapshotId, snap.label);
          }}
          disabled={restoring}
          data-testid={`restore-snapshot-${snap.snapshotId}`}
          aria-label={`恢复到 ${snap.label}`}
        >
          {restoring ? '恢复中...' : '↩ 恢复'}
        </button>
      )}
    </div>
  );
});

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
    clearAllSnapshots,
    error: hookError,
  } = useVersionHistory();

  const { open: openConfirmDialog } = useConfirmDialogStore();

  // Local loading states for async operations
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Compare mode state
  const [compareSnapshots, setCompareSnapshots] = useState<CanvasSnapshot[]>([]);
  const [diffResult, setDiffResult] = useState<ReturnType<typeof computeSnapshotDiff> | null>(null);

  // S90-E2: Selective rollback state
  const [rollbackPreview, setRollbackPreview] = useState<{
    epicId: string;
    epicSnapshots: CanvasSnapshot[];
    rollbackTarget: CanvasSnapshot;
    rollbackDiff: ReturnType<typeof computeSnapshotDiff>;
  } | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);

  // Check if a snapshot is in compare list
  const isInCompare = (snap: CanvasSnapshot) =>
    compareSnapshots.some(s => s.snapshotId === snap.snapshotId);

  // Toggle compare selection
  const toggleCompare = (snap: CanvasSnapshot) => {
    setDiffResult(null);
    if (isInCompare(snap)) {
      setCompareSnapshots(prev => prev.filter(s => s.snapshotId !== snap.snapshotId));
    } else {
      if (compareSnapshots.length < 2) {
        setCompareSnapshots(prev => [...prev, snap]);
      } else {
        // Replace oldest
        setCompareSnapshots([compareSnapshots[1]!, snap]);
      }
    }
  };

  // Sync with parent open state
  React.useEffect(() => {
    if (open && !isOpen) {
      loadSnapshots();
    }
  }, [open, isOpen, loadSnapshots]);

  const handleRestore = useCallback(
    (snapshotId: string, snapshotLabel: string) => {
      // === E2-S4: 二次确认弹窗 ===
      openConfirmDialog({
        title: '确认恢复版本',
        message: `确定要恢复到「${snapshotLabel}」吗？当前画布内容将被替换。`,
        confirmLabel: '确认恢复',
        cancelLabel: '取消',
        destructive: true,
        onConfirm: async () => {
          setRestoring(true);
          setRestoreError(null);
          try {
            await restoreSnapshot(snapshotId);
            onClose();
          } catch (err) {
            setRestoreError('恢复失败，请重试');
            canvasLogger.VersionHistoryPanel.error(' restore error:', err);
          } finally {
            setRestoring(false);
          }
        },
      });
    },
    [restoreSnapshot, onClose, openConfirmDialog]
  );

  const handleClearAll = useCallback(async () => {
    if (snapshots.length === 0) return;
    openConfirmDialog({
      title: '清空版本历史',
      message: `确定要清空所有 ${snapshots.length} 个版本吗？此操作不可撤销。`,
      confirmLabel: '确认清空',
      cancelLabel: '取消',
      destructive: true,
      onConfirm: async () => {
        await clearAllSnapshots();
      },
    });
  }, [snapshots.length, clearAllSnapshots, openConfirmDialog]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      await createSnapshot();
    } catch (err) {
      // 错误由 hook error state 管理
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

  // S90-E2: Group snapshots by Epic ID (snapshots with epicId are grouped)
  const epicGroups = useMemo(() => {
    const groups = new Map<string, CanvasSnapshot[]>();
    for (const snap of snapshots) {
      if (snap.epicId) {
        const existing = groups.get(snap.epicId) ?? [];
        groups.set(snap.epicId, [...existing, snap]);
      }
    }
    // Sort groups by newest Epic snapshot
    return Array.from(groups.entries())
      .map(([epicId, snaps]) => ({
        epicId,
        snapshots: [...snaps].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }))
      .sort((a, b) => new Date(b.snapshots[0]!.createdAt).getTime() - new Date(a.snapshots[0]!.createdAt).getTime());
  }, [snapshots]);

  // S90-E2: Non-Epic snapshots (standalone/manual)
  const nonEpicSnapshots = useMemo(
    () => snapshots.filter(s => !s.epicId),
    [snapshots]
  );

  // S90-E2: Open selective rollback preview
  const handleSelectiveRollback = useCallback(
    (epicId: string) => {
      const epicSnapshots = epicGroups.find(g => g.epicId === epicId)?.snapshots ?? [];

      // Sort oldest first to find the earliest snapshot for this Epic
      const sortedEpicSnapshots = [...epicSnapshots].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const oldestEpicSnapshot = sortedEpicSnapshots[0];

      if (!oldestEpicSnapshot) return;

      // Find the snapshot just before the oldest Epic snapshot (rollback target)
      const rollbackTarget = snapshots.find(
        s => new Date(s.createdAt).getTime() < new Date(oldestEpicSnapshot.createdAt).getTime()
      );

      if (!rollbackTarget) return;

      // Compute diff for preview
      const rollbackDiff = computeSnapshotDiff(rollbackTarget, oldestEpicSnapshot);

      setRollbackPreview({
        epicId,
        epicSnapshots: sortedEpicSnapshots,
        rollbackTarget,
        rollbackDiff,
      });
    },
    [epicGroups, snapshots]
  );

  // S90-E2: Confirm selective rollback
  const handleConfirmRollback = useCallback(async () => {
    if (!rollbackPreview) return;
    setRollbackLoading(true);
    try {
      await restoreSnapshot(rollbackPreview.rollbackTarget.snapshotId);
      setRollbackPreview(null);
      onClose();
    } catch {
      canvasLogger.VersionHistoryPanel.error(' selective rollback error');
    } finally {
      setRollbackLoading(false);
    }
  }, [rollbackPreview, restoreSnapshot, onClose]);

  if (!open) return null;

  const hasEpicGroups = epicGroups.length > 0;

  return (
    <>
      {/* S90-E2: Selective rollback preview dialog */}
      {rollbackPreview && (
        <div className={styles.rollbackPreviewOverlay} role="dialog" aria-modal="true" data-testid="rollback-preview-dialog">
          <div className={styles.rollbackPreviewDialog}>
            <h3 className={styles.rollbackPreviewTitle}>
              ⚠️ 回滚确认 — Epic "{rollbackPreview.epicId}"
            </h3>
            <p className={styles.rollbackPreviewSubtitle}>
              将恢复到「{rollbackPreview.rollbackTarget.label}」之前的版本，
              回滚 {rollbackPreview.epicSnapshots.length} 个相关快照的变更。
            </p>

            {/* Diff preview */}
            <SnapshotDiffView
              diff={rollbackPreview.rollbackDiff}
              labelA={rollbackPreview.rollbackTarget.label}
              labelB={`Epic "${rollbackPreview.epicId}" 变更`}
              onBack={() => setRollbackPreview(null)}
            />

            <div className={styles.rollbackPreviewActions}>
              <button
                type="button"
                className={styles.rollbackCancelBtn}
                onClick={() => setRollbackPreview(null)}
                data-testid="rollback-cancel-btn"
              >
                取消
              </button>
              <button
                type="button"
                className={styles.rollbackConfirmBtn}
                onClick={handleConfirmRollback}
                disabled={rollbackLoading}
                data-testid="rollback-confirm-btn"
              >
                {rollbackLoading ? '回滚中...' : '⚠️ 确认回滚'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop overlay */}
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />

      {/* Drawer panel */}
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="版本历史"
        data-testid="version-history-panel"
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

        {/* Hook error — from load/create operations */}
        {hookError && (
          <div className={styles.errorBanner} role="alert">
            <span>❌ {hookError}</span>
          </div>
        )}

        {/* Restore error — local state */}
        {restoreError && (
          <div className={styles.errorBanner} role="alert">
            <span>❌ {restoreError}</span>
          </div>
        )}

        {/* Diff view */}
        {diffResult && compareSnapshots.length === 2 ? (
          <SnapshotDiffView
            diff={diffResult}
            labelA={compareSnapshots[0]?.label ?? ""}
            labelB={compareSnapshots[1]?.label ?? ""}
            onBack={() => setDiffResult(null)}
          />
        ) : (
          <>
            {/* Snapshot list */}
            <div className={styles.list}>
              {loading ? (
                <div className={styles.emptyState}>
                  <span className={styles.spinner} aria-hidden="true" />
                  <span>加载中...</span>
                </div>
              ) : snapshots.length === 0 ? (
                hookError?.includes('请先创建项目') ? (
                  <div className={styles.emptyState}>
                    <span aria-hidden="true">🗺️</span>
                    <span>请先创建项目</span>
                    <span className={styles.emptyHint}>
                      {hookError}
                    </span>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <span aria-hidden="true">📭</span>
                    <span>暂无版本记录</span>
                    <span className={styles.emptyHint}>
                      点击「保存当前版本」创建第一个快照
                    </span>
                  </div>
                )
              ) : (
                <>
                  {/* S90-E2: Epic sections with rollback buttons */}
                  {hasEpicGroups && epicGroups.map(({ epicId, snapshots: epicSnaps }) => (
                    <div key={epicId} className={styles.epicSection} data-testid={`epic-section-${epicId}`}>
                      <div className={styles.epicSectionTitle}>
                        <span>📌</span>
                        <span>Epic: {epicId}</span>
                        <span style={{ marginLeft: 'auto' }}>
                          <button
                            type="button"
                            className={styles.epicRollbackBtn}
                            onClick={() => handleSelectiveRollback(epicId)}
                            data-testid={`epic-rollback-${epicId}`}
                            title={`回滚 Epic "${epicId}" 的所有变更`}
                          >
                            ↩ 回滚此 Epic
                          </button>
                        </span>
                      </div>
                      {epicSnaps.map((snap) => (
                        <SnapshotCard
                          key={snap.snapshotId}
                          snap={snap}
                          isSelected={selectedSnapshot?.snapshotId === snap.snapshotId}
                          isInCompare={isInCompare(snap)}
                          onSelect={() =>
                            selectSnapshot(
                              selectedSnapshot?.snapshotId === snap.snapshotId
                                ? null
                                : snap
                            )
                          }
                          onToggleCompare={() => toggleCompare(snap)}
                          onRestore={handleRestore}
                          restoring={restoring}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  ))}

                  {/* Non-Epic snapshots (standalone / manual) */}
                  {nonEpicSnapshots.map((snap) => (
                    <SnapshotCard
                      key={snap.snapshotId}
                      snap={snap}
                      isSelected={selectedSnapshot?.snapshotId === snap.snapshotId}
                      isInCompare={isInCompare(snap)}
                      onSelect={() =>
                        selectSnapshot(
                          selectedSnapshot?.snapshotId === snap.snapshotId
                            ? null
                            : snap
                        )
                      }
                      onToggleCompare={() => toggleCompare(snap)}
                      onRestore={handleRestore}
                      restoring={restoring}
                      formatDate={formatDate}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Compare section */}
            {compareSnapshots.length > 0 && (
              <div className={styles.compareSection}>
                <div className={styles.compareLabel}>
                  已选择 {compareSnapshots.length}/2 个版本对比
                </div>
                {compareSnapshots.length === 2 && (
                  <button
                    type="button"
                    className={styles.compareBtn}
                    onClick={() => {
                      const diff = computeSnapshotDiff(compareSnapshots[0]!, compareSnapshots[1]!);
                      setDiffResult(diff);
                    }}
                    data-testid="compare-snapshots-btn"
                  >
                    📊 对比
                  </button>
                )}
              </div>
            )}

            {/* E2-S6: Clear all versions button */}
            {snapshots.length > 0 && (
              <div className={styles.createSection}>
                <button
                  type="button"
                  className={styles.clearAllBtn}
                  onClick={handleClearAll}
                  data-testid="clear-all-versions-btn"
                  title="清空所有版本历史"
                >
                  🗑️ 清空历史
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
