/**
 * useConfirmationState Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useConfirmationState } from '../useConfirmationState';
import { useConfirmationStore } from '@/stores/confirmationStore';

// Mock the store
const mockStore = {
  requirementText: '',
  boundedContexts: [],
  domainModels: [],
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

describe('useConfirmationState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to default values
    mockStore.requirementText = '';
    mockStore.boundedContexts = [];
    mockStore.domainModels = [];
    mockStore.businessFlow = null;
  });

  describe('context step validation', () => {
    it('should return invalid when no requirement text', () => {
      const { result } = renderHook(() => useConfirmationState('context'));

      expect(result.current.isValid).toBe(false);
      expect(result.current.message).toBe('请先输入需求描述');
      expect(result.current.checks.hasRequirementText).toBe(false);
    });

    it('should return valid when requirement text exists', () => {
      mockStore.requirementText = 'Test requirement';

      const { result } = renderHook(() => useConfirmationState('context'));

      expect(result.current.isValid).toBe(true);
      expect(result.current.message).toBe('');
      expect(result.current.checks.hasRequirementText).toBe(true);
    });

    it('should redirect to /confirm when invalid', () => {
      const { result } = renderHook(() => useConfirmationState('context'));

      expect(result.current.redirectTo).toBe('/confirm');
    });
  });

  describe('model step validation', () => {
    it('should return invalid when no bounded contexts', () => {
      const { result } = renderHook(() => useConfirmationState('model'));

      expect(result.current.isValid).toBe(false);
      expect(result.current.message).toBe('请先完成限界上下文确认');
      expect(result.current.checks.hasBoundedContexts).toBe(false);
    });

    it('should return valid when bounded contexts exist', () => {
      mockStore.boundedContexts = [{ id: '1', name: 'Context 1' }];

      const { result } = renderHook(() => useConfirmationState('model'));

      expect(result.current.isValid).toBe(true);
      expect(result.current.message).toBe('');
      expect(result.current.checks.hasBoundedContexts).toBe(true);
    });

    it('should redirect to context step when invalid', () => {
      const { result } = renderHook(() => useConfirmationState('model'));

      expect(result.current.redirectTo).toBe('/confirm?step=context');
    });
  });

  describe('flow step validation', () => {
    it('should return invalid when no domain models', () => {
      const { result } = renderHook(() => useConfirmationState('flow'));

      expect(result.current.isValid).toBe(false);
      expect(result.current.message).toBe('请先完成领域模型确认');
      expect(result.current.checks.hasDomainModels).toBe(false);
    });

    it('should return valid when domain models exist', () => {
      mockStore.domainModels = [{ id: '1', name: 'Model 1' }];

      const { result } = renderHook(() => useConfirmationState('flow'));

      expect(result.current.isValid).toBe(true);
      expect(result.current.message).toBe('');
      expect(result.current.checks.hasDomainModels).toBe(true);
    });

    it('should redirect to model step when invalid', () => {
      const { result } = renderHook(() => useConfirmationState('flow'));

      expect(result.current.redirectTo).toBe('/confirm?step=model');
    });
  });

  describe('checks object', () => {
    it('should track all check conditions', () => {
      mockStore.requirementText = 'Test';
      mockStore.boundedContexts = [{ id: '1' }];
      mockStore.domainModels = [{ id: '1' }];
      mockStore.businessFlow = { nodes: [] };

      const { result } = renderHook(() => useConfirmationState('context'));

      expect(result.current.checks.hasRequirementText).toBe(true);
      expect(result.current.checks.hasBoundedContexts).toBe(true);
      expect(result.current.checks.hasDomainModels).toBe(true);
      expect(result.current.checks.hasBusinessFlow).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace-only requirement text as invalid', () => {
      mockStore.requirementText = '   ';

      const { result } = renderHook(() => useConfirmationState('context'));

      expect(result.current.isValid).toBe(false);
    });

    it('should handle empty arrays correctly', () => {
      mockStore.boundedContexts = [];
      mockStore.domainModels = [];

      const { result } = renderHook(() => useConfirmationState('model'));

      expect(result.current.checks.hasBoundedContexts).toBe(false);
    });

    it('should handle null/undefined values', () => {
      mockStore.requirementText = undefined as any;
      mockStore.boundedContexts = undefined as any;
      mockStore.domainModels = undefined as any;
      mockStore.businessFlow = undefined as any;

      const { result } = renderHook(() => useConfirmationState('context'));

      expect(result.current.checks.hasRequirementText).toBe(false);
    });
  });
});
