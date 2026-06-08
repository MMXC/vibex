'use client';

/**
 * BranchAutoMergeDialog.tsx — E1 (Sprint78)
 * Canvas 分支自动合并预览对话框
 *
 * Shows merge preview with color-coded conflict classification:
 * - 🟢 Auto-merge (green): non-overlapping nodes, will merge automatically
 * - 🟡 Manual (yellow): target-only nodes, no conflict
 * - 🔴 Conflict (red): same node modified on both branches, needs resolution
 *
 * Triggered by BranchManager MergeBranchButton when autoMergeBranch returns conflicts.
 */

import { useState, useEffect } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import type { BranchConflict } from '@/stores/dds/canvasHistoryStore';

interface BranchAutoMergeDialogProps {
  canvasId: string;
  sourceBranch: string;
  targetBranch: string;
  /** Pre-populated conflicts from autoMergeBranch */
  initialConflicts: BranchConflict[];
  /** Called when user confirms and conflicts are fully resolved */
  onComplete: () => void;
  /** Called when user cancels */
  onCancel: () => void;
}

type Resolution = 'keep-local' | 'keep-remote' | null;

/**
 * Node classification for the merge preview
 */
interface MergePreviewItem {
  nodeId: string;
  nodeLabel?: string;
  /** 'auto' | 'manual' | 'conflict' */
  category: 'auto' | 'manual' | 'conflict';
  localData?: Record<string, unknown> | null;
  remoteData?: Record<string, unknown> | null;
  resolution: Resolution;
}

