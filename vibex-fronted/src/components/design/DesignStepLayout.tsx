/**
 * DesignStepLayout - 设计流程页面布局
 * 
 * 包含步骤导航栏，支持步骤回退
 * F1.1: StepNavigator 集成
 * F1.3: 已完成步骤可点击跳转
 */

'use client';

import React from 'react';
import { StepNavigator } from '@/components/homepage/StepNavigator';
import { useDesignStore } from '@/stores/designStore';
import styles from './DesignStepLayout.module.css';

export interface DesignStepLayoutProps {
  children: React.ReactNode;
  /** 当前步骤数字 (1-5) */
  currentStep: number;
}

const DESIGN_STEPS = [
  { id: 1, label: '需求澄清', description: 'Clarification' },
  { id: 2, label: '限界上下文', description: 'Bounded Context' },
  { id: 3, label: '领域模型', description: 'Domain Model' },
  { id: 4, label: '业务流程', description: 'Business Flow' },
  { id: 5, label: 'UI生成', description: 'UI Generation' },
];

/** 将数字步骤映射到 DesignStep 字符串 */
const STEP_MAP: Record<number, string> = {
  1: 'clarification',
  2: 'bounded-context',
  3: 'domain-model',
  4: 'business-flow',
  5: 'ui-generation',
};

export function DesignStepLayout({ children, currentStep }: DesignStepLayoutProps) {
  const setCurrentStep = useDesignStore((s) => s.setCurrentStep);
  const stepHistory = useDesignStore((s) => s.stepHistory);

  // 已完成步骤 = 历史中出现的步骤 + 当前步骤
  const completedSteps = React.useMemo(() => {
    const done = new Set<number>();
    for (const stepStr of stepHistory) {
      const num = Number(Object.entries(STEP_MAP).find(([, v]) => v === stepStr)?.[0] ?? 0);
      if (num > 0) done.add(num);
    }
    return Array.from(done);
  }, [stepHistory]);

  const handleStepClick = (stepId: number) => {
    const designStepStr = STEP_MAP[stepId] as import('@/stores/designStore').DesignStep;
    if (designStepStr) {
      setCurrentStep(designStepStr);
    }
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <StepNavigator
          steps={DESIGN_STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
        <p className={styles.stepIndicator}>Step {currentStep} of 5</p>
      </header>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}

export default DesignStepLayout;
