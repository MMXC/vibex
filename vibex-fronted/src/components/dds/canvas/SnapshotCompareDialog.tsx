/**
 * SnapshotCompareDialog.tsx — Modal dialog showing diff between two snapshots
 * E1 (Sprint65): Snapshot branch management feature
 */

'use client';

import React, { memo, useCallback, useMemo } from 'react';
import type { Snapshot, SnapshotDiff } from '@/stores/dds/canvasHistoryStore';
import { computeSnapshotDiff } from '@/lib/canvas/snapshotCompare';

export interface SnapshotCompareDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** The base snapshot (older) */
  snapA: Snapshot;
  /** The comparison snapshot (newer) */
  snapB: Snapshot;
  /** Called when user closes the dialog */
  onClose: () => void;
}

const SnapshotCompareDialog = React.memo(function SnapshotCompareDialog({
  open,
  snapA,
  snapB,
  onClose,
}: SnapshotCompareDialogProps) {
  const diff: SnapshotDiff = useMemo(() => computeSnapshotDiff(snapA, snapB), [snapA, snapB]);

  const total = diff.added.length + diff.removed.length + diff.modified.length;

  if (!open) return null;

  return (
    <div
      className="snapshot-compare-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="snapshot-compare-title"
    >
      <div className="snapshot-compare-dialog">
        {/* Header */}
        <div className="snapshot-compare-header">
          <h2 id="snapshot-compare-title" className="snapshot-compare-title">
            快照对比
          </h2>
          <button
            className="snapshot-compare-close"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* Snapshot labels */}
        <div className="snapshot-compare-labels">
          <div className="snapshot-label-base">
            <span className="snapshot-label-badge">旧</span>
            <span className="snapshot-label-name">{snapA.name}</span>
            <span className="snapshot-label-time">
              {new Date(snapA.timestamp).toLocaleString()}
            </span>
          </div>
          <div className="snapshot-label-arrow">→</div>
          <div className="snapshot-label-compare">
            <span className="snapshot-label-badge">新</span>
            <span className="snapshot-label-name">{snapB.name}</span>
            <span className="snapshot-label-time">
              {new Date(snapB.timestamp).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="snapshot-compare-summary" aria-live="polite">
          {total === 0 ? (
            <p className="snapshot-no-diff">两个快照完全相同，无变化。</p>
          ) : (
            <p>
              共发现{' '}
              {diff.added.length > 0 && <strong className="diff-added">{diff.added.length} 个新增</strong>}
              {diff.added.length > 0 && diff.removed.length + diff.modified.length > 0 && '、'}
              {diff.removed.length > 0 && <strong className="diff-removed">{diff.removed.length} 个删除</strong>}
              {diff.removed.length > 0 && diff.modified.length > 0 && '、'}
              {diff.modified.length > 0 && <strong className="diff-modified">{diff.modified.length} 个修改</strong>}
              {' '}节点。
            </p>
          )}
        </div>

        {/* Diff details */}
        <div className="snapshot-compare-body">
          {/* Added */}
          {diff.added.length > 0 && (
            <section className="diff-section diff-added-section">
              <h3 className="diff-section-title">
                <span className="diff-badge diff-badge-added">+</span>
                新增节点 ({diff.added.length})
              </h3>
              <ul className="diff-node-list">
                {diff.added.map((node) => (
                  <li key={node.id} className="diff-node-item diff-node-added">
                    <span className="diff-node-id">{node.id}</span>
                    {node.label && (
                      <span className="diff-node-label">{node.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Removed */}
          {diff.removed.length > 0 && (
            <section className="diff-section diff-removed-section">
              <h3 className="diff-section-title">
                <span className="diff-badge diff-badge-removed">-</span>
                删除节点 ({diff.removed.length})
              </h3>
              <ul className="diff-node-list">
                {diff.removed.map((node) => (
                  <li key={node.id} className="diff-node-item diff-node-removed">
                    <span className="diff-node-id">{node.id}</span>
                    {node.label && (
                      <span className="diff-node-label">{node.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Modified */}
          {diff.modified.length > 0 && (
            <section className="diff-section diff-modified-section">
              <h3 className="diff-section-title">
                <span className="diff-badge diff-badge-modified">~</span>
                修改节点 ({diff.modified.length})
              </h3>
              <ul className="diff-node-list">
                {diff.modified.map((node) => (
                  <li key={node.id} className="diff-node-item diff-node-modified">
                    <div className="diff-node-header">
                      <span className="diff-node-id">{node.id}</span>
                      {node.label && (
                        <span className="diff-node-label">{node.label}</span>
                      )}
                    </div>
                    {node.changes && (
                      <ul className="diff-changes-list">
                        {Object.entries(node.changes).map(([key, { before, after }]) => (
                          <li key={key} className="diff-change-item">
                            <span className="diff-change-key">{key}:</span>
                            <span className="diff-change-before">
                              {JSON.stringify(before)}
                            </span>
                            <span className="diff-change-arrow">→</span>
                            <span className="diff-change-after">
                              {JSON.stringify(after)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="snapshot-compare-footer">
          <button className="snapshot-compare-btn-primary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
});

export default SnapshotCompareDialog;
