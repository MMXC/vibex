/**
 * PreviewStore - Zustand 预览状态管理
 * 
 * 管理预览区域的状态：
 * - Mermaid 代码
 * - 当前步骤
 * - 生成状态
 * - 错误信息
 */
// @ts-nocheck


import { create } from 'zustand';

export type PreviewStep = 'idle' | 'context' | 'model' | 'flow' | 'complete';

interface PreviewState {
  mermaidCode: string;
  currentStep: PreviewStep;
  isGenerating: boolean;
  error: string | null;
  requirement: string;
  
  // Actions
  setMermaidCode: (code: string) => void;
  setStep: (step: PreviewStep) => void;
  setGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  setRequirement: (requirement: string) => void;
  reset: () => void;
}

const initialState = {
  mermaidCode: '',
  currentStep: 'idle' as PreviewStep,
  isGenerating: false,
  error: null,
  requirement: '',
};

export const usePreviewStore = create<PreviewState>((set) => ({
  ...initialState,

  setMermaidCode: (code) => set({ mermaidCode: code }),
  setStep: (step) => set({ currentStep: step }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setError: (error) => set({ error }),
  setRequirement: (requirement) => set({ requirement }),

  reset: () => set(initialState),
}));

// 步骤配置
export const STEP_CONFIG: Record<PreviewStep, { label: string; description: string }> = {
  idle: {
    label: '输入需求',
    description: '描述您想要构建的项目',
  },
  context: {
    label: '限界上下文',
    description: '分析系统边界和核心领域',
  },
  model: {
    label: '领域模型',
    description: '生成领域实体和关系',
  },
  flow: {
    label: '业务流程',
    description: '设计业务流程和状态转换',
  },
  complete: {
    label: '项目创建',
    description: '创建项目并生成原型',
  },
};

// 步骤顺序
export const STEP_ORDER: PreviewStep[] = ['idle', 'context', 'model', 'flow', 'complete'];

// 获取下一步
export function getNextStep(currentStep: PreviewStep): PreviewStep | null {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  if (currentIndex < STEP_ORDER.length - 1) {
    return STEP_ORDER[currentIndex + 1];
  }
  return null;
}

// 获取步骤进度 (0-100)
export function getStepProgress(step: PreviewStep): number {
  const index = STEP_ORDER.indexOf(step);
  return Math.round((index / (STEP_ORDER.length - 1)) * 100);
}

export default usePreviewStore;