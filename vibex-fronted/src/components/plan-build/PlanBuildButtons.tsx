/**
 * PlanBuildButtons Component
 * Plan/Build 模式选择按钮组件
 */

'use client';

import { usePlanBuildStore, useCurrentMode, type PlanBuildMode } from '@/stores/plan-build-store';
import styles from './PlanBuildButtons.module.css';

interface PlanBuildButtonsProps {
  onPlan?: () => void;
  onBuild?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Plan/Build 模式选择按钮组件
 * 
 * 用于在需求输入阶段选择不同的处理模式：
 * - Plan 模式：先进行需求分析，再生成
 * - Build 模式：直接生成（原有行为）
 */
export function PlanBuildButtons({
  onPlan,
  onBuild,
  disabled = false,
  className,
}: PlanBuildButtonsProps) {
  const mode = useCurrentMode();
  const { setMode, isPlanLoading, isBuildLoading } = usePlanBuildStore();
  
  const handlePlanClick = () => {
    if (disabled || isPlanLoading || isBuildLoading) return;
    setMode('plan');
    onPlan?.();
  };
  
  const handleBuildClick = () => {
    if (disabled || isPlanLoading || isBuildLoading) return;
    setMode('build');
    onBuild?.();
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.label}>
        <span className={styles.labelText}>选择处理模式</span>
        <span className={styles.currentMode}>
          当前: <strong>{mode === 'plan' ? '📋 Plan' : '🔨 Build'}</strong>
        </span>
      </div>
      
      <div className={styles.buttons}>
        <button
          className={`${styles.button} ${mode === 'plan' ? styles.buttonActive : ''} ${styles.planButton}`}
          onClick={handlePlanClick}
          disabled={disabled || isPlanLoading || isBuildLoading}
        >
          {isPlanLoading ? (
            <>
              <span className={styles.spinner}>🔄</span>
              分析中...
            </>
          ) : (
            <>
              <span className={styles.icon}>📋</span>
              Plan 模式
            </>
          )}
        </button>
        
        <button
          className={`${styles.button} ${mode === 'build' ? styles.buttonActive : ''} ${styles.buildButton}`}
          onClick={handleBuildClick}
          disabled={disabled || isPlanLoading || isBuildLoading}
        >
          {isBuildLoading ? (
            <>
              <span className={styles.spinner}>🔄</span>
              生成中...
            </>
          ) : (
            <>
              <span className={styles.icon}>🔨</span>
              Build 模式
            </>
          )}
        </button>
      </div>
      
      <div className={styles.description}>
        {mode === 'plan' ? (
          <p className={styles.descText}>
            📋 <strong>Plan 模式</strong>：先分析需求复杂度，给出计划建议，再生成代码。适合复杂项目，准确率更高。
          </p>
        ) : (
          <p className={styles.descText}>
            🔨 <strong>Build 模式</strong>：直接生成代码。适合简单需求，快速上手。
          </p>
        )}
      </div>
    </div>
  );
}

export default PlanBuildButtons;
