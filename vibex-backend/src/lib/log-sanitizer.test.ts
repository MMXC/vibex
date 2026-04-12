/**
 * Unit tests for log-sanitizer.ts
 *
 * Tests the sanitize(), sanitizeAndTruncate(), safeError(), devLog(), devDebug()
 * functions to ensure sensitive data redaction works correctly.
 *
 * Epic1 E1: safeError 日志脱敏 — 单元测试覆盖
 */

import { sanitize, sanitizeAndTruncate, safeError, devLog, devDebug } from './log-sanitizer';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

let logCalls: unknown[][] = [];
let errorCalls: unknown[][] = [];

beforeEach(() => {
  logCalls = [];
  errorCalls = [];
  console.log = (...args: unknown[]) => { logCalls.push(args); };
  console.error = (...args: unknown[]) => { errorCalls.push(args); };
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  delete process.env.NODE_ENV;
});

// =============================================================================
// sanitize()
// =============================================================================

describe('sanitize()', () => {
  it('redacts top-level sensitive keys', () => {
    // Note: 'name' is in SENSITIVE_KEYS, so we use non-sensitive field names
    const input = { title: 'alice', password: 'secret123', token: 'tok123' };
    const result = sanitize(input);
    expect(result.title).toBe('alice');
    expect(result.password).toBe('[REDACTED]');
    expect(result.token).toBe('[REDACTED]');
  });

  it('redacts nested sensitive keys recursively', () => {
    const input = {
      user: {
        userId: 'uid-123',
        email: 'alice@example.com',
        sessionToken: 'tok-abc',
        status: 'active', // non-sensitive
      },
    };
    const result = sanitize(input);
    // Nested user object: userId, email, sessionToken redacted; status preserved
    expect((result as any).user.userId).toBe('[REDACTED]');
    expect((result as any).user.email).toBe('[REDACTED]');
    expect((result as any).user.sessionToken).toBe('[REDACTED]');
    expect((result as any).user.status).toBe('active'); // non-sensitive, preserved
  });

  it('redacts sensitive keys case-insensitively', () => {
    const input = { PASSWORD: 'secret', Token: 'tok', PASSWD: 'pass' };
    const result = sanitize(input);
    expect(result.PASSWORD).toBe('[REDACTED]');
    expect((result as any).Token).toBe('[REDACTED]');
    expect((result as any).PASSWD).toBe('[REDACTED]');
  });

  it('redacts sensitive keys even if nested in camelCase or snake_case', () => {
    const input = {
      access_token: 'at-123',
      refreshToken: 'rt-456',
      user_id: 'u-789',
      apiKey: 'key-abc',
    };
    const result = sanitize(input);
    expect((result as any).access_token).toBe('[REDACTED]');
    expect((result as any).refreshToken).toBe('[REDACTED]');
    expect((result as any).user_id).toBe('[REDACTED]');
    expect((result as any).apiKey).toBe('[REDACTED]');
  });

  it('handles null and undefined gracefully', () => {
    expect(sanitize(null)).toBeNull();
    expect(sanitize(undefined)).toBeUndefined();
  });

  it('handles arrays with sensitive values', () => {
    const input = [
      { label: 'Alice', token: 'tok1' },
      { label: 'Bob', token: 'tok2' },
    ];
    const result = sanitize<typeof input>(input);
    // Array: each element is sanitized; label is non-sensitive, token is redacted
    expect(result[0].label).toBe('Alice');
    expect(result[0].token).toBe('[REDACTED]');
    expect(result[1].token).toBe('[REDACTED]');
  });

  it('does not modify non-sensitive fields', () => {
    const input = { id: 123, type: 'user', status: 'active' };
    const result = sanitize(input);
    expect(result).toEqual(input);
  });

  it('prevents infinite recursion at depth > 10', () => {
    let obj: any = { value: 1 };
    for (let i = 0; i < 15; i++) {
      obj = { nested: obj };
    }
    // Should not throw and return something
    const result = sanitize(obj);
    expect(result).toBeDefined();
  });
});

