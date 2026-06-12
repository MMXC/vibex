/**
 * useGitHubPR.test.ts — Sprint89 E4
 * 验证 useGitHubPR hook 的 URL 解析和状态管理
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useGitHubPR, parseGitHubUrl } from './useGitHubPR';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Helper: mockResponse creates a proper Response-like object
// vitest/vi.fn() mocks don't need to be async for simple value returns
const mockResponse = (data: unknown, init?: ResponseInit) => ({
  ok: (init?.status ?? 200) >= 200 && (init?.status ?? 200) < 300,
  status: init?.status ?? 200,
  json: vi.fn(() => Promise.resolve(data)),
});

describe('parseGitHubUrl', () => {
  it('parses standard PR URL', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo/pull/42');
    expect(result).toEqual({ owner: 'owner', repo: 'repo', number: 42, type: 'pull' });
  });

  it('parses PR URL without https', () => {
    const result = parseGitHubUrl('http://github.com/owner/repo/pull/123');
    expect(result).toEqual({ owner: 'owner', repo: 'repo', number: 123, type: 'pull' });
  });

  it('parses issue URL', () => {
    const result = parseGitHubUrl('https://github.com/org/project/issues/99');
    expect(result).toEqual({ owner: 'org', repo: 'project', number: 99, type: 'issue' });
  });

  it('parses URL with extra trailing slashes', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo/pull/42/');
    expect(result?.number).toBe(42);
  });

  it('returns null for invalid URL', () => {
    expect(parseGitHubUrl('not-a-url')).toBeNull();
    expect(parseGitHubUrl('https://gitlab.com/owner/repo/pull/1')).toBeNull();
    expect(parseGitHubUrl('')).toBeNull();
  });

  it('trims whitespace', () => {
    const result = parseGitHubUrl('  https://github.com/owner/repo/pull/5  ');
    expect(result?.number).toBe(5);
  });
});

describe('useGitHubPR', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches stored URL on mount', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true, githubPrUrl: null }));

    const { result } = renderHook(() => useGitHubPR('canvas-1'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/canvas/canvas-1/github');
    });
  });

  it('sets prUrl after fetching stored URL', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: true, githubPrUrl: 'https://github.com/owner/repo/pull/42' })
    );

    const { result } = renderHook(() => useGitHubPR('canvas-1'));

    await waitFor(() => {
      expect(result.current.prUrl).toBe('https://github.com/owner/repo/pull/42');
    });
  });

  it('saves URL via POST', async () => {
    // First call: GET on mount; second call: POST from saveUrl
    mockFetch
      .mockResolvedValueOnce(mockResponse({ ok: true, githubPrUrl: null }))   // GET mount
      .mockResolvedValueOnce(mockResponse({ ok: true }));                       // POST save

    const { result } = renderHook(() => useGitHubPR('canvas-1'));

    // Wait for mount fetch
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    await result.current.saveUrl('https://github.com/owner/repo/pull/99');

    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/canvas/canvas-1/github',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ githubPrUrl: 'https://github.com/owner/repo/pull/99' }),
      })
    );
  });

  it('clears URL via POST with null', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse({ ok: true, githubPrUrl: 'https://github.com/old/pull/1' }))
      .mockResolvedValueOnce(mockResponse({ ok: true }));

    const { result } = renderHook(() => useGitHubPR('canvas-1'));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    await result.current.clearUrl();

    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/canvas/canvas-1/github',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ githubPrUrl: null }),
      })
    );
  });

  it('throws and sets error when save fails', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse({ ok: true, githubPrUrl: null }))
      .mockResolvedValueOnce(mockResponse({ ok: false, error: 'Server error' }, { status: 500 }));

    const { result } = renderHook(() => useGitHubPR('canvas-1'));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    await expect(result.current.saveUrl('https://github.com/owner/repo/pull/1')).rejects.toThrow();
  });
});
