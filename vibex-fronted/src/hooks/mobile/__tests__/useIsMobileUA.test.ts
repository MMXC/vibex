/**
 * useIsMobileUA.test.ts — S92-E4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsMobileUA, isMobileUserAgent } from "../../useIsMobileUA";

describe('useIsMobileUA', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects iPhone UA', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    const { result } = renderHook(() => useIsMobileUA());
    expect(result.current.isMobileUA).toBe(true);
    expect(result.current.isIOS).toBe(true);
    expect(result.current.isAndroid).toBe(false);
  });

  it('detects Android Chrome UA', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0',
    });
    const { result } = renderHook(() => useIsMobileUA());
    expect(result.current.isMobileUA).toBe(true);
    expect(result.current.isAndroid).toBe(true);
    expect(result.current.isIOS).toBe(false);
  });

  it('detects iPad UA as tablet', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    const { result } = renderHook(() => useIsMobileUA());
    expect(result.current.isMobileUA).toBe(true);
    expect(result.current.isTabletUA).toBe(true);
  });

  it('returns false for desktop Chrome UA', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
    });
    const { result } = renderHook(() => useIsMobileUA());
    expect(result.current.isMobileUA).toBe(false);
    expect(result.current.isIOS).toBe(false);
    expect(result.current.isAndroid).toBe(false);
  });
});

describe('isMobileUserAgent', () => {
  it('matches iOS UA', () => {
    expect(isMobileUserAgent('iPhone')).toBe(true);
    expect(isMobileUserAgent('Mozilla/5.0 (iPhone')).toBe(true);
  });

  it('matches Android UA', () => {
    expect(isMobileUserAgent('Android')).toBe(true);
    expect(isMobileUserAgent('Mozilla/5.0 (Linux; Android')).toBe(true);
  });

  it('returns false for desktop UA', () => {
    expect(isMobileUserAgent('Windows NT 10.0')).toBe(false);
    expect(isMobileUserAgent('Macintosh; Intel Mac')).toBe(false);
  });
});
