/**
 * Design Flow Router
 * 5步设计流程路由配置
 */
// @ts-nocheck


import { NextResponse } from 'next/server';

// 设计流程步骤配置
export const DESIGN_STEPS = [
  { id: 'clarification', name: '需求澄清', path: '/design/clarification' },
  { id: 'bounded-context', name: '限界上下文', path: '/design/bounded-context' },
  { id: 'domain-model', name: '领域模型', path: '/design/domain-model' },
  { id: 'business-flow', name: '业务流程', path: '/design/business-flow' },
  { id: 'ui-generation', name: 'UI生成', path: '/design/ui-generation' },
] as const;

export type DesignStep = typeof DESIGN_STEPS[number]['id'];

// 路由映射
export const STEP_ROUTES: Record<DesignStep, string> = {
  clarification: '/design/clarification',
  'bounded-context': '/design/bounded-context',
  'domain-model': '/design/domain-model',
  'business-flow': '/design/business-flow',
  'ui-generation': '/design/ui-generation',
};

// 验证步骤是否有效
export function isValidStep(step: string): step is DesignStep {
  return DESIGN_STEPS.some(s => s.id === step);
}

// 获取下一步
export function getNextStep(currentStep: DesignStep): DesignStep | null {
  const currentIndex = DESIGN_STEPS.findIndex(s => s.id === currentStep);
  if (currentIndex === -1 || currentIndex === DESIGN_STEPS.length - 1) {
    return null;
  }
  return DESIGN_STEPS[currentIndex + 1].id;
}

// 获取上一步
export function getPrevStep(currentStep: DesignStep): DesignStep | null {
  const currentIndex = DESIGN_STEPS.findIndex(s => s.id === currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return DESIGN_STEPS[currentIndex - 1].id;
}

export default DESIGN_STEPS;
