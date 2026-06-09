import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('fake timer debug', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('simple setTimeout test', async () => {
    let fired = false;
    setTimeout(() => { fired = true; }, 0);
    expect(fired).toBe(false);
    vi.advanceTimersByTime(0);
    expect(fired).toBe(true);
  });

  it('async setTimeout with await', async () => {
    let fired = false;
    await new Promise((resolve) => {
      setTimeout(() => { fired = true; resolve(undefined); }, 0);
    });
    expect(fired).toBe(true);
  });
});
