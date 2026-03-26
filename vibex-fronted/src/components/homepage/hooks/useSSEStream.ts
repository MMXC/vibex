/**
 * useSSEStream - SSE Connection Hook for Homepage AI Streaming
 * 
 * Epic 5: SSE 流式 + AI展示区
 * 
 * Features:
 * - EventSource-based SSE connection (not WebSocket)
 * - Exponential backoff reconnect: 1s → 2s → 4s, max 3 attempts
 * - SSE event parsing
 * - Streaming text accumulation
 * - AI results parsing
 * 
 * Red lines:
 * - R-3: Uses SSE (EventSource) not WebSocket
 * - R-2: Reconnect max 3 times
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ==================== Types ====================

export type SSEStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'failed';

export interface BoundedContext {
  id: string;
  name: string;
  description: string;
  type: string;
  keyResponsibilities?: string[];
}

export interface AIResult {
  type: 'context' | 'model' | 'flow' | 'components';
  content: string;
  mermaidCode: string;
  confidence: number;
  boundedContexts?: BoundedContext[];
}

export interface SSEStreamCallbacks {
  onThinking: (text: string) => void;
  onContext: (result: AIResult) => void;
  onModel: (result: AIResult) => void;
  onFlow: (result: AIResult) => void;
  onComponents: (result: AIResult) => void;
  onDone: (data: { projectId?: string }) => void;
  onError: (message: string) => void;
}

export interface UseSSEStreamReturn {
  streamingText: string;
  sseStatus: SSEStatus;
  reconnectCount: number;
  errorMessage: string | null;
  connect: (requirement: string) => void;
  disconnect: () => void;
}

// ==================== Constants ====================

const RECONNECT_DELAYS = [1000, 2000, 4000];
const MAX_RECONNECT_ATTEMPTS = 3;

const SSE_EVENT_TYPES = [
  'thinking',
  'step_context',
  'step_model',
  'step_flow',
  'step_components',
  'done',
  'error',
] as const;

// ==================== Hook ====================

export function useSSEStream(callbacks: Partial<SSEStreamCallbacks> = {}): UseSSEStreamReturn {
  const [streamingText, setStreamingText] = useState('');
  const [sseStatus, setSSEStatus] = useState<SSEStatus>('idle');
  const [reconnectCount, setReconnectCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const currentRequirementRef = useRef<string | null>(null);
  const isConnectingRef = useRef(false);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    isConnectingRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const parseSSEData = useCallback((dataStr: string): unknown => {
    try {
      return JSON.parse(dataStr);
    } catch {
      return dataStr;
    }
  }, []);

  const createSSEHandlers = useCallback(() => {
    const handlers: Partial<Record<string, (e: MessageEvent) => void>> = {};

    handlers['thinking'] = (e: MessageEvent) => {
      const data = parseSSEData(e.data);
      const text = typeof data === 'string' ? data : (data as { text?: string }).text || '';
      setStreamingText(prev => prev + text);
      callbacks.onThinking?.(text);
    };

    handlers['step_context'] = (e: MessageEvent) => {
      const data = parseSSEData(e.data) as { content?: string; mermaidCode?: string; confidence?: number; boundedContexts?: BoundedContext[] };
      callbacks.onContext?.({
        type: 'context',
        content: data.content || '',
        mermaidCode: data.mermaidCode || '',
        confidence: data.confidence || 0.8,
        boundedContexts: data.boundedContexts,
      });
    };

    handlers['step_model'] = (e: MessageEvent) => {
      const data = parseSSEData(e.data) as { content?: string; mermaidCode?: string; confidence?: number };
      callbacks.onModel?.({
        type: 'model',
        content: data.content || '',
        mermaidCode: data.mermaidCode || '',
        confidence: data.confidence || 0.8,
      });
    };

    handlers['step_flow'] = (e: MessageEvent) => {
      const data = parseSSEData(e.data) as { content?: string; mermaidCode?: string; confidence?: number };
      callbacks.onFlow?.({
        type: 'flow',
        content: data.content || '',
        mermaidCode: data.mermaidCode || '',
        confidence: data.confidence || 0.8,
      });
    };

    handlers['step_components'] = (e: MessageEvent) => {
      const data = parseSSEData(e.data) as { content?: string; mermaidCode?: string; confidence?: number };
      callbacks.onComponents?.({
        type: 'components',
        content: data.content || '',
        mermaidCode: data.mermaidCode || '',
        confidence: data.confidence || 0.8,
      });
    };

    handlers['done'] = (e: MessageEvent) => {
      const data = parseSSEData(e.data) as { projectId?: string };
      setSSEStatus('connected');
      callbacks.onDone?.({ projectId: data.projectId });
    };

    handlers['error'] = (e: MessageEvent) => {
      const data = parseSSEData(e.data) as { message?: string };
      const msg = data.message || 'SSE connection error';
      setErrorMessage(msg);
      callbacks.onError?.(msg);
    };

    return handlers;
  }, [callbacks, parseSSEData]);

  const connect = useCallback((requirement: string) => {
    if (isConnectingRef.current && eventSourceRef.current) {
      return;
    }

    cleanup();
    reconnectAttemptRef.current = 0;
    setReconnectCount(0);
    setStreamingText('');
    setErrorMessage(null);
    currentRequirementRef.current = requirement;

    isConnectingRef.current = true;
    setSSEStatus('connecting');

    const url = `/api/v1/analyze/stream?requirement=${encodeURIComponent(requirement)}`;

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      const handlers = createSSEHandlers();

      for (const eventType of SSE_EVENT_TYPES) {
        if (handlers[eventType]) {
          eventSource.addEventListener(eventType, handlers[eventType] as EventListener);
        }
      }

      eventSource.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.step) {
            const stepEvent = `step_${data.step}`;
            if (stepEvent === 'step_context') callbacks.onContext?.({ type: 'context', content: data.content || '', mermaidCode: data.mermaidCode || '', confidence: data.confidence || 0.8 });
            else if (stepEvent === 'step_model') callbacks.onModel?.({ type: 'model', content: data.content || '', mermaidCode: data.mermaidCode || '', confidence: data.confidence || 0.8 });
            else if (stepEvent === 'step_flow') callbacks.onFlow?.({ type: 'flow', content: data.content || '', mermaidCode: data.mermaidCode || '', confidence: data.confidence || 0.8 });
          }
        } catch {
          // Not JSON, ignore
        }
      };

      eventSource.onopen = () => {
        setSSEStatus('connected');
        reconnectAttemptRef.current = 0;
        setReconnectCount(0);
        isConnectingRef.current = false;
      };

      let errorHandled = false;
      eventSource.onerror = () => {
        if (errorHandled) return;
        errorHandled = true;

        eventSource.close();
        eventSourceRef.current = null;
        isConnectingRef.current = false;

        const attempt = reconnectAttemptRef.current;

        if (attempt < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAYS[attempt] || RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1];
          reconnectAttemptRef.current = attempt + 1;
          setReconnectCount(attempt + 1);
          setSSEStatus('reconnecting');

          reconnectTimerRef.current = setTimeout(() => {
            if (currentRequirementRef.current !== null) {
              connect(currentRequirementRef.current);
            }
          }, delay);
        } else {
          setSSEStatus('failed');
          setErrorMessage('SSE 连接失败，已达到最大重试次数 (3次)');
          callbacks.onError?.('SSE 连接失败，已达到最大重试次数 (3次)');
        }
      };
    } catch (err) {
      isConnectingRef.current = false;
      setSSEStatus('error');
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(msg);
      callbacks.onError?.(msg);
    }
  }, [cleanup, createSSEHandlers, callbacks]);

  const disconnect = useCallback(() => {
    cleanup();
    reconnectAttemptRef.current = 0;
    currentRequirementRef.current = null;
    setSSEStatus('idle');
    setStreamingText('');
    setReconnectCount(0);
    setErrorMessage(null);
  }, [cleanup]);

  return {
    streamingText,
    sseStatus,
    reconnectCount,
    errorMessage,
    connect,
    disconnect,
  };
}

export function getReconnectSchedule(): { delays: number[]; maxAttempts: number } {
  return {
    delays: [...RECONNECT_DELAYS],
    maxAttempts: MAX_RECONNECT_ATTEMPTS,
  };
}

export function canRetry(currentAttempt: number): boolean {
  return currentAttempt < MAX_RECONNECT_ATTEMPTS;
}

export default useSSEStream;
