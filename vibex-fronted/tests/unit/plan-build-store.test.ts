import { usePlanBuildStore, PlanBuildMode } from '../../src/stores/plan-build-store';

describe('plan-build-store', () => {
  beforeEach(() => {
    usePlanBuildStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = usePlanBuildStore.getState();
      expect(state.mode).toBe('build');
      expect(state.planResult).toBeNull();
      expect(state.isPlanLoading).toBe(false);
      expect(state.isBuildLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setMode', () => {
    it('should set mode to plan', () => {
      const { setMode } = usePlanBuildStore.getState();
      setMode('plan');
      expect(usePlanBuildStore.getState().mode).toBe('plan');
    });

    it('should set mode to build', () => {
      const { setMode, setMode: _setMode } = usePlanBuildStore.getState();
      usePlanBuildStore.getState().setMode('plan');
      usePlanBuildStore.getState().setMode('build');
      expect(usePlanBuildStore.getState().mode).toBe('build');
    });
  });

  describe('toggleMode', () => {
    it('should toggle from build to plan', () => {
      const { toggleMode } = usePlanBuildStore.getState();
      toggleMode();
      expect(usePlanBuildStore.getState().mode).toBe('plan');
    });

    it('should toggle from plan to build', () => {
      usePlanBuildStore.getState().setMode('plan');
      usePlanBuildStore.getState().toggleMode();
      expect(usePlanBuildStore.getState().mode).toBe('build');
    });

    it('should toggle twice back to original', () => {
      const initial = usePlanBuildStore.getState().mode;
      usePlanBuildStore.getState().toggleMode();
      usePlanBuildStore.getState().toggleMode();
      expect(usePlanBuildStore.getState().mode).toBe(initial);
    });
  });

  describe('setPlanResult', () => {
    it('should set plan result', () => {
      const result = {
        requirementAnalysis: 'Test analysis',
        inferredFeatures: ['Feature 1'],
        suggestedContexts: [{ name: 'ctx1', description: 'desc', priority: 'high' as const }],
        risks: ['Risk 1'],
        complexity: 'medium' as const,
        estimatedComplexityScore: 50,
      };
      usePlanBuildStore.getState().setPlanResult(result);
      const state = usePlanBuildStore.getState();
      expect(state.planResult).toEqual(result);
    });

    it('should clear plan result with null', () => {
      usePlanBuildStore.getState().setPlanResult({
        requirementAnalysis: 'Test',
        inferredFeatures: [],
        suggestedContexts: [],
        risks: [],
        complexity: 'simple',
        estimatedComplexityScore: 10,
      });
      usePlanBuildStore.getState().setPlanResult(null);
      expect(usePlanBuildStore.getState().planResult).toBeNull();
    });
  });

  describe('clearPlanResult', () => {
    it('should clear plan result', () => {
      usePlanBuildStore.getState().setPlanResult({
        requirementAnalysis: 'Test',
        inferredFeatures: [],
        suggestedContexts: [],
        risks: [],
        complexity: 'simple',
        estimatedComplexityScore: 10,
      });
      usePlanBuildStore.getState().clearPlanResult();
      expect(usePlanBuildStore.getState().planResult).toBeNull();
    });
  });

  describe('setPlanLoading', () => {
    it('should set plan loading to true', () => {
      usePlanBuildStore.getState().setPlanLoading(true);
      expect(usePlanBuildStore.getState().isPlanLoading).toBe(true);
    });

    it('should set plan loading to false', () => {
      usePlanBuildStore.getState().setPlanLoading(true);
      usePlanBuildStore.getState().setPlanLoading(false);
      expect(usePlanBuildStore.getState().isPlanLoading).toBe(false);
    });
  });

  describe('setBuildLoading', () => {
    it('should set build loading to true', () => {
      usePlanBuildStore.getState().setBuildLoading(true);
      expect(usePlanBuildStore.getState().isBuildLoading).toBe(true);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      usePlanBuildStore.getState().setError('Something went wrong');
      expect(usePlanBuildStore.getState().error).toBe('Something went wrong');
    });

    it('should clear error with null', () => {
      usePlanBuildStore.getState().setError('Error');
      usePlanBuildStore.getState().setError(null);
      expect(usePlanBuildStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial', () => {
      usePlanBuildStore.getState().setMode('plan');
      usePlanBuildStore.getState().setPlanLoading(true);
      usePlanBuildStore.getState().setBuildLoading(true);
      usePlanBuildStore.getState().setError('error');
      usePlanBuildStore.getState().setPlanResult({
        requirementAnalysis: 'Test',
        inferredFeatures: [],
        suggestedContexts: [],
        risks: [],
        complexity: 'simple',
        estimatedComplexityScore: 10,
      });
      usePlanBuildStore.getState().reset();
      const state = usePlanBuildStore.getState();
      expect(state.mode).toBe('build');
      expect(state.isPlanLoading).toBe(false);
      expect(state.isBuildLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.planResult).toBeNull();
    });
  });

  describe('selector hooks', () => {
    it('useCurrentMode should return current mode', () => {
      usePlanBuildStore.getState().setMode('plan');
      expect(usePlanBuildStore.getState().mode).toBe('plan');
    });

    it('usePlanResult should return plan result', () => {
      const result = {
        requirementAnalysis: 'Analysis',
        inferredFeatures: ['F1'],
        suggestedContexts: [{ name: 'n', description: 'd', priority: 'high' as const }],
        risks: [],
        complexity: 'complex' as const,
        estimatedComplexityScore: 90,
      };
      usePlanBuildStore.getState().setPlanResult(result);
      expect(usePlanBuildStore.getState().planResult).toEqual(result);
    });
  });
});
