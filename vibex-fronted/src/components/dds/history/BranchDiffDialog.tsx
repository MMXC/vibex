'use client';

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import type { BranchDiffResult } from '@/stores/dds/canvasHistoryStore';
import SnapshotDiffRenderer from '../canvas-history/SnapshotDiffRenderer';
import styles from './BranchDiffDialog.module.css';

interface BranchDiffDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Branch A to compare */
  branchA: string;
  /** Branch B to compare */
  branchB: string;
  /** Called when user wants to restore a snapshot */
  onRestore?: (snapshotId: string) => void;
  /** Current canvas ID */
  canvasId?: string;
  /** Called when dialog is closed */
  onClose: () => void;
}

/**
 * BranchDiffDialog — modal dialog for comparing two branches.
 * Opened from HistoryPanel after Ctrl+Click multi-select.
 * Shows diff between the latest snapshots of branchA and branchB.
 * S74-E3: 画布分支对比视图
 * S74-E5: Keyboard navigation — Esc to close, focus trap, focus restoration
 */
const BranchDiffDialog = memo(function BranchDiffDialog({
  open,
  branchA,
  branchB,
  onRestore,
  canvasId,
  onClose,
}: BranchDiffDialogProps) {
  const [diff, setDiff] = useState<BranchDiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for focus management
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const compareBranches = useCanvasHistoryStore((s) => s.compareBranches);

  // S74-E5: Focus restoration — save focus before opening, restore on close
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus first focusable element (close button) after mount
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    }
  }, [open]);

  // S74-E5: Escape key to close dialog
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // S74-E5: Focus trap — keep focus within dialog
  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'a[href]',
    ].join(', ');

    const getFocusableElements = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => !el.closest('[aria-hidden="true"]')
      );

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Ensure focus stays within dialog
    const handleFocusIn = (e: FocusEvent) => {
      if (!dialog.contains(e.target as Node)) {
        e.preventDefault();
        const focusable = getFocusableElements();
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    dialog.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      dialog.removeEventListener('focusin', handleFocusIn);
      // S74-E5: Restore focus when dialog closes
      previousFocusRef.current?.focus();
    };
  }, [open]);

  // Load diff when dialog opens with valid branches
  useEffect(() => {
    if (!open || !branchA || !branchB || branchA === branchB) {
      setDiff(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setDiff(null);
      try {
        const result = await compareBranches(canvasId ?? '', branchA, branchB);
        if (!cancelled) {
          if (result.error) {
            setError(result.error);
          } else {
            setDiff(result);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(`对比失败: ${e instanceof Error ? e.message : String(e)}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [open, branchA, branchB, compareBranches, canvasId]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setDiff(null);
      setError(null);
    }
  }, [open]);

  const handleItemClick = useCallback((item: { id: string }) => {
    onRestore?.(item.id);
  }, [onRestore]);

  const handleCompareToMain = useCallback(() => {
    if (branchA === 'main') {
      // If A is main, compare B to main (already comparing)
      return;
    }
    // This would need to be wired to parent — emit a custom event
    const event = new CustomEvent('compare-to-main', { detail: { branch: branchA } });
    window.dispatchEvent(event);
  }, [branchA]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`分支对比: ${branchA} vs ${branchB}`}
    >
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            分支对比
            <span className={styles.headerBranch}>
              {branchA} ↔ {branchB}
            </span>
          </h2>
          <button
            ref={closeButtonRef}
            className={styles.closeBtn}
            data-testid="diff-close-btn"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          {/* Compare to main quick action */}
          {branchA !== 'main' && (
            <button
              className={styles.mainActionBtn}
              onClick={handleCompareToMain}
              title={`将 ${branchA} 对比到主分支`}
            >
              对比到主分支
            </button>
          )}
          {branchB !== 'main' && (
            <button
              className={styles.mainActionBtn}
              onClick={() => {
                const event = new CustomEvent('compare-to-main', { detail: { branch: branchB } });
                window.dispatchEvent(event);
              }}
              title={`将 ${branchB} 对比到主分支`}
            >
              对比 {branchB} → main
            </button>
          )}
        </div>

        {/* Summary stats */}
        {diff && diff.summary && (
          <div className={styles.statsBar}>
            <span className={styles.statItem} style={{ color: '#16a34a' }}>
              <strong>{diff.summary.contextsAdded}</strong> 新增
            </span>
            <span className={styles.statItem} style={{ color: '#dc2626' }}>
              <strong>{diff.summary.contextsRemoved}</strong> 删除
            </span>
            <span className={styles.statItem} style={{ color: '#d97706' }}>
              <strong>{diff.summary.contextsModified}</strong> 修改
            </span>
            <span className={styles.statItem} style={{ color: '#6b7280' }}>
              共 <strong>{diff.summary.totalChanges}</strong> 项变更
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className={styles.loadingState} role="status">
            正在对比 <strong>{branchA}</strong> 和 <strong>{branchB}</strong>…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={styles.errorState} role="alert">
            {error}
          </div>
        )}

        {/* Diff content */}
        {diff && !loading && !error && (
          <div className={styles.content}>
            <SnapshotDiffRenderer diff={diff.diffs} onItemClick={handleItemClick} />
          </div>
        )}

        {/* Empty — same branch or no diff yet */}
        {!diff && !loading && !error && branchA === branchB && (
          <div className={styles.emptyState}>
            请选择两个不同的分支进行对比
          </div>
        )}
        {!diff && !loading && !error && branchA !== branchB && (
          <div className={styles.emptyState}>
            正在加载对比结果…
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
});

export default BranchDiffDialog;
