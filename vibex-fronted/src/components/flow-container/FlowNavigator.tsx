/**
 * FlowNavigator - Navigation controls for the flow process
 */

'use client';

import { FlowStep } from './flowMachine';
import styles from './FlowNavigator.module.css';

interface FlowNavigatorProps {
  currentStep: FlowStep;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
  isFirst: boolean;
  isLast: boolean;
  isCompleted: boolean;
}

export function FlowNavigator({
  currentStep,
  onPrev,
  onNext,
  onSave,
  isFirst,
  isLast,
  isCompleted,
}: FlowNavigatorProps) {
  if (isCompleted) {
    return (
      <div className={styles.container}>
        <div className={styles.completed}>
          <span className={styles.checkmark}>✓</span>
          <span>Flow completed!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        {!isFirst && (
          <button className={styles.btnSecondary} onClick={onPrev}>
            ← Back
          </button>
        )}
      </div>
      
      <div className={styles.center}>
        <button className={styles.btnSave} onClick={onSave}>
          💾 Save Progress
        </button>
      </div>
      
      <div className={styles.right}>
        <button className={styles.btnPrimary} onClick={onNext}>
          {isLast ? 'Complete →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
