/**
 * Progress Indicator Component
 * 进度指示器：显示已收集信息数量
 */

'use client';

import { useMemo } from 'react';
import styles from './ProgressIndicator.module.css';

export interface ProgressStep {
  id: string;
  label: string;
  completed: boolean;
  current?: boolean;
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep?: string;
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
  onStepClick?: (stepId: string) => void;
}

export function ProgressIndicator({
  steps,
  currentStep,
  showLabels = true,
  size = 'medium',
  onStepClick,
}: ProgressIndicatorProps) {
  const completedCount = useMemo(
    () => steps.filter((s) => s.completed).length,
    [steps]
  );

  const totalCount = steps.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className={`${styles.container} ${styles[size]}`}>
      <div className={styles.header}>
        <span className={styles.label}>
          已完成 {completedCount}/{totalCount}
        </span>
        <span className={styles.percentage}>{Math.round(progressPercent)}%</span>
      </div>

      <div className={styles.track}>
        <div
          className={styles.progress}
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {showLabels && (
        <div className={styles.steps}>
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={`${styles.step} ${
                step.completed ? styles.stepCompleted : ''
              } ${step.id === currentStep || step.current ? styles.stepCurrent : ''}`}
              onClick={() => onStepClick?.(step.id)}
              disabled={!step.completed && step.id !== currentStep}
            >
              <span className={styles.stepIndicator}>
                {step.completed ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span className={styles.stepLabel}>{step.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProgressIndicator;
