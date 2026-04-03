/**
 * useHomePageState Hook Tests
 */
// @ts-nocheck


import { renderHook, act } from '@testing-library/react';
import { useHomePageState } from '../useHomePageState';

describe('useHomePageState', () => {
  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useHomePageState());

      expect(result.current.sidebarCollapsed).toBe(false);
      expect(result.current.aiPanelOpen).toBe(false);
      expect(result.current.currentStep).toBe(0);
      expect(result.current.previewContent).toBe('');
      expect(result.current.inputValue).toBe('');
      expect(result.current.aiMessages).toEqual([]);
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar collapsed state', () => {
      const { result } = renderHook(() => useHomePageState());

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(false);
    });
  });

  describe('toggleAIPanel', () => {
    it('should toggle AI panel open state', () => {
      const { result } = renderHook(() => useHomePageState());

      act(() => {
        result.current.toggleAIPanel();
      });

      expect(result.current.aiPanelOpen).toBe(true);

      act(() => {
        result.current.toggleAIPanel();
      });

      expect(result.current.aiPanelOpen).toBe(false);
    });
  });

  describe('setCurrentStep', () => {
    it('should set current step', () => {
      const { result } = renderHook(() => useHomePageState());

      act(() => {
        result.current.setCurrentStep(3);
      });

      expect(result.current.currentStep).toBe(3);

      act(() => {
        result.current.setCurrentStep(5);
      });

      expect(result.current.currentStep).toBe(5);
    });
  });

  describe('setPreviewContent', () => {
    it('should set preview content', () => {
      const { result } = renderHook(() => useHomePageState());

      act(() => {
        result.current.setPreviewContent('test preview content');
      });

      expect(result.current.previewContent).toBe('test preview content');
    });
  });

  describe('setInputValue', () => {
    it('should set input value', () => {
      const { result } = renderHook(() => useHomePageState());

      act(() => {
        result.current.setInputValue('test input');
      });

      expect(result.current.inputValue).toBe('test input');
    });
  });
});