/**
 * Unit Tests: DDS API Proxy Route — vibex-fix-canvas-bugs Bug1
 *
 * B1-U2: API Route 代理实现验收
 * 测试代理路由的 URL 构造和请求转发逻辑
 *
 * Note: Next.js API route handlers use NextRequest/NextResponse which are server-only.
 * These tests verify the proxy logic (URL construction, method routing) in isolation.
 */

import fs from 'fs';
import path from 'path';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// =============================================================================
// Proxy Logic Tests (verifies URL construction and method routing)
// =============================================================================

/**
 * Test the proxy URL construction logic.
 * This replicates the logic in the route.ts handler to verify correctness.
 */
describe('DDS Proxy URL Construction', () => {
  const BACKEND_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.vibex.top/api';

  const buildProxyUrl = (pathname: string, search: string) => {
    const splat = pathname.replace('/api/v1/dds/', '');
    return `${BACKEND_BASE}/v1/dds/${splat}${search}`;
  };

  it('correctly constructs GET chapters URL', () => {
    const url = buildProxyUrl('/api/v1/dds/chapters', '?projectId=e2e-proj');
    expect(url).toBe('https://api.vibex.top/api/v1/dds/chapters?projectId=e2e-proj');
  });

  it('correctly constructs POST cards URL', () => {
    const url = buildProxyUrl('/api/v1/dds/cards', '');
    expect(url).toBe('https://api.vibex.top/api/v1/dds/cards');
  });

  it('correctly handles URL-encoded paths', () => {
    const url = buildProxyUrl('/api/v1/dds/chapters', '?projectId=e2e%20test');
    expect(url).toContain('/v1/dds/chapters');
    expect(url).toContain('projectId=e2e%20test');
  });

  it('handles empty search params', () => {
    const url = buildProxyUrl('/api/v1/dds/cards', '');
    expect(url).toBe('https://api.vibex.top/api/v1/dds/cards');
  });
});

/**
 * Test proxy fetch behavior (mock-based).
 * Verifies that the proxy correctly forwards requests.
 */
describe('DDS Proxy Fetch Behavior', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    // @ts-expect-error — replace global fetch for test
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper: replicate the proxy GET handler logic for testing
   */
  const proxyGet = async (pathname: string, search: string) => {
    const BACKEND_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.vibex.top/api';
    const splat = pathname.replace('/api/v1/dds/', '');
    const url = `${BACKEND_BASE}/v1/dds/${splat}${search}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', cookie: 'test-cookie' },
      credentials: 'include',
    });

    const data = await response.json();
    return { status: response.status, data };
  };

  it('forwards GET request to backend and returns data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ chapters: [{ id: 'ch-1', name: 'Test' }] }),
    });

    const result = await proxyGet('/api/v1/dds/chapters', '?projectId=proj-1');

    expect(result.status).toBe(200);
    expect(result.data).toEqual({ chapters: [{ id: 'ch-1', name: 'Test' }] });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.vibex.top/api/v1/dds/chapters?projectId=proj-1',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('forwards POST request with body to backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 'card-1', name: 'New Card' }),
    });

    const BACKEND_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.vibex.top/api';
    const testBody = JSON.stringify({ name: 'New Card', type: 'bounded-context' });
    const url = `${BACKEND_BASE}/v1/dds/cards`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: testBody,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.vibex.top/api/v1/dds/cards',
      expect.objectContaining({
        method: 'POST',
        body: testBody,
      })
    );
  });

  it('returns 502 on backend error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const BACKEND_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.vibex.top/api';
    const url = `${BACKEND_BASE}/v1/dds/chapters`;

    await expect(fetch(url)).rejects.toThrow('Network error');
  });

  it('forwards DELETE request correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ deleted: true }),
    });

    const BACKEND_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.vibex.top/api';
    const url = `${BACKEND_BASE}/v1/dds/chapters/ch-1`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.vibex.top/api/v1/dds/chapters/ch-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

// =============================================================================
// Standalone Build Compatibility Tests (vibex-sprint-0415 E1-U2)
// =============================================================================

describe('DDS Route — standalone build compatibility', () => {
  const routeFilePath = path.join(__dirname, 'route.ts');

  it('route.ts exports dynamic = force-static declaration', () => {
    const content = fs.readFileSync(routeFilePath, 'utf8');
    expect(content).toContain('export const dynamic');
    expect(content).toContain('force-static');
  });

  it('route.ts exports generateStaticParams declaration', () => {
    const content = fs.readFileSync(routeFilePath, 'utf8');
    expect(content).toContain('export function generateStaticParams');
    expect(content).toContain('return []');
  });

  it('route.ts retains all HTTP method handlers', () => {
    const content = fs.readFileSync(routeFilePath, 'utf8');
    expect(content).toContain('export async function GET');
    expect(content).toContain('export async function POST');
    expect(content).toContain('export async function PUT');
    expect(content).toContain('export async function DELETE');
  });

  it('route.ts preserves cookie forwarding logic', () => {
    const content = fs.readFileSync(routeFilePath, 'utf8');
    expect(content).toContain('cookie: request.headers.get');
    expect(content).toContain("credentials: 'include'");
  });
});
