// @ts-nocheck
// Step Loading Component

import styles from './StepLoading.module.css';

export interface StepLoadingProps {
  /** Current step number being loaded */
  step: number;
  /** Optional custom message */
  message?: string;
}

const STEP_MESSAGES: Record<number, string> = {
  1: '加载需求输入组件...',
  2: '加载限界上下文组件...',
  3: '加载领域模型组件...',
  4: '加载业务流程组件...',
  5: '加载项目创建组件...',
};

export function StepLoading({ step, message }: StepLoadingProps) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        <div className={styles.ring}></div>
        <div className={styles.ring}></div>
        <div className={styles.ring}></div>
      </div>
      <p className={styles.message}>
        {message || STEP_MESSAGES[step] || '加载中...'}
      </p>
    </div>
  );
}
