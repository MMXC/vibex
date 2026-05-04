/**
 * ClarifyStep - 场景选择步骤组件
 * 
 * 步骤3 (clarify): 选择项目场景，用于 Step 5 模板推荐过滤
 * E1-S3: 场景化模板推荐
 */

'use client';

import { motion } from 'framer-motion';
import { useOnboardingStore, SCENARIO_OPTIONS } from '@/stores/onboarding';
import type { ScenarioType } from '@/stores/onboarding/types';
import styles from './StepContent.module.css';

export interface StepContentProps {
  onNext: () => void;
  onPrev?: () => void;
  onSkip: () => void;
  isLastStep?: boolean;
}

export function ClarifyStep({ onNext, onPrev, onSkip }: StepContentProps) {
  const scenario = useOnboardingStore((s) => s.scenario);
  const setScenario = useOnboardingStore((s) => s.setScenario);

  return (
    <div className={styles.container} data-testid="onboarding-step-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.content}
      >
        <div className={styles.icon}>🤖</div>
        <h2 className={styles.title}>选择项目场景</h2>
        <p className={styles.subtitle}>
          选择你的项目类型，我们将为你推荐合适的模板
        </p>

        {/* E1-S3: 场景选择器 */}
        <div className={styles.scenarioGrid} role="radiogroup" aria-label="项目场景">
          {SCENARIO_OPTIONS.map((option, index) => (
            <motion.button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={scenario === option.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.06 }}
              className={`${styles.scenarioCard} ${scenario === option.value ? styles.scenarioCardSelected : ''}`}
              onClick={() => setScenario(option.value as ScenarioType)}
            >
              <span className={styles.scenarioIcon}>{option.icon}</span>
              <span className={styles.scenarioLabel}>{option.label}</span>
            </motion.button>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.backBtn} onClick={onPrev} data-testid="onboarding-step-2-prev-btn">
            ← 上一步
          </button>
          <div className={styles.rightActions}>
            <button className={styles.skipBtn} onClick={onSkip} data-testid="onboarding-step-2-skip-btn">
              跳过
            </button>
            <button className={styles.nextBtn} onClick={onNext} data-testid="onboarding-step-2-next-btn">
              下一步 →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ClarifyStep;
