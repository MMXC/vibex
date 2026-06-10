'use client';

/**
 * MergePreviewPanel — Branch Merge Preview Panel
 * S85-E4: 分支合并预览与回滚
 *
 * Shows a preview of what will change when merging source branch into target branch.
 * Displays diff of the two branches and provides an execute button.
 *
 * Usage:
 *   <MergePreviewPanel
 *     projectId={projectId}
 *     sourceBranch="feature-a"
 *     targetBranch="main"
 *     canvasId={canvasId}
 *     onClose={() => setMergePanel(null)}
 *     onMerged={() => { /* refresh *\/ }}
 *   />
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import { useAuthStore } from '@/stores/authStore';
import type { Snapshot } from '@/lib/canvas/historyDB';
import styles from './MergePreviewPanel.module.css';

const s = styles as Record<string, string>;

interface MergePreviewPanelProps {
  projectId: string;
  sourceBranch: string;
  targetBranch: string;
  canvasId: string;
  onClose: () => void;
  onMerged?: () => void;
}

interface MergeResult {
  ok: boolean;
  error?: string;
  pendingConflicts?: Array<{ nodeId: string; source: unknown; target: unknown }>;
}

export function MergePreviewPanel({
  projectId,
  sourceBranch,
  targetBranch,
  canvasId,
  onClose,
  onMerged,
}: MergePreviewPanelProps) {
  const userId = useAuthStore((st) => st.currentUser?.id ?? 'local-user');
  const mergeBranch = useCanvasHistoryStore((st) => st.mergeBranch);

  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [snapshotCount, setSnapshotCount] = useState<number | null>(null);

  // Load snapshot count for the source branch when panel opens
  useEffect(() => {
    const historyStore = useCanvasHistoryStore.getState();
    const snaps = historyStore.snapshots.filter(
      (snap: Snapshot) => snap.branchName === sourceBranch
    );
    setSnapshotCount(snaps.length);
  }, [sourceBranch]);

  const handleMerge = useCallback(async () => {
    if (isMerging) return;
    setIsMerging(true);
    setMergeResult(null);

    try {
      // Call frontend mergeBranch (IndexedDB operation)
      const result = await mergeBranch(canvasId, sourceBranch, targetBranch, userId);

      if (!result.ok) {
        setMergeResult({ ok: false, error: result.error ?? '合并失败' });
        setIsMerging(false);
        return;
      }

      // Persist to backend D1 audit log
      try {
        const resp = await fetch(`/api/canvas/${canvasId}/merge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceBranch,
            targetBranch,
            userId,
            snapshotCount: snapshotCount ?? 0,
          }),
        });
        if (!resp.ok) {
          console.warn('[MergePreview] Backend audit log failed, merge in IndexedDB succeeded');
        }
      } catch (apiErr) {
        console.warn('[MergePreview] Backend audit log error:', apiErr);
      }

      setMergeResult({ ok: true });
    } catch (err) {
      setMergeResult({
        ok: false,
        error: err instanceof Error ? err.message : '合并时发生未知错误',
      });
    } finally {
      setIsMerging(false);
    }
  }, [isMerging, mergeBranch, canvasId, sourceBranch, targetBranch, userId, snapshotCount]);

  // Call onMerged after successful merge
  useEffect(() => {
    if (mergeResult?.ok && onMerged) {
      onMerged();
    }
  }, [mergeResult, onMerged]);

  return (
    <div className={s.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="合并预览">
      <div className={s.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={s.header}>
          <h2 className={s.title}>合并预览</h2>
          <button className={s.closeBtn} onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        {/* Branch info */}
        <div className={s.branchInfo}>
          <div className={s.branchLabel}>
            <span className={s.branchBadge}>源分支</span>
            <span className={s.branchName}>{sourceBranch}</span>
          </div>
          <div className={s.arrow}>↓</div>
          <div className={s.branchLabel}>
            <span className={s.branchBadge}>目标分支</span>
            <span className={s.branchName}>{targetBranch}</span>
          </div>
        </div>

        {/* Snapshot count */}
        <div className={s.meta}>
          源分支包含 <strong>{snapshotCount ?? '…'}</strong> 个快照将被合并到目标分支
        </div>

        {/* Result display */}
        {mergeResult && (
          <div className={`${s.result} ${mergeResult.ok ? s.success : s.error}`} role="alert">
            {mergeResult.ok
              ? '✅ 合并成功！'
              : `❌ 合并失败：${mergeResult.error}`}
          </div>
        )}

        {/* Conflict warning */}
        {mergeResult?.pendingConflicts && mergeResult.pendingConflicts.length > 0 && (
          <div className={`${s.result} ${s.warning}`} role="alert">
            ⚠️ 检测到 {mergeResult.pendingConflicts.length} 个冲突节点，请手动解决
          </div>
        )}

        {/* Actions */}
        <div className={s.actions}>
          <button className={s.cancelBtn} onClick={onClose} disabled={isMerging}>
            取消
          </button>
          <button
            className={s.mergeBtn}
            onClick={handleMerge}
            disabled={isMerging || !!mergeResult?.ok}
          >
            {isMerging ? '合并中…' : '执行合并'}
          </button>
        </div>
      </div>
    </div>
  );
}
