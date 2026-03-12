/**
 * User Onboarding Types
 * 
 * 引导步骤类型定义
 */

export type OnboardingStep = 
  | 'welcome'     // 步骤1: 欢迎介绍
  | 'input'       // 步骤2: 需求录入
  | 'clarify'     // 步骤3: AI澄清
  | 'model'       // 步骤4: 建模展示
  | 'prototype';  // 步骤5: 原型生成

export type OnboardingStatus = 
  | 'not-started'  // 未开始
  | 'in-progress'  // 进行中
  | 'completed'     // 已完成
  | 'skipped';      // 已跳过

export interface StepInfo {
  id: OnboardingStep;
  title: string;
  description: string;
  icon: string;
  duration?: string;
}

export interface OnboardingProgress {
  status: OnboardingStatus;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  startedAt?: number;
  completedAt?: number;
}

export interface OnboardingActions {
  start: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  completeStep: (step: OnboardingStep) => void;
  complete: () => void;
  skip: () => void;
  reset: () => void;
}

export type OnboardingStore = OnboardingProgress & OnboardingActions;

// 引导步骤配置
export const ONBOARDING_STEPS: StepInfo[] = [
  {
    id: 'welcome',
    title: '欢迎使用 VibeX',
    description: 'AI 驱动的协作式设计平台',
    icon: '🎯',
    duration: '1min',
  },
  {
    id: 'input',
    title: '描述您的需求',
    description: '输入产品需求，AI 将帮您分析',
    icon: '📝',
    duration: '2min',
  },
  {
    id: 'clarify',
    title: 'AI 智能澄清',
    description: 'AI 会提问帮助完善需求',
    icon: '🤖',
    duration: '2min',
  },
  {
    id: 'model',
    title: '领域建模',
    description: '可视化展示领域模型',
    icon: '🏗️',
    duration: '3min',
  },
  {
    id: 'prototype',
    title: '原型生成',
    description: '一键生成可交互原型',
    icon: '🎨',
    duration: '2min',
  },
];

// 步骤顺序
export const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'input', 
  'clarify',
  'model',
  'prototype',
];

// 获取步骤索引
export function getStepIndex(step: OnboardingStep): number {
  return STEP_ORDER.indexOf(step);
}

// 获取下一步
export function getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex < STEP_ORDER.length - 1) {
    return STEP_ORDER[currentIndex + 1];
  }
  return null;
}

// 获取上一步
export function getPrevStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex > 0) {
    return STEP_ORDER[currentIndex - 1];
  }
  return null;
}
