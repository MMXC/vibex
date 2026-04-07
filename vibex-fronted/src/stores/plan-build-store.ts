/**
 * Plan/Build Mode Store
 * Zustand store for managing Plan/Build mode state
 */

import { create } from 'zustand';

export type PlanBuildMode = 'plan' | 'build';

export interface PlanResult {
  requirementAnalysis: string;
  inferredFeatures: string[];
  suggestedContexts: Array<{
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  risks: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedComplexityScore: number;
}

export interface PlanBuildState {
  // Mode state
  mode: PlanBuildMode;
  setMode: (mode: PlanBuildMode) => void;
  toggleMode: () => void;
  
  // Plan result cache
  planResult: PlanResult | null;
  setPlanResult: (result: PlanResult | null) => void;
  clearPlanResult: () => void;
  
  // UI state
  isPlanLoading: boolean;
  setPlanLoading: (loading: boolean) => void;
  
  isBuildLoading: boolean;
  setBuildLoading: (loading: boolean) => void;
  
  // Error state
  error: string | null;
  setError: (error: string | null) => void;
  
  // Reset all state
  reset: () => void;
}

const initialState = {
  mode: 'build' as PlanBuildMode,
  planResult: null,
  isPlanLoading: false,
  isBuildLoading: false,
  error: null,
};

export const usePlanBuildStore = create<PlanBuildState>((set) => ({
  ...initialState,
  
  setMode: (mode) => set({ mode }),
  
  toggleMode: () => set((state) => ({
    mode: state.mode === 'plan' ? 'build' : 'plan',
  })),
  
  setPlanResult: (planResult) => set({ planResult }),
  
  clearPlanResult: () => set({ planResult: null }),
  
  setPlanLoading: (isPlanLoading) => set({ isPlanLoading }),
  
  setBuildLoading: (isBuildLoading) => set({ isBuildLoading }),
  
  setError: (error) => set({ error }),
  
  reset: () => set(initialState),
}));

// Selector hooks for better performance
export const useCurrentMode = () => usePlanBuildStore((state) => state.mode);
export const usePlanResult = () => usePlanBuildStore((state) => state.planResult);
export const useIsPlanMode = () => usePlanBuildStore((state) => state.mode === 'plan');
export const useIsBuildMode = () => usePlanBuildStore((state) => state.mode === 'build');
export const useIsLoading = () => usePlanBuildStore(
  (state) => state.isPlanLoading || state.isBuildLoading
);
