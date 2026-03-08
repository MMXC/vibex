/**
 * useConfirmationStep Hook - 确认流程步骤进度
 *
 * 用于管理确认流程的步骤进度、导航和状态
 *
 * Usage:
 * const { currentStep, totalSteps, progress, nextStep, prevStep, goToStep } = useConfirmationStep()
 *
 * // 获取当前步骤索引
 * const stepIndex = steps.indexOf(currentStep)
 *
 * // 跳转到下一步
 * goToStep(stepIndex + 1)
 */

'use client';

import { useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useConfirmationStore,
  ConfirmationStep,
} from '@/stores/confirmationStore';

export type StepKey = 'input' | 'context' | 'model' | 'flow' | 'success';

// 步骤顺序
export const STEPS: StepKey[] = [
  'input',
  'context',
  'model',
  'flow',
  'success',
];

// 步骤显示名称
export const STEP_LABELS: Record<StepKey, string> = {
  input: '需求输入',
  context: '限界上下文',
  model: '领域模型',
  flow: '业务流程',
  success: '完成',
};

// 步骤URL参数名
export const STEP_PARAM = 'step';

export interface UseConfirmationStepReturn {
  /** 当前步骤 */
  currentStep: StepKey;
  /** 当前步骤索引 */
  currentIndex: number;
  /** 总步骤数 */
  totalSteps: number;
  /** 进度百分比 */
  progress: number;
  /** 是否第一步 */
  isFirst: boolean;
  /** 是否最后一步 */
  isLast: boolean;
  /** 步骤是否完成 */
  isStepCompleted: (step: StepKey) => boolean;
  /** 跳转到下一步 */
  nextStep: () => void;
  /** 返回上一步 */
  prevStep: () => void;
  /** 跳转到指定步骤 */
  goToStep: (step: StepKey | number) => void;
  /** 获取步骤链接 */
  getStepLink: (step: StepKey) => string;
}

export function useConfirmationStep(): UseConfirmationStepReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useConfirmationStore();

  // 从 URL 获取当前步骤
  const urlStep = searchParams?.get(STEP_PARAM) as StepKey | null;

  // 确定当前步骤（优先使用 store 中的步骤，fallback 到 URL）
  const currentStepFromStore = store.currentStep;
  const currentStep: StepKey = STEPS.includes(urlStep as StepKey)
    ? (urlStep as StepKey)
    : STEPS.includes(currentStepFromStore as StepKey)
      ? (currentStepFromStore as StepKey)
      : 'input';

  const currentIndex = STEPS.indexOf(currentStep);
  const totalSteps = STEPS.length;
  const progress = Math.round((currentIndex / (totalSteps - 1)) * 100);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSteps - 1;

  // 检查步骤是否完成
  const isStepCompleted = useCallback(
    (step: StepKey): boolean => {
      const stepIndex = STEPS.indexOf(step);

      switch (step) {
        case 'input':
          return !!store.requirementText?.trim();
        case 'context':
          return (store.boundedContexts?.length ?? 0) > 0;
        case 'model':
          return (store.domainModels?.length ?? 0) > 0;
        case 'flow':
          return !!store.businessFlow;
        case 'success':
          return currentIndex > STEPS.indexOf('success');
        default:
          return false;
      }
    },
    [store, currentIndex]
  );

  // 跳转到下一步
  const nextStep = useCallback(() => {
    if (!isLast) {
      const next = STEPS[currentIndex + 1];
      store.setCurrentStep(next);
      router.push(`/confirm?step=${next}`);
    }
  }, [currentIndex, isLast, router, store]);

  // 返回上一步
  const prevStep = useCallback(() => {
    if (!isFirst) {
      const prev = STEPS[currentIndex - 1];
      store.setCurrentStep(prev);
      router.push(`/confirm?step=${prev}`);
    }
  }, [currentIndex, isFirst, router, store]);

  // 跳转到指定步骤
  const goToStep = useCallback(
    (step: StepKey | number) => {
      const targetIndex = typeof step === 'number' ? step : STEPS.indexOf(step);
      if (targetIndex >= 0 && targetIndex < totalSteps) {
        const targetStep = STEPS[targetIndex];
        store.setCurrentStep(targetStep);
        router.push(`/confirm?step=${targetStep}`);
      }
    },
    [totalSteps, router, store]
  );

  // 获取步骤链接
  const getStepLink = useCallback((step: StepKey): string => {
    return `/confirm?step=${step}`;
  }, []);

  return {
    currentStep,
    currentIndex,
    totalSteps,
    progress,
    isFirst,
    isLast,
    isStepCompleted,
    nextStep,
    prevStep,
    goToStep,
    getStepLink,
  };
}

export default useConfirmationStep;
