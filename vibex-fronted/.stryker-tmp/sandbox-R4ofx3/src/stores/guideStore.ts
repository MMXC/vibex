/**
 * Guide Store — Zustand store for New User Guide System
 *
 * Manages:
 * - Active guide state (isActive, currentStep)
 * - Completed steps tracking
 * - Earned badges / milestones
 * - Skip state
 *
 * Persisted to localStorage so returning users don't see the guide again.
 */
// @ts-nocheck


'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface GuideStep {
  /** Step identifier */
  id: string;
  /** Display title */
  title: string;
  /** Step description / tooltip body */
  description: string;
  /** CSS selector for the element to highlight */
  targetSelector: string;
  /** Preferred tooltip placement */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Badge earned when completing this step (optional) */
  badge?: string;
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'welcome',
    title: '欢迎使用 VibeX',
    description:
      'VibeX 是一个 DDD 可视化建模工具。通过左侧三棵树管理限界上下文、流程和组件，中间画布展示节点关系。让我们开始吧！',
    targetSelector: '[class*="projectBar"]',
    placement: 'bottom',
  },
  {
    id: 'add-context',
    title: '添加限界上下文',
    description:
      '点击左侧「限界上下文」树面板底部的「+ 添加」按钮，或直接双击画布，创建你的第一个 Bounded Context。这是 DDD 的核心概念。',
    targetSelector: '[class*="treePanel"]',
    placement: 'right',
    badge: 'first-context',
  },
  {
    id: 'add-flow',
    title: '添加流程节点',
    description:
      '切换到「流程」标签页，点击「+ 添加流程」创建业务流程节点。节点可连接形成完整的业务流程视图。',
    targetSelector: '[class*="tabBar"]',
    placement: 'bottom',
    badge: 'first-flow',
  },
  {
    id: 'add-component',
    title: '添加组件',
    description:
      '切换到「组件」标签页，点击「+ 添加组件」定义领域组件。将组件拖入限界上下文中，建立组件与上下文的关联。',
    targetSelector: '[class*="tabBar"]',
    placement: 'bottom',
    badge: 'first-component',
  },
  {
    id: 'complete',
    title: '引导完成！',
    description:
      '恭喜你完成新手引导！你已掌握 VibeX 的核心操作方式。后续可随时按 ? 键打开快捷键面板。',
    targetSelector: '[class*="projectBar"]',
    placement: 'bottom',
    badge: 'guide-complete',
  },
];

// Badge metadata
export const BADGE_META: Record<string, { label: string; emoji: string }> = {
  'first-context': { label: '首个上下文', emoji: '🌏' },
  'first-flow': { label: '首个流程', emoji: '🌊' },
  'first-component': { label: '首个组件', emoji: '🧩' },
  'guide-complete': { label: '新手引导完成', emoji: '🎓' },
};

// =============================================================================
// Store Interface
// =============================================================================

export interface GuideState {
  /** Whether the guide overlay is currently active */
  isActive: boolean;
  /** Current step index (0-based, GUIDE_STEPS) */
  currentStep: number;
  /** Steps that have been completed (indices) */
  completedSteps: number[];
  /** Badges the user has earned */
  earnedBadges: string[];
  /** Whether the user skipped the guide voluntarily */
  isSkipped: boolean;
  /** Whether the user has ever seen the guide (set after completion or skip) */
  hasSeenGuide: boolean;

  // Actions
  startGuide: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeGuide: () => void;
  skipGuide: () => void;
  earnBadge: (badge: string) => void;
  resetGuide: () => void;
}

// =============================================================================
// Store
// =============================================================================

const STORAGE_KEY = 'vibex-guide';

export const useGuideStore = create<GuideState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentStep: 0,
      completedSteps: [],
      earnedBadges: [],
      isSkipped: false,
      hasSeenGuide: false,

      startGuide: () =>
        set({
          isActive: true,
          currentStep: 0,
          completedSteps: [],
          earnedBadges: [],
          isSkipped: false,
        }),

      nextStep: () => {
        const { currentStep, completedSteps } = get();
        const nextStep = currentStep + 1;

        // Earn badge for the step being completed (before moving)
        const currentStepData = GUIDE_STEPS[currentStep];
        if (currentStepData?.badge) {
          get().earnBadge(currentStepData.badge);
        }

        const newCompleted = completedSteps.includes(currentStep)
          ? completedSteps
          : [...completedSteps, currentStep];

        if (nextStep >= GUIDE_STEPS.length) {
          set({ currentStep: nextStep, completedSteps: newCompleted });
          get().completeGuide();
        } else {
          set({ currentStep: nextStep, completedSteps: newCompleted });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      completeGuide: () =>
        set({
          isActive: false,
          hasSeenGuide: true,
          isSkipped: false,
        }),

      skipGuide: () =>
        set({
          isActive: false,
          hasSeenGuide: true,
          isSkipped: true,
        }),

      earnBadge: (badge: string) => {
        const { earnedBadges } = get();
        if (!earnedBadges.includes(badge)) {
          set({ earnedBadges: [...earnedBadges, badge] });
        }
      },

      resetGuide: () =>
        set({
          isActive: false,
          currentStep: 0,
          completedSteps: [],
          earnedBadges: [],
          isSkipped: false,
          hasSeenGuide: false,
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasSeenGuide: state.hasSeenGuide,
        earnedBadges: state.earnedBadges,
      }),
    }
  )
);

export default useGuideStore;
