'use client';

/**
 * DiffView — E2-Design-Review-Diff S2.3
 *
 * Shows the diff between two design review reports.
 * Added items (red) / Removed items (green).
 */

import React from 'react';
import type { ReviewDiff } from '@/lib/reviewDiff';
import styles from './DiffView.module.css';

interface DiffViewProps {
  diff: ReviewDiff;
}

function DiffItem({ item, variant }: { item: import('@/lib/reviewDiff').ReviewItem; variant: 'added' | 'removed' }) {
  return (
    <div
      className={`${styles.diffItem} ${variant === 'added' ? styles.diffItemAdded : styles.diffItemRemoved}`}
      data-testid={`diff-item-${variant}`}
    >
      {item.location && (
        <code className={styles.location} data-testid={`diff-item-location-${variant}`}>{item.location}</code>
      )}
      <p className={styles.message} data-testid={`diff-item-message-${variant}`}>{item.message}</p>
    </div>
  );
}

export function DiffView({ diff }: DiffViewProps) {
  const hasAdded = diff.added.length > 0;
  const hasRemoved = diff.removed.length > 0;
  const hasUnchanged = diff.unchanged.length > 0;

  if (!hasAdded && !hasRemoved && !hasUnchanged) {
    return (
      <div className={styles.container} data-testid="diff-view">
        <div className={styles.empty}>No differences found. Reports are identical.</div>
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="diff-view">
      {hasAdded && (
        <div className={styles.section}>
          <div className={`${styles.sectionHeader} ${styles.sectionAdded}`}>
            <span className={styles.sectionLabel}>Added</span>
            <span className={styles.sectionCount} data-testid="diff-added-count">{diff.added.length}</span>
          </div>
          <div className={styles.itemList}>
            {diff.added.map((item) => (
              <DiffItem key={item.id} item={item} variant="added" />
            ))}
          </div>
        </div>
      )}

      {hasRemoved && (
        <div className={styles.section}>
          <div className={`${styles.sectionHeader} ${styles.sectionRemoved}`}>
            <span className={styles.sectionLabel}>Removed</span>
            <span className={styles.sectionCount} data-testid="diff-removed-count">{diff.removed.length}</span>
          </div>
          <div className={styles.itemList}>
            {diff.removed.map((item) => (
              <DiffItem key={item.id} item={item} variant="removed" />
            ))}
          </div>
        </div>
      )}

      {hasUnchanged && (
        <div className={styles.section}>
          <div className={`${styles.sectionHeader} ${styles.sectionUnchanged}`}>
            <span className={styles.sectionLabel}>Unchanged</span>
            <span className={styles.sectionCount} data-testid="diff-unchanged-count">{diff.unchanged.length}</span>
          </div>
          <div className={styles.itemList}>
            {diff.unchanged.map((item) => (
              <div key={item.id} className={styles.unchangedItem} data-testid="diff-item-unchanged">
                <code className={styles.location}>{item.location}</code>
                <p className={styles.message}>{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
