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
import { useConfirmationStore } from '@/stores/confirmationStore';
import { NUMBER_TO_STEP, STEP_LABELS } from '@/components/homepage/steps/types';
import styles from './DesignStepLayout.module.css';

export interface DesignStepLayoutProps {
  children: React.ReactNode;
  /** 当前步骤数字 (1-5) */
  currentStep: number;
}

const DESIGN_STEPS = [
  { id: 1, label: '需求输入', description: 'Requirement Input' },
  { id: 2, label: '限界上下文', description: 'Bounded Context' },
  { id: 3, label: '领域模型', description: 'Domain Model' },
  { id: 4, label: '需求澄清', description: 'Clarification' },
  { id: 5, label: '业务流程', description: 'Business Flow' },
  { id: 6, label: '项目创建', description: 'Project Create' },
];

export function DesignStepLayout({ children, currentStep }: DesignStepLayoutProps) {
  const setCurrentStep = useConfirmationStore((s) => s.setCurrentStep);
  const stepHistory = useConfirmationStore((s) => s.stepHistory);

  // 已完成步骤 = 历史中出现的步骤 + 当前步骤
  const completedSteps = React.useMemo(() => {
    const done = new Set<number>();
    for (const stepStr of stepHistory) {
      const num = Object.entries(NUMBER_TO_STEP).find(([, v]) => v === stepStr)?.[0];
      if (num) done.add(Number(num));
    }
    return Array.from(done);
  }, [stepHistory]);

  const handleStepClick = (stepId: number) => {
    const confirmationStep = NUMBER_TO_STEP[stepId as keyof typeof NUMBER_TO_STEP];
    if (confirmationStep) {
      setCurrentStep(confirmationStep);
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
        <p className={styles.stepIndicator}>Step {currentStep} of 6</p>
      </header>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}

export default DesignStepLayout;
