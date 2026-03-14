import React from 'react';
import styles from './Sidebar.module.css';
import type { SidebarComponentProps, Step } from '@/types/homepage';

/**
 * Sidebar - 左侧步骤导航组件
 * 
 * 功能：
 * - 步骤列表展示
 * - 当前步骤高亮
 * - 完成步骤标记
 * - 进度统计
 */
export const Sidebar: React.FC<SidebarComponentProps> = ({
  steps,
  currentStep,
  completedStep,
  onStepClick,
  isStepClickable,
  className = '',
}) => {
  const progressPercent = (completedStep / steps.length) * 100;

  return (
    <aside className={`${styles.sidebar} ${className}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>设计流程</h2>
      </div>
      
      <ul className={styles.stepList}>
        {steps.map((step: Step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id <= completedStep;
          const clickable = isStepClickable?.(step.id) ?? isCompleted;

          return (
            <li
              key={step.id}
              className={`${styles.stepItem} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
              onClick={() => clickable && onStepClick(step.id)}
              role="button"
              tabIndex={clickable ? 0 : -1}
              aria-current={isActive ? 'step' : undefined}
              style={{ 
                cursor: clickable ? 'pointer' : 'not-allowed', 
                opacity: clickable ? 1 : 0.5 
              }}
            >
              <span className={styles.stepNumber}>
                {isCompleted ? '✓' : step.id}
              </span>
              <span className={styles.stepLabel}>{step.label}</span>
            </li>
          );
        })}
      </ul>
      
      {/* 进度统计 */}
      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className={styles.progressText}>
          步骤 {currentStep}/{steps.length}
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;