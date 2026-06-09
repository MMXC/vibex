/**
 * ConflictResolutionDialog — E1 (Sprint70): Branch Merge Conflict Resolution
 *
 * Triggered when merging branches results in conflicting nodes.
 * Presents two versions (local vs remote) and three resolution options:
 * 1. Keep my version — discard the remote changes
 * 2. Keep their version — discard local changes
 * 3. Merge both — attempt a content-level merge
 *
 * S83-E3: Added onAutoResolved callback to notify parent of the chosen strategy.
 */

'use client';

import React, { memo, useCallback } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import type { BranchConflict } from '@/stores/dds/canvasHistoryStore';
import type { AutoResolveStrategy } from './ConflictConfirmToast';

export interface ConflictResolutionDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Current canvas ID */
  canvasId: string;
  /** Called when all conflicts are resolved */
  onResolved: () => void;
  /** Called when user cancels */
  onClose: () => void;
  /** S83-E3: Called when a resolution strategy is chosen (before checking if more conflicts remain) */
  onAutoResolved?: (strategy: AutoResolveStrategy) => void;
}

const ConflictResolutionDialog = memo(function ConflictResolutionDialog({
  open,
  canvasId,
  onResolved,
  onClose,
  onAutoResolved,
}: ConflictResolutionDialogProps) {
  const pendingConflicts = useCanvasHistoryStore((s) => s.pendingConflicts);
  const resolveBranchConflict = useCanvasHistoryStore((s) => s.resolveBranchConflict);
  const clearPendingConflicts = useCanvasHistoryStore((s) => s.clearPendingConflicts);

  const currentConflict = pendingConflicts[0] ?? null;

  // S83-E3: Map resolution type to AutoResolveStrategy
  const mapStrategy = (resolution: 'keep-local' | 'keep-remote' | 'merge'): AutoResolveStrategy => {
    switch (resolution) {
      case 'keep-local': return 'keep-mine';
      case 'keep-remote': return 'keep-theirs';
      case 'merge': return 'auto-merge';
    }
  };

  const handleResolve = useCallback(
    async (resolution: 'keep-local' | 'keep-remote' | 'merge') => {
      if (!currentConflict) return;
      // S83-E3: Notify parent of the chosen strategy
      if (onAutoResolved) {
        onAutoResolved(mapStrategy(resolution));
      }
      await resolveBranchConflict(
        canvasId,
        currentConflict.nodeId,
        resolution,
      );
      // Check if all resolved
      const remaining = pendingConflicts.slice(1);
      if (remaining.length === 0) {
        clearPendingConflicts();
        onResolved();
      }
    },
    [currentConflict, resolveBranchConflict, pendingConflicts, clearPendingConflicts, canvasId, onResolved, onAutoResolved],
  );

  const handleCancel = useCallback(() => {
    clearPendingConflicts();
    onClose();
  }, [clearPendingConflicts, onClose]);

  if (!open || !currentConflict) return null;

  const conflictCount = pendingConflicts.length;

  return (
    <div
      className="branch-conflict-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-conflict-title"
    >
      <div className="branch-conflict-dialog">
        {/* Header */}
        <div className="branch-conflict-header">
          <h2 id="branch-conflict-title" className="branch-conflict-title">
            冲突解决
          </h2>
          <button
            className="branch-conflict-close"
            onClick={handleCancel}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* Conflict count */}
        <div className="branch-conflict-summary" aria-live="polite">
          <span>冲突节点：</span>
          <strong>{conflictCount} 个</strong>
          {conflictCount > 1 && (
            <span className="conflict-progress">
              {' '}(1/{conflictCount})
            </span>
          )}
        </div>

        {/* Node ID */}
        <div className="branch-conflict-node-id">
          节点 ID: <code>{currentConflict.nodeId}</code>
        </div>

        {/* Two-column comparison */}
        <div className="branch-conflict-versions">
          {/* Local version */}
          <div className="branch-conflict-version local">
            <div className="branch-conflict-version-header">
              <span className="branch-conflict-version-badge">我的版本</span>
              <span className="branch-conflict-version-branch">
                {currentConflict.localBranch}
              </span>
            </div>
            <div className="branch-conflict-version-content">
              {currentConflict.localData && Object.keys(currentConflict.localData).length > 0 ? (
                <pre className="branch-conflict-version-json">
                  {JSON.stringify(currentConflict.localData, null, 2)}
                </pre>
              ) : (
                <span className="branch-conflict-empty">(节点已删除)</span>
              )}
            </div>
            <button
              className="branch-conflict-resolve-btn keep-mine"
              onClick={() => handleResolve('keep-local')}
              aria-label="保留我的版本"
            >
              保留我的版本
            </button>
          </div>

          {/* Remote version */}
          <div className="branch-conflict-divider">vs</div>

          <div className="branch-conflict-version remote">
            <div className="branch-conflict-version-header">
              <span className="branch-conflict-version-badge remote">对方版本</span>
              <span className="branch-conflict-version-branch">
                {currentConflict.remoteBranch}
              </span>
            </div>
            <div className="branch-conflict-version-content">
              {currentConflict.remoteData && Object.keys(currentConflict.remoteData).length > 0 ? (
                <pre className="branch-conflict-version-json">
                  {JSON.stringify(currentConflict.remoteData, null, 2)}
                </pre>
              ) : (
                <span className="branch-conflict-empty">(节点已删除)</span>
              )}
            </div>
            <button
              className="branch-conflict-resolve-btn keep-theirs"
              onClick={() => handleResolve('keep-remote')}
              aria-label="采用对方版本"
            >
              采用对方版本
            </button>
          </div>
        </div>

        {/* Merge both button */}
        <div className="branch-conflict-merge-both">
          <button
            className="branch-conflict-resolve-btn merge-both"
            onClick={() => handleResolve('merge')}
          >
            合并内容
          </button>
          <p className="branch-conflict-merge-hint">
            尝试将两个版本的内容合并（智能合并策略）
          </p>
        </div>
      </div>
    </div>
  );
});

export default ConflictResolutionDialog;
