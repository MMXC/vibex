/**
 * validateReturnTo — Tests
 * S1.2: 防止 open redirect 攻击
 */
import { describe, it, expect } from 'vitest';
import { validateReturnTo } from './validateReturnTo';

describe('validateReturnTo — S1.2', () => {
  // 合法路径
  it('returns /canvas as-is', () => {
    expect(validateReturnTo('/canvas')).toBe('/canvas');
  });

  it('returns /canvas/project-1 as-is', () => {
    expect(validateReturnTo('/canvas/project-1')).toBe('/canvas/project-1');
  });

  it('returns /design as-is', () => {
    expect(validateReturnTo('/design')).toBe('/design');
  });

  it('returns /projects as-is', () => {
    expect(validateReturnTo('/projects')).toBe('/projects');
  });

  it('returns /dashboard as-is', () => {
    expect(validateReturnTo('/dashboard')).toBe('/dashboard');
  });

  it('returns /auth as-is', () => {
    expect(validateReturnTo('/auth')).toBe('/auth');
  });

  // 恶意路径 → fallback to /
  it('rejects absolute URL https://evil.com', () => {
    expect(validateReturnTo('https://evil.com')).toBe('/');
  });

  it('rejects absolute URL with http://', () => {
    expect(validateReturnTo('http://evil.com/canvas')).toBe('/');
  });

  it('rejects path starting with double slash //', () => {
    expect(validateReturnTo('//evil.com')).toBe('/');
  });

  it('rejects path starting with ftp://', () => {
    expect(validateReturnTo('ftp://evil.com')).toBe('/');
  });

  it('rejects path /etc/passwd', () => {
    expect(validateReturnTo('/etc/passwd')).toBe('/');
  });

  it('rejects path /login (not in whitelist)', () => {
    expect(validateReturnTo('/login')).toBe('/');
  });

  it('rejects path /api/internal (not in whitelist)', () => {
    expect(validateReturnTo('/api/internal')).toBe('/');
  });

  // 空值/null/undefined → /
  it('returns / for null', () => {
    expect(validateReturnTo(null)).toBe('/');
  });

  it('returns / for undefined', () => {
    expect(validateReturnTo(undefined)).toBe('/');
  });

  it('returns / for empty string', () => {
    expect(validateReturnTo('')).toBe('/');
  });
});
