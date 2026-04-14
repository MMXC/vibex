/**
 * FlowStepCard — Flow Step Card Component
 *
 * Renders a flow-step card with:
 * - Step name & actor
 * - Pre/post conditions
 * - Next steps visualization (DAG)
 *
 * Epic 1: F8
 */

'use client';

import React, { memo } from 'react';
import type { FlowStepCard as FlowStepCardType } from '@/types/dds';
import styles from './FlowStepCard.module.css';

export interface FlowStepCardProps {
  card: FlowStepCardType;
  selected?: boolean;
  onSelect?: (id: string) => void;
  /** Step number for display (optional, derived from card.id if not provided) */
  stepNumber?: number;
}

export const FlowStepCard = memo(function FlowStepCard({
  card,
  selected = false,
  onSelect,
  stepNumber,
}: FlowStepCardProps) {
  const handleClick = () => {
    onSelect?.(card.id);
  };

  return (
    <div
      className={`${styles.container} ${selected ? styles.selected : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Flow Step: ${card.stepName}`}
    >
      {/* Header */}
      <div className={styles.header}>
        {stepNumber !== undefined && (
          <span className={styles.stepNumber}>{stepNumber}</span>
        )}
        <span className={styles.badge}>流程步骤</span>
      </div>
      <h3 className={styles.title}>{card.stepName}</h3>

      {/* Actor */}
      {card.actor && (
        <div className={styles.body}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>执行者</span>
            <span className={styles.fieldValue}>{card.actor}</span>
          </div>
        </div>
      )}

      {/* Pre/Post Conditions */}
      {(card.preCondition || card.postCondition) && (
        <div className={styles.conditionsGrid}>
          {card.preCondition && (
            <div className={styles.conditionBox}>
              <p className={`${styles.conditionLabel} ${styles.preLabel}`}>
                前置条件
              </p>
              <p className={styles.conditionText}>{card.preCondition}</p>
            </div>
          )}
          {card.postCondition && (
            <div className={styles.conditionBox}>
              <p className={`${styles.conditionLabel} ${styles.postLabel}`}>
                后置条件
              </p>
              <p className={styles.conditionText}>{card.postCondition}</p>
            </div>
          )}
        </div>
      )}

      {/* Next Steps (DAG) */}
      {card.nextSteps && card.nextSteps.length > 0 && (
        <div className={styles.nextStepsSection}>
          <p className={styles.nextStepsTitle}>
            后续步骤 {card.nextSteps.length > 0 && `(${card.nextSteps.length})`}
          </p>
          <ul className={styles.nextStepsList}>
            {card.nextSteps.map((stepId) => (
              <li key={stepId} className={styles.nextStepTag}>
                <span>→</span>
                <span>{stepId}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Parallel Steps */}
      {card.parallelSteps && card.parallelSteps.length > 0 && (
        <div className={styles.nextStepsSection}>
          <p className={styles.nextStepsTitle}>并行步骤</p>
          <ul className={styles.nextStepsList}>
            {card.parallelSteps.map((stepId) => (
              <li key={stepId} className={styles.nextStepTag}>
                <span>∥</span>
                <span>{stepId}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
