/**
 * useAIController — unit tests
 *
 * Epic: canvas-split-hooks / E4-useAIController
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAIController } from './useAIController';

// Mock all required dependencies
vi.mock('@/lib/canvas/stores/sessionStore', () => ({
  useSessionStore: vi.fn((selector) =>
    selector({
      aiThinking: false,
      aiThinkingMessage: null,
      requirementText: '',
      setRequirementText: vi.fn(),
      flowGenerating: false,
    })
  ),
}));

vi.mock('@/lib/canvas/stores/contextStore', () => ({
  useContextStore: vi.fn((selector) =>
    selector({
      setContextNodes: vi.fn(),
    })
  ),
}));

vi.mock('@/lib/canvas/stores/flowStore', () => ({
  useFlowStore: vi.fn((selector) =>
    selector({
      autoGenerateFlows: vi.fn(),
    })
  ),
}));

vi.mock('@/lib/canvas/stores/componentStore', () => ({
  useComponentStore: vi.fn((selector) =>
    selector({
      setComponentNodes: vi.fn(),
    })
  ),
}));

vi.mock('@/lib/canvas/type-guards', () => ({
  isValidFlowNodes: vi.fn(() => true),
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
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
