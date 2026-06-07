/**
 * SnapshotManagerPanel.tsx — E5 (Sprint75): Canvas Snapshot Management Panel
 *
 * Displays all canvas snapshots with multi-select batch delete capability.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import styles from './SnapshotManagerPanel.module.css';

interface SnapshotManagerPanelProps {
  /** Canvas ID for snapshot operations (falls back to current canvas from store) */
  canvasId?: string;
}

export function SnapshotManagerPanel({ canvasId }: SnapshotManagerPanelProps) {
  // Use the canvasId from store if not provided
  const storeCanvasId = useCanvasHistoryStore((s) => s.snapshots[0] ? (s as {canvasId?: string}).canvasId ?? '' : '');
  const actualCanvasId = canvasId ?? storeCanvasId;

  const snapshots = useCanvasHistoryStore((s) => s.snapshots);
  const listSnapshots = useCanvasHistoryStore((s) => s.listSnapshots);
  const deleteSnapshots = useCanvasHistoryStore((s) => s.deleteSnapshots);
  const restoreSnapshot = useCanvasHistoryStore((s) => s.restoreSnapshot);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load snapshots on mount
  useEffect(() => {
    if (!actualCanvasId) return;
    setLoadError(null);
    listSnapshots(actualCanvasId).catch(() => {
      setLoadError('无法加载快照列表');
    });
  }, [actualCanvasId, listSnapshots]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === snapshots.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(snapshots.map((s) => s.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0 || !actualCanvasId) return;
    setIsDeleting(true);
    try {
      await deleteSnapshots(actualCanvasId, Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreDefault = async (snapshotId: string) => {
    if (!actualCanvasId) return;
    setIsRestoring(snapshotId);
    try {
      await restoreSnapshot(actualCanvasId, snapshotId);
    } finally {
      setIsRestoring(null);
    }
  };

  const handleRefresh = () => {
    if (!actualCanvasId) return;
    setLoadError(null);
    setSelectedIds(new Set());
    listSnapshots(actualCanvasId).catch(() => {
      setLoadError('无法刷新快照列表');
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasSelection = selectedIds.size > 0;

  if (loadError) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{loadError}</div>
      </div>
    );
  }

  return (
    <div className={styles.container} role="region" aria-label="快照管理">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.snapshotCount}>{snapshots.length} 个快照</span>
          {hasSelection && (
            <span className={styles.selectionCount}>已选 {selectedIds.size} 项</span>
          )}
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={handleRefresh}
            aria-label="刷新"
          >
            刷新
          </button>
          {hasSelection && (
            <button
              type="button"
              className={styles.deleteButton}
              onClick={handleBatchDelete}
              disabled={isDeleting}
              aria-label={`批量删除 ${selectedIds.size} 个快照`}
            >
              {isDeleting ? '删除中…' : `批量删除 (${selectedIds.size})`}
            </button>
          )}
        </div>
      </div>

      {/* Snapshot list */}
      {snapshots.length === 0 ? (
        <div className={styles.empty}>
          <p>暂无快照</p>
          <p className={styles.emptyHint}>在画布上保存快照后将在此处显示</p>
        </div>
      ) : (
        <div className={styles.list} role="list" aria-label="快照列表">
          {/* Select all row */}
          <div className={styles.selectAllRow}>
            <input
              type="checkbox"
              id="select-all-snapshots"
              checked={selectedIds.size === snapshots.length && snapshots.length > 0}
              onChange={toggleSelectAll}
              aria-label="全选"
            />
            <label htmlFor="select-all-snapshots">全选</label>
          </div>

          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className={styles.snapshotItem} role="listitem">
              <div className={styles.snapshotLeft}>
                <input
                  type="checkbox"
                  id={`snapshot-${snapshot.id}`}
                  checked={selectedIds.has(snapshot.id)}
                  onChange={() => toggleSelect(snapshot.id)}
                  aria-label={`选择快照 ${snapshot.name}`}
                />
                <div className={styles.snapshotInfo}>
                  <div className={styles.snapshotName}>
                    <span className={styles.snapshotNameText}>{snapshot.name}</span>
                    {snapshot.isStarred && (
                      <span className={styles.star} aria-label="已星标">★</span>
                    )}
                    {snapshot.branchName && (
                      <span className={styles.branchBadge}>{snapshot.branchName}</span>
                    )}
                  </div>
                  <div className={styles.snapshotMeta}>
                    <span>{formatDate(snapshot.timestamp)}</span>
                    {snapshot.data?.nodes?.length !== undefined && (
                      <span>{snapshot.data.nodes.length} 个节点</span>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.snapshotActions}>
                <button
                  type="button"
                  className={styles.restoreButton}
                  onClick={() => handleRestoreDefault(snapshot.id)}
                  disabled={isRestoring === snapshot.id}
                  aria-label={`恢复 ${snapshot.name}`}
                >
                  {isRestoring === snapshot.id ? '恢复中…' : '恢复'}
                </button>
                <button
                  type="button"
                  className={styles.deleteSingleButton}
                  onClick={() => {
                    setSelectedIds(new Set([snapshot.id]));
                    handleBatchDelete();
                  }}
                  disabled={isDeleting}
                  aria-label={`删除 ${snapshot.name}`}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
