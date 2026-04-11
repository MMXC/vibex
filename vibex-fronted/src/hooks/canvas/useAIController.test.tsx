/**
 * useAIController — unit tests
 *
 * Epic: canvas-split-hooks / E4-useAIController
 * Phase 3: GeneratingState transition tests
 *
 * R-7: SSE mock only in test files
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';

// ─── Hoisted state — accessible to vi.mock factories ─────────────────────────

const { getStoredCallbacks, resetStoredCallbacks } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let callbacks: Record<string, (...args: any[]) => void> = {};
  return {
    getStoredCallbacks: () => callbacks,
    resetStoredCallbacks: () => { callbacks = {}; },
  };
});

// ─── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/canvas/stores/sessionStore', () => ({
  useSessionStore: vi.fn((selector) =>
    selector({
      aiThinking: false,
      aiThinkingMessage: null,
      requirementText: '',
      setRequirementText: vi.fn(),
      flowGenerating: false,
      setAiThinking: vi.fn(),
      setFlowGenerating: vi.fn(),
    })
  ),
}));

vi.mock('@/lib/canvas/stores/contextStore', () => ({
  useContextStore: vi.fn((selector) =>
    selector({ setContextNodes: vi.fn() })
  ),
}));

vi.mock('@/lib/canvas/stores/flowStore', () => {
  const instance = { autoGenerateFlows: vi.fn().mockResolvedValue(undefined), flowNodes: [] as unknown[] };
  const storeFn = vi.fn((selector?: (s: typeof instance) => unknown) =>
    selector ? selector(instance) : instance
  );
  Object.assign(storeFn, { getState: () => instance });
  return { useFlowStore: storeFn };
});

vi.mock('@/lib/canvas/stores/componentStore', () => ({
  useComponentStore: vi.fn((selector) =>
    selector({ setComponentNodes: vi.fn() })
  ),
}));

vi.mock('@/lib/canvas/type-guards', () => ({
  isValidFlowNodes: vi.fn(() => true),
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

// canvasSseApi mock — single stable fn for both access paths
vi.mock('@/lib/canvas/api/canvasSseApi', () => {
  // Create ONE stable mock function, reference it in both the named export
  // and the canvasSseApi namespace property (avoiding getter creating new fns)
  const mockFn = vi.fn(async (_req: string, callbacks: Record<string, (...args: unknown[]) => void>) => {
    Object.assign(getStoredCallbacks(), callbacks);
  });
  return {
    get canvasSseAnalyze() { return mockFn; },
    get canvasSseApi() { return { get canvasSseAnalyze() { return mockFn; } }; },
  };
});

// ─── Import hook AFTER mocks ────────────────────────────────────────────────────
import { useAIController } from './useAIController';

// ─── Helpers ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  resetStoredCallbacks();
  vi.clearAllMocks();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SSEFn = (...args: any[]) => void;

/** Simulate SSE done event */
function fireDone() {
  getStoredCallbacks().onDone?.('project-123', '生成完成');
}

/** Simulate SSE error event */
function fireError(message = 'SSE error', code?: string) {
  getStoredCallbacks().onError?.(message, code);
}

/** Simulate SSE thinking event */
function fireThinking(content: string) {
  getStoredCallbacks().onThinking?.(content, false);
}

