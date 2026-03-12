/**
 * StepIndicator - 步骤指示器组件
 * 
 * 显示引导进度，支持点击跳转
 */

'use client';

import { motion } from 'framer-motion';
import styles from './StepIndicator.module.css';

export interface StepIndicatorProps {
  steps: Array<{
    id: string;
    title: string;
    icon: string;
  }>;
  currentStep: string;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
}

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = step.id === currentStep;
        const isClickable = onStepClick && (isCompleted || index < currentIndex);

        return (
          <div
            key={step.id}
            className={`${styles.step} ${isCurrent ? styles.current : ''} ${
              isCompleted ? styles.completed : ''
            }`}
            onClick={() => isClickable && onStepClick(step.id)}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
          >
            <div className={styles.indicator}>
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={styles.checkmark}
                >
                  ✓
                </motion.div>
              ) : (
                <span className={styles.number}>{index + 1}</span>
              )}
            </div>
            <div className={styles.label}>
              <span className={styles.icon}>{step.icon}</span>
              <span className={styles.title}>{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`${styles.connector} ${
                  isCompleted ? styles.connectorCompleted : ''
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepIndicator;
