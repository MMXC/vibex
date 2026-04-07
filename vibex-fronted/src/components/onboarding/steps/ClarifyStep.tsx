/**
 * ClarifyStep - 需求澄清步骤组件
 * 
 * 步骤3: 需求澄清引导
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

export function ClarifyStep({ onNext, onPrev, onSkip }: StepContentProps) {
  const questions = [
    '目标用户是谁？',
    '需要哪些核心功能？',
    '与现有系统如何集成？',
  ];

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.content}
      >
        <div className={styles.icon}>🤖</div>
        <h2 className={styles.title}>AI 智能澄清</h2>
        <p className={styles.subtitle}>
          AI 会通过提问帮助你完善需求，确保理解准确
        </p>

        <div className={styles.questions}>
          <p className={styles.questionsTitle}>AI 可能会问：</p>
          {questions.map((q, index) => (
            <motion.div
              key={q}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={styles.question}
            >
              <span className={styles.questionIcon}>❓</span>
              <span>{q}</span>
            </motion.div>
          ))}
        </div>

        <div className={styles.highlight}>
          <span className={styles.highlightIcon}>✨</span>
          <span>通过互动问答，AI 会生成更精准的设计方案</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.backBtn} onClick={onPrev}>
            ← 上一步
          </button>
          <div className={styles.rightActions}>
            <button className={styles.skipBtn} onClick={onSkip}>
              跳过
            </button>
            <button className={styles.nextBtn} onClick={onNext}>
              下一步 →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ClarifyStep;
