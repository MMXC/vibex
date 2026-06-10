
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Module-level vi.fn()
const moduleMock = vi.fn();

describe('vi.fn() at module level', () => {
  beforeEach(() => {
    moduleMock.mockClear();
  });

  it('module-level vi.fn() has mockClear', () => {
    console.log('typeof moduleMock.mockClear:', typeof moduleMock.mockClear);
    expect(typeof moduleMock.mockClear).toBe('function');
    moduleMock();
    expect(moduleMock).toHaveBeenCalled();
  });
});
