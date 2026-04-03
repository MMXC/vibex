/**
 * Onboarding Store Tests
 */
// @ts-nocheck


import { renderHook, act } from '@testing-library/react';
import { useOnboardingStore } from './onboardingStore';
import { OnboardingStep, STEP_ORDER } from './types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useOnboardingStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useOnboardingStore());
    act(() => {
      result.current.reset();
    });
    localStorageMock.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useOnboardingStore());

      expect(result.current.status).toBe('not-started');
      expect(result.current.currentStep).toBe('welcome');
      expect(result.current.completedSteps).toEqual([]);
      expect(result.current.startedAt).toBeUndefined();
      expect(result.current.completedAt).toBeUndefined();
    });
  });

  describe('start', () => {
    it('should set status to in-progress', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.start();
      });

      expect(result.current.status).toBe('in-progress');
      expect(result.current.currentStep).toBe('welcome');
      expect(result.current.startedAt).toBeDefined();
    });
  });

  describe('nextStep', () => {
    it('should move to next step', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe('input');
      expect(result.current.completedSteps).toContain('welcome');
    });

    it('should complete when on last step', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.start();
      });

      // Navigate through all steps
      for (let i = 0; i < STEP_ORDER.length - 1; i++) {
        act(() => {
          result.current.nextStep();
        });
      }

      // On prototype step
      expect(result.current.currentStep).toBe('prototype');

      // Complete the last step
      act(() => {
        result.current.nextStep();
      });

      expect(result.current.status).toBe('completed');
      expect(result.current.completedAt).toBeDefined();
    });
  });

  describe('prevStep', () => {
    it('should move to previous step', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.start();
        result.current.nextStep(); // Now on 'input'
      });

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe('welcome');
    });

    it('should not go before welcome', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe('welcome');
    });
  });

  describe('goToStep', () => {
    it('should jump to specific step', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.goToStep('model' as OnboardingStep);
      });

      expect(result.current.currentStep).toBe('model');
    });
  });

  describe('completeStep', () => {
    it('should mark step as completed', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.completeStep('input' as OnboardingStep);
      });

      expect(result.current.completedSteps).toContain('input');
    });

    it('should not duplicate completed steps', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.completeStep('welcome' as OnboardingStep);
        result.current.completeStep('welcome' as OnboardingStep);
      });

      expect(result.current.completedSteps.filter(s => s === 'welcome').length).toBe(1);
    });
  });

  describe('skip', () => {
    it('should skip the onboarding', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.start();
        result.current.skip();
      });

      expect(result.current.status).toBe('skipped');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.start();
        result.current.nextStep();
        result.current.nextStep();
        result.current.reset();
      });

      expect(result.current.status).toBe('not-started');
      expect(result.current.currentStep).toBe('welcome');
      expect(result.current.completedSteps).toEqual([]);
    });
  });
});
