'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import type { SnapshotDiff, SnapshotDiffItem, BranchDiffResult } from '@/stores/dds/canvasHistoryStore';
import SnapshotDiffRenderer from './SnapshotDiffRenderer';

interface BranchDiffPanelProps {
  /** Whether the panel is open */
  open: boolean;
  onClose: () => void;
  /** Called when user wants to restore a snapshot */
  onRestore?: (snapshotId: string) => void;
  /** Current canvas ID */
  canvasId?: string;
}

/**
 * BranchDiffPanel — side panel for comparing the latest snapshots of two branches.
 * Opens alongside the HistoryPanel and shows the diff between branch tips.
 */
const BranchDiffPanel = memo(function BranchDiffPanel({
  open,
  onClose,
  onRestore,
  canvasId,
}: BranchDiffPanelProps) {
  const [branchA, setBranchA] = useState<string>('main');
  const [branchB, setBranchB] = useState<string>('main');
  const [diff, setDiff] = useState<BranchDiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branches = useCanvasHistoryStore((s) => s.snapshots.length > 0
    ? Array.from(new Set(s.snapshots.map((snap) => snap.branchName ?? 'main')))
    : ['main']
  );
  const compareBranches = useCanvasHistoryStore((s) => s.compareBranches);

  // Initialize branch selectors to first two branches
  useEffect(() => {
    if (branches.length >= 2) {
      setBranchA(branches[0]);
      setBranchB(branches[1]);
    } else if (branches.length === 1) {
      setBranchA(branches[0]);
      setBranchB(branches[0]);
    }
  }, [branches]);

  const handleCompare = useCallback(async () => {
    if (branchA === branchB) {
      setError('请选择两个不同的分支进行对比');
      return;
    }
    setLoading(true);
    setError(null);
    setDiff(null);
    try {
      const result = await compareBranches(canvasId ?? '', branchA, branchB);
      if (result.error) {
        setError(result.error);
      } else {
        setDiff(result);
      }
    } catch (e) {
      setError(`对比失败: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [branchA, branchB, compareBranches, canvasId]);

  const handleItemClick = useCallback((item: SnapshotDiffItem) => {
    onRestore?.(item.id);
  }, [onRestore]);

  if (!open) return null;

  return (
    <div className="branch-diff-panel" role="complementary" aria-label="分支对比">
      {/* Header */}
      <div className="branch-diff-header">
        <h2 className="branch-diff-title">分支对比</h2>
        <button
          className="branch-diff-close"
          onClick={onClose}
          aria-label="关闭"
        >
          ✕
        </button>
      </div>

      {/* Branch selectors */}
      <div className="branch-diff-selectors">
        <label className="branch-selector" htmlFor="branch-a-select">
          <span className="branch-selector-label">分支 A</span>
          <select
            id="branch-a-select"
            className="branch-select"
            value={branchA}
            onChange={(e) => setBranchA(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>

        <span className="branch-diff-arrow" aria-hidden="true">↔</span>

        <label className="branch-selector" htmlFor="branch-b-select">
          <span className="branch-selector-label">分支 B</span>
          <select
            id="branch-b-select"
            className="branch-select"
            value={branchB}
            onChange={(e) => setBranchB(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>

        <button
          className="branch-diff-compare-btn"
          onClick={handleCompare}
          disabled={loading}
          aria-label="对比分支"
        >
          {loading ? '对比中…' : '对比'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="branch-diff-error" role="alert">
          {error}
        </div>
      )}

      {/* Diff results */}
      {diff && (
        <div className="branch-diff-content">
          <div className="branch-diff-meta">
            <span className="branch-diff-meta-item">
              <strong>{branchA}</strong> vs <strong>{branchB}</strong>
            </span>
          </div>
          <SnapshotDiffRenderer diff={diff.diffs} onItemClick={handleItemClick} />
        </div>
      )}

      {/* Empty state */}
      {!diff && !loading && !error && (
        <div className="branch-diff-empty-state">
          选择两个分支并点击「对比」查看差异
        </div>
      )}
    </div>
  );
});

export default BranchDiffPanel;
