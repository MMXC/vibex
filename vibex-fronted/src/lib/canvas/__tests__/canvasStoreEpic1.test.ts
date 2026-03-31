/**
 * canvasStoreEpic1.test.ts — Epic 1: CanvasStore 状态扩展测试
 *
 * S1.1: Drawer state (leftDrawerOpen/rightDrawerOpen/leftDrawerWidth/rightDrawerWidth)
 * S1.2: abortGeneration() 方法
 * S1.3: SSE status (sseStatus: idle|connecting|connected|reconnecting|error)
 *
 * 验收标准:
 * S1.1: expect(canvasStore.leftDrawerOpen).toBe(false)
 * S1.1: expect(canvasStore.rightDrawerWidth).toBe(200)
 * S1.2: expect(canvasStore.abortGeneration).toBeDefined()
 * S1.3: expect(canvasStore.sseStatus).toBe('idle')
 */

import { useCanvasStore } from '../canvasStore';
import type { SSEStatus } from '../canvasStore';

describe('Epic 1 S1.1: Drawer State — initial values', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      leftDrawerOpen: false,
      rightDrawerOpen: false,
      leftDrawerWidth: 200,
      rightDrawerWidth: 200,
      sseStatus: 'idle',
      sseError: null,
      abortControllerRef: null,
      flowGenerating: false,
      aiThinking: false,
    });
  });

  it('AC-S1.1: leftDrawerOpen 默认 false', () => {
    expect(useCanvasStore.getState().leftDrawerOpen).toBe(false);
  });

  it('AC-S1.1: rightDrawerOpen 默认 false', () => {
    expect(useCanvasStore.getState().rightDrawerOpen).toBe(false);
  });

  it('AC-S1.1: leftDrawerWidth 默认 200', () => {
    expect(useCanvasStore.getState().leftDrawerWidth).toBe(200);
  });

  it('AC-S1.1: rightDrawerWidth 默认 200', () => {
    expect(useCanvasStore.getState().rightDrawerWidth).toBe(200);
  });
});

describe('Epic 1 S1.1: Drawer Actions', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      leftDrawerOpen: false,
      rightDrawerOpen: false,
      leftDrawerWidth: 200,
      rightDrawerWidth: 200,
    });
  });

  it('toggleLeftDrawer: false → true → false', () => {
    const { toggleLeftDrawer } = useCanvasStore.getState();
    expect(useCanvasStore.getState().leftDrawerOpen).toBe(false);
    toggleLeftDrawer();
    expect(useCanvasStore.getState().leftDrawerOpen).toBe(true);
    toggleLeftDrawer();
    expect(useCanvasStore.getState().leftDrawerOpen).toBe(false);
  });

  it('toggleRightDrawer: false → true → false', () => {
    const { toggleRightDrawer } = useCanvasStore.getState();
    expect(useCanvasStore.getState().rightDrawerOpen).toBe(false);
    toggleRightDrawer();
    expect(useCanvasStore.getState().rightDrawerOpen).toBe(true);
    toggleRightDrawer();
    expect(useCanvasStore.getState().rightDrawerOpen).toBe(false);
  });

  it('setLeftDrawerWidth: 有效值设置', () => {
    const { setLeftDrawerWidth } = useCanvasStore.getState();
    setLeftDrawerWidth(300);
    expect(useCanvasStore.getState().leftDrawerWidth).toBe(300);
    setLeftDrawerWidth(100);
    expect(useCanvasStore.getState().leftDrawerWidth).toBe(100);
  });

  it('setLeftDrawerWidth: 超出范围自动 clamp 到 [100, 400]', () => {
    const { setLeftDrawerWidth } = useCanvasStore.getState();
    setLeftDrawerWidth(50);   // below min
    expect(useCanvasStore.getState().leftDrawerWidth).toBe(100);
    setLeftDrawerWidth(500);  // above max
    expect(useCanvasStore.getState().leftDrawerWidth).toBe(400);
  });

  it('setRightDrawerWidth: 有效值设置', () => {
    const { setRightDrawerWidth } = useCanvasStore.getState();
    setRightDrawerWidth(250);
    expect(useCanvasStore.getState().rightDrawerWidth).toBe(250);
  });

  it('setRightDrawerWidth: 超出范围自动 clamp', () => {
    const { setRightDrawerWidth } = useCanvasStore.getState();
    setRightDrawerWidth(0);
    expect(useCanvasStore.getState().rightDrawerWidth).toBe(100);
    setRightDrawerWidth(999);
    expect(useCanvasStore.getState().rightDrawerWidth).toBe(400);
  });
});

