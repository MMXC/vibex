/**
 * usePlanBuild Hook
 * Unified hook for Plan/Build mode
 */
// @ts-nocheck


import { useCallback } from 'react';
import { usePlanBuildStore, type PlanResult as PlanResultType } from '@/stores/plan-build-store';
import { analyzeRequirement } from '@/services/plan/plan-service';

interface UsePlanBuildReturn {
  // Mode
  mode: 'plan' | 'build';
  toggleMode: () => void;
  
  // Plan mode
  planResult: PlanResultType | null;
  isPlanLoading: boolean;
  runPlanAnalysis: (requirementText: string) => Promise<void>;
  clearPlanResult: () => void;
  
  // Build mode  
  isBuildLoading: boolean;
  
  // Combined
  isLoading: boolean;
}

export function usePlanBuild(): UsePlanBuildReturn {
  const {
    mode,
    toggleMode,
    planResult,
    isPlanLoading,
    setPlanLoading,
    isBuildLoading,
    setBuildLoading,
    setPlanResult,
    clearPlanResult,
  } = usePlanBuildStore();

  const runPlanAnalysis = useCallback(async (requirementText: string) => {
    setPlanLoading(true);
    try {
      const result = await analyzeRequirement({ requirementText });
      setPlanResult(result as unknown as PlanResultType);
    } catch (error) {
      console.error('Plan analysis failed:', error);
      throw error;
    } finally {
      setPlanLoading(false);
    }
  }, [setPlanLoading, setPlanResult]);

  return {
    mode,
    toggleMode,
    planResult: planResult as PlanResultType | null,
    isPlanLoading,
    runPlanAnalysis,
    clearPlanResult,
    isBuildLoading,
    isLoading: isPlanLoading || isBuildLoading,
  };
}

export default usePlanBuild;
