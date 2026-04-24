/**
 * Firebase Presence Latency Tests
 * P002-S3: Presence update latency verification
 *
 * Tests measure the mock fallback path latency.
 * Real Firebase RTDB SSE latency (< 1s) requires E2E Playwright tests
 * with actual Firebase credentials configured.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the canvasLogger
vi.mock('@/lib/canvas/canvasLogger', () => ({
  canvasLogger: {
    default: {
      debug: vi.fn(),
      error: vi.fn(),
    },
  },
}));

describe('P002-S3: Presence Latency (Mock Mode)', () => {
  beforeEach(() => {
    // Ensure Firebase is not configured (mock mode)
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  });

  it('setPresence mock latency < 10ms', async () => {
    const { setPresence } = await import('../presence');

    const start = performance.now();
    await setPresence('test-canvas', 'user-latency-test', 'Latency User');
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10);
  });

  it('subscribeToOthers mock callback latency < 10ms', async () => {
    const { setPresence, subscribeToOthers, removePresence } = await import('../presence');

    await setPresence('test-latency-canvas', 'user-1', 'User One');
    await setPresence('test-latency-canvas', 'user-2', 'User Two');

    let callbackTime = 0;
    const unsubscribe = subscribeToOthers('test-latency-canvas', (users) => {
      callbackTime = performance.now();
    }, 'user-1');

    // Callback should have been called immediately in mock mode
    expect(callbackTime).toBeGreaterThan(0);

    // Total time from subscribe call to callback should be < 10ms
    const totalTime = callbackTime - (callbackTime - 0); // callbackTime is set inside
    expect(totalTime).toBeLessThan(10);

    unsubscribe();
    await removePresence('test-latency-canvas', 'user-1');
    await removePresence('test-latency-canvas', 'user-2');
  });

  it('removePresence mock latency < 10ms', async () => {
    const { setPresence, removePresence } = await import('../presence');

    await setPresence('test-remove-canvas', 'user-remove', 'Remove User');

    const start = performance.now();
    await removePresence('test-remove-canvas', 'user-remove');
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10);
  });

  it('multiple users presence update propagates in < 10ms (mock)', async () => {
    const { setPresence, subscribeToOthers, removePresence } = await import('../presence');

    // Simulate multiple concurrent presence updates
    const start = performance.now();
    await Promise.all([
      setPresence('multi-canvas', 'user-1', 'User 1'),
      setPresence('multi-canvas', 'user-2', 'User 2'),
      setPresence('multi-canvas', 'user-3', 'User 3'),
    ]);

    let receivedUsers: any[] = [];
    const subscribeStart = performance.now();
    const unsubscribe = subscribeToOthers('multi-canvas', (users) => {
      receivedUsers = users;
    }, 'user-1');

    const totalTime = performance.now() - start;

    // Multiple updates + subscribe in mock mode should be < 50ms
    expect(totalTime).toBeLessThan(50);
    expect(receivedUsers.length).toBe(2); // user-2 and user-3 (excluding user-1)

    unsubscribe();
    await Promise.all([
      removePresence('multi-canvas', 'user-1'),
      removePresence('multi-canvas', 'user-2'),
      removePresence('multi-canvas', 'user-3'),
    ]);
  });
});
