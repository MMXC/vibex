/**
 * DiffOverlay — Sprint38 P003-E1: DiffOverlay 多文件 tab + Token 估算
 *
 * S39-P003-E1: Adds multi-file tab support with activeTab state and token estimation.
 * Extends Sprint38 P003-E2: adds Approve/Reject action buttons and error display.
 * P003-E3: adds AIScoreCard at the bottom for code quality scoring.
 *
 * Usage:
 * ```tsx
 * import { useAIAgent } from '@/hooks/useAIAgent';
 * const { lastResult, lastError } = useAIAgent();
 * <DiffOverlay
 *   result={lastResult}
 *   files={[{ filename: 'src/utils/helper.ts', changes: [...], added: 5, removed: 2 }]}
 *   error={lastError}
 *   onClose={() => setOverlayOpen(false)}
 *   onApprove={() => handleApprove()}
 *   onReject={() => setOverlayOpen(false)}
 * />
 * ```
 */

'use client';

import React, { memo, useMemo, useState } from 'react';
import type { DiffResult } from '@/hooks/useAIAgent';
import { AIScoreCard } from '@/components/AIScoreCard/AIScoreCard';
import styles from './DiffOverlay.module.css';

/** Single file entry in the multi-file diff view */
export interface DiffFileEntry {
  /** Relative file path displayed in the tab */
  filename: string;
  /** Individual diff lines for this file */
  changes: DiffResult['changes'];
  /** Lines added in this file */
  added: number;
  /** Lines removed in this file */
  removed: number;
}

interface DiffOverlayProps {
  /** Diff result to display; null = overlay hidden */
  result: DiffResult | null;
  /** Multi-file diff entries for tabbed view (optional, falls back to result.changes) */
  files?: DiffFileEntry[];
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
  files,
  error,
  onClose,
  onApprove,
  onReject,
}: DiffOverlayProps) {
  // S39-P003-E1: activeTab state for multi-file tab support
  const [activeTab, setActiveTab] = useState(0);

  const { added, removed, changes } = result ?? { added: 0, removed: 0, changes: [] };

  // S39-P003-E1: Derive per-file or aggregate data for rendering
  const activeFile = files && files.length > 0 ? files[activeTab] : null;
  const displayChanges = activeFile ? activeFile.changes : changes;
  const displayAdded = activeFile ? activeFile.added : added;
  const displayRemoved = activeFile ? activeFile.removed : removed;

  const hasContent = (displayAdded > 0 || displayRemoved > 0) && displayChanges.length > 0;

  // S39-P003-E1: Token estimate — chars * 0.75 ≈ tokens
  const tokenEstimate = useMemo(() => {
    if (!hasContent) return null;
    const content = displayChanges.map((c) => c.line).join('\n');
    const chars = new Blob([content]).size;
    return Math.ceil(chars * 0.75);
  }, [displayChanges, hasContent]);

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

      {/* S39-P003-E1: Tab bar for multi-file diff */}
      {files && files.length > 1 && (
        <div className={styles.tabBar} role="tablist" data-testid="diff-tab-bar">
          {files.map((file, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activeTab}
              aria-controls={`diff-tab-panel-${i}`}
              className={`${styles.tabBtn} ${i === activeTab ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(i)}
              data-testid={`diff-tab-${i}`}
            >
              {file.filename.split('/').pop()}
            </button>
          ))}
        </div>
      )}

      {/* Stats bar */}
      <div className={styles.stats} data-testid="diff-stats">
        <span className={`${styles.stat} ${styles.statAdded}`} data-testid="diff-added">
          +{displayAdded} added
        </span>
        <span className={`${styles.stat} ${styles.statRemoved}`} data-testid="diff-removed">
          -{displayRemoved} removed
        </span>
        {/* S39-P003-E1: Token estimate badge */}
        {tokenEstimate !== null && (
          <span className={styles.stat} data-testid="diff-token-estimate">
            ~{tokenEstimate.toLocaleString()} tokens
          </span>
        )}
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
          displayChanges.map((change, i) => (
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