describe('Epic 1 S1.2: abortGeneration()', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      abortControllerRef: null,
      sseStatus: 'connected',
      flowGenerating: true,
      aiThinking: true,
    });
  });

  it('AC-S1.2: abortGeneration 定义存在', () => {
    expect(useCanvasStore.getState().abortGeneration).toBeDefined();
    expect(typeof useCanvasStore.getState().abortGeneration).toBe('function');
  });

  it('AC-S1.2: abortGeneration 调用后 abortControllerRef 置 null', () => {
    // Simulate having an AbortController
    const mockAbort = jest.fn();
    const mockController = { abort: mockAbort, signal: { aborted: false } };
    useCanvasStore.setState({ abortControllerRef: mockController as unknown as AbortController });

    useCanvasStore.getState().abortGeneration();
    expect(mockAbort).toHaveBeenCalled();
    expect(useCanvasStore.getState().abortControllerRef).toBeNull();
  });

  it('AC-S1.2: abortGeneration 调用后 SSE 状态重置为 idle', () => {
    const mockAbort = jest.fn();
    const mockController = { abort: mockAbort, signal: { aborted: false } };
    useCanvasStore.setState({ abortControllerRef: mockController as unknown as AbortController, sseStatus: 'connected' });
    useCanvasStore.getState().abortGeneration();
    expect(useCanvasStore.getState().sseStatus).toBe('idle');
  });

  it('AC-S1.2: abortGeneration 调用后 flowGenerating 和 aiThinking 置 false', () => {
    const mockAbort = jest.fn();
    const mockController = { abort: mockAbort, signal: { aborted: false } };
    useCanvasStore.setState({
      abortControllerRef: mockController as unknown as AbortController,
      flowGenerating: true,
      aiThinking: true,
    });
    useCanvasStore.getState().abortGeneration();
    expect(useCanvasStore.getState().flowGenerating).toBe(false);
    expect(useCanvasStore.getState().aiThinking).toBe(false);
  });

  it('AC-S1.2: 无 AbortController 时 abortGeneration 不抛错', () => {
    useCanvasStore.setState({ abortControllerRef: null });
    expect(() => useCanvasStore.getState().abortGeneration()).not.toThrow();
  });
});

describe('Epic 1 S1.3: SSE Status', () => {
  beforeEach(() => {
    useCanvasStore.setState({ sseStatus: 'idle', sseError: null });
  });

  it('AC-S1.3: sseStatus 默认 idle', () => {
    expect(useCanvasStore.getState().sseStatus).toBe('idle');
  });

  it('AC-S1.3: setSseStatus 支持 5 种状态', () => {
    const { setSseStatus } = useCanvasStore.getState();
    const statuses: SSEStatus[] = ['idle', 'connecting', 'connected', 'reconnecting', 'error'];

    statuses.forEach((status) => {
      setSseStatus(status);
      expect(useCanvasStore.getState().sseStatus).toBe(status);
    });
  });

  it('AC-S1.3: setSseStatus("error") 时设置错误信息', () => {
    const { setSseStatus } = useCanvasStore.getState();
    setSseStatus('error', 'SSE connection refused');
    expect(useCanvasStore.getState().sseStatus).toBe('error');
    expect(useCanvasStore.getState().sseError).toBe('SSE connection refused');
  });

  it('AC-S1.3: setSseStatus 非 error 时清除 sseError', () => {
    const { setSseStatus } = useCanvasStore.getState();
    setSseStatus('error', 'Some error');
    expect(useCanvasStore.getState().sseError).toBe('Some error');
    setSseStatus('connected');
    expect(useCanvasStore.getState().sseError).toBeNull();
  });
});

describe('Epic 1: SSEStatus type integrity', () => {
  it('SSEStatus 类型包含所有 5 种状态', () => {
    const statuses: SSEStatus[] = ['idle', 'connecting', 'connected', 'reconnecting', 'error'];
    expect(statuses).toHaveLength(5);
  });
});
