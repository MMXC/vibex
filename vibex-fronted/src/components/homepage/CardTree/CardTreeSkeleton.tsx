/**
 * CardTreeSkeleton — Loading skeleton for CardTree
 *
 * Animated skeleton cards shown during data loading.
 */

'use client';

import React from 'react';
import styles from './CardTree.module.css';

export interface CardTreeSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Custom class name */
  className?: string;
  'data-testid'?: string;
}

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard} data-testid="skeleton-card">
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonIcon} />
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonBadge} />
      </div>
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonLine} style={{ width: '70%' }} />
        <div className={styles.skeletonLine} style={{ width: '85%' }} />
        <div className={styles.skeletonLine} style={{ width: '60%' }} />
      </div>
    </div>
  );
}

/**
 * CardTreeSkeleton — Animated loading skeleton
 */
export function CardTreeSkeleton({
  count = 3,
  className,
  ...props
}: CardTreeSkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className ? ` ${className}` : ''}`}
      data-testid={props['data-testid'] || 'cardtree-skeleton'}
      aria-label="加载中..."
    >
      {/* Skeleton connector line */}
      <div className={styles.skeletonConnector} />

      {/* Skeleton cards */}
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
