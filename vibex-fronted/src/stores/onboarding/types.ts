/**
 * User Onboarding Types
 * 
 * 引导步骤类型定义
 * E1: 新增 ScenarioType + store 新增字段
 */

export type OnboardingStep = 
  | 'welcome'     // 步骤1: 欢迎介绍
  | 'input'       // 步骤2: 需求录入
  | 'clarify'     // 步骤3: AI澄清（场景选择）
  | 'model'       // 步骤4: 建模展示
  | 'prototype';  // 步骤5: 原型生成（模板选择）

export type OnboardingStatus = 
  | 'not-started'  // 未开始
  | 'in-progress'  // 进行中
  | 'completed'     // 已完成
  | 'skipped';      // 已跳过

/** E1-S3: 场景类型 */
export type ScenarioType = 
  | 'new-feature'   // 新功能开发
  | 'refactor'      // 重构
  | 'bugfix'        // Bug 修复
  | 'documentation' // 文档
  | 'other';        // 其他

/** P003: AI 解析结果 */
export interface ClarifyResult {
  role: string | null;
  goal: string | null;
  constraints: string[];
  raw: string;
  parsed: { role: string; goal: string; constraints: string[] } | null;
  guidance?: string;
}

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
  /** E1-S3: 场景类型 (Step 3 选择) */
  scenario?: ScenarioType;
  /** E1-S1: 选中的模板 ID (Step 5 选择) */
  selectedTemplateId?: string;
  /** P003: 原始需求文本 (Step 2 录入) */
  requirementText?: string;
  /** P003: AI 解析结果 (Step 3 生成) */
  clarifyResult?: ClarifyResult;
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
  /** E1-S3: 设置场景类型 */
  setScenario: (scenario: ScenarioType) => void;
  /** E1-S1: 设置选中的模板 ID */
  setSelectedTemplateId: (templateId: string | undefined) => void;
  /** P003: 设置需求文本 */
  setRequirementText: (text: string) => void;
  /** P003: 设置 AI 解析结果 */
  setClarifyResult: (result: ClarifyResult | undefined) => void;
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
    description: '选择你的项目场景',
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
    title: '模板推荐',
    description: '选择一个模板快速开始',
    icon: '🎨',
    duration: '2min',
  },
];

/** E1-S3: 场景配置 */
export const SCENARIO_OPTIONS: { value: ScenarioType; label: string; icon: string }[] = [
  { value: 'new-feature', label: '新功能开发', icon: '✨' },
  { value: 'refactor', label: '代码重构', icon: '🔧' },
  { value: 'bugfix', label: 'Bug 修复', icon: '🐛' },
  { value: 'documentation', label: '文档撰写', icon: '📄' },
  { value: 'other', label: '其他', icon: '📦' },
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
    return STEP_ORDER[currentIndex + 1]!;
  }
  return null;
}

// 获取上一步
export function getPrevStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex > 0) {
    return STEP_ORDER[currentIndex - 1]!;
  }
  return null;
}
