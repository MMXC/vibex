/**
 * PreviewStep - 预览完成步骤组件
 * 
 * 步骤5: 预览完成引导
 */
// @ts-nocheck


'use client';

import { motion } from 'framer-motion';
import styles from './StepContent.module.css';

export interface StepContentProps {
  onNext: () => void;
  onPrev?: () => void;
  onSkip: () => void;
  isLastStep?: boolean;
}

export function PreviewStep({ onNext, onPrev }: StepContentProps) {
  const features = [
    { icon: '🎨', title: '可视化预览', desc: '所见即所得' },
    { icon: '📱', title: '多端适配', desc: '响应式布局' },
    { icon: '↗️', title: '一键导出', desc: '多种格式' },
  ];

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.content}
      >
        <div className={styles.icon}>🎉</div>
        <h2 className={styles.title}>原型生成</h2>
        <p className={styles.subtitle}>
          完成设计后，一键生成可交互的原型
        </p>

        <div className={styles.features}>
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={styles.cta}
        >
          准备好开始你的第一个项目了吗？
        </motion.div>

        <div className={styles.actions}>
          <button className={styles.backBtn} onClick={onPrev}>
            ← 上一步
          </button>
          <button className={styles.nextBtn} onClick={onNext}>
            开始使用 🎯
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default PreviewStep;
