/**
 * MilestoneBadge — Displays earned achievement badges from the guide
 *
 * Shows a grid of badges (earned ones filled, unearned ones dimmed).
 * The "complete" badge is always highlighted.
 */
// @ts-nocheck


'use client';

import React, { memo } from 'react';
import { BADGE_META } from '@/stores/guideStore';
import styles from './MilestoneBadge.module.css';

interface MilestoneBadgeProps {
  /** All earned badge IDs */
  earnedBadges: string[];
  /** Compact inline mode (for tooltip/completion card) */
  compact?: boolean;
}

export const MilestoneBadge = memo(function MilestoneBadge({
  earnedBadges,
  compact = false,
}: MilestoneBadgeProps) {
  const allBadgeIds = Object.keys(BADGE_META);

  if (compact) {
    // Show just earned badges as small chips
    return (
      <div className={styles.compactRow} aria-label="已获得的成就徽章">
        {earnedBadges.map((id) => {
          const meta = BADGE_META[id];
          if (!meta) return null;
          return (
            <span key={id} className={styles.compactBadge} title={meta.label}>
              {meta.emoji}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className={styles.container} role="list" aria-label="成就徽章">
      {allBadgeIds.map((id) => {
        const meta = BADGE_META[id];
        const earned = earnedBadges.includes(id);
        return (
          <div
            key={id}
            className={`${styles.badge} ${earned ? styles.earned : styles.locked}`}
            role="listitem"
            title={earned ? `已获得：${meta.label}` : `未解锁：${meta.label}`}
            aria-label={`${meta.label}${earned ? '，已获得' : '，未解锁'}`}
          >
            <span className={styles.emoji}>{meta.emoji}</span>
            <span className={styles.label}>{meta.label}</span>
            {earned && <span className={styles.checkmark} aria-hidden="true">✓</span>}
          </div>
        );
      })}
    </div>
  );
});

export default MilestoneBadge;
