/**
 * WelcomeStep - 欢迎步骤组件
 * 
 * 步骤1: 欢迎 + 产品介绍
 */

'use client';

import { motion } from 'framer-motion';
import styles from './StepContent.module.css';

export interface StepContentProps {
  onNext: () => void;
  onPrev?: () => void;
  onSkip: () => void;
  isLastStep?: boolean;
}

export function WelcomeStep({ onNext, onSkip }: StepContentProps) {
  const features = [
    { icon: '🎯', title: 'AI 驱动', desc: '智能分析需求' },
    { icon: '🏗️', title: 'DDD 建模', desc: '专业领域设计' },
    { icon: '🎨', title: '快速原型', desc: '一键生成应用' },
  ];

  return (
    <div className={styles.container} data-testid="onboarding-step-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.content}
      >
        <div className={styles.icon}>🎉</div>
        <h2 className={styles.title}>欢迎使用</h2>
        <p className={styles.subtitle}>
          AI 驱动的协作式产品建模平台
        </p>
        <p className={styles.duration}>预计时长: 1min</p>

        <div className={styles.features}>
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={styles.feature}
            >
              <span className={styles.featureIcon}>{feature.icon}</span>
              <div className={styles.featureText}>
                <span className={styles.featureTitle}>{feature.title}</span>
                <span className={styles.featureDesc}>{feature.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className={styles.actions} data-testid="onboarding-step-0">
          <button className={styles.skipBtn} onClick={onSkip} data-testid="onboarding-skip-btn">
            跳过介绍
          </button>
          <button className={styles.nextBtn} onClick={onNext} data-testid="onboarding-next-btn">
            下一步 →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default WelcomeStep;
