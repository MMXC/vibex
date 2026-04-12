/**
 * setup.ts 本身的行为验证测试
 *
 * 验证全局 IntersectionObserver mock 的正确性。
 * 这是 S1.1 的单元测试层验收标准。
 *
 * Ref: prd.md Epic 1 S1.1 验收标准
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('IntersectionObserver Mock (setup.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('global.IntersectionObserver should be defined', () => {
    expect(global.IntersectionObserver).toBeDefined();
  });

  it('new IntersectionObserver(callback) should return an object with observe/unobserve/disconnect/takeRecords', () => {
    const callback = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const observer = new global.IntersectionObserver(callback);
    expect(observer).toHaveProperty('observe');
    expect(observer).toHaveProperty('unobserve');
    expect(observer).toHaveProperty('disconnect');
    expect(observer).toHaveProperty('takeRecords');
  });

  it('observe() should call the callback with isIntersecting: true', () => {
    const callback = vi.fn();
    const observer = new global.IntersectionObserver(callback);
    const fakeElement = document.createElement('div');

    observer.observe(fakeElement);

    expect(callback).toHaveBeenCalledTimes(1);
    const [entries, obs] = callback.mock.calls[0];
    expect(entries).toHaveLength(1);
    expect(entries[0].isIntersecting).toBe(true);
    expect(entries[0].target).toBe(fakeElement);
    expect(obs).toBe(observer);
  });

  it('observe() should not throw when called without callback (immediate trigger)', () => {
    const observer = new global.IntersectionObserver(() => {});
    const fakeElement = document.createElement('div');
    expect(() => observer.observe(fakeElement)).not.toThrow();
  });

  it('mockImplementationOnce should override the default behavior', () => {
    const callback = vi.fn();
    (global.IntersectionObserver as unknown as { mockImplementationOnce: (fn: () => void) => void }).mockImplementationOnce(
      function (_cb: IntersectionObserverCallback) {
        this.observe = vi.fn(); // Don't fire callback
        this.unobserve = vi.fn();
        this.disconnect = vi.fn();
        this.takeRecords = vi.fn(() => []);
      }
    );

    const observer = new global.IntersectionObserver(callback);
    const fakeElement = document.createElement('div');
    observer.observe(fakeElement);

    // Callback should NOT fire since mockImplementationOnce overrides with no-op
    expect(callback).not.toHaveBeenCalled();
  });

  it('unobserve() should be callable without error', () => {
    const observer = new global.IntersectionObserver(() => {});
    const fakeElement = document.createElement('div');
    observer.observe(fakeElement);
    expect(() => observer.unobserve(fakeElement)).not.toThrow();
  });

  it('disconnect() should be callable without error', () => {
    const observer = new global.IntersectionObserver(() => {});
    expect(() => observer.disconnect()).not.toThrow();
  });

  it('takeRecords() should return an empty array', () => {
    const observer = new global.IntersectionObserver(() => {});
    expect(observer.takeRecords()).toEqual([]);
  });
});
