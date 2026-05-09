/**
 * RequirementCard — User Story Card Component
 *
 * Renders a user-story card with role/action/benefit format:
 * - 作为[角色]
 * - 我想要[行为]
 * - 以便于[收益]
 *
 * Epic 1: F6
 */

'use client';

import React, { useState, memo } from 'react';
import type { UserStoryCard as UserStoryCardType } from '@/types/dds';
import styles from './RequirementCard.module.css';

export interface RequirementCardProps {
  card: UserStoryCardType;
  selected?: boolean;
  onSelect?: (id: string) => void;
  conflict?: boolean;
}

function PriorityBadge({ priority }: { priority: UserStoryCardType['priority'] }) {
  const labelMap = { high: '高', medium: '中', low: '低' };
  const classMap = {
    high: styles.priorityHigh,
    medium: styles.priorityMedium,
    low: styles.priorityLow,
  };
  return (
    <span className={`${styles.priorityBadge} ${classMap[priority]}`}>
      {labelMap[priority]}
    </span>
  );
}

export const RequirementCard = memo(function RequirementCard({
  card,
  selected = false,
  onSelect,
  conflict = false,
}: RequirementCardProps) {
  const [showAcceptance, setShowAcceptance] = useState(false);

  const handleClick = () => {
    onSelect?.(card.id);
  };

  return (
    <div
      className={`${styles.container} ${selected ? styles.selected : ''} ${conflict ? styles.conflict : ''}`}
      data-conflict={conflict ? 'true' : undefined}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`User Story: ${card.title}`}
    >
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>{card.title}</h3>
        <PriorityBadge priority={card.priority} />
      </div>

      {/* Story Body */}
      <div className={styles.storyBody}>
        <div className={styles.storyLine}>
          <span className={styles.roleLabel}>作为</span>
          <span>{card.role}</span>
        </div>
        <div className={styles.storyLine}>
          <span className={styles.actionLabel}>我想要</span>
          <span>{card.action}</span>
        </div>
        <div className={styles.storyLine}>
          <span className={styles.benefitLabel}>以便于</span>
          <span>{card.benefit}</span>
        </div>
      </div>

      {/* Acceptance Criteria (collapsible) */}
      {card.acceptanceCriteria && card.acceptanceCriteria.length > 0 && (
        <div className={styles.acceptanceSection}>
          <button
            className={styles.acceptanceToggle}
            onClick={(e) => {
              e.stopPropagation();
              setShowAcceptance((v) => !v);
            }}
            aria-expanded={showAcceptance}
          >
            <span>{showAcceptance ? '▼' : '▶'}</span>
            <span>验收标准 ({card.acceptanceCriteria.length})</span>
          </button>

          {showAcceptance && (
            <ul className={styles.acceptanceList}>
              {card.acceptanceCriteria.map((criterion, i) => (
                <li key={i} className={styles.acceptanceItem}>
                  <span className={styles.acceptanceBullet}>•</span>
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
});
