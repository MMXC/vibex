/**
 * DiffOverlay — Sprint38 P003-E1: AI result diff overlay
 *
 * Displays line-level diff results from the AI coding agent using the `diff` npm package.
 * Shows green lines for additions and red lines for removals.
 * Appears as a fixed overlay anchored to the bottom-right of the viewport.
 *
 * Usage:
 * ```tsx
 * import { useAIAgent } from '@/hooks/useAIAgent';
 * const { lastResult } = useAIAgent();
 * <DiffOverlay result={lastResult} onClose={() => setLastResult(null)} />
 * ```
 */

'use client';

import React, { memo, useMemo } from 'react';
import type { DiffResult } from '@/hooks/useAIAgent';
import styles from './DiffOverlay.module.css';

interface DiffOverlayProps {
  /** Diff result to display; null = overlay hidden */
  result: DiffResult | null;
  /** Called when the user dismisses the overlay */
  onClose: () => void;
}

export const DiffOverlay = memo(function DiffOverlay({
  result,
  onClose,
}: DiffOverlayProps) {
  const { added, removed, changes } = result ?? { added: 0, removed: 0, changes: [] };

  const hasContent = (added > 0 || removed > 0) && changes.length > 0;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-label="AI 代码 Diff 预览"
      data-testid="diff-overlay"
    >
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>🤖 AI 代码变更预览</span>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className={styles.stats} data-testid="diff-stats">
        <span className={`${styles.stat} ${styles.statAdded}`} data-testid="diff-added">
          +{added} added
        </span>
        <span className={`${styles.stat} ${styles.statRemoved}`} data-testid="diff-removed">
          -{removed} removed
        </span>
      </div>

      {/* Diff body */}
      <div className={styles.diffBody}>
        {!hasContent ? (
          <div className={styles.emptyState} data-testid="diff-empty">
            <div>📝</div>
            <div>暂无代码变更</div>
          </div>
        ) : (
          changes.map((change, i) => (
            <DiffLineView key={i} change={change} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
        >
          关闭
        </button>
      </div>
    </div>
  );
});

/**
 * Renders a single diff line with the appropriate color class.
 */
function DiffLineView({
  change,
}: {
  change: { type: 'add' | 'remove'; line: string; lineNumber: number };
}) {
  const lineClass =
    change.type === 'add' ? styles.addedLine : styles.removedLine;

  return (
    <div className={`${styles.diffLine} ${lineClass}`} data-testid={`diff-line-${change.type}`}>
      <span className={styles.lineNumber}>{change.lineNumber}</span>
      <span className={styles.lineContent}>{change.line}</span>
    </div>
  );
}

export default DiffOverlay;
