/**
 * useConfirmationState Hook - 确认流程状态校验
 * 
 * 用于检查确认流程各步骤的前置数据是否存在
 * 
 * Usage:
 * const { isValid, redirectTo, message } = useConfirmationState('context')
 * 
 * if (!isValid) {
 *   router.push(redirectTo)
 * }
 */

'use client';

import { useMemo } from 'react';
import { useConfirmationStore, ConfirmationStep } from '@/stores/confirmationStore';

export type ConfirmationStepKey = 'context' | 'model' | 'flow';

/**
 * 获取上一步骤
 */
function getPrevStep(step: ConfirmationStepKey): ConfirmationStepKey {
  const steps: ConfirmationStepKey[] = ['context', 'model', 'flow'];
  const currentIndex = steps.indexOf(step);
  return steps[Math.max(0, currentIndex - 1)];
}

/**
 * 获取步骤对应的数据键名
 */
function getDataKey(step: ConfirmationStepKey): string {
  switch (step) {
    case 'context':
      return 'boundedContexts';
    case 'model':
      return 'domainModels';
    case 'flow':
      return 'businessFlow';
    default:
      return 'boundedContexts';
  }
}

export interface UseConfirmationStateReturn {
  /** 当前步骤是否有效（有前置数据） */
  isValid: boolean;
  /** 重定向路径 */
  redirectTo: string;
  /** 错误消息 */
  message: string;
  /** 检查结果详情 */
  checks: {
    hasRequirementText: boolean;
    hasBoundedContexts: boolean;
    hasDomainModels: boolean;
    hasBusinessFlow: boolean;
  };
}

export function useConfirmationState(step: ConfirmationStepKey): UseConfirmationStateReturn {
  const store = useConfirmationStore();
  
  return useMemo(() => {
    const { requirementText, boundedContexts, domainModels, businessFlow } = store;
    
    // 检查各项数据
    const hasRequirementText = !!requirementText?.trim();
    const hasBoundedContexts = boundedContexts?.length > 0;
    const hasDomainModels = domainModels?.length > 0;
    const hasBusinessFlow = !!businessFlow;
    
    // 根据步骤检查前置条件
    let isValid = false;
    let message = '';
    
    switch (step) {
      case 'context':
        isValid = hasRequirementText;
        message = isValid ? '' : '请先输入需求描述';
        break;
      case 'model':
        isValid = hasBoundedContexts;
        message = isValid ? '' : '请先完成限界上下文确认';
        break;
      case 'flow':
        isValid = hasDomainModels;
        message = isValid ? '' : '请先完成领域模型确认';
        break;
    }
    
    // 计算重定向路径
    let redirectTo = '/confirm';
    if (!isValid) {
      const prevStep = getPrevStep(step);
      if (prevStep !== step) {
        redirectTo = `/confirm?step=${prevStep}`;
      }
    }
    
    return {
      isValid,
      redirectTo,
      message,
      checks: {
        hasRequirementText,
        hasBoundedContexts,
        hasDomainModels,
        hasBusinessFlow,
      },
    };
  }, [
    store.requirementText,
    store.boundedContexts,
    store.domainModels,
    store.businessFlow,
    step,
  ]);
}

export default useConfirmationState;
