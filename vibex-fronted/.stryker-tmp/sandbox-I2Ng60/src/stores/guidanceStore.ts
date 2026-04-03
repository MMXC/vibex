/**
 * Guidance Store — Zustand store for Canvas Guidance System
 *
 * Manages:
 * - ShortcutBar visibility (collapsed/expanded)
 * - Canvas onboarding state (first-time user detection + step progress)
 * - Node tooltip state (hovered node, position)
 */
// @ts-nocheck


'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// =============================================================================
// Types
// =============================================================================

export interface GuidanceStore {
  // ShortcutBar state
  shortcutBarVisible: boolean;
  shortcutBarCollapsed: boolean;

  // Onboarding state
  canvasOnboardingCompleted: boolean;
  canvasOnboardingStep: number; // 0 = not started, 1-3 = steps
  canvasOnboardingDismissed: boolean;

  // Node tooltip state
  tooltipNodeId: string | null;
  tooltipPosition: { x: number; y: number };
  tooltipContent: string | null;

  // Actions: ShortcutBar
  showShortcutBar: () => void;
  hideShortcutBar: () => void;
  toggleShortcutBar: () => void;
  collapseShortcutBar: () => void;
  expandShortcutBar: () => void;

  // Actions: Onboarding
  startCanvasOnboarding: () => void;
  nextOnboardingStep: () => void;
  prevOnboardingStep: () => void;
  completeCanvasOnboarding: () => void;
  dismissCanvasOnboarding: () => void;
  resetCanvasOnboarding: () => void;

  // Actions: Tooltip
  showTooltip: (nodeId: string, x: number, y: number, content: string) => void;
  hideTooltip: () => void;
  moveTooltip: (x: number, y: number) => void;
}

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'vibex-guidance';
const CANVAS_ONBOARDING_STEPS = 3;

// =============================================================================
// Store
// =============================================================================

const initialState = {
  shortcutBarVisible: true,
  shortcutBarCollapsed: false,
  canvasOnboardingCompleted: false,
  canvasOnboardingStep: 0,
  canvasOnboardingDismissed: false,
  tooltipNodeId: null,
  tooltipPosition: { x: 0, y: 0 },
  tooltipContent: null,
};

export const useGuidanceStore = create<GuidanceStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ShortcutBar
      showShortcutBar: () => set({ shortcutBarVisible: true }),
      hideShortcutBar: () => set({ shortcutBarVisible: false }),
      toggleShortcutBar: () => set((s) => ({ shortcutBarVisible: !s.shortcutBarVisible })),
      collapseShortcutBar: () => set({ shortcutBarCollapsed: true }),
      expandShortcutBar: () => set({ shortcutBarCollapsed: false }),

      // Onboarding
      startCanvasOnboarding: () => set({ canvasOnboardingStep: 1 }),
      nextOnboardingStep: () => {
        const { canvasOnboardingStep } = get();
        if (canvasOnboardingStep < CANVAS_ONBOARDING_STEPS) {
          set({ canvasOnboardingStep: canvasOnboardingStep + 1 });
        } else {
          get().completeCanvasOnboarding();
        }
      },
      prevOnboardingStep: () => {
        const { canvasOnboardingStep } = get();
        if (canvasOnboardingStep > 1) {
          set({ canvasOnboardingStep: canvasOnboardingStep - 1 });
        }
      },
      completeCanvasOnboarding: () =>
        set({ canvasOnboardingCompleted: true, canvasOnboardingStep: 0 }),
      dismissCanvasOnboarding: () =>
        set({ canvasOnboardingDismissed: true, canvasOnboardingStep: 0 }),
      resetCanvasOnboarding: () =>
        set({ canvasOnboardingCompleted: false, canvasOnboardingDismissed: false, canvasOnboardingStep: 0 }),

      // Tooltip
      showTooltip: (nodeId, x, y, content) =>
        set({ tooltipNodeId: nodeId, tooltipPosition: { x, y }, tooltipContent: content }),
      hideTooltip: () => set({ tooltipNodeId: null, tooltipContent: null }),
      moveTooltip: (x, y) => set({ tooltipPosition: { x, y } }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        shortcutBarVisible: state.shortcutBarVisible,
        shortcutBarCollapsed: state.shortcutBarCollapsed,
        canvasOnboardingCompleted: state.canvasOnboardingCompleted,
        canvasOnboardingDismissed: state.canvasOnboardingDismissed,
      }),
    }
  )
);

export default useGuidanceStore;
