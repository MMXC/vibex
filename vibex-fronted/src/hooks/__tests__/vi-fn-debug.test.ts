
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Same pattern as useWebSocket.e2.test.ts
const mockWS = {
  _readyState: 0,
  get readyState() { return this._readyState; },
  set readyState(v) { this._readyState = v; },
  close: vi.fn(),
  send: vi.fn(),
};

describe('mockWS pattern', () => {
  beforeEach(() => {
    console.log('typeof mockWS.close:', typeof mockWS.close);
    console.log('typeof mockWS.close.mockClear:', typeof (mockWS.close as any).mockClear);
    mockWS.close.mockClear?.();
  });

  it('mockWS.close has mockClear', () => {
    expect(typeof mockWS.close.mockClear).toBe('function');
  });
});
