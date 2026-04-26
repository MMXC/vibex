'use client';

/**
 * ConflictResolutionDialog — E1 Design-to-Code Pipeline
 *
 * A three-panel diff view for resolving token conflicts during bidirectional sync.
 * Shows Local / Base / Remote token values with resolution actions.
 *
 * @module components/ConflictResolutionDialog
 */

import React, { useState } from 'react';
import styles from './ConflictResolutionDialog.module.css';

interface ConflictResolutionDialogProps {
  /** Local token value */
  localValue: string;
  /** Base/common ancestor value */
  baseValue: string;
  /** Remote (Figma) token value */
  remoteValue: string;
  /** Token key being resolved */
  tokenKey: string;
  /** Called when user selects a resolution */
  onResolve: (
    resolution: 'local' | 'figma' | 'merge',
    mergedValue?: string
  ) => void;
  /** Called when dialog is dismissed */
  onClose: () => void;
}

export function ConflictResolutionDialog({
  localValue,
  baseValue,
  remoteValue,
  tokenKey,
  onResolve,
  onClose,
}: ConflictResolutionDialogProps) {
  const [selected, setSelected] = useState<'local' | 'figma' | 'merge' | null>(
    null
  );
  const [mergeValue, setMergeValue] = useState('');

  const handleMerge = () => {
    if (mergeValue.trim()) {
      onResolve('merge', mergeValue);
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="conflict-resolution-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-dialog-title"
    >
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 id="conflict-dialog-title" className={styles.title}>
            Resolve Token Conflict
          </h2>
          <span className={styles.tokenKey}>{tokenKey}</span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
            data-testid="conflict-dialog-close"
          >
            ×
          </button>
        </div>

        <div className={styles.panels}>
          <div className={styles.panel}>
            <div className={styles.panelLabel}>Local</div>
            <pre className={styles.panelContent}>{localValue}</pre>
            <button
              className={`${styles.btn} ${selected === 'local' ? styles.btnSelected : ''}`}
              onClick={() => setSelected('local')}
              data-testid="keep-local-btn"
            >
              Keep Local
            </button>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelLabel}>Base</div>
            <pre className={`${styles.panelContent} ${styles.panelBase}`}>
              {baseValue}
            </pre>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelLabel}>Remote (Figma)</div>
            <pre className={styles.panelContent}>{remoteValue}</pre>
            <button
              className={`${styles.btn} ${selected === 'figma' ? styles.btnSelected : ''}`}
              onClick={() => setSelected('figma')}
              data-testid="keep-figma-btn"
            >
              Keep Figma
            </button>
          </div>
        </div>

        {selected === 'merge' && (
          <div className={styles.mergeSection}>
            <label className={styles.mergeLabel} htmlFor="merge-input">
              Edit merged value:
            </label>
            <textarea
              id="merge-input"
              className={styles.mergeTextarea}
              value={mergeValue}
              onChange={(e) => setMergeValue(e.target.value)}
              rows={4}
              data-testid="merge-input"
            />
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => setSelected(selected === 'merge' ? null : 'merge')}
            data-testid="merge-btn"
          >
            Merge
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => {
              if (selected === 'merge') {
                handleMerge();
              } else if (selected) {
                onResolve(selected);
              }
            }}
            disabled={!selected}
            data-testid="conflict-resolve-confirm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
