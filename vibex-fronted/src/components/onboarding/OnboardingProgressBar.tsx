/**
 * OnboardingProgressBar - 顶部进度条组件
 * 
 * 显示引导整体进度和预计剩余时间
 * 符合 PRD F3.1, F3.3 要求
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOnboardingStore, ONBOARDING_STEPS, getStepIndex } from '@/stores/onboarding';
import styles from './OnboardingProgressBar.module.css';

// 步骤耗时映射（分钟）
const STEP_DURATIONS: Record<string, number> = {
  welcome: 1,
  input: 2,
  clarify: 2,
  model: 3,
  prototype: 2,
};

export function OnboardingProgressBar() {
  const { status, currentStep, completedSteps } = useOnboardingStore();

  // 只在进行中显示
  if (status !== 'in-progress') {
    return null;
  }

  const currentIndex = getStepIndex(currentStep);
  const totalSteps = ONBOARDING_STEPS.length;
  
  // 计算进度百分比
  const progressPercent = useMemo(() => {
    if (completedSteps.length === 0) {
      return 5; // 初始显示 5%
    }
    return Math.round((completedSteps.length / totalSteps) * 100);
  }, [completedSteps.length, totalSteps]);

  // 计算预计剩余时间
  const remainingTime = useMemo(() => {
    // 计算剩余步骤的总时长
    let remainingMinutes = 0;
    for (let i = currentIndex; i < totalSteps; i++) {
      const stepId = ONBOARDING_STEPS[i].id;
      remainingMinutes += STEP_DURATIONS[stepId] || 2;
    }
    
    if (remainingMinutes <= 1) {
      return '不到 1 分钟';
    } else if (remainingMinutes < 60) {
      return `约 ${remainingMinutes} 分钟`;
    } else {
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      return `约 ${hours} 小时 ${mins} 分钟`;
    }
  }, [currentIndex, totalSteps]);

  // 步骤文本
  const stepText = `第 ${currentIndex + 1} 步 / 共 ${totalSteps} 步`;

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.wrapper}>
        {/* 步骤信息 */}
        <div className={styles.stepInfo}>
          <span className={styles.stepText}>{stepText}</span>
          <span className={styles.remainingTime}>
            ⏱️ 预计剩余 {remainingTime}
          </span>
        </div>

        {/* 进度条 */}
        <div className={styles.progressTrack}>
          <motion.div 
            className={styles.progressFill}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* 进度百分比 */}
        <span className={styles.percent}>{progressPercent}%</span>
      </div>
    </motion.div>
  );
}

export default OnboardingProgressBar;
