/**
 * ModelStep - 模型选择步骤组件
 * 
 * 步骤4: 模型选择引导
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

export function ModelStep({ onNext, onPrev, onSkip }: StepContentProps) {
  const models = [
    { icon: '🏗️', title: '限界上下文', desc: '划分业务边界' },
    { icon: '📊', title: '领域模型', desc: '实体和关系' },
    { icon: '🔀', title: '业务流程', desc: '状态和流转' },
  ];

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.content}
      >
        <div className={styles.icon}>🏗️</div>
        <h2 className={styles.title}>领域建模</h2>
        <p className={styles.subtitle}>
          AI 会为你生成多种设计模型，你可以查看和调整
        </p>

        <div className={styles.models}>
          {models.map((model, index) => (
            <motion.div
              key={model.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={styles.model}
            >
              <span className={styles.modelIcon}>{model.icon}</span>
              <span className={styles.modelTitle}>{model.title}</span>
              <span className={styles.modelDesc}>{model.desc}</span>
            </motion.div>
          ))}
        </div>

        <div className={styles.tips}>
          <span className={styles.tipIcon}>💡</span>
          <span>所有模型都可以手动调整</span>
        </div>

        <div className={styles.actions} data-testid="onboarding-step-3">
          <button className={styles.backBtn} onClick={onPrev} data-testid="onboarding-prev-btn">
            ← 上一步
          </button>
          <div className={styles.rightActions}>
            <button className={styles.skipBtn} onClick={onSkip} data-testid="onboarding-skip-btn">
              跳过
            </button>
            <button className={styles.nextBtn} onClick={onNext} data-testid="onboarding-next-btn">
              下一步 →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ModelStep;
