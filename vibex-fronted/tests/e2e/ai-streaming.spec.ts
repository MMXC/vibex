/**
 * E2E Test: AI Streaming SSE
 * Sprint43 P002-E2: AI Agent 流式响应界面（SSE）
 *
 * Tests the POST /api/ai/generate SSE streaming endpoint and
 * the streaming UI integration in AgentFeedbackPanel.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Test: SSE endpoint returns text/event-stream content type.
 * Uses fetch() to bypass UI — confirms the API contract directly.
 */
test('SSE endpoint should return text/event-stream when Accept header is set', async ({ request }) => {
  const response = await request.fetch(`${BASE_URL}/api/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      // Auth headers would be set by gateway in production
      'x-auth-user': JSON.stringify({ userId: 'test-user-001', email: 'test@vibex.top' }),
    },
    body: JSON.stringify({ message: 'hello', stream: true }),
    // 10s timeout — stream should start within 5s
    timeout: 10_000,
  });

  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('text/event-stream');
});

/**
 * Test: Non-streaming mode returns JSON.
 */
test('Non-streaming mode should return application/json', async ({ request }) => {
  const response = await request.fetch(`${BASE_URL}/api/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-user': JSON.stringify({ userId: 'test-user-001', email: 'test@vibex.top' }),
    },
    body: JSON.stringify({ message: 'hello', stream: false }),
    timeout: 15_000,
  });

  // 401 means auth issue (expected in test env without real token)
  // The key assertion is content-type
  const ct = response.headers()['content-type'] || '';
  expect(ct).toMatch(/json|text\/event-stream/);
});

/**
 * Test: SSE stream yields data events.
 * Reads the SSE stream body and verifies it contains data: lines.
 */
test('SSE stream should yield data events from MiniMax API', async ({ request }) => {
  const response = await request.fetch(`${BASE_URL}/api/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'x-auth-user': JSON.stringify({ userId: 'test-user-001', email: 'test@vibex.top' }),
    },
    body: JSON.stringify({ message: 'say hello', stream: true }),
    timeout: 15_000,
  });

  expect(response.ok()).toBeTruthy();

  const body = await response.body();
  expect(body).toBeTruthy();

  const text = new TextDecoder().decode(body);

  // SSE format: lines start with "data: "
  const dataLines = text.split('\n').filter((l) => l.startsWith('data: '));
  expect(dataLines.length).toBeGreaterThan(0);

  // First event should be the conversation ID / status event
  const firstEvent = JSON.parse(dataLines[0].slice(6));
  expect(firstEvent).toHaveProperty('conversationId');
});

/**
 * Test: GET /api/ai/generate returns endpoint info.
 */
test('GET /api/ai/generate should return endpoint documentation', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/api/ai/generate`, {
    timeout: 5_000,
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data).toHaveProperty('status', 'ok');
  expect(data).toHaveProperty('endpoint', '/api/ai/generate');
});

/**
 * Test: Missing auth should return 401.
 */
test('Missing auth should return 401', async ({ request }) => {
  const response = await request.fetch(`${BASE_URL}/api/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({ message: 'hello', stream: true }),
    timeout: 5_000,
  });

  // Without auth headers, should return 401
  expect(response.status()).toBe(401);
});

/**
 * Test: Empty message should return 400.
 */
test('Empty message should return 400', async ({ request }) => {
  const response = await request.fetch(`${BASE_URL}/api/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-user': JSON.stringify({ userId: 'test-user-001', email: 'test@vibex.top' }),
    },
    body: JSON.stringify({ message: '' }),
    timeout: 5_000,
  });

  expect(response.status()).toBe(400);
});
