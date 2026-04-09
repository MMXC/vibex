/**
 * [F4.2] Canvas Stream Integration Tests
 * Tests the SSE event sequence: thinking → step_context → step_model → step_flow → step_components → done
 */

import { NextRequest } from 'next/server';

// Mock global fetch
global.fetch = jest.fn();

jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn().mockReturnValue({ userId: 'test-user', email: 'test@test.com' }),
}));

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn().mockReturnValue({ userId: 'test-user', email: 'test@test.com' }),
}));

// Mock AI service to avoid real API calls
jest.mock('@/services/ai-service', () => ({
  createAIService: jest.fn().mockReturnValue({
    chat: jest.fn().mockResolvedValue({
      success: true,
      data: '[core] 用户管理 - 用户注册、登录、个人信息\n[supporting] 订单管理 - 下单、支付',
    }),
    generateJSON: jest.fn().mockResolvedValue({
      data: {
        entities: [{ name: 'User', type: 'entity', description: '用户实体', attributes: [] }],
        mermaidCode: 'classDiagram\n    class User {}',
        confidence: 0.8,
      },
    }),
  }),
}));

describe('[F4.2] Canvas Stream SSE Event Sequence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('emits complete event sequence ending with done', async () => {
    // Import dynamically to get the route handler
    const { GET: StreamGET } = await import('@/app/api/v1/canvas/stream/route');

    const request = new NextRequest(
      'http://localhost:3000/api/v1/canvas/stream?requirement=build a hotel booking system',
      { method: 'GET' }
    );

    const response = await StreamGET(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/event-stream');

    const events: Array<{ event: string; data: unknown }> = [];
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE format: "event: NAME\ndata: JSON\n\n"
        // Events are separated by \n\n
        while (buffer.includes('\n\n')) {
          const eventBlockEnd = buffer.indexOf('\n\n');
          const eventBlock = buffer.slice(0, eventBlockEnd);
          buffer = buffer.slice(eventBlockEnd + 2);

          const eventMatch = eventBlock.match(/^event: (.+)$/m);
          const dataMatch = eventBlock.match(/^data: (.+)$/m);

          if (eventMatch) {
            const evt: { event: string; data: unknown } = { event: eventMatch[1], data: null };
            if (dataMatch) {
              try {
                evt.data = JSON.parse(dataMatch[1]);
              } catch {}
            }
            events.push(evt);
          }
        }
      }
    } catch {
      // Stream may close early in test env without AI service
    }

    // Verify event types sequence
    const eventTypes = events.map((e) => e.event);
    expect(eventTypes).toContain('thinking');
    expect(eventTypes).toContain('step_context');
    expect(eventTypes).toContain('step_model');
    expect(eventTypes).toContain('step_flow');
    expect(eventTypes).toContain('step_components');
    expect(eventTypes).toContain('done');
  });

  it('sends projectId in the done event', async () => {
    const { GET: StreamGET } = await import('@/app/api/v1/canvas/stream/route');

    const request = new NextRequest(
      'http://localhost:3000/api/v1/canvas/stream?requirement=test',
      { method: 'GET' }
    );

    const response = await StreamGET(request);
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let doneEvent: { projectId?: string; summary?: string } | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        while (buffer.includes('\n\n')) {
          const eventBlockEnd = buffer.indexOf('\n\n');
          const eventBlock = buffer.slice(0, eventBlockEnd);
          buffer = buffer.slice(eventBlockEnd + 2);

          const eventMatch = eventBlock.match(/^event: (.+)$/m);
          const dataMatch = eventBlock.match(/^data: (.+)$/m);

          if (eventMatch && eventMatch[1] === 'done' && dataMatch) {
            try {
              doneEvent = JSON.parse(dataMatch[1]);
            } catch {}
          }
        }
      }
    } catch {}

    // done event should have projectId
    expect(doneEvent).not.toBeNull();
    expect(doneEvent?.projectId).toBeDefined();
    expect(doneEvent?.projectId).toMatch(/^proj_\d+$/);
  });
});

describe('[F4.1] Route parameter consistency', () => {
  it('canvas/stream route accepts requirement parameter', async () => {
    const { GET: StreamGET } = await import('@/app/api/v1/canvas/stream/route');

    const request = new NextRequest(
      'http://localhost:3000/api/v1/canvas/stream?requirement=hotel booking',
      { method: 'GET' }
    );

    const response = await StreamGET(request);
    // Should not return 400 for missing requirement
    expect(response.status).not.toBe(400);
  });
});
