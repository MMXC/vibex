/**
 * Step Navigator Component
 * 
 * Displays the 5-step confirmation flow with progress indicators.
 */

'use client';

import React from 'react';
import styles from './StepNavigator.module.css';

export interface Step {
  id: number;
  label: string;
  description?: string;
}

export interface StepNavigatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  completedSteps?: number[];
  disabled?: boolean;
  className?: string;
}

export function StepNavigator({
  steps,
  currentStep,
  onStepClick,
  completedSteps = [],
  disabled = false,
  className,
}: StepNavigatorProps) {
  const getStepStatus = (stepId: number) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    if (stepId < currentStep) return 'accessible';
    return 'pending';
  };

  return (
    <nav className={`${styles.container} ${className ?? ''}`} aria-label="流程步骤">
      <ol className={styles.stepList}>
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isClickable = status !== 'pending' && !disabled && onStepClick;

          return (
            <li
              key={step.id}
              className={`${styles.stepItem} ${styles[status]}`}
            >
              <button
                className={styles.stepButton}
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                <span className={styles.stepIndicator}>
                  {status === 'completed' ? (
                    <span className={styles.checkIcon}>✓</span>
                  ) : (
                    step.id
                  )}
                </span>
                <div className={styles.stepContent}>
                  <span className={styles.stepLabel}>{step.label}</span>
                  {step.description && (
                    <span className={styles.stepDescription}>{step.description}</span>
                  )}
                </div>
              </button>
              {index < steps.length - 1 && (
                <div className={`${styles.connector} ${status === 'completed' ? styles.connectorCompleted : ''}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default StepNavigator;
