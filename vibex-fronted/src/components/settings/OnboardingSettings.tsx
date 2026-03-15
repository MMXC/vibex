/**
 * OnboardingSettings - 引导设置组件
 * 
 * 允许用户在设置页管理引导流程：重置引导、查看状态
 * 支持 F5.3: 设置页重新开始
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore, ONBOARDING_STEPS } from '@/stores/onboarding';
import { useFirstVisitDetect } from '@/hooks/useFirstVisitDetect';
import styles from './OnboardingSettings.module.css';

export function OnboardingSettings() {
  const {
    status,
    currentStep,
    completedSteps,
    start,
    reset,
  } = useOnboardingStore();
  
  // F1.3 & F5.3: 重置首次访问状态
  const { resetFirstVisit, isFirstVisit, isExpired } = useFirstVisitDetect({
    expirationMs: 7 * 24 * 60 * 60 * 1000,
    storageKey: 'vibex-first-visit',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.id === currentStep);
  const progress = completedSteps.length / ONBOARDING_STEPS.length * 100;

  // F5.3: 重置引导并清除首次访问状态，允许重新触发
  const handleReset = () => {
    if (confirm('确定要重置引导吗？重置后可重新开始。')) {
      reset();
      resetFirstVisit();
    }
  };

  // F1.3: 手动开始引导（即使不是首次访问也可以）
  const handleStart = () => {
    start();
  };

  return (
    <div className={styles.container}>
      <div 
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.headerLeft}>
          <span className={styles.icon}>🎯</span>
          <div className={styles.headerText}>
            <span className={styles.title}>新手指引</span>
            <span className={styles.subtitle}>
              {status === 'completed' 
                ? '已完成' 
                : status === 'in-progress' 
                  ? `进行中 - 第 ${currentIndex + 1} 步`
                  : isFirstVisit || isExpired 
                    ? '未开始（首次访问）'
                    : '可重新开始'}
            </span>
          </div>
        </div>
        <button className={styles.toggleBtn}>
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.content}
          >
            {/* Progress Bar */}
            <div className={styles.progressSection}>
              <div className={styles.progressLabel}>
                <span>完成进度</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className={styles.progressBar}>
                <motion.div
                  className={styles.progressFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Steps Status */}
            <div className={styles.stepsList}>
              {ONBOARDING_STEPS.map((step, index) => {
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = step.id === currentStep;

                return (
                  <div
                    key={step.id}
                    className={`${styles.stepItem} ${
                      isCompleted ? styles.completed : ''
                    } ${isCurrent ? styles.current : ''}`}
                  >
                    <span className={styles.stepIcon}>
                      {isCompleted ? '✓' : index + 1}
                    </span>
                    <span className={styles.stepName}>{step.title}</span>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              {status === 'not-started' && (
                <button
                  className={styles.startBtn}
                  onClick={handleStart}
                >
                  开始引导
                </button>
              )}
              
              {(status === 'completed' || status === 'in-progress' || status === 'skipped') && (
                <button
                  className={styles.resetBtn}
                  onClick={handleReset}
                >
                  重置引导
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default OnboardingSettings;