export function BranchAutoMergeDialog({
  canvasId,
  sourceBranch,
  targetBranch,
  initialConflicts,
  onComplete,
  onCancel,
}: BranchAutoMergeDialogProps) {
  const autoMergeBranch = useCanvasHistoryStore((s) => s.autoMergeBranch);
  const resolveBranchConflict = useCanvasHistoryStore((s) => s.resolveBranchConflict);
  const mergeBranch = useCanvasHistoryStore((s) => s.mergeBranch);
  const setCurrentBranch = useCanvasHistoryStore((s) => s.setCurrentBranch);
  const listSnapshots = useCanvasHistoryStore((s) => s.listSnapshots);
  const pendingConflicts = useCanvasHistoryStore((s) => s.pendingConflicts);
  const clearPendingConflicts = useCanvasHistoryStore((s) => s.clearPendingConflicts);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build preview items from conflicts
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});

  // Track which conflicts have been resolved
  const conflictIds = initialConflicts.map((c) => c.nodeId);
  const unresolvedCount = conflictIds.filter((id) => !resolutions[id]).length;
  const allResolved = unresolvedCount === 0;

  const handleResolution = (nodeId: string, resolution: Resolution) => {
    setResolutions((prev) => ({ ...prev, [nodeId]: resolution }));
  };

  const handleConfirm = async () => {
    if (!allResolved) {
      setError('请为所有冲突节点选择解决方案');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Resolve each conflict
      for (const conflict of initialConflicts) {
        const resolution = resolutions[conflict.nodeId];
        if (resolution) {
          await resolveBranchConflict(canvasId, conflict.nodeId, resolution);
        }
      }
      // Perform the actual merge
      await mergeBranch(canvasId, sourceBranch, targetBranch, 'user-1');
      setCurrentBranch(targetBranch);
      await listSnapshots(canvasId);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : '合并失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    clearPendingConflicts();
    onCancel();
  };

  const categoryLabel = (cat: 'auto' | 'manual' | 'conflict') => {
    if (cat === 'auto') return { text: '自动合并', className: 'auto-merge-badge' };
    if (cat === 'manual') return { text: '目标分支独有', className: 'manual-badge' };
    return { text: '需解决', className: 'conflict-badge' };
  };

  const getNodeLabel = (conflict: BranchConflict) =>
    conflict.nodeLabel ?? conflict.nodeId;

  const getNodeValue = (data: Record<string, unknown> | null | undefined) => {
    if (!data) return '—';
    const label = data.label ?? data.name ?? data.id ?? '—';
    return String(label);
  };

  const conflictCount = initialConflicts.length;
  const resolvedCount = Object.keys(resolutions).filter((k) => resolutions[k]).length;

  return (
    <div className="dialog-overlay" onClick={handleCancel} role="dialog" aria-modal="true" aria-labelledby="merge-dialog-title">
      <div className="dialog-panel merge-preview-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className="dialog-header">
          <h3 id="merge-dialog-title">🔀 分支合并预览</h3>
          <button className="dialog-close" onClick={handleCancel} aria-label="关闭">×</button>
        </div>

        {/* Branch info */}
        <div className="dialog-body">
          <div className="merge-branch-info">
            <span className="branch-tag source">{sourceBranch}</span>
            <span className="merge-arrow">→</span>
            <span className="branch-tag target">{targetBranch}</span>
          </div>

          {/* Conflict summary */}
          <div className="merge-summary">
            <div className="summary-item conflict">
              <span className="summary-count">{conflictCount}</span>
              <span className="summary-label">冲突节点</span>
            </div>
            <div className="summary-item resolved">
              <span className="summary-count">{resolvedCount}</span>
              <span className="summary-label">已解决</span>
            </div>
            <div className="summary-item pending">
              <span className="summary-count">{conflictCount - resolvedCount}</span>
              <span className="summary-label">待解决</span>
            </div>
          </div>

          {/* Conflict list */}
          {initialConflicts.length === 0 ? (
            <p className="merge-empty">没有冲突，将自动合并所有变更。</p>
          ) : (
            <div className="conflict-list" role="list">
              {initialConflicts.map((conflict) => {
                const res = resolutions[conflict.nodeId];
                const cat = categoryLabel('conflict');
                return (
                  <div key={conflict.nodeId} className={`conflict-item conflict-row ${res ? 'resolved' : ''}`} role="listitem">
                    <div className="conflict-header">
                      <span className={`conflict-badge ${cat.className}`}>{cat.text}</span>
                      <span className="node-label">{getNodeLabel(conflict)}</span>
                      <span className="node-id">{conflict.nodeId}</span>
                    </div>

                    <div className="conflict-content">
                      <div className="conflict-side source-side">
                        <div className="side-label">
                          <span className="branch-tag source">{conflict.localBranch}</span>
                        </div>
                        <pre className="node-data">{getNodeValue(conflict.localData)}</pre>
                      </div>
                      <div className="conflict-divider">vs</div>
                      <div className="conflict-side target-side">
                        <div className="side-label">
                          <span className="branch-tag target">{conflict.remoteBranch}</span>
                        </div>
                        <pre className="node-data">{getNodeValue(conflict.remoteData)}</pre>
                      </div>
                    </div>

                    {/* Resolution buttons */}
                    <div className="conflict-resolution" role="group" aria-label="选择解决方案">
                      <button
                        className={`resolution-btn local ${res === 'keep-local' ? 'selected' : ''}`}
                        onClick={() => handleResolution(conflict.nodeId, 'keep-local')}
                        aria-pressed={res === 'keep-local'}
                      >
                        保留源分支
                      </button>
                      <button
                        className={`resolution-btn remote ${res === 'keep-remote' ? 'selected' : ''}`}
                        onClick={() => handleResolution(conflict.nodeId, 'keep-remote')}
                        aria-pressed={res === 'keep-remote'}
                      >
                        保留目标分支
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div className="merge-error" role="alert">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="dialog-footer">
          <button className="btn-ghost" onClick={handleCancel} disabled={loading}>
            取消
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={loading || !allResolved}
          >
            {loading ? '合并中…' : allResolved ? '确认合并' : `还需解决 ${conflictCount - resolvedCount} 个冲突`}
          </button>
        </div>
      </div>
    </div>
  );
}
