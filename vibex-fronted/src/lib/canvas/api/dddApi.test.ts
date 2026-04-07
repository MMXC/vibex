/**
 * dddApi.test.ts — DDD API SSE Client Tests
 *
 * Epic 1: F1.1-F1.4
 * Migrated to canvasSseApi.ts (vibex-canvas-api-standardization Epic 2)
 *
 * Tests SSE event type definitions and API surface.
 * Full integration tests require the actual backend SSE endpoint.
 */
import type {
  ThinkingEvent,
  StepContextEvent,
  DoneEvent,
  ErrorEvent,
  SSEEvent,
  CanvasSseOptions as DDDApiOptions,
  BoundedContext,
} from './canvasSseApi';
import { describe, it, expect } from '@jest/globals';

describe('canvasSseApi (migrated from dddApi)', () => {
  // F1.1: API function export
  it('F1.1: canvasSseAnalyze is exported', async () => {
    const mod = await import('./canvasSseApi');
    expect(typeof mod.canvasSseAnalyze).toBe('function');
  });

  // F1.2: SSE event types are discriminated unions
  it('F1.2: ThinkingEvent has correct structure', () => {
    const event: ThinkingEvent = { type: 'thinking', content: '分析中', delta: false };
    expect(event.type).toBe('thinking');
    expect(event.content).toBe('分析中');
  });

  it('F1.2: StepContextEvent has correct structure', () => {
    const event: StepContextEvent = {
      type: 'step_context',
      content: '上下文分析完成',
      confidence: 0.85,
      boundedContexts: [],
    };
    expect(event.type).toBe('step_context');
    expect(event.confidence).toBe(0.85);
    expect(event.boundedContexts).toEqual([]);
  });

  it('F1.2: StepContextEvent with boundedContexts', () => {
    const contexts: BoundedContext[] = [
      { id: 'ctx1', name: '用户上下文', description: '用户管理', type: 'core' },
      { id: 'ctx2', name: '订单上下文', description: '订单处理', type: 'core' },
    ];
    const event: StepContextEvent = {
      type: 'step_context',
      content: '识别出2个限界上下文',
      confidence: 0.9,
      boundedContexts: contexts,
    };
    expect(event.boundedContexts).toHaveLength(2);
    expect(event.boundedContexts[0].name).toBe('用户上下文');
    expect(event.boundedContexts[1].type).toBe('core');
  });

  it('F1.2: DoneEvent has correct structure', () => {
    const event: DoneEvent = { type: 'done', projectId: 'proj_123', summary: '完成' };
    expect(event.type).toBe('done');
    expect(event.projectId).toBe('proj_123');
  });

  it('F1.2: ErrorEvent has correct structure', () => {
    const event: ErrorEvent = { type: 'error', message: '网络错误', code: 'NETWORK' };
    expect(event.type).toBe('error');
    expect(event.message).toBe('网络错误');
  });

  it('F1.2: SSEEvent is union of all event types', () => {
    const events: SSEEvent[] = [
      { type: 'thinking', content: '分析中', delta: false },
      { type: 'done', projectId: 'proj_1', summary: '完成' },
      { type: 'error', message: '失败' },
    ];
    expect(events.length).toBe(3);
  });

  // F1.3: DDDApiCallbacks has all required methods
  it('F1.3: DDDApiOptions accepts all callback types', () => {
    const options: DDDApiOptions = {
      onThinking: (c, d) => { expect(typeof c).toBe('string'); expect(typeof d).toBe('boolean'); },
      onDone: (p, s) => { expect(typeof p).toBe('string'); expect(typeof s).toBe('string'); },
      onError: (m) => { expect(typeof m).toBe('string'); },
      timeoutMs: 5000,
    };
    expect(options.timeoutMs).toBe(5000);
  });

  it('F1.3: onStepContext callback includes boundedContexts parameter', () => {
    let capturedContexts: BoundedContext[] | undefined;
    const options: DDDApiOptions = {
      onStepContext: (content, mermaidCode, confidence, boundedContexts) => {
        capturedContexts = boundedContexts;
        expect(typeof content).toBe('string');
        expect(typeof confidence).toBe('number');
      },
    };
    // Verify the callback signature accepts 4 arguments
    expect(options.onStepContext).toBeDefined();
  });

  // F1.4: Error event structure
  it('F1.4: ErrorEvent includes optional code field', () => {
    const eventWithCode: ErrorEvent = { type: 'error', message: 'err', code: 'ERR_CODE' };
    const eventWithoutCode: ErrorEvent = { type: 'error', message: 'err' };
    expect(eventWithCode.code).toBe('ERR_CODE');
    expect(eventWithoutCode.code).toBeUndefined();
  });
});