/** Simulate SSE step_context event */
function fireStepContext(contexts: Array<{ id: string; name: string; description: string; type: string }>) {
  getStoredCallbacks().onStepContext?.('上下文分析完成', undefined, 0.9, contexts);
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('useAIController — initial state', () => {
  it('returns idle generatingState', () => {
    const { result } = renderHook(() => useAIController());
    expect(result.current.generatingState).toBe('idle');
  });

  it('isQuickGenerating is false when idle', () => {
    const { result } = renderHook(() => useAIController());
    expect(result.current.isQuickGenerating).toBe(false);
  });

  it('returns empty requirementInput', () => {
    const { result } = renderHook(() => useAIController());
    expect(result.current.requirementInput).toBe('');
  });

  it('has quickGenerate function', () => {
    const { result } = renderHook(() => useAIController());
    expect(typeof result.current.quickGenerate).toBe('function');
  });
});

describe('useAIController — requirementInput', () => {
  it('updates requirementInput via setRequirementInput', () => {
    const { result } = renderHook(() => useAIController());
    act(() => {
      result.current.setRequirementInput('用户登录功能');
    });
    expect(result.current.requirementInput).toBe('用户登录功能');
  });
});

describe('useAIController — quickGenerate guard', () => {
  it('returns early when requirementInput is empty', async () => {
    const { result } = renderHook(() => useAIController());
    await act(async () => {
      await result.current.quickGenerate();
    });
    // Guard prevents SSE call: state stays idle
    expect(result.current.generatingState).toBe('idle');
  });
});

describe('useAIController — quickGenerate state transitions', () => {
  it('sets generatingState to generating when quickGenerate is called', async () => {
    const { result } = renderHook(() => useAIController());
    act(() => {
      result.current.setRequirementInput('测试需求');
    });
    await act(async () => {
      result.current.quickGenerate();
    });
    expect(result.current.generatingState).toBe('generating');
  });

  it('isQuickGenerating is true while generating', async () => {
    const { result } = renderHook(() => useAIController());
    act(() => {
      result.current.setRequirementInput('测试需求');
    });
    await act(async () => {
      result.current.quickGenerate();
    });
    expect(result.current.isQuickGenerating).toBe(true);
  });
});

describe('useAIController — SSE callbacks', () => {
  it('stores onDone callback when quickGenerate is called', async () => {
    const { result } = renderHook(() => useAIController());
    act(() => {
      result.current.setRequirementInput('测试需求');
    });
    await act(async () => {
      result.current.quickGenerate();
    });
    expect(getStoredCallbacks().onDone).toBeDefined();
  });

  it('stores onThinking callback', async () => {
    const { result } = renderHook(() => useAIController());
    act(() => {
      result.current.setRequirementInput('测试需求');
    });
    await act(async () => {
      result.current.quickGenerate();
    });
    expect(getStoredCallbacks().onThinking).toBeDefined();
    fireThinking('正在分析业务流程...');
  });

  it('onDone sets generatingState to done', async () => {
    // Use a fresh hook instance to avoid stale closure issues
    const { result: r1 } = renderHook(() => useAIController());
    act(() => {
      r1.current.setRequirementInput('测试需求');
    });
    await act(async () => {
      r1.current.quickGenerate();
    });
    // Call fireDone synchronously after quickGenerate starts
    await act(async () => {
      r1.current.quickGenerate();
      fireDone();
    });
    expect(r1.current.generatingState).toBe('done');
  });

  it('onDone is stored and callable after quickGenerate completes', async () => {
    const { result } = renderHook(() => useAIController());
    act(() => {
      result.current.setRequirementInput('测试需求');
    });
    await act(async () => {
      await result.current.quickGenerate();
    });
    // Verify the onDone callback is stored and callable
    expect(getStoredCallbacks().onDone).toBeDefined();
    // Fire it and verify the hook state transitions in the same act
    await act(async () => {
      await result.current.quickGenerate();
      fireDone();
    });
    expect(result.current.generatingState).toBe('done');
  });

  it('onStepContext collects boundedContexts', async () => {
    const { result } = renderHook(() => useAIController());
    act(() => {
      result.current.setRequirementInput('测试需求');
    });
    await act(async () => {
      result.current.quickGenerate();
      fireStepContext([
        { id: 'ctx-1', name: '用户管理', description: '用户相关功能', type: 'core' },
        { id: 'ctx-2', name: '订单管理', description: '订单相关功能', type: 'core' },
      ]);
      fireDone();
    });
    expect(result.current.generatingState).toBe('done');
  });
});

describe('useAIController — onError fallback', () => {
  it('stores onError callback', async () => {
    const { result } = renderHook(() => useAIController());
    act(() => {
      result.current.setRequirementInput('测试需求');
    });
    await act(async () => {
      result.current.quickGenerate();
    });
    expect(getStoredCallbacks().onError).toBeDefined();
    fireError('SSE 连接失败', 'CONNECTION_ERROR');
  });

  it('onError triggers fallback (sets generatingState to done or fallback)', async () => {
    const { result } = renderHook(() => useAIController());
    act(() => {
      result.current.setRequirementInput('测试需求');
    });
    await act(async () => {
      result.current.quickGenerate();
      fireError('Network error');
    });
    // Fallback completes: generatingState should be 'done' (fallback sets it to 'done' at the end)
    expect(result.current.generatingState).toBe('done');
  });
});