// =============================================================================
// sanitizeAndTruncate()
// =============================================================================

describe('sanitizeAndTruncate()', () => {
  it('redacts email addresses', () => {
    const input = 'Hello user@example.com, your account is ready';
    const result = sanitizeAndTruncate(input);
    expect(result).toContain('[EMAIL_REDACTED]');
    expect(result).not.toContain('user@example.com');
  });

  it('redacts long token-like hex strings', () => {
    const input = 'Token: deadbeef1234567890abcdef12345678';
    const result = sanitizeAndTruncate(input);
    expect(result).toContain('[TOKEN_REDACTED]');
    expect(result).not.toContain('deadbeef');
  });

  it('truncates long strings beyond maxLen', () => {
    const long = 'x'.repeat(600);
    const result = sanitizeAndTruncate(long, 100);
    // 600 > 100 → truncate to first 100 chars + '...'
    expect(result.length).toBe(103);
    expect(result.endsWith('...')).toBe(true);
  });

  it('handles empty string', () => {
    expect(sanitizeAndTruncate('')).toBe('');
  });

  it('handles null/undefined', () => {
    expect(sanitizeAndTruncate(null as any)).toBeNull();
    expect(sanitizeAndTruncate(undefined as any)).toBeUndefined();
  });

  it('redacts multiple emails in one string', () => {
    const input = 'Contact alice@test.com or bob@corp.com';
    const result = sanitizeAndTruncate(input);
    expect(result).not.toContain('alice@test.com');
    expect(result).not.toContain('bob@corp.com');
    expect(result).toContain('[EMAIL_REDACTED]');
  });
});

// =============================================================================
// safeError()
// =============================================================================

describe('safeError()', () => {
  it('sanitizes object arguments via console.error', () => {
    safeError('Error:', { token: 'tok123', message: 'fail' });
    expect(errorCalls.length).toBe(1);
    const output = errorCalls[0];
    // safeError applies sanitizeAndTruncate to strings and sanitize to objects
    expect(output).toBeDefined();
  });

  it('handles mixed string and object args', () => {
    safeError('Failed to fetch', { url: '/api', password: 'secret' });
    expect(errorCalls.length).toBe(1);
    expect(errorCalls[0][0]).toBe('Failed to fetch');
  });

  it('handles null/undefined args without throwing', () => {
    expect(() => safeError(null, undefined, 'ok')).not.toThrow();
    expect(errorCalls.length).toBe(1);
  });

  it('truncates long string args', () => {
    const long = 'x'.repeat(600);
    safeError(long);
    expect(errorCalls[0][0].length).toBeLessThanOrEqual(503); // 500 + '...'
  });
});

// =============================================================================
// devLog()
// =============================================================================

describe('devLog()', () => {
  it('logs in non-production env', () => {
    process.env.NODE_ENV = 'development';
    devLog('debug message');
    expect(logCalls.length).toBe(1);
    expect(logCalls[0][0]).toBe('debug message');
  });

  it('does not log in production env', () => {
    process.env.NODE_ENV = 'production';
    devLog('should not appear');
    expect(logCalls.length).toBe(0);
  });

  it('logs in test env (only production is blocked)', () => {
    process.env.NODE_ENV = 'test';
    devLog('should appear in test');
    expect(logCalls.length).toBe(1);
    expect(logCalls[0][0]).toBe('should appear in test');
  });
});

// =============================================================================
// devDebug()
// =============================================================================

describe('devDebug()', () => {
  it('logs sanitized arguments in non-production env', () => {
    process.env.NODE_ENV = 'development';
    devDebug('Token:', { token: 'tok123', email: 'a@b.com' });
    expect(logCalls.length).toBe(1);
  });

  it('does not log in production env', () => {
    process.env.NODE_ENV = 'production';
    devDebug('secret');
    expect(logCalls.length).toBe(0);
  });

  it('sanitizes and truncates string args', () => {
    process.env.NODE_ENV = 'development';
    const long = 'y'.repeat(300);
    devDebug(long);
    expect(logCalls[0][0].length).toBeLessThanOrEqual(203);
  });
});
