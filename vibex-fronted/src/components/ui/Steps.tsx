'use client';

import React from 'react';
import styles from './Steps.module.css';

export type StepStatus = 'pending' | 'in-progress' | 'completed' | 'error';

export interface Step {
  title: string;
  description?: string;
  status?: StepStatus;
}

export interface StepsProps {
  /** 步骤列表 */
  steps: Step[];
  /** 当前激活步骤索引 (从 0 开始) */
  current?: number;
  /** 是否显示步骤编号 */
  showNumber?: boolean;
  /** 是否支持点击跳转 */
  clickable?: boolean;
  /** 步骤点击回调 */
  onStepClick?: (index: number) => void;
  /** 自定义类名 */
  className?: string;
  /** 布局方向 */
  direction?: 'horizontal' | 'vertical';
}

export function Steps({
  steps,
  current = 0,
  showNumber = true,
  clickable = false,
  onStepClick,
  className = '',
  direction = 'horizontal',
}: StepsProps) {
  const handleStepClick = (index: number, status: StepStatus | undefined) => {
    if (!clickable || status === 'pending') return;
    onStepClick?.(index);
  };

  const getStepStatus = (index: number, status?: StepStatus): StepStatus => {
    if (status) return status;
    if (index < current) return 'completed';
    if (index === current) return 'in-progress';
    return 'pending';
  };

  return (
    <div className={`${styles.container} ${styles[direction]} ${className}`}>
      {steps.map((step, index) => {
        const status = getStepStatus(index, step.status);
        const isClickable = clickable && status !== 'pending';

        return (
          <div
            key={index}
            className={`${styles.step} ${styles[status]} ${isClickable ? styles.clickable : ''}`}
            onClick={() => handleStepClick(index, status)}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={(e) => {
              if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                handleStepClick(index, status);
              }
            }}
          >
            {/* 连接线 */}
            {index > 0 && (
              <div className={`${styles.connector} ${index <= current ? styles.completed : ''}`} />
            )}
            
            {/* 步骤标识 */}
            <div className={styles.indicator}>
              {showNumber && status !== 'completed' && (
                <span className={styles.number}>{index + 1}</span>
              )}
              {status === 'completed' && (
                <span className={styles.check}>✓</span>
              )}
              {status === 'error' && (
                <span className={styles.errorIcon}>✕</span>
              )}
            </div>

            {/* 步骤内容 */}
            <div className={styles.content}>
              <div className={styles.title}>{step.title}</div>
              {step.description && (
                <div className={styles.description}>{step.description}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 简化版本 - 只显示标题
interface SimpleStepsProps {
  steps: string[];
  current?: number;
  className?: string;
}

export function SimpleSteps({ steps, current = 0, className = '' }: SimpleStepsProps) {
  return (
    <Steps
      steps={steps.map((title) => ({ title }))}
      current={current}
      className={className}
    />
  );
}
