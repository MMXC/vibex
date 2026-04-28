'use client';

/**
 * ConflictResolutionDialog — S16-P0-2 Design-to-Code Bidirectional Sync
 *
 * Three-panel diff UI for resolving design/code/token conflicts:
 * - Design panel: tokens from Figma
 * - Token panel: current design tokens
 * - Code panel: tokens from source code
 *
 * Actions: Accept Design | Accept Code | Accept Token | Merge All
 */

import React, { useCallback, useState } from 'react';
import type { TokenChange } from '@/types/designSync';
import styles from './ConflictResolutionDialog.module.css';

// ============================================================================
// Types
// ============================================================================

interface ConflictResolutionDialogProps {
  /** Open state */
  isOpen: boolean;
  /** Changes to resolve */
  changes: TokenChange[];
  /** Design tokens (from Figma) */
  designTokens?: { name: string; value: string }[];
  /** Code tokens (from source) */
  codeTokens?: { name: string; value: string }[];
  /** Called when user resolves conflict */
  onResolve: (action: 'design' | 'code' | 'token' | 'merge') => void;
  /** Called to close dialog */
  onClose: () => void;
}

// ============================================================================
// Sub-components
// ============================================================================

function DiffLine({
  type,
  text,
}: {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  text: string;
}) {
  return (
    <div
      className={`${styles.diffLine} ${styles[`diffLine--${type}`]}`}
      data-testid={`diff-${type}`}
    >
      <span className={styles.diffPrefix}>
        {type === 'added' ? '+' : type === 'removed' ? '-' : type === 'modified' ? '~' : ' '}
      </span>
      <code className={styles.diffText}>{text}</code>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function ConflictResolutionDialog({
  isOpen,
  changes,
  designTokens = [],
  codeTokens = [],
  onResolve,
  onClose,
}: ConflictResolutionDialogProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const handleResolve = useCallback(
    (action: 'design' | 'code' | 'token' | 'merge') => {
      setSelectedAction(action);
      onResolve(action);
    },
    [onResolve]
  );

  if (!isOpen) return null;

  const hasChanges = changes.length > 0;

  return (
    <div
      className={styles.overlay}
      data-testid="conflict-resolution-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Conflict Resolution"
    >
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title} data-testid="dialog-title">
            Design-to-Code Conflict
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            data-testid="dialog-close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {hasChanges ? (
          <>
            {/* Summary */}
            <div className={styles.summary} data-testid="conflict-summary">
              <span className={styles.summaryCount} data-testid="change-count">
                {changes.length} change{changes.length !== 1 ? 's' : ''} detected
              </span>
              <div className={styles.changeBreakdown}>
                <span className={styles.badgeAdded}>
                  {changes.filter((c) => c.type === 'added').length} added
                </span>
                <span className={styles.badgeRemoved}>
                  {changes.filter((c) => c.type === 'removed').length} removed
                </span>
                <span className={styles.badgeModified}>
                  {changes.filter((c) => c.type === 'modified').length} modified
                </span>
              </div>
            </div>

            {/* Three-panel diff */}
            <div className={styles.panels} data-testid="three-panels">
              {/* Design panel */}
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <span className={styles.panelTitle}>Design (Figma)</span>
                </div>
                <div className={styles.panelContent}>
                  {designTokens.map((t, i) => (
                    <div
                      key={i}
                      className={styles.tokenRow}
                      data-testid={`design-token-${i}`}
                    >
                      <code className={styles.tokenName}>{t.name}</code>
                      <code className={styles.tokenValue}>{t.value}</code>
                    </div>
                  ))}
                  {designTokens.length === 0 && (
                    <p className={styles.empty}>No design tokens</p>
                  )}
                </div>
              </div>

              {/* Token panel */}
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <span className={styles.panelTitle}>Token</span>
                </div>
                <div className={styles.panelContent}>
                  {changes.map((change, i) => (
                    <DiffLine
                      key={i}
                      type={
                        change.type === 'added'
                          ? 'added'
                          : change.type === 'removed'
                          ? 'removed'
                          : 'modified'
                      }
                      text={`${change.location ?? change.tokenId}: ${change.oldValue ?? ''} → ${change.newValue ?? ''}`}
                    />
                  ))}
                </div>
              </div>

              {/* Code panel */}
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <span className={styles.panelTitle}>Code</span>
                </div>
                <div className={styles.panelContent}>
                  {codeTokens.map((t, i) => (
                    <div
                      key={i}
                      className={styles.tokenRow}
                      data-testid={`code-token-${i}`}
                    >
                      <code className={styles.tokenName}>{t.name}</code>
                      <code className={styles.tokenValue}>{t.value}</code>
                    </div>
                  ))}
                  {codeTokens.length === 0 && (
                    <p className={styles.empty}>No code tokens</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className={styles.actions} data-testid="dialog-actions">
              <button
                type="button"
                className={`${styles.actionBtn} ${styles['actionBtn--design']}`}
                onClick={() => handleResolve('design')}
                data-testid="btn-accept-design"
              >
                Accept Design
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles['actionBtn--code']}`}
                onClick={() => handleResolve('code')}
                data-testid="btn-accept-code"
              >
                Accept Code
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles['actionBtn--token']}`}
                onClick={() => handleResolve('token')}
                data-testid="btn-accept-token"
              >
                Accept Token
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles['actionBtn--merge']}`}
                onClick={() => handleResolve('merge')}
                data-testid="btn-merge-all"
              >
                Merge All
              </button>
            </div>

            {/* Selected action indicator */}
            {selectedAction && (
              <div className={styles.selectedIndicator} data-testid="selected-action">
                Selected: {selectedAction}
              </div>
            )}
          </>
        ) : (
          <div className={styles.noConflict} data-testid="no-conflict">
            <p>No conflicts detected.</p>
          </div>
        )}
      </div>
    </div>
  );
}
