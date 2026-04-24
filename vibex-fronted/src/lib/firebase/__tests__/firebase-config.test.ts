/**
 * Firebase Configuration Tests
 * P002-S2: Firebase cold start verification
 *
 * Since VibeX uses Firebase REST API (zero SDK), "cold start" means:
 * 1. Checking isFirebaseConfigured() (sync, < 1ms)
 * 2. Constructing REST API URLs (sync, < 1ms)
 * 3. Mock fallback path (sync, < 1ms)
 *
 * Note: FIREBASE_CONFIG is evaluated at module load time.
 * Testing configured/unconfigured states requires mocking the module.
 * These tests verify the actual runtime behavior in the current env.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the canvasLogger
vi.mock('@/lib/canvas/canvasLogger', () => ({
  canvasLogger: {
    default: {
      debug: vi.fn(),
      error: vi.fn(),
    },
  },
}));

describe('P002-S2: Firebase Cold Start', () => {
  it('isFirebaseConfigured() is a fast synchronous check', async () => {
    const { isFirebaseConfigured } = await import('../presence');

    const start = performance.now();
    const result = isFirebaseConfigured();
    const duration = performance.now() - start;

    // The check is a simple boolean expression, should be < 1ms
    expect(duration).toBeLessThan(5);
    // Result reflects actual environment configuration
    expect(typeof result).toBe('boolean');
  });

  it('Mock mode setPresence resolves in < 10ms', async () => {
    const { setPresence } = await import('../presence');

    const start = performance.now();
    await setPresence('test-canvas', 'user-coldstart', 'Cold Start Test');
    const duration = performance.now() - start;

    // Mock mode (Firebase not configured) should be very fast
    expect(duration).toBeLessThan(10);
  });

  it('Mock mode subscribeToOthers resolves in < 10ms', async () => {
    const { subscribeToOthers } = await import('../presence');

    const start = performance.now();
    let callbackCalled = false;
    const unsubscribe = subscribeToOthers('test-canvas-cs', (users) => {
      expect(Array.isArray(users)).toBe(true);
      callbackCalled = true;
    }, 'user-cs');
    const duration = performance.now() - start;

    // Mock subscribe + immediate callback should be < 10ms
    expect(duration).toBeLessThan(10);
    expect(callbackCalled).toBe(true);

    unsubscribe();
  });
});
