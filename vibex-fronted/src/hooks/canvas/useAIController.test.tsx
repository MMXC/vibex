/**
 * useAIController — unit tests
 *
 * Epic: canvas-split-hooks / E4-useAIController
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAIController } from './useAIController';

// Mock all required dependencies
jest.mock('@/lib/canvas/stores/sessionStore', () => ({
  useSessionStore: jest.fn((selector) =>
    selector({
      aiThinking: false,
      aiThinkingMessage: null,
      requirementText: '',
      setRequirementText: jest.fn(),
      flowGenerating: false,
    })
  ),
}));

jest.mock('@/lib/canvas/stores/contextStore', () => ({
  useContextStore: jest.fn((selector) =>
    selector({
      setContextNodes: jest.fn(),
    })
  ),
}));

jest.mock('@/lib/canvas/stores/flowStore', () => ({
  useFlowStore: jest.fn((selector) =>
    selector({
      autoGenerateFlows: jest.fn(),
    })
  ),
}));

jest.mock('@/lib/canvas/stores/componentStore', () => ({
  useComponentStore: jest.fn((selector) =>
    selector({
      setComponentNodes: jest.fn(),
    })
  ),
}));

jest.mock('@/lib/canvas/type-guards', () => ({
  isValidFlowNodes: jest.fn(() => true),
}));

jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

describe('useAIController', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useAIController());
    expect(result.current.requirementInput).toBe('');
    expect(result.current.isQuickGenerating).toBe(false);
  });

  it('updates requirementInput', () => {
    const { result } = renderHook(() => useAIController());
    act(() => {
      result.current.setRequirementInput('用户登录功能');
    });
    expect(result.current.requirementInput).toBe('用户登录功能');
  });

  it('has quickGenerate function', () => {
    const { result } = renderHook(() => useAIController());
    expect(typeof result.current.quickGenerate).toBe('function');
  });
});
