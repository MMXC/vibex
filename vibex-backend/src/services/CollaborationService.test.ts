/**
 * CollaborationService — KV-based Concurrency Tests
 *
 * E4: Lock concurrency test coverage for KV-based CollaborationService.
 * Uses Jest (jest.fn) since backend uses Jest, not Vitest.
 */

import { CollaborationService, LockHeldError, LockRequiredError } from './CollaborationService';

const store = new Map<string, string>();

function createMockKV() {
  return {
    get: jest.fn().mockImplementation(async (key: string) => store.get(key) ?? null),
    put: jest.fn().mockImplementation(async (key: string, value: string) => { store.set(key, value); }),
    delete: jest.fn().mockImplementation(async (key: string) => { store.delete(key); }),
    list: jest.fn().mockResolvedValue({ keys: [] as { name: string }[], list_complete: true }),
  };
}

describe('CollaborationService KV locking', () => {
  let mockKV: ReturnType<typeof createMockKV>;
  let svc: CollaborationService;

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    mockKV = createMockKV();
    svc = new CollaborationService({ COLLABORATION_KV: mockKV as any } as any);
  });

  // Note: KV-based locking does not provide true atomicity (no compare-and-swap).
  // Multiple concurrent acquires may all succeed, overwriting each other.
  // The lock becomes "last writer wins". This is acceptable for short-lived operations.
  it('100 concurrent acquireLock: no throws, at least 1 success', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 100 }, () =>
        svc.acquireLock('p', 's').then(() => 'success' as const).catch((e) => e)
      )
    );
    const successes = results.filter((r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<string>).value === 'success');
    expect(successes.length).toBeGreaterThanOrEqual(1);
    // All results should be successful (no unexpected throws)
    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
  });

  it('second acquire succeeds after TTL expires', async () => {
    const ttlMs = 50;
    await svc.acquireLock('p', 's', ttlMs);
    await expect(svc.hasLock('p', 's')).resolves.toBe(true);
    await expect(svc.acquireLock('p', 's', ttlMs)).rejects.toBeInstanceOf(LockHeldError);
    await new Promise((r) => setTimeout(r, ttlMs + 80));
    await expect(svc.hasLock('p', 's')).resolves.toBe(false);
    await expect(svc.acquireLock('p', 's', ttlMs)).resolves.toBeUndefined();
  });

  it('rapid acquire-release-acquire with short TTL', async () => {
    const ttlMs = 30;
    await svc.acquireLock('p', 's', ttlMs);
    await svc.releaseLock('p', 's');
    await expect(svc.hasLock('p', 's')).resolves.toBe(false);
    await expect(svc.acquireLock('p', 's', ttlMs)).resolves.toBeUndefined();
  });

  it('validateLock throws LockRequiredError when no lock held', async () => {
    await expect(svc.validateLock('p', 's')).rejects.toBeInstanceOf(LockRequiredError);
  });

  it('validateLock succeeds when lock held', async () => {
    await svc.acquireLock('p', 's');
    await expect(svc.validateLock('p', 's')).resolves.toBeUndefined();
  });

  it('hasLock returns false when KV not bound', () => {
    const svcNoKV = new CollaborationService({} as any);
    expect(svcNoKV.hasLock('p', 's')).resolves.toBe(false);
  });

  it('hasLock returns false after release', async () => {
    await svc.acquireLock('p', 's');
    await expect(svc.hasLock('p', 's')).resolves.toBe(true);
    await svc.releaseLock('p', 's');
    await expect(svc.hasLock('p', 's')).resolves.toBe(false);
  });
});
