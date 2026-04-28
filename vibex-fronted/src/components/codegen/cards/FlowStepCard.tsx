'use client';

/**
 * FlowStepCard — S16-P1-2 Code Generator Real Components
 *
 * Renders a FlowStep node with real props:
 * - stepName, actor, pre, post conditions
 * - Cyberpunk card styling
 */

import React from 'react';
import type { FlowStepProps } from '@/types/codegen';
import styles from './FlowStepCard.module.css';

interface FlowStepCardProps {
  /** Flow step data */
  step: FlowStepProps;
  /** Whether the card is selected */
  selected?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export function FlowStepCard({ step, selected = false, onClick }: FlowStepCardProps) {
  const { stepName, actor, pre, post } = step;

  return (
    <div
      className={`${styles.card} ${selected ? styles['card--selected'] : ''}`}
      data-testid="flowstep-card"
      data-step-id={step.stepId}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.header}>
        <span className={styles.stepName} data-testid="step-name">
          {stepName || 'Unnamed Step'}
        </span>
        {actor && (
          <span className={styles.actor} data-testid="step-actor">
            {actor}
          </span>
        )}
      </div>
      {pre && (
        <div className={styles.condition}>
          <span className={styles.conditionLabel}>Pre:</span>
          <code className={styles.conditionText} data-testid="step-pre">
            {pre}
          </code>
        </div>
      )}
      {post && (
        <div className={styles.condition}>
          <span className={styles.conditionLabel}>Post:</span>
          <code className={styles.conditionText} data-testid="step-post">
            {post}
          </code>
        </div>
      )}
    </div>
  );
}
