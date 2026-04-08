/**
 * lib/api/sseToQueryBridge.ts — SSE → TanStack Query 缓存桥接
 *
 * E1-S4: SSE 数据写入 Query 缓存
 *
 * 职责：
 * - SSE 事件到达时，通过 queryClient.setQueryData() 写入缓存
 * - SSE 完成/错误时，通过 queryClient.invalidateQueries() 刷新缓存
 * - 防止 SSE 数据绕过 Query 缓存层
 *
 * 使用方式：
 *   import { createSseBridge } from '@/lib/api/sseToQueryBridge';
 *   const bridge = createSseBridge(queryClient);
 *
 *   await canvasSseAnalyze(requirement, {
 *     ...bridge.stepContextHandlers(),
 *     ...bridge.doneHandlers(),
 *     ...bridge.errorHandlers(),
 *   });
 */
import { QueryClient } from '@tanstack/react-query';
import type {
  StepContextEvent,
  StepModelEvent,
  StepFlowEvent,
  StepComponentsEvent,
  DoneEvent,
  ErrorEvent,
} from '@/lib/canvas/api/canvasSseApi';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

export interface SseToQueryBridge {
  /** Canvas SSE 上下文步骤 → setQueryData */
  stepContextHandlers: () => {
    onStepContext: (
      content: string,
      mermaidCode?: string,
      confidence?: number,
      boundedContexts?: { id: string; name: string; description: string; type: string }[]
    ) => void;
  };
  /** Canvas SSE 完成 → invalidateQueries */
  doneHandlers: () => {
    onDone: (projectId: string, summary: string) => void;
  };
  /** Canvas SSE 错误 → invalidateQueries */
  errorHandlers: () => {
    onError: (message: string, code?: string) => void;
  };
}

/**
 * 创建 SSE → Query 缓存桥接器
 *
 * 每次 SSE 步骤完成时写入缓存，避免 SSE 数据绕过 Query 层
 */
export function createSseBridge(qc: QueryClient): SseToQueryBridge {
  return {
    stepContextHandlers: () => ({
      onStepContext: (
        content: string,
        mermaidCode?: string,
        confidence?: number,
        boundedContexts?: { id: string; name: string; description: string; type: string }[]
      ) => {
        // SSE 数据写入 Query 缓存
        qc.setQueryData<StepContextEvent>(['canvas', 'step', 'context'], {
          type: 'step_context',
          content,
          mermaidCode,
          confidence: confidence ?? 0,
          boundedContexts: boundedContexts ?? [],
        });

        canvasLogger.default.debug('[sseToQueryBridge] step_context cached', {
          confidence,
          contexts: boundedContexts?.length,
        });
      },
    }),

    doneHandlers: () => ({
      onDone: (projectId: string, summary: string) => {
        // SSE 完成 → 刷新所有 canvas 相关缓存
        qc.invalidateQueries({ queryKey: ['canvas'] });
        qc.invalidateQueries({ queryKey: ['projects'] });

        canvasLogger.default.info('[sseToQueryBridge] SSE done, cache invalidated', {
          projectId,
        });
      },
    }),

    errorHandlers: () => ({
      onError: (message: string, code?: string) => {
        // SSE 错误 → 标记缓存过期但不删除（保留离线访问）
        qc.cancelQueries({ queryKey: ['canvas'] });

        canvasLogger.default.error('[sseToQueryBridge] SSE error', { message, code });
      },
    }),
  };
}
