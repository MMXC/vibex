/**
 * InputStep - 需求输入步骤组件
 * 
 * P003 S-P3.2: 需求录入 + 存储需求文本到 localStorage
 * 步骤2: 需求输入引导
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding';
import styles from './StepContent.module.css';

/** P003: localStorage key for requirement text */
const REQUIREMENT_STORAGE_KEY = 'vibex:onboarding:requirement';

export interface StepContentProps {
  onNext: () => void;
  onPrev?: () => void;
  onSkip: () => void;
  isLastStep?: boolean;
}

export function InputStep({ onNext, onPrev, onSkip }: StepContentProps) {
  const setRequirementText = useOnboardingStore((s) => s.setRequirementText);
  const [value, setValue] = useState('');

  const handleNext = () => {
    const text = value.trim();
    // Store in localStorage (cross-session persistence)
    try {
      localStorage.setItem(REQUIREMENT_STORAGE_KEY, text);
    } catch {
      // ignore
    }
    // Store in Zustand store
    setRequirementText(text);
    onNext();
  };

  return (
    <div className={styles.container} data-testid="onboarding-step-1">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.content}
      >
        <div className={styles.icon}>📝</div>
        <h2 className={styles.title}>描述您的需求</h2>
        <p className={styles.subtitle}>
          用自然语言描述你的产品想法，AI 会帮你分析和完善
        </p>

        {/* P003: 需求输入框 */}
        <textarea
          className={styles.requireInput}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="例如：开发一个在线教育平台，包含用户管理、课程管理、订单处理等功能"
          rows={4}
          data-testid="onboarding-input-requirement"
        />

        <div className={styles.examples}>
          <p className={styles.examplesTitle}>参考示例：</p>
          <div className={styles.exampleList}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={styles.example}
              onClick={() => setValue('开发一个在线教育平台，包含用户管理、课程管理、订单处理等功能')}
            >
              "开发一个在线教育平台，包含用户管理、课程管理、订单处理等功能"
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={styles.example}
              onClick={() => setValue('创建一个项目管理工具，支持任务分配、进度跟踪、团队协作')}
            >
              "创建一个项目管理工具，支持任务分配、进度跟踪、团队协作"
            </motion.div>
          </div>
        </div>

        <div className={styles.tips}>
          <span className={styles.tipIcon}>💡</span>
          <span>描述越详细，生成结果越准确</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.backBtn} onClick={onPrev} data-testid="onboarding-step-1-prev-btn">
            ← 上一步
          </button>
          <div className={styles.rightActions}>
            <button className={styles.skipBtn} onClick={onSkip} data-testid="onboarding-step-1-skip-btn">
              跳过
            </button>
            <button
              className={styles.nextBtn}
              onClick={handleNext}
              data-testid="onboarding-step-1-next-btn"
            >
              下一步 →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default InputStep;
