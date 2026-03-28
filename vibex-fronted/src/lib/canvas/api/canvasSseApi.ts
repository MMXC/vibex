/**
 * canvasSseApi.ts — Canvas SSE AI Client
 *
 * 调用后端 SSE 流式 API，通过 api-config.ts 获取端点 `/api/v1/canvas/stream`
 * 实时接收 thinking / step_context / done / error 事件
 *
 * Canvas API 标准化 Epic 2 (vibex-canvas-api-standardization)
 */
'use client';

import { getApiUrl, API_CONFIG } from '@/lib/api-config';

// =============================================================================
// Types
// =============================================================================

export interface ThinkingEvent {
  type: 'thinking';
  content: string;
  delta: boolean;
}

export interface BoundedContext {
  id: string;
  name: string;
  description: string;
  type: string;
  keyResponsibilities?: string[];
}

export interface StepContextEvent {
  type: 'step_context';
  content: string;
  mermaidCode?: string;
  confidence: number;
  boundedContexts: BoundedContext[];
}

export interface StepModelEvent {
  type: 'step_model';
  content: string;
  mermaidCode?: string;
  confidence: number;
}

export interface StepFlowEvent {
  type: 'step_flow';
  content: string;
  mermaidCode?: string;
  confidence: number;
}

export interface StepComponentsEvent {
  type: 'step_components';
  content: string;
  mermaidCode?: string;
  confidence: number;
}

export interface DoneEvent {
  type: 'done';
  projectId: string;
  summary: string;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
  code?: string;
}

export type SSEEvent =
  | ThinkingEvent
  | StepContextEvent
  | StepModelEvent
  | StepFlowEvent
  | StepComponentsEvent
  | DoneEvent
  | ErrorEvent;

export interface CanvasSseCallbacks {
  onThinking?: (content: string, delta: boolean) => void;
  onStepContext?: (content: string, mermaidCode?: string, confidence?: number, boundedContexts?: BoundedContext[]) => void;
  onStepModel?: (content: string, mermaidCode?: string, confidence?: number) => void;
  onStepFlow?: (content: string, mermaidCode?: string, confidence?: number) => void;
  onStepComponents?: (content: string, mermaidCode?: string, confidence?: number) => void;
  onDone?: (projectId: string, summary: string) => void;
  onError?: (message: string, code?: string) => void;
}

export interface CanvasSseOptions extends CanvasSseCallbacks {
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
  /** Timeout in ms (default: 30000) */
  timeoutMs?: number;
}

// =============================================================================
// SSE Client
// =============================================================================

/**
 * 调用 Canvas SSE 流式端点，实时处理 AI 分析事件
 * GET /api/v1/canvas/stream?requirement=xxx
 */
export async function canvasSseAnalyze(
  requirementText: string,
  options: CanvasSseOptions = {}
): Promise<void> {
  const { signal, timeoutMs = 30000, ...callbacks } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // Merge external signal with internal timeout
  const mergedSignal = signal
    ? (() => {
        const externalHandler = () => controller.abort();
        signal.addEventListener('abort', externalHandler);
        return controller.signal;
      })()
    : controller.signal;

  try {
    const url = getApiUrl(`${API_CONFIG.endpoints.canvas.stream}?requirement=${encodeURIComponent(requirementText)}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: mergedSignal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${res.statusText} — ${errorText}`);
    }

    if (!res.body) {
      throw new Error('Response body is null — SSE not supported');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let pendingEventType: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('event: ')) {
          // Remember the event type for the next data line
          pendingEventType = trimmed.slice(7).trim();
        } else if (trimmed.startsWith('data: ') && pendingEventType !== null) {
          // We have both event type and data — dispatch
          try {
            const rawData = trimmed.slice(6).trim();
            const data = JSON.parse(rawData);
            dispatchEvent(pendingEventType as SSEEvent['type'], data, callbacks);
          } catch {
            // Ignore parse errors for individual events
          } finally {
            pendingEventType = null;
          }
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}

// =============================================================================
// Event Dispatch
// =============================================================================

function dispatchEvent(
  type: SSEEvent['type'],
  data: Record<string, unknown>,
  callbacks: CanvasSseCallbacks
): void {
  switch (type) {
    case 'thinking':
      callbacks.onThinking?.(
        String(data.content ?? ''),
        Boolean(data.delta ?? false)
      );
      break;

    case 'step_context':
      callbacks.onStepContext?.(
        String(data.content ?? ''),
        data.mermaidCode ? String(data.mermaidCode) : undefined,
        data.confidence ? Number(data.confidence) : undefined,
        Array.isArray(data.boundedContexts) ? data.boundedContexts as BoundedContext[] : undefined
      );
      break;

    case 'step_model':
      callbacks.onStepModel?.(
        String(data.content ?? ''),
        data.mermaidCode ? String(data.mermaidCode) : undefined,
        data.confidence ? Number(data.confidence) : undefined
      );
      break;

    case 'step_flow':
      callbacks.onStepFlow?.(
        String(data.content ?? ''),
        data.mermaidCode ? String(data.mermaidCode) : undefined,
        data.confidence ? Number(data.confidence) : undefined
      );
      break;

    case 'step_components':
      callbacks.onStepComponents?.(
        String(data.content ?? ''),
        data.mermaidCode ? String(data.mermaidCode) : undefined,
        data.confidence ? Number(data.confidence) : undefined
      );
      break;

    case 'done':
      callbacks.onDone?.(
        String(data.projectId ?? ''),
        String(data.summary ?? '')
      );
      break;

    case 'error':
      callbacks.onError?.(
        String(data.message ?? 'Unknown error'),
        data.code ? String(data.code) : undefined
      );
      break;
  }
}
