/**
 * SnapshotCompareDialog.tsx — Modal dialog showing diff between two snapshots
 * E1 (Sprint65): Snapshot branch management feature
 */

'use client';

import React, { memo, useCallback, useMemo, useState } from 'react';
import type { Snapshot, SnapshotDiff } from '@/stores/dds/canvasHistoryStore';
import { computeSnapshotDiff } from '@/lib/canvas/snapshotCompare';

export interface SnapshotCompareDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** The base snapshot (older) */
  snapA: Snapshot;
  /** The comparison snapshot (newer) */
  snapB: Snapshot;
  /** E1 (Sprint70): Dialog mode — 'view' = diff summary, 'merge' = side-by-side with keep/ignore per node */
  mode?: 'view' | 'merge';
  /** E1 (Sprint70): Called when user confirms merge selections (only in merge mode) */
  onMergeConfirm?: (selections: MergeSelection[]) => void;
  /** Called when user closes the dialog */
  onClose: () => void;
}

/** E1 (Sprint70): Merge selection per node */
export interface MergeSelection {
  nodeId: string;
  action: 'keep-left' | 'keep-right' | 'skip';
}

const SnapshotCompareDialog = React.memo(function SnapshotCompareDialog({
  open,
  snapA,
  snapB,
  mode = 'view',
  onMergeConfirm,
  onClose,
}: SnapshotCompareDialogProps) {
  const diff: SnapshotDiff = useMemo(() => computeSnapshotDiff(snapA, snapB), [snapA, snapB]);
  const [activeMode, setActiveMode] = useState<'view' | 'merge'>(mode);
  // E1 (Sprint70): Merge selections — default to 'keep-right' (newer snapshot wins)
  const [selections, setSelections] = useState<Record<string, MergeSelection['action']>>(() => {
    const initial: Record<string, MergeSelection['action']> = {};
    diff.added.forEach((n) => { initial[n.id] = 'keep-right'; });
    diff.removed.forEach((n) => { initial[n.id] = 'keep-left'; });
    diff.modified.forEach((n) => { initial[n.id] = 'keep-right'; });
    return initial;
  });
  const [previewNode, setPreviewNode] = useState<{ id: string; side: 'left' | 'right' } | null>(null);

  const handleSelect = useCallback((nodeId: string, action: MergeSelection['action']) => {
    setSelections((prev) => ({ ...prev, [nodeId]: action }));
  }, []);

  const handleConfirm = useCallback(() => {
    const merged: MergeSelection[] = Object.entries(selections).map(([nodeId, action]) => ({
      nodeId,
      action,
    }));
    onMergeConfirm?.(merged);
    onClose();
  }, [selections, onMergeConfirm, onClose]);

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
          {/* E1 (Sprint70): Mode toggle — view vs merge */}
          <div className="snapshot-compare-mode-toggle" role="group" aria-label="对比模式">
            <button
              className={`mode-btn ${activeMode === 'view' ? 'mode-btn-active' : ''}`}
              onClick={() => setActiveMode('view')}
            >
              差异概览
            </button>
            <button
              className={`mode-btn ${activeMode === 'merge' ? 'mode-btn-active' : ''}`}
              onClick={() => setActiveMode('merge')}
            >
              合并预览
            </button>
          </div>
          <button
            className="snapshot-compare-close"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* E1 (Sprint70): View mode — diff summary */}
        {activeMode === 'view' && (
          <>
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

        {/* E1 (Sprint70): Merge mode — side-by-side node selection */}
        {activeMode === 'merge' && (
          <>
            <div className="snapshot-compare-labels">
              <div className="snapshot-label-base">
                <span className="snapshot-label-badge">左</span>
                <span className="snapshot-label-name">{snapA.name}</span>
                <span className="snapshot-label-time">
                  {new Date(snapA.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="snapshot-label-arrow">↔</div>
              <div className="snapshot-label-compare">
                <span className="snapshot-label-badge">右</span>
                <span className="snapshot-label-name">{snapB.name}</span>
                <span className="snapshot-label-time">
                  {new Date(snapB.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="snapshot-compare-merge-body">
              {/* Side-by-side diff panels */}
              <div className="snapshot-compare-merge-panels">
                {/* Left — snapA */}
                <div className="merge-panel merge-panel-left">
                  <div className="merge-panel-header">
                    <span className="merge-panel-title">左侧（保留）</span>
                  </div>
                  <div className="merge-panel-content">
                    {diff.removed.length > 0 && (
                      <div className="merge-section">
                        <div className="merge-section-title">← 删除的节点（右侧无）</div>
                        {diff.removed.map((node) => (
                          <div
                            key={node.id}
                            className={`merge-node-row merge-node-removed ${previewNode?.id === node.id && previewNode.side === 'left' ? 'merge-node-selected' : ''}`}
                            onClick={() => setPreviewNode({ id: node.id, side: 'left' })}
                            title="点击预览"
                          >
                            <span className="merge-node-id">{node.id}</span>
                            {node.label && <span className="merge-node-label">{node.label}</span>}
                            <span className="merge-node-action">
                              <button
                                className={`merge-choice-btn ${selections[node.id] === 'keep-left' ? 'merge-choice-active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleSelect(node.id, 'keep-left'); }}
                                title="保留左侧"
                              >
                                ← 保留
                              </button>
                              <button
                                className={`merge-choice-btn ${selections[node.id] === 'skip' ? 'merge-choice-active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleSelect(node.id, 'skip'); }}
                                title="忽略"
                              >
                                忽略
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {diff.modified.length > 0 && (
                      <div className="merge-section">
                        <div className="merge-section-title">~ 修改的节点</div>
                        {diff.modified.map((node) => (
                          <div
                            key={node.id}
                            className={`merge-node-row merge-node-modified ${previewNode?.id === node.id && previewNode.side === 'left' ? 'merge-node-selected' : ''}`}
                            onClick={() => setPreviewNode({ id: node.id, side: 'left' })}
                            title="点击预览"
                          >
                            <span className="merge-node-id">{node.id}</span>
                            {node.label && <span className="merge-node-label">{node.label}</span>}
                            <span className="merge-node-action">
                              <button
                                className={`merge-choice-btn ${selections[node.id] === 'keep-left' ? 'merge-choice-active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleSelect(node.id, 'keep-left'); }}
                                title="保留左侧"
                              >
                                ← 保留
                              </button>
                              <button
                                className={`merge-choice-btn ${selections[node.id] === 'keep-right' ? 'merge-choice-active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleSelect(node.id, 'keep-right'); }}
                                title="保留右侧"
                              >
                                保留 →
                              </button>
                              <button
                                className={`merge-choice-btn ${selections[node.id] === 'skip' ? 'merge-choice-active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleSelect(node.id, 'skip'); }}
                                title="忽略"
                              >
                                忽略
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right — snapB */}
                <div className="merge-panel merge-panel-right">
                  <div className="merge-panel-header">
                    <span className="merge-panel-title">右侧（目标）</span>
                  </div>
                  <div className="merge-panel-content">
                    {diff.added.length > 0 && (
                      <div className="merge-section">
                        <div className="merge-section-title">+ 新增节点</div>
                        {diff.added.map((node) => (
                          <div
                            key={node.id}
                            className={`merge-node-row merge-node-added ${previewNode?.id === node.id && previewNode.side === 'right' ? 'merge-node-selected' : ''}`}
                            onClick={() => setPreviewNode({ id: node.id, side: 'right' })}
                            title="点击预览"
                          >
                            <span className="merge-node-id">{node.id}</span>
                            {node.label && <span className="merge-node-label">{node.label}</span>}
                            <span className="merge-node-action">
                              <button
                                className={`merge-choice-btn ${selections[node.id] === 'keep-right' ? 'merge-choice-active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleSelect(node.id, 'keep-right'); }}
                                title="保留右侧"
                              >
                                保留 →
                              </button>
                              <button
                                className={`merge-choice-btn ${selections[node.id] === 'skip' ? 'merge-choice-active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleSelect(node.id, 'skip'); }}
                                title="忽略"
                              >
                                忽略
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {diff.modified.length > 0 && (
                      <div className="merge-section">
                        <div className="merge-section-title">~ 修改的节点</div>
                        {diff.modified.map((node) => (
                          <div
                            key={node.id}
                            className={`merge-node-row merge-node-modified ${previewNode?.id === node.id && previewNode.side === 'right' ? 'merge-node-selected' : ''}`}
                            onClick={() => setPreviewNode({ id: node.id, side: 'right' })}
                            title="点击预览"
                          >
                            <span className="merge-node-id">{node.id}</span>
                            {node.label && <span className="merge-node-label">{node.label}</span>}
                            <span className="merge-node-action">
                              <button
                                className={`merge-choice-btn ${selections[node.id] === 'keep-left' ? 'merge-choice-active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleSelect(node.id, 'keep-left'); }}
                                title="保留左侧"
                              >
                                ← 保留
                              </button>
                              <button
                                className={`merge-choice-btn ${selections[node.id] === 'keep-right' ? 'merge-choice-active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleSelect(node.id, 'keep-right'); }}
                                title="保留右侧"
                              >
                                保留 →
                              </button>
                              <button
                                className={`merge-choice-btn ${selections[node.id] === 'skip' ? 'merge-choice-active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleSelect(node.id, 'skip'); }}
                                title="忽略"
                              >
                                忽略
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Node preview panel */}
              {previewNode && (
                <div className="merge-node-preview" role="region" aria-label="节点预览">
                  <div className="merge-preview-header">
                    <span className="merge-preview-title">节点预览 — {previewNode.id}</span>
                    <button
                      className="merge-preview-close"
                      onClick={() => setPreviewNode(null)}
                      aria-label="关闭预览"
                    >
                      ✕
                    </button>
                  </div>
                  <pre className="merge-preview-content">
                    {JSON.stringify(
                      previewNode.side === 'left'
                        ? (diff.removed.find((n) => n.id === previewNode.id)
                          ?? diff.modified.find((n) => n.id === previewNode.id))
                        : (diff.added.find((n) => n.id === previewNode.id)
                          ?? diff.modified.find((n) => n.id === previewNode.id)),
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="snapshot-compare-footer">
          {activeMode === 'merge' && (
            <button
              className="snapshot-compare-btn-primary"
              onClick={handleConfirm}
              disabled={!onMergeConfirm}
            >
              确认合并
            </button>
          )}
          <button className="snapshot-compare-btn-secondary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
});

export default SnapshotCompareDialog;
