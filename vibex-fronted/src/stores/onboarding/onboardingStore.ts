/**
 * User Onboarding Store
 * 
 * 引导状态管理 - 使用 Zustand persist 持久化进度
 * E1: 支持场景化模板推荐 + localStorage 完成标记
 */

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  OnboardingStep,
  OnboardingStatus,
  OnboardingStore,
  ScenarioType,
  STEP_ORDER,
  getNextStep,
  getStepIndex,
} from './types';

const STORAGE_KEY = 'vibex-onboarding';

/** E1-S2: localStorage 完成标记 key */
const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';
const ONBOARDING_COMPLETED_AT_KEY = 'onboarding_completed_at';
/** E1-S2: 待填充到 Canvas 的模板 requirement 内容 */
const PENDING_TEMPLATE_REQ_KEY = 'vibex:pending_template_req';

// 初始状态
const initialState = {
  status: 'not-started' as OnboardingStatus,
  currentStep: 'welcome' as OnboardingStep,
  completedSteps: [] as OnboardingStep[],
  startedAt: undefined as number | undefined,
  completedAt: undefined as number | undefined,
  /** E1-S3: 场景类型 (Step 3 选择) */
  scenario: undefined as ScenarioType | undefined,
  /** E1-S1: 选中的模板 ID (Step 5 选择) */
  selectedTemplateId: undefined as string | undefined,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 开始引导
      start: () => {
        set({
          status: 'in-progress',
          currentStep: 'welcome',
          startedAt: Date.now(),
        });
      },

      // 下一步
      nextStep: () => {
        const { currentStep, completedSteps } = get();
        const nextStep = getNextStep(currentStep);
        
        if (nextStep) {
          // 将当前步骤标记为完成
          if (!completedSteps.includes(currentStep)) {
            set({
              completedSteps: [...completedSteps, currentStep],
              currentStep: nextStep,
            });
          } else {
            set({ currentStep: nextStep });
          }
        } else {
          // 如果没有下一步，则完成引导
          get().complete();
        }
      },

      // 上一步
      prevStep: () => {
        const { currentStep } = get();
        const currentIndex = getStepIndex(currentStep);
        
        if (currentIndex > 0) {
          set({ currentStep: STEP_ORDER[currentIndex - 1] });
        }
      },

      // 跳转到指定步骤
      goToStep: (step: OnboardingStep) => {
        set({ currentStep: step });
      },

      // 标记步骤完成
      completeStep: (step: OnboardingStep) => {
        const { completedSteps } = get();
        if (!completedSteps.includes(step)) {
          set({
            completedSteps: [...completedSteps, step],
          });
        }
      },

      /**
       * E1-S3: 设置场景类型
       * @param scenario 场景类型
       */
      setScenario: (scenario: ScenarioType) => {
        set({ scenario });
      },

      /**
       * E1-S1: 设置选中的模板 ID
       * @param templateId 模板 ID
       */
      setSelectedTemplateId: (templateId: string | undefined) => {
        set({ selectedTemplateId: templateId });
      },

      // 完成引导
      complete: () => {
        const { currentStep, completedSteps } = get();
        
        // 确保当前步骤也被标记为完成
        let finalSteps = completedSteps;
        if (!completedSteps.includes(currentStep)) {
          finalSteps = [...completedSteps, currentStep];
        }
        
        set({
          status: 'completed',
          completedSteps: finalSteps,
          completedAt: Date.now(),
        });

        // E1-S4: 写入 localStorage 完成标记
        try {
          localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
          localStorage.setItem(ONBOARDING_COMPLETED_AT_KEY, new Date().toISOString());
        } catch {
          // localStorage 写入失败静默忽略
        }
      },

      // 跳过引导
      skip: () => {
        set({
          status: 'skipped',
        });
      },

      // 重置引导
      reset: () => {
        set(initialState);
        try {
          localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
          localStorage.removeItem(ONBOARDING_COMPLETED_AT_KEY);
        } catch {
          // ignore
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        status: state.status,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        scenario: state.scenario,
        selectedTemplateId: state.selectedTemplateId,
      }),
    }
  )
);

export default useOnboardingStore;
