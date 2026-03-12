/**
 * InputStep - 需求输入步骤组件
 * 
 * 步骤2: 需求输入引导
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

export function InputStep({ onNext, onPrev, onSkip }: StepContentProps) {
  return (
    <div className={styles.container}>
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

        <div className={styles.examples}>
          <p className={styles.examplesTitle}>例如：</p>
          <div className={styles.exampleList}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={styles.example}
            >
              "开发一个在线教育平台，包含用户管理、课程管理、订单处理等功能"
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={styles.example}
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

export default InputStep;
