/**
 * User Onboarding Store
 * 
 * 引导状态管理 - 使用 Zustand persist 持久化进度
 */

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  OnboardingStep,
  OnboardingStatus,
  OnboardingStore,
  STEP_ORDER,
  getNextStep,
  getStepIndex,
} from './types';

const STORAGE_KEY = 'vibex-onboarding';

// 初始状态
const initialState = {
  status: 'not-started' as OnboardingStatus,
  currentStep: 'welcome' as OnboardingStep,
  completedSteps: [] as OnboardingStep[],
  startedAt: undefined as number | undefined,
  completedAt: undefined as number | undefined,
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
      }),
    }
  )
);

export default useOnboardingStore;
