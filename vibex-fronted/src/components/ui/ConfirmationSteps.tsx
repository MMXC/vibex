'use client';

import React from 'react';
import { Steps, Step } from '@/components/ui/Steps';
import { ConfirmationStep } from '@/stores/confirmationStore';

interface ConfirmationStepsProps {
  currentStep: ConfirmationStep;
  className?: string;
}

// Define all steps in order
const CONFIRMATION_STEPS: Step[] = [
  { title: '需求输入', description: '输入产品需求' },
  { title: '限界上下文', description: '定义领域边界' },
  { title: '领域模型', description: '设计类图结构' },
  { title: '业务流程', description: '设计流程图' },
];

// Map ConfirmationStep to step index
const STEP_INDEX_MAP: Record<ConfirmationStep, number> = {
  input: 0,
  context: 1,
  model: 2,
  clarification: 3,
  flow: 4,
  success: 5, // Success is after flow
};

export function ConfirmationSteps({
  currentStep,
  className = '',
}: ConfirmationStepsProps) {
  const currentIndex = STEP_INDEX_MAP[currentStep];

  return (
    <Steps
      steps={CONFIRMATION_STEPS}
      current={currentIndex}
      className={className}
    />
  );
}

// Helper function to get step titles for pages
export const CONFIRM_STEP_TITLES: Record<ConfirmationStep, string> = {
  input: 'Step 1: 需求输入',
  context: 'Step 2: 限界上下文图确认',
  model: 'Step 3: 领域模型类图确认',
  clarification: 'Step 4: 需求澄清',
  flow: 'Step 5: 业务流程图确认',
  success: '项目创建成功',
};
