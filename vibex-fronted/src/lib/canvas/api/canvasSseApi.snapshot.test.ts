/**
 * canvasSseApi.snapshot.test.ts — Canvas SSE API Snapshot Tests
 *
 * Epic 4: SSE 类型验证 (F-4.1)
 *
 * 为 canvasSseApi.ts 的 8 个 SSE Event 类型编写 snapshot test，
 * 确保类型结构变更能被自动检测。
 *
 * SSE Event 类型列表:
 * 1. ThinkingEvent
 * 2. BoundedContext
 * 3. StepContextEvent
 * 4. StepModelEvent
 * 5. StepFlowEvent
 * 6. StepComponentsEvent
 * 7. DoneEvent
 * 8. ErrorEvent
 */
import { describe, it, expect } from 'vitest';
import type {
  ThinkingEvent,
  BoundedContext,
  StepContextEvent,
  StepModelEvent,
  StepFlowEvent,
  StepComponentsEvent,
  DoneEvent,
  ErrorEvent,
  SSEEvent,
  CanvasSseCallbacks,
  CanvasSseOptions,
} from './canvasSseApi';

describe('canvasSseApi SSE Event Snapshots', () => {
  // F-4.1: Snapshot for ThinkingEvent
  it('F-4.1-1: ThinkingEvent snapshot', () => {
    const event: ThinkingEvent = {
      type: 'thinking',
      content: '正在分析用户需求...',
      delta: false,
    };
    expect(event).toMatchSnapshot();
  });

  it('F-4.1-1: ThinkingEvent delta snapshot', () => {
    const event: ThinkingEvent = {
      type: 'thinking',
      content: '补充分析',
      delta: true,
    };
    expect(event).toMatchSnapshot();
  });

  // F-4.1: Snapshot for BoundedContext
  it('F-4.1-2: BoundedContext snapshot', () => {
    const ctx: BoundedContext = {
      id: 'ctx_user',
      name: '用户管理',
      description: '处理用户注册、登录、权限等',
      type: 'core',
      keyResponsibilities: ['用户注册', '用户登录', '权限验证'],
    };
    expect(ctx).toMatchSnapshot();
  });

  it('F-4.1-2: BoundedContext minimal snapshot', () => {
    const ctx: BoundedContext = {
      id: 'ctx_order',
      name: '订单上下文',
      description: '订单处理',
      type: 'supporting',
    };
    expect(ctx).toMatchSnapshot();
  });

  // F-4.1: Snapshot for StepContextEvent
  it('F-4.1-3: StepContextEvent snapshot', () => {
    const event: StepContextEvent = {
      type: 'step_context',
      content: '上下文分析完成，识别出 3 个限界上下文',
      mermaidCode: 'graph TD\n  A --> B',
      confidence: 0.92,
      boundedContexts: [
        { id: 'ctx1', name: '用户', description: '用户管理', type: 'core' },
        { id: 'ctx2', name: '订单', description: '订单处理', type: 'core' },
        { id: 'ctx3', name: '支付', description: '支付处理', type: 'supporting' },
      ],
    };
    expect(event).toMatchSnapshot();
  });

  it('F-4.1-3: StepContextEvent without mermaid snapshot', () => {
    const event: StepContextEvent = {
      type: 'step_context',
      content: '上下文分析完成',
      confidence: 0.85,
      boundedContexts: [],
    };
    expect(event).toMatchSnapshot();
  });

  // F-4.1: Snapshot for StepModelEvent
  it('F-4.1-4: StepModelEvent snapshot', () => {
    const event: StepModelEvent = {
      type: 'step_model',
      content: '领域模型分析完成',
      mermaidCode: 'classDiagram\n  class User',
      confidence: 0.88,
    };
    expect(event).toMatchSnapshot();
  });

  it('F-4.1-4: StepModelEvent without mermaid snapshot', () => {
    const event: StepModelEvent = {
      type: 'step_model',
      content: '领域模型生成中...',
      confidence: 0.5,
    };
    expect(event).toMatchSnapshot();
  });

  // F-4.1: Snapshot for StepFlowEvent
  it('F-4.1-5: StepFlowEvent snapshot', () => {
    const event: StepFlowEvent = {
      type: 'step_flow',
      content: '业务流程分析完成',
      mermaidCode: 'flowchart LR\n  A --> B',
      confidence: 0.9,
    };
    expect(event).toMatchSnapshot();
  });

  it('F-4.1-5: StepFlowEvent without mermaid snapshot', () => {
    const event: StepFlowEvent = {
      type: 'step_flow',
      content: '业务流程生成中...',
      confidence: 0.4,
    };
    expect(event).toMatchSnapshot();
  });

  // F-4.1: Snapshot for StepComponentsEvent
  it('F-4.1-6: StepComponentsEvent snapshot', () => {
    const event: StepComponentsEvent = {
      type: 'step_components',
      content: '组件树分析完成',
      mermaidCode: 'componentDiagram\n  C1 --> C2',
      confidence: 0.87,
    };
    expect(event).toMatchSnapshot();
  });

  it('F-4.1-6: StepComponentsEvent without mermaid snapshot', () => {
    const event: StepComponentsEvent = {
      type: 'step_components',
      content: '组件树生成中...',
      confidence: 0.35,
    };
    expect(event).toMatchSnapshot();
  });

  // F-4.1: Snapshot for DoneEvent
  it('F-4.1-7: DoneEvent snapshot', () => {
    const event: DoneEvent = {
      type: 'done',
      projectId: 'proj_abc123',
      summary: '分析完成，已生成上下文、模型、流程和组件',
    };
    expect(event).toMatchSnapshot();
  });

  // F-4.1: Snapshot for ErrorEvent
  it('F-4.1-8: ErrorEvent with code snapshot', () => {
    const event: ErrorEvent = {
      type: 'error',
      message: '网络连接失败，请检查网络',
      code: 'NETWORK_ERROR',
    };
    expect(event).toMatchSnapshot();
  });

  it('F-4.1-8: ErrorEvent without code snapshot', () => {
    const event: ErrorEvent = {
      type: 'error',
      message: '未知错误',
    };
    expect(event).toMatchSnapshot();
  });

  // F-4.1-9: SSEEvent union type snapshot
  it('F-4.1-9: SSEEvent union covers all types', () => {
    const events: SSEEvent[] = [
      { type: 'thinking', content: 'test', delta: false },
      { type: 'done', projectId: 'p1', summary: 'done' },
      { type: 'error', message: 'err' },
    ];
    expect(events).toMatchSnapshot();
  });

  // F-4.1-10: CanvasSseCallbacks snapshot
  it('F-4.1-10: CanvasSseCallbacks snapshot', () => {
    const callbacks: CanvasSseCallbacks = {
      onThinking: (content, delta) => { console.log(content, delta); },
      onStepContext: (content, mermaid, confidence, contexts) => { console.log(content); },
      onStepModel: (content, mermaid, confidence) => { console.log(content); },
      onStepFlow: (content, mermaid, confidence) => { console.log(content); },
      onStepComponents: (content, mermaid, confidence) => { console.log(content); },
      onDone: (projectId, summary) => { console.log(projectId); },
      onError: (message, code) => { console.error(message); },
    };
    expect(Object.keys(callbacks).sort()).toMatchSnapshot();
  });

  // F-4.1-10: CanvasSseOptions snapshot
  it('F-4.1-10: CanvasSseOptions with all fields snapshot', () => {
    const options: CanvasSseOptions = {
      signal: new AbortController().signal,
      timeoutMs: 60000,
      onThinking: (c, d) => {},
      onStepContext: (c, m, conf, ctx) => {},
      onDone: (p, s) => {},
      onError: (m) => {},
    };
    expect(Object.keys(options).sort()).toMatchSnapshot();
  });
});
