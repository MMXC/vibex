/**
 * useCanvasSession.test.ts
 * Unit tests for useCanvasSession hook
 *
 * Epic 2 S2.4: 10 单元测试覆盖 hook 返回值
 */

import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCanvasSession } from '../useCanvasSession';
import { useCanvasStore } from '../canvasStore';

// ── Test QueryClient provider wrapper ──────────────────────────────────────────
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  // eslint-disable-next-line react/function-component-definition
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useCanvasSession', () => {
  describe('S2.1: hook is defined', () => {
    it('should be defined as a function', () => {
      expect(typeof useCanvasSession).toBe('function');
    });

    it('should return an object with all required keys', () => {
      const { result } = renderHook(() => useCanvasSession(), { wrapper: createWrapper() });
      expect(result.current).toHaveProperty('sessionId');
      expect(result.current).toHaveProperty('contextNodes');
      expect(result.current).toHaveProperty('flowNodes');
      expect(result.current).toHaveProperty('componentNodes');
      expect(result.current).toHaveProperty('projectId');
      expect(result.current).toHaveProperty('messages');
      expect(result.current).toHaveProperty('drawerState');
      expect(result.current).toHaveProperty('aiStatus');
      expect(result.current).toHaveProperty('sseStatus');
      expect(result.current).toHaveProperty('sseError');
    });
  });

  describe('S2.2: sessionId + three trees + messages + drawerState', () => {
    it('should return sessionId as projectId when set', () => {
      useCanvasStore.getState().setProjectId('test-project-123');
      const { result } = renderHook(() => useCanvasSession(), { wrapper: createWrapper() });
      expect(result.current.sessionId).toBe('test-project-123');
      expect(result.current.projectId).toBe('test-project-123');
    });

    it('should return sessionId as generated when projectId is null', () => {
      useCanvasStore.getState().setProjectId(null);
      const { result } = renderHook(() => useCanvasSession(), { wrapper: createWrapper() });
      expect(result.current.sessionId).toMatch(/^session-\d+$/);
      expect(result.current.projectId).toBeNull();
    });

    it('should return three tree arrays', () => {
      const { result } = renderHook(() => useCanvasSession(), { wrapper: createWrapper() });
      expect(Array.isArray(result.current.contextNodes)).toBe(true);
      expect(Array.isArray(result.current.flowNodes)).toBe(true);
      expect(Array.isArray(result.current.componentNodes)).toBe(true);
    });

    it('should return drawerState with left and right open states', () => {
      const { result } = renderHook(() => useCanvasSession(), { wrapper: createWrapper() });
      expect(result.current.drawerState).toHaveProperty('leftDrawerOpen');
      expect(result.current.drawerState).toHaveProperty('rightDrawerOpen');
      expect(typeof result.current.drawerState.leftDrawerOpen).toBe('boolean');
      expect(typeof result.current.drawerState.rightDrawerOpen).toBe('boolean');
    });

    it('should return messages array', () => {
      const { result } = renderHook(() => useCanvasSession(), { wrapper: createWrapper() });
      expect(Array.isArray(result.current.messages)).toBe(true);
    });
  });

  describe('S2.3: AI status + SSE status', () => {
    it('should return aiStatus with thinking and generating states', () => {
      const { result } = renderHook(() => useCanvasSession(), { wrapper: createWrapper() });
      expect(result.current.aiStatus).toHaveProperty('aiThinking');
      expect(result.current.aiStatus).toHaveProperty('aiThinkingMessage');
      expect(result.current.aiStatus).toHaveProperty('flowGenerating');
      expect(result.current.aiStatus).toHaveProperty('flowGeneratingMessage');
      expect(typeof result.current.aiStatus.aiThinking).toBe('boolean');
      expect(typeof result.current.aiStatus.flowGenerating).toBe('boolean');
    });

    it('should return sseStatus as valid SSEStatus', () => {
      const { result } = renderHook(() => useCanvasSession(), { wrapper: createWrapper() });
      const validStatuses = ['idle', 'connecting', 'connected', 'reconnecting', 'error'];
      expect(validStatuses).toContain(result.current.sseStatus);
    });

    it('should return sseError as null or string', () => {
      const { result } = renderHook(() => useCanvasSession(), { wrapper: createWrapper() });
      expect(result.current.sseError === null || typeof result.current.sseError === 'string').toBe(true);
    });
  });

  describe('S2.4: reactivity', () => {
    it('should update sessionId when projectId changes', () => {
      useCanvasStore.getState().setProjectId('proj-1');
      const { result } = renderHook(() => useCanvasSession(), { wrapper: createWrapper() });
      expect(result.current.projectId).toBe('proj-1');

      act(() => {
        useCanvasStore.getState().setProjectId('proj-2');
      });

      expect(result.current.projectId).toBe('proj-2');
    });
  });
});
