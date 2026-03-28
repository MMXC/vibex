/**
 * dddApi.ts — DDD AI SSE Client (Legacy)
 *
 * DEPRECATED: This module is kept for backward compatibility.
 * Use canvasSseApi.ts instead (Canvas API 标准化 Epic 2).
 *
 * All new code should import from ./canvasSseApi.ts
 *
 * @deprecated Use canvasSseApi.ts
 */
'use client';

export {
  canvasSseAnalyze as analyzeRequirement,
} from './canvasSseApi';

// Re-export all types from canvasSseApi for backward compatibility
export type {
  ThinkingEvent,
  StepContextEvent,
  StepModelEvent,
  StepFlowEvent,
  StepComponentsEvent,
  DoneEvent,
  ErrorEvent,
  SSEEvent,
  BoundedContext,
  CanvasSseCallbacks as DDDApiCallbacks,
  CanvasSseOptions as DDDApiOptions,
} from './canvasSseApi';
