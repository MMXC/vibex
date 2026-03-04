/**
 * useConfirmationStep Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useConfirmationStep, STEPS, STEP_LABELS } from '../useConfirmationStep';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock dependencies
const mockRouter = {
  push: jest.fn(),
};

const mockSearchParams = new URLSearchParams();

const mockStore = {
  requirementText: '',
  boundedContexts: [] as any[],
  domainModels: [] as any[],
  businessFlow: null,
  currentStep: 'input' as const,
  setCurrentStep: jest.fn(),
  setRequirementText: jest.fn(),
  setBoundedContexts: jest.fn(),
  setDomainModels: jest.fn(),
  setBusinessFlow: jest.fn(),
  reset: jest.fn(),
};

jest.mock('@/stores/confirmationStore', () => ({
  useConfirmationStore: jest.fn(() => mockStore),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
  useSearchParams: jest.fn(() => mockSearchParams),
}));

describe('useConfirmationStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();
    mockStore.currentStep = 'input';
    mockStore.requirementText = '';
    mockStore.boundedContexts = [];
    mockStore.domainModels = [];
    mockStore.businessFlow = null;
  });

  describe('STEP constants', () => {
    it('should have correct step order', () => {
      expect(STEPS).toEqual(['input', 'context', 'model', 'flow', 'success']);
    });

    it('should have labels for all steps', () => {
      expect(STEP_LABELS.input).toBe('需求输入');
      expect(STEP_LABELS.context).toBe('限界上下文');
      expect(STEP_LABELS.model).toBe('领域模型');
      expect(STEP_LABELS.flow).toBe('业务流程');
      expect(STEP_LABELS.success).toBe('完成');
    });
  });

  describe('current step', () => {
    it('should return input as default step', () => {
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.currentStep).toBe('input');
      expect(result.current.currentIndex).toBe(0);
    });

    it('should return correct total steps', () => {
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.totalSteps).toBe(5);
    });
  });

  describe('progress calculation', () => {
    it('should calculate 0% progress for first step', () => {
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.progress).toBe(0);
    });

    it('should identify first and last steps', () => {
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.isFirst).toBe(true);
      expect(result.current.isLast).toBe(false);
    });
  });

  describe('step completion', () => {
    it('should report input as incomplete when no requirement text', () => {
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.isStepCompleted('input')).toBe(false);
    });

    it('should report input as complete when requirement text exists', () => {
      mockStore.requirementText = 'Test requirement';
      
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.isStepCompleted('input')).toBe(true);
    });

    it('should report context as incomplete when no bounded contexts', () => {
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.isStepCompleted('context')).toBe(false);
    });

    it('should report context as complete when bounded contexts exist', () => {
      mockStore.boundedContexts = [{ id: '1' }];
      
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.isStepCompleted('context')).toBe(true);
    });

    it('should report model as incomplete when no domain models', () => {
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.isStepCompleted('model')).toBe(false);
    });

    it('should report model as complete when domain models exist', () => {
      mockStore.domainModels = [{ id: '1' }];
      
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.isStepCompleted('model')).toBe(true);
    });

    it('should report flow as incomplete when no business flow', () => {
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.isStepCompleted('flow')).toBe(false);
    });

    it('should report flow as complete when business flow exists', () => {
      mockStore.businessFlow = { nodes: [] };
      
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.isStepCompleted('flow')).toBe(true);
    });
  });

  describe('navigation functions', () => {
    it('should provide getStepLink function', () => {
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.getStepLink('context')).toBe('/confirm?step=context');
      expect(result.current.getStepLink('model')).toBe('/confirm?step=model');
    });

    it('should not navigate on nextStep when at last step', () => {
      mockStore.currentStep = 'success';
      const { result } = renderHook(() => useConfirmationStep());
      
      act(() => {
        result.current.nextStep();
      });
      
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should not navigate on prevStep when at first step', () => {
      const { result } = renderHook(() => useConfirmationStep());
      
      act(() => {
        result.current.prevStep();
      });
      
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined requirementText', () => {
      mockStore.requirementText = undefined as any;
      
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.isStepCompleted('input')).toBe(false);
    });

    it('should handle undefined arrays', () => {
      mockStore.boundedContexts = undefined as any;
      mockStore.domainModels = undefined as any;
      
      const { result } = renderHook(() => useConfirmationStep());
      
      expect(result.current.isStepCompleted('context')).toBe(false);
      expect(result.current.isStepCompleted('model')).toBe(false);
    });

    it('should handle goToStep with invalid index', () => {
      const { result } = renderHook(() => useConfirmationStep());
      
      act(() => {
        result.current.goToStep(999);
      });
      
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should handle goToStep with negative index', () => {
      const { result } = renderHook(() => useConfirmationStep());
      
      act(() => {
        result.current.goToStep(-1);
      });
      
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });
});
