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

/**
 * @deprecated Use canvasSseAnalyze from ./canvasSseApi.ts
 *
 * Migration:
 *   Before: import { analyzeRequirement } from '@/lib/canvas/api/dddApi';
 *   After:  import { canvasSseAnalyze as analyzeRequirement } from '@/lib/canvas/api/canvasSseApi';
 */
export {
  canvasSseAnalyze as analyzeRequirement,
} from './canvasSseApi';

/**
 * @deprecated Use the same type from ./canvasSseApi.ts
 *
 * Migration:
 *   Before: import type { ThinkingEvent } from '@/lib/canvas/api/dddApi';
 *   After:  import type { ThinkingEvent } from '@/lib/canvas/api/canvasSseApi';
 */
export type {
  ThinkingEvent,
} from './canvasSseApi';

/**
 * @deprecated Use the same type from ./canvasSseApi.ts
 *
 * Migration:
 *   Before: import type { StepContextEvent } from '@/lib/canvas/api/dddApi';
 *   After:  import type { StepContextEvent } from '@/lib/canvas/api/canvasSseApi';
 */
export type {
  StepContextEvent,
} from './canvasSseApi';

/**
 * @deprecated Use the same type from ./canvasSseApi.ts
 *
 * Migration:
 *   Before: import type { StepModelEvent } from '@/lib/canvas/api/dddApi';
 *   After:  import type { StepModelEvent } from '@/lib/canvas/api/canvasSseApi';
 */
export type {
  StepModelEvent,
} from './canvasSseApi';

/**
 * @deprecated Use the same type from ./canvasSseApi.ts
 *
 * Migration:
 *   Before: import type { StepFlowEvent } from '@/lib/canvas/api/dddApi';
 *   After:  import type { StepFlowEvent } from '@/lib/canvas/api/canvasSseApi';
 */
export type {
  StepFlowEvent,
} from './canvasSseApi';

/**
 * @deprecated Use the same type from ./canvasSseApi.ts
 *
 * Migration:
 *   Before: import type { StepComponentsEvent } from '@/lib/canvas/api/dddApi';
 *   After:  import type { StepComponentsEvent } from '@/lib/canvas/api/canvasSseApi';
 */
export type {
  StepComponentsEvent,
} from './canvasSseApi';

/**
 * @deprecated Use the same type from ./canvasSseApi.ts
 *
 * Migration:
 *   Before: import type { DoneEvent } from '@/lib/canvas/api/dddApi';
 *   After:  import type { DoneEvent } from '@/lib/canvas/api/canvasSseApi';
 */
export type {
  DoneEvent,
} from './canvasSseApi';

/**
 * @deprecated Use the same type from ./canvasSseApi.ts
 *
 * Migration:
 *   Before: import type { ErrorEvent } from '@/lib/canvas/api/dddApi';
 *   After:  import type { ErrorEvent } from '@/lib/canvas/api/canvasSseApi';
 */
export type {
  ErrorEvent,
} from './canvasSseApi';

/**
 * @deprecated Use the same type from ./canvasSseApi.ts
 *
 * Migration:
 *   Before: import type { SSEEvent } from '@/lib/canvas/api/dddApi';
 *   After:  import type { SSEEvent } from '@/lib/canvas/api/canvasSseApi';
 */
export type {
  SSEEvent,
} from './canvasSseApi';

/**
 * @deprecated Use the same type from ./canvasSseApi.ts
 *
 * Migration:
 *   Before: import type { BoundedContext } from '@/lib/canvas/api/dddApi';
 *   After:  import type { BoundedContext } from '@/lib/canvas/api/canvasSseApi';
 */
export type {
  BoundedContext,
} from './canvasSseApi';

/**
 * @deprecated Use CanvasSseCallbacks from ./canvasSseApi.ts
 *
 * Migration:
 *   Before: import type { DDDApiCallbacks } from '@/lib/canvas/api/dddApi';
 *   After:  import type { CanvasSseCallbacks } from '@/lib/canvas/api/canvasSseApi';
 */
export type {
  CanvasSseCallbacks as DDDApiCallbacks,
} from './canvasSseApi';

/**
 * @deprecated Use CanvasSseOptions from ./canvasSseApi.ts
 *
 * Migration:
 *   Before: import type { DDDApiOptions } from '@/lib/canvas/api/dddApi';
 *   After:  import type { CanvasSseOptions } from '@/lib/canvas/api/canvasSseApi';
 */
export type {
  CanvasSseOptions as DDDApiOptions,
} from './canvasSseApi';
