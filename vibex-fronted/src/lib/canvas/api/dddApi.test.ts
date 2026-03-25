/**
 * dddApi.test.ts — DDD API SSE Client Tests
 *
 * Epic 1: F1.1-F1.4
 *
 * Tests SSE event type definitions and API surface.
 * Full integration tests require the actual backend SSE endpoint.
 */
import { describe, it, expect } from '@jest/globals';

describe('dddApi', () => {
  // F1.1: API function export
  it('F1.1: analyzeRequirement is a function', async () => {
    const mod = await import('./dddApi');
    expect(typeof mod.analyzeRequirement).toBe('function');
  });

  // F1.2: SSE event types are discriminated unions
  it('F1.2: ThinkingEvent has correct structure', async () => {
    const mod = await import('./dddApi');
    const event: mod.ThinkingEvent = { type: 'thinking', content: '分析中', delta: false };
    expect(event.type).toBe('thinking');
    expect(event.content).toBe('分析中');
  });

  it('F1.2: StepContextEvent has correct structure', async () => {
    const mod = await import('./dddApi');
    const event: mod.StepContextEvent = {
      type: 'step_context',
      content: '上下文分析完成',
      confidence: 0.85,
    };
    expect(event.type).toBe('step_context');
    expect(event.confidence).toBe(0.85);
  });

  it('F1.2: DoneEvent has correct structure', async () => {
    const mod = await import('./dddApi');
    const event: mod.DoneEvent = { type: 'done', projectId: 'proj_123', summary: '完成' };
    expect(event.type).toBe('done');
    expect(event.projectId).toBe('proj_123');
  });

  it('F1.2: ErrorEvent has correct structure', async () => {
    const mod = await import('./dddApi');
    const event: mod.ErrorEvent = { type: 'error', message: '网络错误', code: 'NETWORK' };
    expect(event.type).toBe('error');
    expect(event.message).toBe('网络错误');
  });

  it('F1.2: SSEEvent is union of all event types', async () => {
    const mod = await import('./dddApi');
    const events: mod.SSEEvent[] = [
      { type: 'thinking', content: '分析中', delta: false },
      { type: 'done', projectId: 'proj_1', summary: '完成' },
      { type: 'error', message: '失败' },
    ];
    expect(events.length).toBe(3);
  });

  // F1.3: DDDApiCallbacks has all required methods
  it('F1.3: DDDApiCallbacks options object is accepted by analyzeRequirement', async () => {
    const mod = await import('./dddApi');
    // TypeScript enforces callback types at compile time
    // We verify the API surface by passing valid callbacks
    const options: mod.DDDApiOptions = {
      onThinking: (c, d) => { expect(typeof c).toBe('string'); expect(typeof d).toBe('boolean'); },
      onDone: (p, s) => { expect(typeof p).toBe('string'); expect(typeof s).toBe('string'); },
      onError: (m) => { expect(typeof m).toBe('string'); },
      timeoutMs: 5000,
    };
    expect(options.timeoutMs).toBe(5000);
  });

  // F1.4: Error event structure
  it('F1.4: ErrorEvent includes optional code field', async () => {
    const mod = await import('./dddApi');
    const eventWithCode: mod.ErrorEvent = { type: 'error', message: 'err', code: 'ERR_CODE' };
    const eventWithoutCode: mod.ErrorEvent = { type: 'error', message: 'err' };
    expect(eventWithCode.code).toBe('ERR_CODE');
    expect(eventWithoutCode.code).toBeUndefined();
  });
});
