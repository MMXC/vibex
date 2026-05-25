/**
 * DiffOverlay — Sprint38 P003-E2: Approve/Reject 流程 + Toast 错误
 *
 * Extends P003-E1: adds Approve/Reject action buttons and error display.
 * P003-E3: adds AIScoreCard at the bottom for code quality scoring.
 *
 * Usage:
 * ```tsx
 * import { useAIAgent } from '@/hooks/useAIAgent';
 * const { lastResult, lastError } = useAIAgent();
 * <DiffOverlay
 *   result={lastResult}
 *   error={lastError}
 *   onClose={() => setOverlayOpen(false)}
 *   onApprove={() => handleApprove()}
 *   onReject={() => setOverlayOpen(false)}
 * />
 * ```
 */

'use client';

import React, { memo, useMemo } from 'react';
import type { DiffResult } from '@/hooks/useAIAgent';
import { AIScoreCard } from '@/components/AIScoreCard/AIScoreCard';
import styles from './DiffOverlay.module.css';

interface DiffOverlayProps {
  /** Diff result to display; null = overlay hidden */
  result: DiffResult | null;
  /** Error message from AI agent; non-null triggers error display */
  error?: string | null;
  /** Called when the user dismisses the overlay (via ✕ or 关闭) */
  onClose: () => void;
  /** Called when user clicks Approve — user confirms diff changes */
  onApprove?: () => void;
  /** Called when user clicks Reject — user rejects diff changes */
  onReject?: () => void;
}

export const DiffOverlay = memo(function DiffOverlay({
  result,
  error,
  onClose,
  onApprove,
  onReject,
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

      {/* P003-E2: Error banner */}
      {error && (
        <div className={styles.errorBanner} role="alert" data-testid="diff-error">
          <span className={styles.errorIcon}>⚠</span>
          <span className={styles.errorMessage}>{error}</span>
        </div>
      )}

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

      {/* P003-E3: AI Score Card — shown when diff has content */}
      {hasContent && result && (
        <AIScoreCard diffResult={result} />
      )}

      {/* Footer */}
      <div className={styles.footer}>
        {/* P003-E2: Action buttons — only shown when diff has content */}
        {hasContent && (
          <>
            <button
              type="button"
              className={styles.approveBtn}
              onClick={onApprove}
              data-testid="diff-approve-btn"
              aria-label="确认应用变更"
            >
              ✓ 确认
            </button>
            <button
              type="button"
              className={styles.rejectBtn}
              onClick={onReject}
              data-testid="diff-reject-btn"
              aria-label="拒绝变更"
            >
              ✕ 拒绝
            </button>
          </>
        )}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          data-testid="diff-close-btn"
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
